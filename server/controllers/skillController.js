const Skill = require("../models/Skill");

// Add a new skill
exports.addSkill = async (req, res) => {
  try {
    const { skillName, category, description, experienceLevel, image, overview, benefits, useCases } = req.body;
    
    console.log("📝 Adding skill - Body:", req.body);
    console.log("📝 User from auth:", req.user);
    
    if (!skillName || !skillName.trim()) {
      return res.status(400).json({ error: "Skill name is required" });
    }
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Unauthorized - no user ID" });
    }
    
    const newSkill = new Skill({
      user: req.user.id,
      skillName: skillName.trim(),
      category: category || "other",
      description: description || "",
      experienceLevel: experienceLevel || "intermediate",
      image: image || null,
      overview: overview || "",
      benefits: benefits || "",
      useCases: useCases || ""
    });
    
    await newSkill.save();
    console.log("✅ Skill saved:", newSkill._id);
    res.json({ message: "Skill added successfully", skill: newSkill });
  } catch (err) {
    console.error("❌ Error adding skill:", err);
    res.status(400).json({ error: err.message });
  }
};

// Get current user's skills
exports.getMySkills = async (req, res) => {
  try {
    const skills = await Skill.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(skills);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all skills (for browsing)
exports.getAllSkills = async (req, res) => {
  try {
    const { category, search, user } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20); // Max 100, default 20
    const skip = (page - 1) * limit;
    
    let query = {};
    
    if (category && category !== "all") {
      query.category = category;
    }
    
    if (search) {
      query.skillName = { $regex: search, $options: "i" };
    }
    
    if (user) {
      query.user = user;
    }
    
    // Get total count
    const total = await Skill.countDocuments(query);
    
    const skills = await Skill.find(query)
      .populate("user", "name photo title bio _id yearsOfExperience")
      .sort({ createdAt: -1 })
      .limit(limit)
.skip(skip)
    
    res.json({
      skills,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete a skill
exports.deleteSkill = async (req, res) => {
  try {
    const skill = await Skill.findOne({ _id: req.params.id, user: req.user.id });
    
    if (!skill) {
      return res.status(404).json({ error: "Skill not found" });
    }
    
    await Skill.findByIdAndDelete(req.params.id);
    res.json({ message: "Skill deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update a skill
exports.updateSkill = async (req, res) => {
  try {
    const { skillName, category, description, experienceLevel, image, overview, benefits, useCases } = req.body;
    
    const skill = await Skill.findOne({ _id: req.params.id, user: req.user.id });
    
    if (!skill) {
      return res.status(404).json({ error: "Skill not found" });
    }
    
    if (skillName) skill.skillName = skillName;
    if (category) skill.category = category;
    if (description !== undefined) skill.description = description;
    if (experienceLevel) skill.experienceLevel = experienceLevel;
    if (image !== undefined) skill.image = image;
    if (overview !== undefined) skill.overview = overview;
    if (benefits !== undefined) skill.benefits = benefits;
    if (useCases !== undefined) skill.useCases = useCases;
    
    await skill.save();
    res.json({ message: "Skill updated successfully", skill });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};