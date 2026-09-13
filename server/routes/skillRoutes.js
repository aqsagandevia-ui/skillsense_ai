const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { addSkill, getMySkills, getAllSkills, deleteSkill, updateSkill } = require("../controllers/skillController");

// Public read-only routes: browsing skills should not require login.
router.get("/", getAllSkills);
router.get("/all", getAllSkills);

// Auth-required routes for user-owned actions.
router.post("/", auth, addSkill);
router.get("/my-skills", auth, getMySkills);
router.put("/:id", auth, updateSkill);
router.delete("/:id", auth, deleteSkill);

module.exports = router;

