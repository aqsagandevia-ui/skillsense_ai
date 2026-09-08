const User = require("../models/User");
const Session = require("../models/Session");
const Skill = require("../models/Skill");
const SkillRequest = require("../models/SkillRequest");

// Get matches for current user (based on skills learner wants to learn)
exports.getMatches = async (req, res) => {
  try {
    const me = await User.findById(req.user.id);

    // Get skills user wants to learn
    const learnSkills = me.skillsToLearn?.map(s => s.skillName?.toLowerCase()) || [];

    // Find users who can teach any of these skills
    const matches = await User.find({
      _id: { $ne: me._id },
      skills: { $exists: true, $ne: [] }
    })
      .populate('skills')
      .select("name skills rating bio photo")
      .limit(20);

    res.json(matches);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Create a skill exchange request
exports.createRequest = async (req, res) => {
  try {
    const { mentorId, skillId, message } = req.body;
    const learnerId = req.user.id;

    // Validate mentor exists
    const mentor = await User.findById(mentorId);
    if (!mentor) {
      return res.status(404).json({ msg: "Mentor not found" });
    }

    // Validate skill exists
    const skill = await Skill.findById(skillId);
    if (!skill) {
      return res.status(404).json({ msg: "Skill not found" });
    }

    // Check if request already exists
    const existingRequest = await SkillRequest.findOne({
      learner: learnerId,
      mentor: mentorId,
      skillTopic: skillId
    });

    if (existingRequest) {
      return res.status(400).json({ msg: "Request already exists" });
    }

    // Create new request
    const newRequest = new SkillRequest({
      learner: learnerId,
      mentor: mentorId,
      skillTopic: skillId,
      message: message || "",
      status: "pending"
    });

    await newRequest.save();
    await newRequest.populate('learner', 'name photo email');
    await newRequest.populate('mentor', 'name');
    await newRequest.populate('skillTopic', 'skillName');

    res.json({ message: "Request sent successfully", request: newRequest });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Get incoming requests for current user (mentor)
exports.getIncomingRequests = async (req, res) => {
  try {
    const requests = await SkillRequest.find({
      mentor: req.user.id
    })
      .populate('learner', 'name photo email bio rating')
      .populate('skillTopic', 'skillName category')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Get sent requests for current user (learner)
exports.getSentRequests = async (req, res) => {
  try {
    const requests = await SkillRequest.find({
      learner: req.user.id
    })
      .populate('mentor', 'name photo')
      .populate('skillTopic', 'skillName category')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Accept a skill exchange request
const { sendMail } = require("../services/email");
const { generateMeetingLink } = require("../services/meeting");

exports.acceptRequest = async (req, res) => {
  try {
    const request = await SkillRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ msg: "Request not found" });
    }

    if (request.mentor.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Not authorized" });
    }

    request.status = "accepted";
    request.respondedAt = new Date();
    await request.save();

    // Create a session
    const newSession = new Session({
      learner: request.learner,
      mentor: request.mentor,
      skillTopic: request.skillTopic,
      skillRequest: request._id,
      // Newly created session remains pending scheduling until mentor sets date/time
      status: "pending"
    });

    await newSession.save();

    const populatedSession = await Session.findById(newSession._id)
      .populate('learner', 'name email photo')
      .populate('mentor', 'name email photo')
      .populate('skillTopic', 'skillName');

    // NOTE: Do not send acceptance email here. Final scheduling will send emails.

    res.json({ message: "Request accepted", request, session: populatedSession });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Reject a skill exchange request
exports.rejectRequest = async (req, res) => {
  try {
    const request = await SkillRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ msg: "Request not found" });
    }

    if (request.mentor.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Not authorized" });
    }

    request.status = "rejected";
    request.respondedAt = new Date();
    await request.save();

    try {
      await request.populate('learner', 'name email');
      await request.populate('mentor', 'name');
      const learner = request.learner;
      const mentor = request.mentor;
      const subject = 'Request Rejected';
      const html = `
        <div style="font-family: Arial, sans-serif;">
          <p>Hello ${learner.name},</p>
          <p>Your request with ${mentor.name} has been rejected.</p>
          <p>Regards,<br/>Skill Swap Team</p>
        </div>
      `;
      await sendMail({ to: learner.email, subject, html });
    } catch (mailErr) {
      console.warn('Failed to send rejection email:', mailErr && mailErr.message);
    }

    res.json({ message: "Request rejected", request });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Request session with teacher for a skill
exports.createSession = async (req, res) => {
  const { teacherId, skill } = req.body;
  try {
    const session = await Session.create({
      mentor: teacherId,
      learner: req.user.id,
      skillTopic: skill,
      status: "scheduled"
    });
    res.json({ message: "Session created", session });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Get sessions for current user
exports.getSessions = async (req, res) => {
  try {
    const sessions = await Session.find({
      $or: [{ mentor: req.user.id }, { learner: req.user.id }]
    })
      .populate("mentor", "name photo")
      .populate("learner", "name photo")
      .populate("skillTopic", "skillName")
      .sort({ createdAt: -1 });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Get all requests (for match page)
exports.getAllRequests = async (req, res) => {
  try {
    const SkillRequest = require("../models/SkillRequest");
    const requests = await SkillRequest.find()
      .populate('learner', 'name photo')
      .populate('mentor', 'name photo')
      .populate('skillTopic', 'skillName')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(requests);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Send message in session
exports.sendMessage = async (req, res) => {
  const { sessionId, text } = req.body;
  try {
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ msg: "Session not found" });
    }

    // Note: You may want to use a separate Message model for this
    // For now, we'll store messages in the session
    session.messages = session.messages || [];
    session.messages.push({ sender: req.user.id, text, sentAt: new Date() });
    await session.save();
    res.json(session);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Complete session
exports.completeSession = async (req, res) => {
  const { sessionId } = req.params;
  try {
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ msg: "Session not found" });
    }

    session.status = "completed";
    session.completedAt = new Date();
    await session.save();

    // Increment learner's sessionsCompleted
    await User.findByIdAndUpdate(session.learner, { $inc: { sessionsCompleted: 1 } });

    res.json({ message: "Session completed", session });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
