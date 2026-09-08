const router = require("express").Router();
const auth = require("../middleware/auth");
const { requireRole } = require("../middleware/roles");
const validate = require('../middleware/validate');
const requestValidators = require('../validators/requestValidators');
const { 
  getMatches, 
  createSession, 
  getSessions, 
  sendMessage, 
  completeSession,
  createRequest,
  getIncomingRequests,
  getSentRequests,
  acceptRequest,
  rejectRequest,
  getAllRequests
} = require("../controllers/matchController");

// Matches
router.get("/matches", auth, getMatches);
router.get("/", auth, getAllRequests);

// Skill Exchange Requests
router.post("/request", auth, requireRole('learner'), requestValidators.createRequest, validate, createRequest);
router.get("/requests/incoming", auth, requireRole('mentor'), getIncomingRequests);
router.get("/requests/sent", auth, getSentRequests);
router.put("/requests/:id/accept", auth, requireRole('mentor'), acceptRequest);
router.put("/requests/:id/reject", auth, requireRole('mentor'), rejectRequest);

// Sessions
router.post("/session", auth, createSession);
router.get("/sessions", auth, getSessions);
router.put("/sessions/:sessionId/complete", auth, completeSession);

// Messages
router.post("/message", auth, sendMessage);

module.exports = router;
