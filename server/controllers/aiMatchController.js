const User = require("../models/User");
const stringSimilarity = require("string-similarity");

exports.getAiMatches = async (req, res) => {
  try {
    const me = await User.findById(req.user.id);

    const learnSkills = me.skills
      .filter(s => s.type === "learn")
      .map(s => s.name.toLowerCase());

    // Limit to 1000 teachers maximum to prevent memory issues
    const allTeachers = await User.find({
      _id: { $ne: me._id },
      "skills.type": "teach"
    })
      .select("name skills trustScore")
      .limit(1000) // Add limit to prevent memory overload


    const matches = [];

    allTeachers.forEach(teacher => {
      teacher.skills.forEach(skill => {
        if (skill.type === "teach") {
          learnSkills.forEach(lskill => {
            const similarity = stringSimilarity.compareTwoStrings(lskill, skill.name.toLowerCase());
            if (similarity > 0.5) { // threshold
              matches.push({ teacher, skill: skill.name, similarity });
            }
          });
        }
      });
    });

    // sort by similarity + trustScore
    matches.sort((a, b) => b.similarity - a.similarity || b.teacher.trustScore - a.teacher.trustScore);
    
    // Limit results to top 100 matches
    res.json(matches.slice(0, 100));
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};