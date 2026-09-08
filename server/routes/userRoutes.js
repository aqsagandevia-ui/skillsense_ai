const router = require("express").Router();
const auth = require("../middleware/auth");
const { 
  getProfile, 
  updateProfile, 
  getMentors, 
  getAllUsers, 
  getUserById,
  searchUsers,
  getLearningHistory,
  getLearnerDashboard,
  getMentorSessions,
  addReview,
  getUserReviews,
  getAvailability,
  updateAvailability,
  getLearners
} = require("../controllers/userController");

router.get("/me", auth, getProfile);
router.get("/mentors", auth, getMentors);
router.get("/all", auth, getAllUsers);
router.get("/learners", auth, getLearners);
router.get("/search", auth, searchUsers);
router.get("/learning-history", auth, getLearningHistory);
router.get("/dashboard", auth, getLearnerDashboard);
router.get("/mentor-sessions", auth, getMentorSessions);
router.get("/reviews/:userId", auth, getUserReviews);
router.get("/availability/:userId", auth, getAvailability);
router.get("/:id", auth, getUserById);

router.put("/update", auth, updateProfile);
router.put("/availability/update", auth, updateAvailability);
router.post("/reviews/:userId", auth, addReview);

module.exports = router;
