const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { addSkill, getMySkills, getAllSkills, deleteSkill, updateSkill } = require("../controllers/skillController");

// Add a new skill
router.post("/", auth, addSkill);

// Get current user's skills (specific route - must come before generic GET /)
router.get("/my-skills", auth, getMySkills);

// Get all skills (for browsing)  - generic route - must come after specific routes
router.get("/", auth, getAllSkills);

// Get all skills (alternate route for backward compatibility)
router.get("/all", auth, getAllSkills);

// Update a skill (must come before /:id DELETE route to ensure :id doesn't match)
router.put("/:id", auth, updateSkill);

// Delete a skill
router.delete("/:id", auth, deleteSkill);

module.exports = router;

