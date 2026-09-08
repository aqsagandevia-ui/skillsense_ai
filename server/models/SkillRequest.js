const mongoose = require("mongoose");

/* =========================
   SkillRequest Schema
========================= */
const skillRequestSchema = new mongoose.Schema({
  // Learner requesting the skill
  learner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  
  // Mentor offering to teach
  mentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  
  // The skill being requested
  skillTopic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Skill",
    required: true,
  },
  
  // Message from learner
  message: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  
  // Request status
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected", "completed", "cancelled"],
    default: "pending",
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
  
  respondedAt: {
    type: Date,
  }
});

// Index for efficient queries
skillRequestSchema.index({ learner: 1 });
skillRequestSchema.index({ mentor: 1 });
skillRequestSchema.index({ status: 1 });
skillRequestSchema.index({ createdAt: -1 });
skillRequestSchema.index({ learner: 1, mentor: 1, skillTopic: 1 }); // Unique constraint equivalent

module.exports = mongoose.model("SkillRequest", skillRequestSchema);

