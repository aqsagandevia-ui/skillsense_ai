const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const { requireRole } = require("../middleware/roles");

const {
    getConnectUrl,
    oauthCallback,
    getStatus,
    disconnect,
} = require("../controllers/calendarController");

// Mentor → Get Google OAuth URL
router.post(
    "/connect-url",
    auth,
    requireRole("mentor"),
    getConnectUrl
);

// Google → Callback
router.get("/oauth/callback", oauthCallback);

// Mentor → Calendar status
router.get(
    "/status",
    auth,
    requireRole("mentor"),
    getStatus
);

// Mentor → Disconnect
router.delete(
    "/disconnect",
    auth,
    requireRole("mentor"),
    disconnect
);

module.exports = router;