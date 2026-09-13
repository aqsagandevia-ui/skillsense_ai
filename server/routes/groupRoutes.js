const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
    createGroup,
    getMyGroups,
    getGroupById,
    updateGroup,
    deleteGroup,
    addMembers,
    removeMember,
    updateMemberAdminStatus,
    leaveGroup,
    getGroupMessages,
    sendGroupMessage,
} = require("../controllers/groupController");

router.post("/", auth, createGroup);
router.get("/", auth, getMyGroups);
router.get("/:groupId", auth, getGroupById);
router.patch("/:groupId", auth, updateGroup);
router.delete("/:groupId", auth, deleteGroup);
router.post("/:groupId/members", auth, addMembers);
router.delete("/:groupId/members/:userId", auth, removeMember);
router.patch("/:groupId/members/:userId/admin", auth, updateMemberAdminStatus);
router.post("/:groupId/leave", auth, leaveGroup);
router.get("/:groupId/messages", auth, getGroupMessages);
router.post("/:groupId/messages", auth, sendGroupMessage);

module.exports = router;
