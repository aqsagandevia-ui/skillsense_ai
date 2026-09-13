const Session = require("../models/Session");
const Skill = require("../models/Skill");
const User = require("../models/User");
const { sendMail } = require("../services/email");
const { createCalendarEvent } = require("../services/googleOAuth");

const normalizeDurationMinutes = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const minutes = Number(value);
  if (!Number.isFinite(minutes)) return null;
  const safeMinutes = Math.round(minutes);
  if (safeMinutes < 15 || safeMinutes > 240) return null;
  return safeMinutes;
};

const buildSessionWindow = (session, currentTime = new Date()) => {
  const now = new Date(currentTime);
  const startTime = session?.startTime ? new Date(session.startTime) : null;
  const endTime = session?.endTime ? new Date(session.endTime) : null;

  if (!startTime || !endTime) {
    return {
      isUpcoming: false,
      isLive: false,
      isCompleted: false,
      isCancelled: session?.status === 'cancelled',
      joinAllowed: false,
      canReview: false,
    };
  }

  if (session?.status === 'cancelled') {
    return {
      isUpcoming: false,
      isLive: false,
      isCompleted: false,
      isCancelled: true,
      joinAllowed: false,
      canReview: false,
    };
  }

  const isUpcoming = now < startTime;
  const isLive = now >= startTime && now < endTime;
  const isCompleted = now >= endTime;

  return {
    isUpcoming,
    isLive,
    isCompleted,
    isCancelled: false,
    joinAllowed: isLive,
    canReview: isCompleted || Boolean(session?.closedAt),
  };
};

const getSessionWindowState = (session) => buildSessionWindow(session, new Date());

const getSessionLearnerIds = (session = {}) => {
  const rawLearners = [];
  if (session.learner) rawLearners.push(session.learner);
  if (Array.isArray(session.learners)) rawLearners.push(...session.learners);

  return [...new Set(rawLearners.filter(Boolean).map((id) => id && id.toString ? id.toString() : String(id)))];
};

const isSessionParticipant = (session, userId) => {
  if (!session || !userId) return false;
  const userIdStr = String(userId);
  const mentorId = session.mentor && session.mentor.toString ? session.mentor.toString() : String(session.mentor || '');
  const learnerIds = getSessionLearnerIds(session);
  return mentorId === userIdStr || learnerIds.includes(userIdStr);
};

const ensureSessionWindow = (session, userId) => {
  if (!session) {
    return { allowed: false, status: 404, message: 'Session not found' };
  }

  if (session.status === 'cancelled') {
    return { allowed: false, status: 400, message: 'This session has been cancelled.' };
  }

  const mentorId = session.mentor && session.mentor.toString ? session.mentor.toString() : session.mentor;
  const isAuthorized = isSessionParticipant(session, userId) || mentorId === userId;

  if (!isAuthorized) {
    return { allowed: false, status: 403, message: 'You are not authorized to access this session.' };
  }

  const { isUpcoming, isLive, isCompleted, isCancelled } = getSessionWindowState(session);

  if (isCancelled) {
    return { allowed: false, status: 400, message: 'This session has been cancelled.' };
  }

  if (isUpcoming) {
    return { allowed: false, status: 400, message: "Session hasn't started yet." };
  }

  if (isCompleted) {
    return { allowed: false, status: 400, message: 'This session has ended and can no longer be joined.' };
  }

  if (!isLive) {
    return { allowed: false, status: 400, message: 'Session is not currently active.' };
  }

  return { allowed: true, status: 200, message: 'Join allowed' };
};

const normalizeSessionStatus = (session) => {
  if (!session) return 'pending';
  if (session.status === 'cancelled') return 'cancelled';
  if (session.status === 'rejected') return 'rejected';

  const now = new Date();
  const startTime = session.startTime ? new Date(session.startTime) : null;
  const endTime = session.endTime ? new Date(session.endTime) : null;

  if (session.closedAt) return 'completed';
  if (startTime && endTime && now < startTime) return 'scheduled';
  if (startTime && endTime && now >= startTime && now < endTime) return 'live';
  if (startTime && endTime && now >= endTime) return 'completed';
  return session.status || 'scheduled';
};

/* =========================================
   GET ALL SESSIONS
========================================= */
exports.getSessions = async (req, res) => {
  try {
    const userId = req.user.id;

    const sessions = await Session.find({
      $or: [{ learner: userId }, { learners: userId }, { mentor: userId }]
    })
      .populate("learner", "name email photo")
      .populate("learners", "name email photo")
      .populate("mentor", "name email photo")
      .populate("skillTopic", "skillName")
      .sort({ createdAt: -1 });

    for (const session of sessions) {
      const nextStatus = normalizeSessionStatus(session);
      if (session.status !== nextStatus && !['pending', 'accepted'].includes(session.status) && nextStatus !== 'scheduled') {
        session.status = nextStatus;
        if (nextStatus === 'completed' && !session.completedAt) {
          session.completedAt = new Date();
        }
        await session.save();
      }
    }

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
    console.error('createSessionRequest error:', error && error.stack ? error.stack : error);
    res.status(500).json({ msg: error && error.message ? error.message : "Failed to send request" });
  }
};

/* =========================================
   MENTOR ACCEPT + SCHEDULE
========================================= */
exports.acceptAndSchedule = async (req, res) => {
  try {
    const mentorId = req.user.id;
    const sessionId = req.params && req.params.id ? req.params.id : req.body.sessionId;
    const { date, time, note, duration, learners } = req.body;

    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({ msg: "Session not found" });
    }

    if (session.mentor.toString() !== mentorId) {
      return res.status(403).json({ msg: "Unauthorized" });
    }

    if (!date || !time) {
      return res.status(400).json({ msg: "Date and time are required" });
    }

    const durationMinutes = normalizeDurationMinutes(duration);
    if (!durationMinutes) {
      return res.status(400).json({ msg: "A valid session duration is required. Select 15-240 minutes." });
    }

    const parsed = new Date(`${date}T${time}`);
    if (isNaN(parsed.getTime())) {
      return res.status(400).json({ msg: "Invalid date or time format" });
    }

    const now = new Date();
    if (parsed <= now) {
      return res.status(400).json({ msg: "Cannot schedule sessions in the past" });
    }

    const endTime = new Date(parsed.getTime() + durationMinutes * 60 * 1000);

    session.scheduledAt = parsed;
    session.startTime = parsed;
    session.duration = durationMinutes;
    session.endTime = endTime;
    session.closedAt = null;
    session.closedBy = null;

    const selectedLearnerIds = Array.isArray(learners) ? learners : [session.learner];
    const uniqueLearnerIds = [...new Set(selectedLearnerIds.filter(Boolean).map((id) => String(id)))];
    if (!uniqueLearnerIds.length) {
      return res.status(400).json({ msg: "At least one learner is required for the session." });
    }

    session.learners = uniqueLearnerIds.map((id) => id);
    session.learner = session.learner || uniqueLearnerIds[0];

    const mentor = await User.findById(mentorId);
    const learnerUsers = await User.find({ _id: { $in: uniqueLearnerIds } }).select("name email");
    const skill = await Skill.findById(session.skillTopic).select("skillName");
    if (!mentor || learnerUsers.length === 0) return res.status(404).json({ msg: "Session participants not found" });

    let calendarEvent;
    try {
      calendarEvent = await createCalendarEvent({
        user: mentor,
        summary: `SkillSwap teaching session: ${skill?.skillName || "Teaching"}`,
        description: note || "SkillSwap teaching session",
        startTime: parsed,
        endTime: new Date(parsed.getTime() + session.duration * 60 * 1000),
        attendeeEmails: learnerUsers.map((learner) => learner.email).filter(Boolean),
        existingEventId: session.googleCalendarEventId,
      });
    } catch (calendarError) {
      return res.status(400).json({ msg: calendarError.message || "Failed to create Google Calendar event" });
    }

    session.meetingLink = calendarEvent.hangoutLink || calendarEvent.conferenceData?.entryPoints?.find((entry) => entry.entryPointType === "video")?.uri || "";
    session.googleCalendarEventId = calendarEvent.id;
    session.status = "scheduled";
    if (session.startTime && session.endTime) {
      const now = new Date();
      if (now < session.startTime) {
        session.status = 'scheduled';
      } else if (now >= session.startTime && now < session.endTime) {
        session.status = 'live';
      } else {
        session.status = 'completed';
        session.completedAt = session.completedAt || new Date();
      }
    }
    // save optional note
    if (note) session.mentorNote = note;

    await session.save();

    const updated = await Session.findById(sessionId)
      .populate("learner", "name email photo")
      .populate("learners", "name email photo")
      .populate("mentor", "name email photo")
      .populate("skillTopic", "skillName");

    try {
      const mentor = updated.mentor;
      const skill = updated.skillTopic?.skillName || "";
      const dateStr = updated.scheduledAt.toLocaleDateString();
      const timeStr = updated.scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const templates = require('../services/emailTemplates');

      for (const learner of updated.learners || []) {
        const learnerName = learner?.name || 'Learner';
        const learnerHtml = templates.sessionScheduledLearner({ learnerName, mentorName: mentor.name, skill, dateStr, timeStr, meetingLink: updated.meetingLink, note: updated.mentorNote });
        await sendMail({ to: learner.email, subject: 'Session Scheduled Successfully', html: learnerHtml });
      }

      const mentorHtml = templates.sessionScheduledMentor({ learnerName: (updated.learners && updated.learners[0]?.name) || updated.learner?.name || 'Learner', mentorName: mentor.name, skill, dateStr, timeStr, meetingLink: updated.meetingLink });
      await sendMail({ to: mentor.email, subject: 'Session Scheduled with Learner', html: mentorHtml });
    } catch (mailErr) {
      console.warn('Failed to send session email(s):', mailErr && mailErr.message ? mailErr.message : mailErr);
    }

    try {
      const Message = require('../models/Message');
      const socketServer = require('../socket');
      const senderId = updated.mentor._id.toString();
      const participants = [...new Set([(updated.learner?._id || updated.learner)?.toString(), ...(updated.learners || []).map((learner) => learner?._id?.toString()).filter(Boolean)])];

      for (const receiverId of participants) {
        if (!receiverId || receiverId === senderId) continue;
        const chatId = [senderId, receiverId].sort().join('_');
        const text = `Your session has been scheduled for ${updated.scheduledAt.toLocaleDateString()} at ${updated.scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.\nMeeting Link: ${updated.meetingLink}`;

        const msgDoc = await Message.create({ chatId, sender: senderId, receiver: receiverId, text, isRead: false });
        await msgDoc.populate('sender', 'name photo');
        await msgDoc.populate('receiver', 'name photo');

        const emittedMessage = {
          _id: msgDoc._id.toString(),
          sender: { _id: msgDoc.sender._id.toString(), name: msgDoc.sender.name, photo: msgDoc.sender.photo },
          receiver: { _id: msgDoc.receiver._id.toString(), name: msgDoc.receiver.name, photo: msgDoc.receiver.photo },
          text: msgDoc.text,
          createdAt: msgDoc.createdAt,
          isRead: msgDoc.isRead
        };

        const io = socketServer.getIO && socketServer.getIO();
        if (io) {
          io.to(chatId).emit('receive_message', emittedMessage);
          io.to(`user_${receiverId}`).emit('message_received', { from: senderId, message: emittedMessage });
        }
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

    const now = new Date();
    const startTime = session.startTime ? new Date(session.startTime) : null;
    const endTime = session.endTime ? new Date(session.endTime) : null;

    if (startTime && endTime && now < endTime && session.closedAt === null) {
      return res.status(400).json({ success: false, message: 'Session cannot be completed before its scheduled end time.' });
    }

    session.status = "completed";
    session.completedAt = new Date();
    session.closedAt = session.closedAt || new Date();
    session.closedBy = session.closedBy || session.mentor;
    if (!session.startTime) session.startTime = session.scheduledAt || new Date();
    if (!session.endTime) {
      const durationMinutes = normalizeDurationMinutes(session.duration) || 60;
      session.endTime = new Date((session.startTime || new Date()).getTime() + durationMinutes * 60 * 1000);
    }
    await session.save();

    try {
      const learnerIds = [...new Set([
        session.learner,
        ...(Array.isArray(session.learners) ? session.learners : [])
      ].filter(Boolean).map((id) => String(id)))];

      if (learnerIds.length) {
        await User.updateMany({ _id: { $in: learnerIds } }, { $inc: { sessionsCompleted: 1 } });
      }
    } catch (e) {
      console.error("Error incrementing sessionsCompleted:", e.message);
    }

    res.json({ success: true, msg: "Session completed", session });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.closeSession = async (req, res) => {
  try {
    const { sessionId } = req.body || req.params;
    const userId = req.user?.id;
    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ msg: "Session not found" });

    if (session.mentor.toString() !== userId) {
      return res.status(403).json({ msg: "Only the mentor can close a session early." });
    }

    session.closedAt = new Date();
    session.closedBy = userId;
    session.status = 'completed';
    session.completedAt = session.completedAt || session.closedAt;
    if (!session.endTime) {
      const startTime = session.startTime ? new Date(session.startTime) : new Date();
      const durationMinutes = normalizeDurationMinutes(session.duration) || 60;
      session.endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
    }
    await session.save();

    res.json({ success: true, msg: 'Session closed early', session });
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

    if (!isSessionParticipant(session, userId)) {
      return res.status(403).json({ msg: "Unauthorized - only a participant can start this session" });
    }

    const validation = ensureSessionWindow(session, userId);
    if (!validation.allowed) {
      return res.status(validation.status).json({ success: false, message: validation.message });
    }

    session.status = 'live';
    session.startedAt = new Date();
    session.completedAt = null;
    await session.save();

    const updated = await Session.findById(sessionId)
      .populate("learner", "name email photo")
      .populate("mentor", "name email photo")
      .populate("skillTopic", "skillName");

    res.json({ success: true, msg: "Session started", session: updated });
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

module.exports = {
  ...module.exports,
  getSessionWindowState,
  ensureSessionWindow,
  normalizeSessionStatus,
  normalizeDurationMinutes,
  buildSessionWindow,
  getSessionLearnerIds,
  isSessionParticipant,
};