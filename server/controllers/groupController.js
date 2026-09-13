const Group = require("../models/Group");
const Message = require("../models/Message");
const User = require("../models/User");
const mongoose = require("mongoose");
const socketServer = require("../socket");

const normalizeId = (id) => {
    if (!id) return null;
    if (mongoose.Types.ObjectId.isValid(id)) return new mongoose.Types.ObjectId(id);
    return id;
};

const formatGroup = async (group) => {
    if (!group) return null;

    const populated = await Group.findById(group._id)
        .populate("createdBy", "name photo email")
        .populate("admins", "name photo email")
        .populate("members.userId", "name photo email isOnline");

    return populated;
};

const getMemberEntry = (userId, role = "member") => ({
    userId: normalizeId(userId),
    role,
    joinedAt: new Date(),
});

const canManageGroup = (group, userId) => {
    if (!group || !userId) return false;
    const member = group.members.find((m) => String(m.userId) === String(userId));
    const adminIds = group.admins.map((id) => String(id));
    return !!member && adminIds.includes(String(userId));
};

const canViewGroup = (group, userId) => {
    if (!group || !userId) return false;
    return group.members.some((m) => String(m.userId) === String(userId));
};

const buildGroupPayload = (group) => {
    const seen = new Set();
    const normalizedMembers = (group.members || []).filter((member) => {
        const userId = member?.userId && member.userId._id ? String(member.userId._id) : String(member?.userId || "");
        if (!userId || seen.has(userId)) return false;
        seen.add(userId);
        return true;
    }).map((member) => ({
        ...member.toObject ? member.toObject() : member,
        userId: member?.userId && member.userId._id ? member.userId._id : member?.userId,
        user: member?.userId && typeof member.userId === "object" && !member.userId._id ? member.userId : null,
    }));

    return {
        _id: group._id,
        groupName: group.groupName,
        groupPhoto: group.groupPhoto,
        createdBy: group.createdBy,
        members: normalizedMembers,
        admins: group.admins,
        lastMessage: group.lastMessage,
        lastMessageAt: group.lastMessageAt,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt,
        memberCount: normalizedMembers.length,
    };
};

exports.createGroup = async (req, res) => {
    try {
        const { groupName, groupPhoto, memberIds = [] } = req.body;

        if (!groupName || !groupName.trim()) {
            return res.status(400).json({ msg: "Group name is required." });
        }

        const trimmedName = groupName.trim();
        const uniqueMembers = [...new Set(memberIds.map(String))];
        const userId = req.user.id;

        if (!userId) {
            return res.status(401).json({ msg: "Invalid user session." });
        }

        const memberIdsToAdd = uniqueMembers.filter((id) => String(id) !== String(userId));
        const existingUsers = await User.find({ _id: { $in: memberIdsToAdd } }).select("_id");
        const foundIds = existingUsers.map((u) => String(u._id));

        const invalidIds = memberIdsToAdd.filter((id) => !foundIds.includes(id));
        if (invalidIds.length) {
            return res.status(400).json({ msg: "One or more selected users are invalid." });
        }

        const group = new Group({
            groupName: trimmedName,
            groupPhoto: groupPhoto || "",
            createdBy: userId,
            members: [
                getMemberEntry(userId, "admin"),
                ...memberIdsToAdd.map((id) => getMemberEntry(id, "member")),
            ],
            admins: [normalizeId(userId)],
            lastMessage: "",
            lastMessageAt: null,
        });

        await group.save();

        const populated = await formatGroup(group);

        const io = socketServer.getIO && socketServer.getIO();
        if (io) {
            if (populated.members?.length) {
                for (const member of populated.members) {
                    const memberUserId = member.userId && member.userId._id ? member.userId._id.toString() : member.userId?.toString();
                    if (memberUserId) {
                        io.to(`user_${memberUserId}`).emit("group:memberAdded", {
                            groupId: populated._id.toString(),
                            group: buildGroupPayload(populated),
                        });
                    }
                }
            }
        }

        return res.status(201).json({
            message: "Group created successfully",
            group: buildGroupPayload(populated),
        });
    } catch (err) {
        console.error("Create group error:", err);
        return res.status(500).json({ msg: err.message || "Failed to create group." });
    }
};

exports.getMyGroups = async (req, res) => {
    try {
        const userId = req.user.id;

        const groups = await Group.find({
            isDeleted: false,
            "members.userId": normalizeId(userId),
        })
            .sort({ lastMessageAt: -1, updatedAt: -1 })
            .populate("createdBy", "name photo")
            .populate("admins", "name photo")
            .populate("members.userId", "name photo email isOnline");

        const payload = await Promise.all(
            groups.map(async (group) => {
                const lastMessage = await Message.findOne({ group: group._id }).sort({ createdAt: -1 }).populate("sender", "name photo");

                return {
                    ...buildGroupPayload(group),
                    lastMessagePreview: lastMessage ? lastMessage.content || lastMessage.text || "" : "",
                    lastMessageSender: lastMessage ? lastMessage.sender : null,
                    unreadCount: 0,
                };
            })
        );

        return res.json(payload);
    } catch (err) {
        console.error("Get my groups error:", err);
        return res.status(500).json({ msg: err.message || "Failed to fetch groups." });
    }
};

exports.getGroupById = async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user.id;

        const group = await Group.findOne({ _id: groupId, isDeleted: false })
            .populate("createdBy", "name photo email")
            .populate("admins", "name photo email")
            .populate("members.userId", "name photo email isOnline");

        if (!group) {
            return res.status(404).json({ msg: "Group not found." });
        }

        if (!canViewGroup(group, userId)) {
            return res.status(403).json({ msg: "You are not a member of this group." });
        }

        const unreadMessages = await Message.countDocuments({
            group: group._id,
            sender: { $ne: normalizeId(userId) },
            isRead: { $ne: true },
            recipients: { $in: [normalizeId(userId)] },
        });

        return res.json({
            ...buildGroupPayload(group),
            unreadCount: unreadMessages,
        });
    } catch (err) {
        console.error("Get group error:", err);
        return res.status(500).json({ msg: err.message || "Failed to fetch group." });
    }
};

exports.updateGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { groupName, groupPhoto } = req.body;
        const userId = req.user.id;

        const group = await Group.findOne({ _id: groupId, isDeleted: false });
        if (!group) {
            return res.status(404).json({ msg: "Group not found." });
        }

        if (!canManageGroup(group, userId)) {
            return res.status(403).json({ msg: "Only group admins can edit this group." });
        }

        if (groupName !== undefined && groupName.trim()) {
            group.groupName = groupName.trim();
        }

        if (groupPhoto !== undefined) {
            group.groupPhoto = groupPhoto || "";
        }

        await group.save();

        const io = socketServer.getIO && socketServer.getIO();
        if (io) {
            io.to(`group:${group._id.toString()}`).emit("group:updated", {
                groupId: group._id.toString(),
                group: buildGroupPayload(group),
            });
        }

        return res.json({ message: "Group updated successfully", group: buildGroupPayload(group) });
    } catch (err) {
        console.error("Update group error:", err);
        return res.status(500).json({ msg: err.message || "Failed to update group." });
    }
};

exports.deleteGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user.id;

        const group = await Group.findOne({ _id: groupId, isDeleted: false });
        if (!group) {
            return res.status(404).json({ msg: "Group not found." });
        }

        if (!canManageGroup(group, userId)) {
            return res.status(403).json({ msg: "Only group admins can delete this group." });
        }

        group.isDeleted = true;
        await group.save();

        const io = socketServer.getIO && socketServer.getIO();
        if (io) {
            io.to(`group:${group._id.toString()}`).emit("group:deleted", {
                groupId: group._id.toString(),
            });
        }

        return res.json({ message: "Group deleted successfully" });
    } catch (err) {
        console.error("Delete group error:", err);
        return res.status(500).json({ msg: err.message || "Failed to delete group." });
    }
};

exports.addMembers = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { memberIds = [] } = req.body;
        const userId = req.user.id;

        const group = await Group.findOne({ _id: groupId, isDeleted: false });
        if (!group) {
            return res.status(404).json({ msg: "Group not found." });
        }

        if (!canManageGroup(group, userId)) {
            return res.status(403).json({ msg: "Only group admins can add members." });
        }

        const uniqueMembers = [...new Set(memberIds.map(String))];
        const existingIds = group.members.map((m) => String(m.userId));

        const validNewIds = uniqueMembers.filter((id) => !existingIds.includes(id));
        const users = await User.find({ _id: { $in: validNewIds } }).select("_id");

        if (users.length !== validNewIds.length) {
            return res.status(400).json({ msg: "One or more selected users are invalid." });
        }

        const newMembers = validNewIds.map((id) => getMemberEntry(id, "member"));
        group.members.push(...newMembers);
        await group.save();

        const io = socketServer.getIO && socketServer.getIO();
        if (io) {
            for (const id of validNewIds) {
                io.to(`user_${id}`).emit("group:memberAdded", {
                    groupId: group._id.toString(),
                    group: buildGroupPayload(group),
                });
            }
            io.to(`group:${group._id.toString()}`).emit("group:memberAdded", {
                groupId: group._id.toString(),
                group: buildGroupPayload(group),
            });
        }

        return res.json({ message: "Members added successfully", group: buildGroupPayload(group) });
    } catch (err) {
        console.error("Add members error:", err);
        return res.status(500).json({ msg: err.message || "Failed to add members." });
    }
};

exports.removeMember = async (req, res) => {
    try {
        const { groupId, userId: targetUserId } = req.params;
        const authUserId = req.user.id;

        const group = await Group.findOne({ _id: groupId, isDeleted: false });
        if (!group) {
            return res.status(404).json({ msg: "Group not found." });
        }

        const requesterIsAdmin = canManageGroup(group, authUserId);
        const isSelfRemoval = String(authUserId) === String(targetUserId);

        if (!requesterIsAdmin && !isSelfRemoval) {
            return res.status(403).json({ msg: "You do not have permission to remove members." });
        }

        if (String(group.createdBy) === String(targetUserId)) {
            return res.status(400).json({ msg: "Group creator cannot be removed." });
        }

        const beforeLength = group.members.length;
        group.members = group.members.filter((m) => String(m.userId) !== String(targetUserId));
        group.admins = group.admins.filter((id) => String(id) !== String(targetUserId));

        if (group.members.length === beforeLength) {
            return res.status(404).json({ msg: "User is not a member of this group." });
        }

        await group.save();

        const io = socketServer.getIO && socketServer.getIO();
        if (io) {
            io.to(`group:${group._id.toString()}`).emit("group:memberRemoved", {
                groupId: group._id.toString(),
                removedUserId: targetUserId,
            });
        }

        return res.json({ message: "Member removed successfully", group: buildGroupPayload(group) });
    } catch (err) {
        console.error("Remove member error:", err);
        return res.status(500).json({ msg: err.message || "Failed to remove member." });
    }
};

exports.updateMemberAdminStatus = async (req, res) => {
    try {
        const { groupId, userId: targetUserId } = req.params;
        const { isAdmin } = req.body;
        const authUserId = req.user.id;

        const group = await Group.findOne({ _id: groupId, isDeleted: false });
        if (!group) {
            return res.status(404).json({ msg: "Group not found." });
        }

        if (!canManageGroup(group, authUserId)) {
            return res.status(403).json({ msg: "Only group admins can change admin status." });
        }

        if (String(group.createdBy) === String(targetUserId) && !isAdmin) {
            return res.status(400).json({ msg: "The group creator must remain admin." });
        }

        const member = group.members.find((m) => String(m.userId) === String(targetUserId));
        if (!member) {
            return res.status(404).json({ msg: "User is not a member of this group." });
        }

        member.role = isAdmin ? "admin" : "member";

        if (isAdmin) {
            if (!group.admins.some((id) => String(id) === String(targetUserId))) {
                group.admins.push(normalizeId(targetUserId));
            }
        } else {
            group.admins = group.admins.filter((id) => String(id) !== String(targetUserId));
        }

        await group.save();

        const io = socketServer.getIO && socketServer.getIO();
        if (io) {
            io.to(`group:${group._id.toString()}`).emit("group:updated", {
                groupId: group._id.toString(),
                group: buildGroupPayload(group),
            });
        }

        return res.json({ message: "Admin status updated successfully", group: buildGroupPayload(group) });
    } catch (err) {
        console.error("Update member admin status error:", err);
        return res.status(500).json({ msg: err.message || "Failed to update admin status." });
    }
};

exports.leaveGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user.id;

        const group = await Group.findOne({ _id: groupId, isDeleted: false });
        if (!group) {
            return res.status(404).json({ msg: "Group not found." });
        }

        if (!canViewGroup(group, userId)) {
            return res.status(403).json({ msg: "You are not a member of this group." });
        }

        if (String(group.createdBy) === String(userId)) {
            return res.status(400).json({ msg: "Group creator cannot leave the group. Delete it instead." });
        }

        group.members = group.members.filter((m) => String(m.userId) !== String(userId));
        group.admins = group.admins.filter((id) => String(id) !== String(userId));
        await group.save();

        const io = socketServer.getIO && socketServer.getIO();
        if (io) {
            io.to(`group:${group._id.toString()}`).emit("group:memberRemoved", {
                groupId: group._id.toString(),
                removedUserId: userId,
            });
        }

        return res.json({ message: "Left group successfully" });
    } catch (err) {
        console.error("Leave group error:", err);
        return res.status(500).json({ msg: err.message || "Failed to leave group." });
    }
};

exports.getGroupMessages = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { page = 1, limit = 40 } = req.query;
        const userId = req.user.id;

        const group = await Group.findOne({ _id: groupId, isDeleted: false });
        if (!group) {
            return res.status(404).json({ msg: "Group not found." });
        }

        if (!canViewGroup(group, userId)) {
            return res.status(403).json({ msg: "You are not a member of this group." });
        }

        const pageNum = Math.max(1, Number(page));
        const pageLimit = Math.min(100, Math.max(1, Number(limit)));
        const skip = (pageNum - 1) * pageLimit;

        const [messages, total] = await Promise.all([
            Message.find({ group: groupId })
                .sort({ createdAt: 1 })
                .skip(skip)
                .limit(pageLimit)
                .populate("sender", "name photo email")
                .lean(),
            Message.countDocuments({ group: groupId }),
        ]);

        await Message.updateMany(
            {
                group: groupId,
                sender: { $ne: normalizeId(userId) },
                recipients: { $in: [normalizeId(userId)] },
                isRead: { $ne: true },
            },
            { $set: { isRead: true } }
        );

        return res.json({
            messages,
            pagination: {
                page: pageNum,
                limit: pageLimit,
                total,
                totalPages: Math.ceil(total / pageLimit),
            },
        });
    } catch (err) {
        console.error("Get group messages error:", err);
        return res.status(500).json({ msg: err.message || "Failed to fetch group messages." });
    }
};

exports.sendGroupMessage = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { content, clientMessageId } = req.body;
        const userId = req.user.id;

        if (!content || !content.trim()) {
            return res.status(400).json({ msg: "Message content is required." });
        }

        const group = await Group.findOne({ _id: groupId, isDeleted: false });
        if (!group) {
            return res.status(404).json({ msg: "Group not found." });
        }

        if (!canViewGroup(group, userId)) {
            return res.status(403).json({ msg: "You are not allowed to send messages in this group." });
        }

        const cleanText = content.trim().slice(0, 3000);
        const message = await Message.create({
            sender: normalizeId(userId),
            group: normalizeId(groupId),
            content: cleanText,
            type: "group",
            clientMessageId,
            recipients: group.members.map((member) => normalizeId(member.userId)),
            isRead: false,
        });

        const populatedMessage = await Message.findById(message._id).populate("sender", "name photo email");

        group.lastMessage = cleanText;
        group.lastMessageAt = new Date();
        await group.save();

        const io = socketServer.getIO && socketServer.getIO();
        if (io) {
            io.to(`group:${groupId}`).emit("group:message", {
                _id: populatedMessage._id.toString(),
                sender: populatedMessage.sender,
                group: groupId,
                content: cleanText,
                type: "group",
                createdAt: populatedMessage.createdAt,
                clientMessageId,
            });
        }

        return res.status(201).json({
            message: "Group message sent successfully",
            data: populatedMessage,
        });
    } catch (err) {
        console.error("Send group message error:", err);
        return res.status(500).json({ msg: err.message || "Failed to send group message." });
    }
};
