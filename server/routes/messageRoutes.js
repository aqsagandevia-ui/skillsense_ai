const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { sendMessage, getMessages, getConversations, getUnreadCounts, markMessagesAsRead } = require("../controllers/messageController");

router.post("/", auth, sendMessage);                               // send message
router.get("/conversations", auth, getConversations);             // get all conversations MUST be before /:userId
router.get("/unread-counts", auth, getUnreadCounts);              // get unread counts for all conversations
router.patch("/mark-read/:fromUserId", auth, markMessagesAsRead); // mark messages from specific user as read
router.get("/:userId", auth, getMessages);                        // get chat with a user

module.exports = router;