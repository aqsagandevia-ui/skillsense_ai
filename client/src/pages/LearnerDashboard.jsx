import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { reviewAPI } from "../services/api";
import ReviewModal from "../components/ui/ReviewModal";

/* --------------------------------------------------
   SIMPLE UI COMPONENTS
--------------------------------------------------- */
const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow p-6 ${className}`}>
    {children}
  </div>
);

const Button = ({ children, className = "", ...props }) => (
  <button
    {...props}
    className={`px-4 py-2 rounded-lg font-medium transition ${className}`}
  >
    {children}
  </button>
);

const StatCard = ({ title, value, color = "blue" }) => {
  const colors = {
    blue: "border-blue-500 text-blue-600",
    green: "border-green-500 text-green-600",
    purple: "border-purple-500 text-purple-600",
    orange: "border-orange-500 text-orange-600",
    pink: "border-pink-500 text-pink-600",
  };

  return (
    <div
      className={`bg-white rounded-xl shadow p-5 border-l-4 ${colors[color] || colors.blue
        }`}
    >
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-sm text-slate-500 mt-1">{title}</div>
    </div>
  );
};

/* --------------------------------------------------
   MAIN COMPONENT
--------------------------------------------------- */
export default function LearnerDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [stats, setStats] = useState({
    requestsSent: 0,
    upcomingSessions: 0,
    completedSessions: 0,
    favouriteMentors: 0,
    learningHours: 0,
  });

  const [mentors, setMentors] = useState([]);
  const [filteredMentors, setFilteredMentors] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [history, setHistory] = useState([]);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewSession, setReviewSession] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [reviewLoading, setReviewLoading] = useState(false);
  const [sessionReviews, setSessionReviews] = useState({});

  const [searchQuery, setSearchQuery] = useState("");

  /* --------------------------------------------------
     AUTH CHECK
  --------------------------------------------------- */
  useEffect(() => {
    if (authLoading) return;

    if (!user || user.role !== "learner") {
      navigate("/");
      return;
    }

    fetchDashboard();
  }, [user, authLoading, navigate]);

  /* --------------------------------------------------
     FETCH DASHBOARD
  --------------------------------------------------- */
  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [dashboardRes, mentorsRes, sessionsRes, historyRes] =
        await Promise.all([
          fetch("/api/users/dashboard", { headers }),
          fetch("/api/users/mentors", { headers }),
          fetch("/api/session", { headers }),
          fetch("/api/users/learning-history", { headers }),
        ]);

      if (dashboardRes.ok) {
        const data = await dashboardRes.json();
        setStats(data || {});
      }

      if (mentorsRes.ok) {
        const data = await mentorsRes.json();
        setMentors(Array.isArray(data) ? data : []);
        setFilteredMentors(Array.isArray(data) ? data : []);
      }

      if (sessionsRes.ok) {
        const data = await sessionsRes.json();
        setSessions(Array.isArray(data) ? data : []);
      }

      if (historyRes.ok) {
        const data = await historyRes.json();
        setHistory(Array.isArray(data.sessions) ? data.sessions : []);
      }
    } catch (err) {
      console.error("Dashboard Error:", err);
      setError("Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  };

  const isSessionCompleted = (session) => {
    if (!session) return false;
    if (session.status === "completed") return true;

    const start = session?.startTime ? new Date(session.startTime) : session?.scheduledAt ? new Date(session.scheduledAt) : null;
    const end = session?.endTime ? new Date(session.endTime) : null;

    return !!start && !!end && new Date() >= end;
  };

  const openReviewModal = async (session) => {
    setReviewSession(session);
    setReviewLoading(true);

    try {
      const response = await reviewAPI.getSessionReview(session._id);
      const review = response.data.review;
      setSessionReviews((prev) => ({ ...prev, [session._id]: review }));
      setReviewForm({ rating: review.rating, comment: review.comment || "" });
    } catch (err) {
      if (err.response?.status === 404) {
        setReviewForm({ rating: 5, comment: "" });
      } else {
        console.error("Unable to load review details", err);
      }
    } finally {
      setReviewLoading(false);
      setReviewModalOpen(true);
    }
  };

  const closeReviewModal = () => {
    setReviewModalOpen(false);
    setReviewSession(null);
    setReviewForm({ rating: 5, comment: "" });
  };

  const handleReviewSubmit = async ({ rating, comment }) => {
    if (!reviewSession) return;
    setReviewLoading(true);

    try {
      const payload = { sessionId: reviewSession._id, rating, comment };
      const existing = sessionReviews[reviewSession._id];

      if (existing) {
        await reviewAPI.editReview(existing._id, payload);
      } else {
        await reviewAPI.createReview(payload);
      }

      const updated = await reviewAPI.getSessionReview(reviewSession._id);
      setSessionReviews((prev) => ({ ...prev, [reviewSession._id]: updated.data.review }));
      closeReviewModal();
      alert("Review saved successfully");
    } catch (err) {
      console.error("Review submit error", err);
      alert(err.response?.data?.msg || err.message || "Failed to save review");
    } finally {
      setReviewLoading(false);
    }
  };

  /* --------------------------------------------------
     FILTER MENTORS
  --------------------------------------------------- */
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredMentors(mentors);
      return;
    }

    const q = searchQuery.toLowerCase();

    const filtered = mentors.filter(
      (mentor) =>
        mentor.name?.toLowerCase().includes(q) ||
        mentor.bio?.toLowerCase().includes(q)
    );

    setFilteredMentors(filtered);
  }, [searchQuery, mentors]);

  /* --------------------------------------------------
     LOADING UI
  --------------------------------------------------- */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const completedSessions = sessions.filter((session) => isSessionCompleted(session));

  /* --------------------------------------------------
     MAIN UI
  --------------------------------------------------- */
  return (
    <div className="min-h-screen bg-slate-100 pt-24 pb-10">
      <div className="max-w-7xl mx-auto px-4">
        {/* HEADER */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">
              Welcome, {user?.name || "Learner"} 👋
            </h1>
            <p className="text-slate-500 mt-1">
              Discover mentors and grow your skills.
            </p>
          </div>

          <Link to="/browse">
            <Button className="bg-blue-600 text-white hover:bg-blue-700">
              Find Mentors
            </Button>
          </Link>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-6 bg-red-50 text-red-700 border border-red-200 rounded-lg p-4">
            {error}
          </div>
        )}

        {/* TABS */}
        <div className="flex gap-3 flex-wrap mb-8">
          {["overview", "mentors", "sessions", "history"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg font-medium transition ${activeTab === tab
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-700 border"
                }`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-8">
              <StatCard title="Requests Sent" value={stats.requestsSent} />
              <StatCard
                title="Upcoming"
                value={stats.upcomingSessions}
                color="green"
              />
              <StatCard
                title="Completed"
                value={stats.completedSessions}
                color="purple"
              />
              <StatCard
                title="Fav Mentors"
                value={stats.favouriteMentors}
                color="orange"
              />
              <StatCard
                title="Hours"
                value={stats.learningHours}
                color="pink"
              />
            </div>

            {completedSessions.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-slate-900">Completed Sessions</h3>
                </div>

                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {completedSessions.slice(0, 3).map((session) => {
                    const review = sessionReviews[session._id];
                    return (
                      <div key={session._id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                        <h4 className="font-semibold text-slate-900">{session.mentor?.name || "Mentor"}</h4>
                        <p className="text-sm text-slate-500 mt-1">{session.skillTopic?.skillName || "Session"}</p>
                        <p className="text-xs text-slate-400 mt-2">
                          {session.completedAt ? new Date(session.completedAt).toLocaleString() : "Completed"}
                        </p>

                        <button
                          onClick={() => openReviewModal(session)}
                          className="mt-4 w-full rounded-xl bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition"
                        >
                          {review ? "Edit Review" : "Leave Review"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <h3 className="text-lg font-semibold mb-2">
                  Recommended Mentors
                </h3>
                <p className="text-sm text-slate-500">
                  Personalized mentors based on your interests.
                </p>
              </Card>

              <Card>
                <h3 className="text-lg font-semibold mb-2">
                  Recent Requests
                </h3>
                <p className="text-sm text-slate-500">
                  Manage your mentor requests.
                </p>
              </Card>

              <Card>
                <h3 className="text-lg font-semibold mb-2">
                  Upcoming Sessions
                </h3>
                <p className="text-sm text-slate-500">
                  Join scheduled learning sessions.
                </p>
              </Card>
            </div>
          </>
        )}

        {/* MENTORS */}
        {activeTab === "mentors" && (
          <Card>
            <div className="flex flex-col md:flex-row gap-4 mb-6 md:items-center md:justify-between">
              <h2 className="text-2xl font-bold">Available Mentors</h2>

              <input
                type="text"
                placeholder="Search mentors..."
                className="border px-4 py-2 rounded-lg w-full md:w-80"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {filteredMentors.length === 0 ? (
              <p className="text-slate-500">No mentors found.</p>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredMentors.map((mentor) => (
                  <div
                    key={mentor._id}
                    className="border rounded-xl p-5 hover:shadow transition"
                  >
                    <h3 className="text-xl font-semibold">{mentor.name}</h3>

                    <p className="text-sm text-slate-500 mt-2">
                      {mentor.bio || "No bio available"}
                    </p>

                    <div className="mt-4 flex gap-2">
                      <Link
                        to={`/profile/${mentor._id}`}
                        className="flex-1 text-center px-4 py-2 bg-slate-200 rounded-lg"
                      >
                        Profile
                      </Link>

                      <Link
                        to={`/chat/${mentor._id}`}
                        className="flex-1 text-center px-4 py-2 bg-blue-600 text-white rounded-lg"
                      >
                        Chat
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* SESSIONS */}
        {activeTab === "sessions" && (
          <Card>
            <h2 className="text-2xl font-bold mb-6">Upcoming Sessions</h2>

            {sessions.length === 0 ? (
              <p className="text-slate-500">No sessions available.</p>
            ) : (
              <div className="space-y-4">
                {sessions.map((session) => (
                  <div
                    key={session._id}
                    className="border rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                  >
                    <div>
                      <h4 className="font-semibold">
                        {session.mentor?.name || "Unknown Mentor"}
                      </h4>

                      <p className="text-sm text-slate-500">
                        {session.skillTopic?.skillName || "Session"}
                      </p>
                      <p className="text-sm text-slate-500">
                        {session.scheduledAt
                          ? new Date(session.scheduledAt).toLocaleString()
                          : "No Date"}
                      </p>
                      <p className="text-xs uppercase tracking-wide text-slate-400 mt-1">{session.status}</p>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      {session.status === "scheduled" && (
                        <Button className="bg-green-600 text-white hover:bg-green-700" onClick={() => fetch(`/api/session/start`, { method: 'PUT', headers: { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: session._id }) })}>
                          Start
                        </Button>
                      )}
                      {session.status === "in-progress" && (
                        <Button className="bg-purple-600 text-white hover:bg-purple-700" onClick={() => fetch(`/api/session/complete`, { method: 'PUT', headers: { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: session._id }) })}>
                          Complete
                        </Button>
                      )}
                      {isSessionCompleted(session) && (
                        <Button className="bg-indigo-600 text-white hover:bg-indigo-700" onClick={() => openReviewModal(session)}>
                          {sessionReviews[session._id] ? "Edit Review" : "Leave Review"}
                        </Button>
                      )}
                      <Link to={`/chat/${session.mentor?._id}`} className="px-4 py-2 rounded-lg bg-slate-200 text-slate-700">
                        Chat
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* HISTORY */}
        {activeTab === "history" && (
          <Card>
            <h2 className="text-2xl font-bold mb-6">Learning History</h2>

            {history.length === 0 ? (
              <p className="text-slate-500">
                No completed sessions yet.
              </p>
            ) : (
              <div className="space-y-4">
                {history.map((item) => (
                  <div
                    key={item._id}
                    className="border rounded-lg p-4"
                  >
                    <h4 className="font-semibold">
                      {item.skillTopic?.skillName || "Skill"}
                    </h4>

                    <p className="text-sm text-slate-500">
                      Mentor: {item.mentor?.name || "Unknown"}
                    </p>

                    <p className="text-sm text-slate-500">
                      Completed:{" "}
                      {item.completedAt
                        ? new Date(
                          item.completedAt
                        ).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>

      {reviewModalOpen && reviewSession && (
        <ReviewModal
          open={reviewModalOpen}
          title={sessionReviews[reviewSession._id] ? "Edit Review" : "Leave a Review"}
          initialRating={reviewForm.rating}
          initialComment={reviewForm.comment}
          onClose={closeReviewModal}
          onSubmit={handleReviewSubmit}
          loading={reviewLoading}
        />
      )}
    </div>
  );
}