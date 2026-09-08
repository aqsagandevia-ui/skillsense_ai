const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
    {
        learner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        mentor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        skillTopic: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Skill",
            required: true
        },

        message: {
            type: String,
            default: ""
        },

        scheduledAt: {
            type: Date,
            default: null
        },

        meetingLink: {
            type: String,
            default: ""
        },

        googleCalendarEventId: {
            type: String,
            default: ""
        },

        // Workflow status: pending -> accepted -> scheduled -> in-progress -> completed -> rejected/cancelled
        status: {
            type: String,
            enum: ["pending", "accepted", "scheduled", "in-progress", "completed", "rejected", "cancelled"],
            default: "pending"
        },

        // Optional reference back to the originating skill request
        skillRequest: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SkillRequest",
            default: null
        },

        rating: {
            type: Number,
            default: 0
        },

        startedAt: {
            type: Date,
            default: null
        },

        completedAt: {
            type: Date,
            default: null
        }
        ,
        // Optional note from mentor when scheduling
        mentorNote: {
            type: String,
            default: ""
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Session", sessionSchema);