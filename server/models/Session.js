const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
    {
        learner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        learners: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: []
        }],

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

        startTime: {
            type: Date,
            default: null
        },

        endTime: {
            type: Date,
            default: null
        },

        duration: {
            type: Number,
            default: null,
            min: 15,
            max: 240
        },

        meetingLink: {
            type: String,
            default: ""
        },

        closedAt: {
            type: Date,
            default: null
        },

        closedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        googleCalendarEventId: {
            type: String,
            default: ""
        },

        // Workflow status: pending -> accepted -> scheduled -> live -> completed -> rejected/cancelled
        status: {
            type: String,
            enum: ["pending", "accepted", "scheduled", "live", "in-progress", "completed", "rejected", "cancelled"],
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
        },
        // Optional note from mentor when scheduling
        mentorNote: {
            type: String,
            default: ""
        }
    },
    { timestamps: true }
);

sessionSchema.pre('save', async function () {
    const legacyLearner = this.learner ? [this.learner] : [];
    const uniqueLearners = new Set(
        [...legacyLearner, ...(Array.isArray(this.learners) ? this.learners : [])]
            .filter(Boolean)
            .map((item) => item.toString())
    );

    if (uniqueLearners.size > 0) {
        this.learners = [...uniqueLearners].map((id) => mongoose.Types.ObjectId(id));
        this.learner = this.learner || mongoose.Types.ObjectId([...uniqueLearners][0]);
    }

    if (this.startTime && !this.scheduledAt) {
        this.scheduledAt = new Date(this.startTime);
    }

    if (!this.startTime && this.scheduledAt) {
        this.startTime = new Date(this.scheduledAt);
    }

    const startValue = this.startTime || this.scheduledAt;
    const durationMinutes = Number(this.duration);

    if (startValue) {
        const startDate = new Date(startValue);
        this.scheduledAt = new Date(startDate);
        this.startTime = new Date(startDate);

        if (Number.isFinite(durationMinutes) && durationMinutes > 0) {
            this.endTime = new Date(startDate.getTime() + durationMinutes * 60 * 1000);
        } else if (this.endTime && this.startTime) {
            const durationFromEnd = Math.round((new Date(this.endTime) - startDate) / 60000);
            if (durationFromEnd > 0) {
                this.duration = durationFromEnd;
            }
        }
    }

    if (this.closedAt) {
        this.closedBy = this.closedBy || this.mentor;
        this.endTime = this.endTime || new Date(this.closedAt);
        this.status = 'completed';
        this.completedAt = this.completedAt || new Date(this.closedAt);
        return;
    }

    if (this.status === 'cancelled') return;

    if (this.startTime && this.endTime) {
        const now = new Date();
        if (now < this.startTime) {
            this.status = 'scheduled';
        } else if (now >= this.startTime && now < this.endTime) {
            this.status = 'live';
        } else {
            this.status = 'completed';
            this.completedAt = this.completedAt || new Date();
        }
    }
});

module.exports = mongoose.model("Session", sessionSchema);