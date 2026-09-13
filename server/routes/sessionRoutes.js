
const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const { requireRole } = require("../middleware/roles");
const validate = require('../middleware/validate');
const { scheduleSession } = require('../validators/sessionValidators');

const {
  createSessionRequest,
  getSessions,
  acceptAndSchedule,
  acceptRequest,
  acceptOrSchedule,
  rejectSession,
  completeSession,
  closeSession,
  updateMeetingLink,
  startSession
} = require("../controllers/sessionController");

router.post("/", auth, requireRole('learner'), createSessionRequest);
router.get("/", auth, getSessions);
router.post("/:id/schedule", auth, requireRole('mentor'), scheduleSession, validate, acceptAndSchedule);
router.put("/accept", auth, requireRole('mentor'), acceptOrSchedule);
router.put("/accept-request", auth, requireRole('mentor'), acceptRequest);
router.put("/reject", auth, requireRole('mentor'), rejectSession);
router.put("/start", auth, requireRole('learner'), startSession);
router.put("/complete", auth, completeSession);
router.put("/close", auth, closeSession);
router.put("/update-link", auth, requireRole('mentor'), updateMeetingLink);
router.get('/:id/window', auth, async (req, res) => {
  try {
    const session = await require('../models/Session').findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    const { isUpcoming, isLive, isCompleted, isCancelled } = require('../controllers/sessionController').getSessionWindowState(session);
    res.json({ success: true, sessionId: session._id, isUpcoming, isLive, isCompleted, isCancelled, status: session.status, startTime: session.startTime, endTime: session.endTime });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
module.exports = router;

