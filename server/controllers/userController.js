const User = require("../models/User");
const Session = require("../models/Session");

// Get profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Get all mentors (users with skills to teach)
exports.getMentors = async (req, res) => {
  try {
    // Get the current user ID from auth middleware
    const currentUserId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20); // Max 100, default 20
    const skip = (page - 1) * limit;
    
    // Get total count
    const total = await User.countDocuments({
      _id: { $ne: currentUserId },
      skills: { $exists: true, $ne: [] }
    });
    
    // Get users who have at least one skill with type "teach", excluding current user
    const mentors = await User.find({
      _id: { $ne: currentUserId },
      skills: { $exists: true, $ne: [] }
    })
      .select("-password")
      .limit(limit)
.skip(skip)
    
    res.json({
      mentors,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Get a single user by ID (for viewing mentor profiles)
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Update profile (skills + availability + basic info + photo)
exports.updateProfile = async (req, res) => {
  try {
    const { 
      name, 
      bio, 
      skills, 
      skillsToLearn, 
      availability, 
      photo,
      // Learner fields
      learningGoals,
      // Mentor fields
      qualifications,
      certifications,
      yearsOfExperience,
      areasOfExpertise,
      teachingStyle,
      portfolio
    } = req.body;

    // Build update object
    const updateData = {};
    
    // Handle basic info updates (for both roles)
    if (name !== undefined) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;

    // Handle photo update (base64 string from client)
    if (photo !== undefined) {
      // Validate base64 image format
      if (photo && !photo.startsWith('data:image/')) {
        return res.status(400).json({ msg: "Invalid photo format" });
      }
      // Check size - base64 strings are ~33% larger than original file
      // Allow up to 3MB original size (roughly 4MB base64 string)
      if (photo && photo.length > 4 * 1024 * 1024) {
        return res.status(400).json({ msg: "Photo size too large (max 3MB)" });
      }
      updateData.photo = photo;
    }

    // ==================== LEARNER FIELDS ====================
    // Handle skillsToLearn update (skills the user wants to learn)
    if (skillsToLearn !== undefined) {
      console.log("📝 Updating skillsToLearn:", skillsToLearn);
      if (!Array.isArray(skillsToLearn)) {
        return res.status(400).json({ msg: "Skills to learn must be an array" });
      }
      for (let skill of skillsToLearn) {
        if (!skill.skillName) {
          return res.status(400).json({ msg: "Each skill must have a name" });
        }
      }
      updateData.skillsToLearn = skillsToLearn;
    }

    // Handle learning goals update
    if (learningGoals !== undefined) {
      updateData.learningGoals = learningGoals;
    }

    // ==================== MENTOR FIELDS ====================
    // Handle skills update (skills the user can teach)
    if (skills !== undefined) {
      if (!Array.isArray(skills)) {
        return res.status(400).json({ msg: "Skills must be an array" });
      }
      for (let skill of skills) {
        if (!skill.name || !skill.type || !skill.level) {
          return res.status(400).json({ msg: "Each skill must have name, type, and level" });
        }
      }
      updateData.skills = skills;
    }

    // Handle qualifications update
    if (qualifications !== undefined && qualifications.length > 0) {
      if (!Array.isArray(qualifications)) {
        return res.status(400).json({ msg: "Qualifications must be an array" });
      }
      updateData.qualifications = qualifications;
    }

    // Handle certifications update
    if (certifications !== undefined) {
      if (!Array.isArray(certifications)) {
        return res.status(400).json({ msg: "Certifications must be an array" });
      }
      // Handle both string arrays and object arrays from client
      const certStrings = certifications.map(cert => 
        typeof cert === 'string' ? cert : (cert.name || 'Unnamed certification')
      );
      updateData.certifications = certStrings;
    }

    // Handle years of experience update
    if (yearsOfExperience !== undefined) {
      const yearsNum = Number(yearsOfExperience);
      if (isNaN(yearsNum) || yearsNum < 0) {
        return res.status(400).json({ msg: "Years of experience must be a valid non-negative number" });
      }
      updateData.yearsOfExperience = yearsNum;
    }

    // Handle areas of expertise update
    if (areasOfExpertise !== undefined && areasOfExpertise.length > 0) {
      if (!Array.isArray(areasOfExpertise)) {
        return res.status(400).json({ msg: "Areas of expertise must be an array" });
      }
      updateData.areasOfExpertise = areasOfExpertise;
    }

    // Handle teaching style update
    if (teachingStyle !== undefined) {
      updateData.teachingStyle = teachingStyle;
    }

    // Handle availability update
    if (availability !== undefined) {
      if (!Array.isArray(availability)) {
        return res.status(400).json({ msg: "Availability must be an array" });
      }
      updateData.availability = availability;
    }

    // Handle portfolio update
    if (portfolio !== undefined) {
      if (!Array.isArray(portfolio)) {
        return res.status(400).json({ msg: "Portfolio must be an array" });
      }
      updateData.portfolio = portfolio;
    }

    console.log("📥 Incoming req.body keys:", Object.keys(req.body));
    console.log("📝 Full updateData:", JSON.stringify(updateData, null, 2));
    console.log("📝 User ID being updated:", req.user.id);

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true }
    ).select("-password");

    console.log("✅ User updated, result:", user ? "success" : "null");

    res.json({ message: "Profile updated", user });
  } catch (err) {
    console.error("❌ Error updating profile:", err);
    res.status(500).json({ msg: err.message });
  }
};

// Get all users (for chat - exclude current user)
exports.getAllUsers = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20); // Max 50, default 20
    const skip = (page - 1) * limit;
    
    // Get total count (async)
    const total = await User.countDocuments({ _id: { $ne: currentUserId } });
    
    const users = await User.find({ _id: { $ne: currentUserId } })
      .select("name isOnline")
      .sort({ name: 1 })
      .limit(limit)
      .skip(skip)
    
    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Search users by name or skills (for finding mentors/learners)
exports.searchUsers = async (req, res) => {
  try {
    const { query, role, category } = req.query;
    const currentUserId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20); // Max 50, default 20
    const skip = (page - 1) * limit;

    let filter = { _id: { $ne: currentUserId } };
    
    // Filter by role if specified
    if (role) {
      filter.role = role;
    }
    
    // Search by name or bio
    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: 'i' } },
        { bio: { $regex: query, $options: 'i' } }
      ];
    }
    
    // Get total count
    const total = await User.countDocuments(filter);
    
    const users = await User.find(filter)
      .populate('skills')
      .select("-password")
      .sort({ rating: -1 })
      .limit(limit)
.skip(skip)
    
    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Get learner's learning history (completed sessions)
exports.getLearningHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const sessions = await Session.find({
      learner: userId,
      status: "completed"
    })
      .populate('mentor', 'name photo')
      .populate('skillTopic')
      .sort({ completedAt: -1 });
    
    const stats = {
      totalSessions: sessions.length,
      skillsLearned: [...new Set(sessions.map(s => s.skillTopic?.skillName).filter(Boolean))]
    };
    
    res.json({ sessions, stats });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Get learner dashboard summary
exports.getLearnerDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const sessions = await Session.find({ learner: userId })
      .populate('mentor', 'name photo')
      .populate('skillTopic', 'skillName')
      .sort({ createdAt: -1 });

    const requestsSent = sessions.filter((session) => session.status === 'pending' || session.status === 'accepted').length;
    const upcomingSessions = sessions.filter((session) => ['scheduled', 'in-progress'].includes(session.status)).length;
    const completedSessions = sessions.filter((session) => session.status === 'completed').length;

    res.json({
      requestsSent,
      upcomingSessions,
      completedSessions,
      favouriteMentors: new Set(sessions.map((session) => session.mentor?._id?.toString()).filter(Boolean)).size,
      learningHours: completedSessions * 1,
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Get mentor's completed sessions (for tracking)
exports.getMentorSessions = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const sessions = await Session.find({
      mentor: userId
    })
      .populate('learner', 'name photo')
      .populate('skillTopic')
      .sort({ createdAt: -1 });
    
    const completed = sessions.filter((s) => s.status === 'completed');
    const stats = {
      totalSessions: sessions.length,
      completedSessions: completed.length,
      upcomingSessions: sessions.filter((s) => ['scheduled', 'in-progress'].includes(s.status)).length,
      studentsHelped: new Set(completed.map(s => s.learner?._id?.toString()).filter(Boolean)).size
    };
    
    res.json({ sessions, stats });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Add review/rating to a user
exports.addReview = async (req, res) => {
  try {
    const { userId } = req.params;
    const { rating, comment } = req.body;
    const fromUserId = req.user.id;
    
    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ msg: "Rating must be between 1 and 5" });
    }
    
    // Check if user already reviewed this person
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    
    const existingReview = user.reviewsReceived.find(
      r => r.fromUser.toString() === fromUserId
    );
    
    if (existingReview) {
      // Update existing review
      existingReview.rating = rating;
      existingReview.comment = comment;
    } else {
      // Add new review
      user.reviewsReceived.push({
        fromUser: fromUserId,
        rating,
        comment,
        createdAt: new Date()
      });
    }
    
    // Recalculate average rating
    if (user.reviewsReceived.length > 0) {
      const avgRating = user.reviewsReceived.reduce((sum, r) => sum + r.rating, 0) / user.reviewsReceived.length;
      user.rating = Math.round(avgRating * 10) / 10;
    }
    
    await user.save();
    
    res.json({ message: "Review added successfully", user });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Get user's reviews
exports.getUserReviews = async (req, res) => {
  try {
    let { userId } = req.params;
    
    // Handle "me" parameter to use authenticated user's ID
    if (userId === "me") {
      userId = req.user.id;
    }
    
    const user = await User.findById(userId)
      .select('rating reviewsReceived')
      .populate('reviewsReceived.fromUser', 'name photo');
    
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    
    res.json({
      averageRating: user.rating,
      reviewCount: user.reviewsReceived.length,
      reviews: user.reviewsReceived
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Get user's availability schedule
exports.getAvailability = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId).select('availability');
    
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    
    res.json({ availability: user.availability });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Update availability schedule
exports.updateAvailability = async (req, res) => {
  try {
    const { availability } = req.body;
    
    if (!Array.isArray(availability)) {
      return res.status(400).json({ msg: "Availability must be an array" });
    }
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { availability },
      { new: true }
    ).select("-password");
    
    res.json({ message: "Availability updated", availability: user.availability });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Get learners for a mentor
exports.getLearners = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const Session = require("../models/Session");
    
    // Get unique learners from mentor's sessions
    const sessions = await Session.find({ mentor: userId })
      .select('learner')
      .distinct('learner');
    
    // Fetch learner details
    const learners = await User.find({ _id: { $in: sessions } })
      .select('name photo email learningGoals bio')
      .limit(50);
    
    res.json(learners);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
