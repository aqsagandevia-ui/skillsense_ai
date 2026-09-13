const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        role: {
            type: String,
            enum: ["admin", "member"],
            default: "member",
        },
        joinedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { _id: false }
);

const groupSchema = new mongoose.Schema(
    {
        groupName: {
            type: String,
            required: true,
            trim: true,
            maxlength: 80,
        },
        groupPhoto: {
            type: String,
            default: "",
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        members: {
            type: [memberSchema],
            default: [],
        },
        admins: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        lastMessage: {
            type: String,
            default: "",
        },
        lastMessageAt: {
            type: Date,
            default: null,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

groupSchema.index({ "members.userId": 1 });
groupSchema.index({ createdBy: 1 });

groupSchema.methods.toPublicJSON = function () {
    const obj = this.toObject();

    const uniqueMembers = [];
    const seen = new Set();

    for (const member of obj.members || []) {
        const userId = member.userId && member.userId._id ? member.userId._id.toString() : member.userId?.toString?.() || String(member.userId);
        if (!userId || seen.has(userId)) continue;
        seen.add(userId);
        uniqueMembers.push({
            ...member,
            userId,
            user: member.userId && typeof member.userId === "object" ? member.userId : null,
        });
    }

    obj.memberCount = uniqueMembers.length;
    obj.members = uniqueMembers;

    return obj;
};

module.exports = mongoose.model("Group", groupSchema);
