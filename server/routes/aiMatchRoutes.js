const router = require("express").Router();
const auth = require("../middleware/auth");
const { getAiMatches } = require("../controllers/aiMatchController");

router.get("/aimatches", auth, getAiMatches);

module.exports = router;
