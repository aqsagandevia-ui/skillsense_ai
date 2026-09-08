import { useState, useEffect } from "react";
import toast from 'react-hot-toast';
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState("overview");
  const [sessions, setSessions] = useState([]);
  const [skills, setSkills] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchSkill, setSearchSkill] = useState("");

  const isMentor = user?.isMentor;
  const isLearner = user?.isLearner;

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      const [sessionsRes, skillsRes, mentorsRes] = await Promise.all([
        fetch("/api/session", { headers }),
        fetch("/api/skills", { headers }),
        fetch("/api/users/mentors", { headers })
      ]);

      if (sessionsRes.ok) {
        const data = await sessionsRes.json();
        setSessions(Array.isArray(data) ? data : []);
      }
      
      if (skillsRes.ok) {
        const data = await skillsRes.json();
        setSkills(Array.isArray(data) ? data : []);
      }

      if (mentorsRes.ok) {
        const data = await mentorsRes.json();
        setMentors(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptSession = async (sessionId) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("/api/session/accept", {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ sessionId })
      });

      if (response.ok) {
        fetchData();
        toast.success("Session accepted successfully!");
      } else {
        toast.error("Failed to accept session");
      }
    } catch (err) {
      console.error("Error accepting session:", err);
        toast.error("Error accepting session");
    }
  };

  const handleRejectSession = async (sessionId) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`/api/session/${sessionId}`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: "rejected" })
      });

      if (response.ok) {
        fetchData();
        toast.success("Session rejected");
      }
    } catch (err) {
      console.error("Error rejecting session:", err);
    }
  };

  // Calculate stats
  const pendingRequests = sessions.filter(s => s.status === "pending" && s.teacher?._id === user?._id).length;
  const activeSwaps = sessions.filter(s => s.status === "accepted").length;
  const completedSwaps = sessions.filter(s => s.status === "completed").length;
  const mySkills = skills.filter(s => s.user?._id === user?._id).length;

  // Filter data based on user role
  const userSessions = sessions.filter(s => 
    s.teacher?._id === user?._id || s.learner?._id === user?._id
  );

  const incomingRequests = sessions.filter(s => 
    s.status === "pending" && s.teacher?._id === user?._id
  );

  const getStatusColor = (status) => {
    switch (status) {
      case "accepted":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "completed":
        return "bg-blue-100 text-blue-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (loading) {
    return (
      <div className="pt-24 pb-12 max-w-7xl mx-auto px-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-12 max-w-7xl mx-auto px-6">
      {/* HEADER */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">
            {isMentor && !isLearner ? "Mentor Dashboard" : isLearner && !isMentor ? "Learner Dashboard" : "My Dashboard"}
          </h2>
          <p className="text-gray-500 mt-1">Manage your skills and sessions</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* STATS CARDS */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: isMentor ? "Incoming Requests" : "Active Sessions", value: isMentor ? pendingRequests : activeSwaps, icon: "📩", color: "from-blue-500 to-blue-600" },
          { label: "Sessions", value: userSessions.length, icon: "📅", color: "from-purple-500 to-pink-500" },
          { label: "Completed", value: completedSwaps, icon: "✅", color: "from-green-500 to-emerald-500" },
          { label: isMentor ? "Skills Offered" : "Learning", value: mySkills, icon: "💡", color: "from-yellow-500 to-orange-500" },
        ].map((item, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center text-2xl`}>
                {item.icon}
              </div>
              <span className="text-3xl font-bold text-gray-900">{item.value}</span>
            </div>
            <p className="text-gray-500 font-medium">{item.label}</p>
          </div>
        ))}
      </div>

      {/* TAB NAVIGATION */}
      <div className="flex flex-wrap gap-2 mb-6 p-1 bg-gray-100 rounded-xl w-fit">
        {[
          { id: "overview", label: "Overview", icon: "📊" },
          { id: "sessions", label: "Sessions", icon: "📅" },
          ...(isMentor ? [{ id: "requests", label: "Incoming Requests", icon: "📬" }] : []),
          ...(isMentor ? [{ id: "skills", label: "My Skills", icon: "⭐" }] : []),
          ...(isLearner ? [{ id: "browse", label: "Browse Skills", icon: "🔍" }] : []),
          { id: "mentors", label: "Learn More", icon: "👥" },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? "bg-white text-blue-600 shadow-md"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <span>{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Recent Activity */}
          <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="w-2 h-8 bg-blue-500 rounded-full"></span>
              Recent Activity
            </h3>
            
            {userSessions.length > 0 ? (
              <div className="space-y-4">
                {userSessions.slice(0, 5).map(session => (
                  <div key={session._id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl hover:shadow-md transition-all duration-200 border border-gray-100">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{session.skill}</p>
                        <p className="text-sm text-gray-500">
                          with {session.teacher?._id === user?._id ? session.learner?.name : session.teacher?.name}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                      {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No activity yet</p>
            )}
          </div>

          {/* Quick Stats */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Learning Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Sessions</p>
                <p className="text-2xl font-bold text-gray-900">{userSessions.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{completedSwaps}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SESSIONS TAB */}
      {activeTab === "sessions" && (
        <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span className="w-2 h-8 bg-purple-500 rounded-full"></span>
            Sessions
          </h3>

          {userSessions.length > 0 ? (
            <div className="space-y-4">
              {userSessions.map(session => (
                <div key={session._id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white hover:shadow-md transition-all duration-200 border border-gray-100">
                  <div>
                    <h4 className="font-semibold text-gray-900">{session.skill}</h4>
                    <p className="text-sm text-gray-500">
                      {session.date ? `${session.date} at ${session.time}` : "No date scheduled"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {session.teacher?._id === user?._id ? `Teaching to ${session.learner?.name}` : `Learning from ${session.teacher?.name}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    {session.status === "accepted" && session.liveLink && (
                      <a
                        href={session.liveLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-all"
                      >
                        Join Session
                      </a>
                    )}
                    <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(session.status)}`}>
                      {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500 font-medium">No sessions scheduled yet</p>
              {isLearner && (
                <button
                  onClick={() => setActiveTab("browse")}
                  className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-all"
                >
                  Browse Skills
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* INCOMING REQUESTS TAB (Mentor Only) */}
      {activeTab === "requests" && isMentor && (
        <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span className="w-2 h-8 bg-red-500 rounded-full"></span>
            Incoming Requests ({incomingRequests.length})
          </h3>

          {incomingRequests.length > 0 ? (
            <div className="space-y-4">
              {incomingRequests.map(req => (
                <div key={req._id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-yellow-50 to-white hover:shadow-md transition-all border border-yellow-100">
                  <div className="flex items-center gap-4">
                    {req.learner?.photo && (
                      <img src={req.learner.photo} alt={req.learner.name} className="w-12 h-12 rounded-full object-cover border-2 border-yellow-200" />
                    )}
                    {!req.learner?.photo && (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center text-white font-bold">
                        {req.learner?.name?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h4 className="font-semibold text-gray-900">{req.learner?.name} wants to learn {req.skill}</h4>
                      <p className="text-sm text-gray-500">Requested on {new Date(req.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => handleAcceptSession(req._id)}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-all flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Accept
                    </button>
                    <button
                      onClick={() => handleRejectSession(req._id)}
                      className="px-4 py-2 border-2 border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-all"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <p className="text-gray-500 font-medium">No incoming requests</p>
            </div>
          )}
        </div>
      )}

      {/* MY SKILLS TAB (Mentor Only) */}
      {activeTab === "skills" && isMentor && (
        <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="w-2 h-8 bg-amber-500 rounded-full"></span>
              My Skills ({mySkills})
            </h3>
            <button
              onClick={() => navigate("/profile")}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-all"
            >
              Add Skill
            </button>
          </div>

          {skills.filter(s => s.user?._id === user?._id).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {skills.filter(s => s.user?._id === user?._id).map(skill => (
                <div key={skill._id} className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all">
                  {skill.image && (
                    <img src={skill.image} alt={skill.skillName} className="w-full h-32 object-cover rounded-lg mb-3" />
                  )}
                  <h4 className="font-semibold text-gray-900">{skill.skillName}</h4>
                  <p className="text-xs text-gray-500 mb-2">{skill.category}</p>
                  <p className="text-sm text-gray-600 mb-3">{skill.overview}</p>
                  <span className="inline-block px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded font-medium">
                    {skill.experienceLevel}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <p className="text-gray-500 font-medium">No skills added yet</p>
              <button
                onClick={() => navigate("/profile")}
                className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-all"
              >
                Add Your First Skill
              </button>
            </div>
          )}
        </div>
      )}

      {/* BROWSE SKILLS TAB (Learner Only) */}
      {activeTab === "browse" && isLearner && (
        <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span className="w-2 h-8 bg-green-500 rounded-full"></span>
            Explore Skills
          </h3>

          <div className="mb-6">
            <input
              type="text"
              placeholder="Search skills..."
              value={searchSkill}
              onChange={(e) => setSearchSkill(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {skills.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {skills.filter(s => s.skillName.toLowerCase().includes(searchSkill.toLowerCase())).map(skill => (
                <div key={skill._id} className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all cursor-pointer" onClick={() => navigate(`/mentor/${skill.user?._id}`, { state: { mentor: skill.user } })}>
                  {skill.image && (
                    <img src={skill.image} alt={skill.skillName} className="w-full h-32 object-cover rounded-lg mb-3" />
                  )}
                  <h4 className="font-semibold text-gray-900">{skill.skillName}</h4>
                  <p className="text-xs text-gray-500 mb-2">{skill.category}</p>
                  <p className="text-sm text-gray-600 mb-3">{skill.overview}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">By {skill.user?.name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/mentor/${skill.user?._id}`, { state: { mentor: skill.user } });
                      }}
                      className="px-3 py-1 bg-blue-500 text-white text-xs rounded font-medium hover:bg-blue-600"
                    >
                      View Mentor
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">Loading skills...</p>
          )}
        </div>
      )}

      {/* MENTORS TAB */}
      {activeTab === "mentors" && (
        <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span className="w-2 h-8 bg-indigo-500 rounded-full"></span>
            Available Mentors
          </h3>

          {mentors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mentors.map(mentor => (
                <div key={mentor._id} className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all">
                  <div className="flex items-center gap-4 mb-3">
                    {mentor.photo && (
                      <img src={mentor.photo} alt={mentor.name} className="w-12 h-12 rounded-full object-cover" />
                    )}
                    {!mentor.photo && (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-bold">
                        {mentor.name?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h4 className="font-semibold text-gray-900">{mentor.name}</h4>
                      <p className="text-xs text-gray-500">{mentor.yearsOfExperience || 0} years experience</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{mentor.bio}</p>
                  <button
                    onClick={() => navigate(`/mentor/${mentor._id}`, { state: { mentor: mentor } })}
                    className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-all"
                  >
                    View Profile
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No mentors available yet</p>
          )}
        </div>
      )}
    </div>
  );
}
