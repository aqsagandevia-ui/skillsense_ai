const Session = require("../models/Session");
const Skill = require("../models/Skill");
const User = require("../models/User");
const { sendMail } = require("../services/email");
const { createCalendarEvent } = require("../services/googleOAuth");

/* =========================================
   GET ALL SESSIONS
========================================= */
exports.getSessions = async (req, res) => {
  try {
    const userId = req.user.id;

    const sessions = await Session.find({
      $or: [{ learner: userId }, { mentor: userId }]
    })
      .populate("learner", "name email photo")
      .populate("mentor", "name email photo")
      .populate("skillTopic", "skillName")
      .sort({ createdAt: -1 });

    res.json(sessions);
  } catch (error) {
    res.status(500).json({ msg: "Failed to fetch sessions" });
  }
};

/* =========================================
   LEARNER SEND REQUEST ONLY
========================================= */
exports.createSessionRequest = async (req, res) => {
  try {
    const learnerId = req.user.id;
    const { teacherId, skill, message } = req.body;

    const skillDoc = await Skill.findOne({ skillName: skill });

    if (!skillDoc) {
      return res.status(404).json({ msg: "Skill not found" });
    }

    const session = await Session.create({
      learner: learnerId,
      mentor: teacherId,
      skillTopic: skillDoc._id,
      message: message || "",
      status: "pending"
    });

    const populated = await Session.findById(session._id)
      .populate("learner", "name email photo")
      .populate("mentor", "name email photo")
      .populate("skillTopic", "skillName");

    res.status(201).json({
      msg: "Request sent successfully",
      session: populated
    });
    // Notify mentor by email
    try {
      const mentor = populated.mentor;
      const learner = populated.learner;
      const skillName = populated.skillTopic?.skillName || '';
      const templates = require('../services/emailTemplates');
      const html = templates.newRequestNotification({ mentorName: mentor.name || 'Mentor', learnerName: learner.name || 'Learner', skill: skillName, message: message });
      await sendMail({ to: mentor.email, subject: 'New Session Request', html });
    } catch (mailErr) {
      console.warn('Failed to send new request email to mentor:', mailErr && mailErr.message);
    }
  } catch (error) {
    res.status(500).json({ msg: "Failed to send request" });
  }
};

/* =========================================
   MENTOR ACCEPT + SCHEDULE
========================================= */
exports.acceptAndSchedule = async (req, res) => {
  try {
    const mentorId = req.user.id;
    // sessionId may be provided in params or body
    const sessionId = req.params && req.params.id ? req.params.id : req.body.sessionId;
    const { date, time, note } = req.body;

    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({ msg: "Session not found" });
    }

    if (session.mentor.toString() !== mentorId) {
      return res.status(403).json({ msg: "Unauthorized" });
    }

    // Validate date/time inputs
    if (!date || !time) {
      return res.status(400).json({ msg: "Date and time are required" });
    }

    const parsed = new Date(`${date}T${time}`);
    if (isNaN(parsed.getTime())) {
      return res.status(400).json({ msg: "Invalid date or time format" });
    }

    const now = new Date();
    if (parsed <= now) {
      return res.status(400).json({ msg: "Cannot schedule sessions in the past" });
    }

    session.scheduledAt = parsed;

    const mentor = await User.findById(mentorId);
    const learner = await User.findById(session.learner).select("name email");
    const skill = await Skill.findById(session.skillTopic).select("skillName");
    if (!mentor || !learner) return res.status(404).json({ msg: "Session participants not found" });

    let calendarEvent;
    try {
      calendarEvent = await createCalendarEvent({
        user: mentor,
        summary: `SkillSwap teaching session: ${skill?.skillName || "Teaching"}`,
        description: note || "SkillSwap teaching session",
        startTime: parsed,
        endTime: new Date(parsed.getTime() + 60 * 60 * 1000),
        attendeeEmail: learner.email,
        existingEventId: session.googleCalendarEventId,
      });
    } catch (calendarError) {
      return res.status(400).json({ msg: calendarError.message || "Failed to create Google Calendar event" });
    }

    session.meetingLink = calendarEvent.hangoutLink || calendarEvent.conferenceData?.entryPoints?.find((entry) => entry.entryPointType === "video")?.uri || "";
    session.googleCalendarEventId = calendarEvent.id;
    session.status = "scheduled";
    // save optional note
    if (note) session.mentorNote = note;

    await session.save();

    const updated = await Session.findById(sessionId)
      .populate("learner", "name email photo")
      .populate("mentor", "name email photo")
      .populate("skillTopic", "skillName");

    // Send email notification to learner and mentor
    try {
      const learner = updated.learner;
      const mentor = updated.mentor;
      const skill = updated.skillTopic?.skillName || "";
      const dateStr = updated.scheduledAt.toLocaleDateString();
      const timeStr = updated.scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const templates = require('../services/emailTemplates');
      const learnerHtml = templates.sessionScheduledLearner({ learnerName: learner.name, mentorName: mentor.name, skill, dateStr, timeStr, meetingLink: updated.meetingLink, note: updated.mentorNote });
      await sendMail({ to: learner.email, subject: 'Session Scheduled Successfully', html: learnerHtml });

      const mentorHtml = templates.sessionScheduledMentor({ learnerName: learner.name, mentorName: mentor.name, skill, dateStr, timeStr, meetingLink: updated.meetingLink });
      await sendMail({ to: mentor.email, subject: 'Session Scheduled with Learner', html: mentorHtml });
    } catch (mailErr) {
      console.warn('Failed to send session email(s):', mailErr && mailErr.message ? mailErr.message : mailErr);
    }

    // Also create a chat message with the meeting link (so learner receives link in chat)
    try {
      const Message = require('../models/Message');
      const socketServer = require('../socket');
      const senderId = updated.mentor._id.toString();
      const receiverId = updated.learner._id.toString();
      const chatId = [senderId, receiverId].sort().join('_');
      const text = `Your session has been scheduled for ${updated.scheduledAt.toLocaleDateString()} at ${updated.scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.\nMeeting Link: ${updated.meetingLink}`;

      const msgDoc = await Message.create({ chatId, sender: senderId, receiver: receiverId, text, isRead: false });

      // populate sender/receiver for emit
      await msgDoc.populate('sender', 'name photo');
      await msgDoc.populate('receiver', 'name photo');

      // Normalize message for socket emit
      const emittedMessage = {
        _id: msgDoc._id.toString(),
        sender: { _id: msgDoc.sender._id.toString(), name: msgDoc.sender.name, photo: msgDoc.sender.photo },
        receiver: { _id: msgDoc.receiver._id.toString(), name: msgDoc.receiver.name, photo: msgDoc.receiver.photo },
        text: msgDoc.text,
        createdAt: msgDoc.createdAt,
        isRead: msgDoc.isRead
      };

      const io = socketServer.getIO && socketServer.getIO();
      const roomId = chatId;
      if (io) {
        io.to(roomId).emit('receive_message', emittedMessage);
        io.to(`user_${receiverId}`).emit('message_received', { from: senderId, message: emittedMessage });
      }
    } catch (msgErr) {
      console.warn('Failed to send chat message with meeting link:', msgErr && msgErr.message ? msgErr.message : msgErr);
    }

    res.json({ msg: "Session scheduled successfully", session: updated });
  } catch (error) {
    res.status(500).json({ msg: "Failed to schedule session" });
  }
};

/* =========================================
   REJECT REQUEST
========================================= */
exports.rejectSession = async (req, res) => {
  try {
    const mentorId = req.user.id;
    const { sessionId } = req.body;

    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({ msg: "Session not found" });
    }

    if (session.mentor.toString() !== mentorId) {
      return res.status(403).json({ msg: "Unauthorized" });
    }

    session.status = "rejected";
    await session.save();

    // Notify learner by email
    try {
      const populated = await Session.findById(sessionId)
        .populate('learner', 'name email')
        .populate('mentor', 'name');

      const learner = populated.learner;
      const mentor = populated.mentor;

      try {
        const templates = require('../services/emailTemplates');
        const html = templates.requestRejectedEmail({ learnerName: learner.name, mentorName: mentor.name, skill: populated.skillTopic?.skillName || '' });
        await sendMail({ to: learner.email, subject: 'Session Request Update', html });
      } catch (e) {
        console.warn('Failed to send rejection email:', e && e.message);
      }
    } catch (e) {
      console.warn('Failed to send rejection email:', e && e.message);
    }

    res.json({ msg: "Request rejected" });
  } catch (error) {
    res.status(500).json({ msg: "Failed to reject request" });
  }
};

/* =========================================
   COMPLETE SESSION
========================================= */
exports.completeSession = async (req, res) => {
  try {
    const { sessionId } = req.body || req.params;
    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ msg: "Session not found" });

    session.status = "completed";
    session.completedAt = new Date();
    await session.save();

    // Increment learner's sessionsCompleted
    try {
      await User.findByIdAndUpdate(session.learner, { $inc: { sessionsCompleted: 1 } });
    } catch (e) {
      console.error("Error incrementing sessionsCompleted:", e.message);
    }

    res.json({ msg: "Session completed", session });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

/* =========================================
   UPDATE MEETING LINK
   (mentor can update a meeting URL after scheduling)
========================================= */
exports.updateMeetingLink = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId, meetingLink } = req.body;

    if (!sessionId) return res.status(400).json({ msg: "sessionId required" });

    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ msg: "Session not found" });

    // Only mentor for this session may update the link
    if (session.mentor.toString() !== userId) {
      return res.status(403).json({ msg: "Unauthorized" });
    }

    session.meetingLink = meetingLink || "";
    await session.save();

    res.json({ msg: "Meeting link updated", session });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

/* =========================================
   START SESSION (learner joins the session)
========================================= */
exports.startSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.body;

    if (!sessionId) return res.status(400).json({ msg: "sessionId required" });

    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ msg: "Session not found" });

    // Only learner for this session may start it
    if (session.learner.toString() !== userId) {
      return res.status(403).json({ msg: "Unauthorized - only the learner can start this session" });
    }

    // Only start if session is scheduled
    if (session.status !== "scheduled") {
      return res.status(400).json({ msg: `Session cannot be started. Current status: ${session.status}` });
    }

    // Mark session as in-progress and record start time
    session.status = "in-progress";
    session.startedAt = new Date();
    await session.save();

    const updated = await Session.findById(sessionId)
      .populate("learner", "name email photo")
      .populate("mentor", "name email photo")
      .populate("skillTopic", "skillName");

    res.json({ msg: "Session started", session: updated });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

/* =========================================
   MENTOR ACCEPT (mark accepted, then mentor schedules)
   This endpoint is used when a mentor accepts a pending request
   and wants the learner notified that scheduling will follow.
========================================= */
exports.acceptRequest = async (req, res) => {
  try {
    const mentorId = req.user.id;
    const { sessionId } = req.body;

    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ msg: 'Session not found' });
    if (session.mentor.toString() !== mentorId) return res.status(403).json({ msg: 'Unauthorized' });

    session.status = 'accepted';
    await session.save();

    const populated = await Session.findById(sessionId)
      .populate('learner', 'name email')
      .populate('mentor', 'name')
      .populate('skillTopic', 'skillName');

    // Notify learner by email that request was accepted and scheduling will follow
    // NOTE: Do not send email here. Scheduling (and emails) will occur when mentor finalizes schedule.

    res.json({ msg: 'Request accepted', session: populated });
  } catch (err) {
    console.error('Error in acceptRequest:', err);
    res.status(500).json({ msg: 'Failed to accept request', error: err.message });
  }
};

/* =========================================
   ACCEPT OR SCHEDULE (compat wrapper)
   If date/time provided -> schedule (finalize), else -> mark accepted (no email)
========================================= */
exports.acceptOrSchedule = async (req, res) => {
  try {
    const { date, time } = req.body || {};
    if (date && time) {
      // delegate to acceptAndSchedule (it handles params or body)
      return await exports.acceptAndSchedule(req, res);
    }
    // otherwise mark accepted without emailing
    return await exports.acceptRequest(req, res);
  } catch (err) {
    console.error('Error in acceptOrSchedule:', err);
    res.status(500).json({ msg: 'Failed to process accept/schedule', error: err.message });
  }
};