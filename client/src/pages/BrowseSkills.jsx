import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function BrowseSkills() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const navigate = useNavigate();

  const categories = ["all", "technology", "design", "business", "language", "music", "art", "sports", "other"];

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("/api/skills?limit=200", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error("Failed to fetch skills");
      const data = await response.json();
      
      // Get skills list
      const skillsList = data.skills || data || [];
      
      // Group skills by skillName and count mentors
      const groupedSkills = skillsList.reduce((acc, skill) => {
        const skillName = skill.skillName || skill.title;
        const existing = acc.find(s => s.skillName === skillName);
        
        if (existing) {
          // Add this mentor to the mentors array
          if (!existing.mentors) existing.mentors = [{ ...existing }];
          existing.mentors.push(skill);
        } else {
          // New skill with one mentor
          acc.push({
            ...skill,
            skillName,
            mentors: [skill]
          });
        }
        return acc;
      }, []);
      
      setSkills(groupedSkills);
    } catch (err) {
      console.error("Error fetching skills:", err);
      setSkills([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter skills based on category and search
  const filteredSkills = skills.filter(skill => {
    const matchesCategory = selectedCategory === "all" || skill.category === selectedCategory;
    const matchesSearch = skill.skillName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleRequestSwap = (skillGroup) => {
    navigate(`/skill/${encodeURIComponent(skillGroup.skillName)}`, {
      state: { skill: skillGroup, allMentors: skillGroup.mentors || [skillGroup] }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-emerald-50 pt-20 pb-12 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-emerald-50 pt-20 pb-12">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Browse Skills</h1>
          <p className="text-gray-600">Discover skills from mentors and start your learning journey</p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="Search skills..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary focus:outline-none transition-colors"
          />
        </div>

        {/* Category Filter */}
        <div className="mb-8 overflow-x-auto">
          <div className="flex gap-2 pb-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? "bg-primary text-white"
                    : "bg-white text-gray-700 border-2 border-gray-200 hover:border-primary"
                }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Skills Grid */}
        {filteredSkills.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSkills.map((skillGroup, i) => (
              <div
                key={i}
                className="group bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 card-hover"
              >
                <div className="relative h-48 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 opacity-20 group-hover:opacity-30 transition-opacity"></div>
                  {skillGroup.image ? (
                    <img
                      src={skillGroup.image}
                      alt={skillGroup.skillName}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 flex items-center justify-center">
                      <span className="text-6xl opacity-50">📚</span>
                    </div>
                  )}
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium text-gray-700">
                    {skillGroup.mentors.length} mentor{skillGroup.mentors.length !== 1 ? 's' : ''}
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-lg text-gray-900 group-hover:text-primary transition-colors">
                    {skillGroup.skillName}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                    <span>📚</span> {(skillGroup.category || "other").charAt(0).toUpperCase() + (skillGroup.category || "other").slice(1)}
                  </p>
                  <button
                    onClick={() => handleRequestSwap(skillGroup)}
                    className="mt-4 w-full bg-gradient-to-r from-primary to-indigo-600 text-white py-2.5 rounded-xl font-semibold hover:shadow-lg transition-all"
                  >
                    View Mentors
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-3xl">
            <p className="text-gray-600 text-lg mb-4">No skills found matching your criteria.</p>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
              }}
              className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}