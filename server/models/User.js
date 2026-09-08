const mongoose = require("mongoose");

/* =========================
   Availability Schema
========================= */
const availabilitySchema = new mongoose.Schema(
  {
    day: { type: String },
    time: { type: String },
  },
  { _id: false }
);

/* =========================
   Review Schema
========================= */
const reviewSchema = new mongoose.Schema(
  {
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

/* =========================
   Portfolio Project Schema
========================= */
const portfolioSchema = new mongoose.Schema(
  {
    title: { type: String },
    description: { type: String },
    link: { type: String },
    addedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

/* =========================
   User Schema
========================= */
const userSchema = new mongoose.Schema(
  {
    // Basic Info (for both roles)
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    bio: { type: String },
    photo: { type: String },

    // 🔐 Normal Login
    password: { type: String }, // hashed password
    
    // 🔑 Password Reset
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },

    // 🔐 Password Reset OTP
    resetOtp: { type: String },
    resetOtpExpires: { type: Date },

    // 🔑 Google Login
    provider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    // Role (learner, mentor or admin)
    role: { 
      type: String, 
      enum: ["user", "learner", "mentor", "admin"],
      required: true,
      default: "learner"
    },

    // ==================== LEARNER SPECIFIC FIELDS ====================
    // Skills the user wants to learn
    skillsToLearn: {
      type: [mongoose.Schema.Types.Mixed],
      default: []
    },

    // Learning goals
    learningGoals: { type: String },

    // Sessions completed
    sessionsCompleted: { type: Number, default: 0 },

    // ==================== MENTOR SPECIFIC FIELDS ====================
    // Skills the user can teach (teaching experience)
    skills: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Skill"
    }],

    // Professional experience
    qualifications: {
      type: [String],
      default: []
    },

    certifications: {
      type: [String],
      default: []
    },

    yearsOfExperience: { type: Number },

    areasOfExpertise: {
      type: [String],
      default: []
    },

    // Teaching style / description
    teachingStyle: { type: String },

    // Availability for sessions (for mentors)
    availability: [availabilitySchema],

    // Portfolio / Linked projects
    portfolio: [portfolioSchema],

    // ==================== SHARED RATING & REVIEWS ====================
    // Average rating (calculated from reviews)
    rating: { type: Number, default: 0, min: 0, max: 5 },

    // Reviews received
    reviewsReceived: [reviewSchema],
    reviewSummary: { type: String, default: '' },
    reviewInsights: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    mentorScore: { type: Number, default: 0 },

    // ==================== COMMON FIELDS ====================
    // Trust score
    trustScore: { type: Number, default: 0 },

    // 💬 Realtime Chat
    isOnline: { type: Boolean, default: false },

    // Account control
    isBlocked: { type: Boolean, default: false },

    // 🔗 Google OAuth Tokens
    googleTokens: {
      access_token: { type: String },
      refresh_token: { type: String },
      scope: { type: String },
      token_type: { type: String },
      expiry_date: { type: Number },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
