import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import toast from 'react-hot-toast';

export default function MentorProfile() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const mentor = state?.mentor;
  const skill = state?.skill;

  if (!mentor) {
    return <div className="p-10 text-center text-gray-600">Mentor not found</div>;
  }

  // ⭐ Stars
  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i}>{i < Math.floor(rating) ? "⭐" : "☆"}</span>
    ));
  };

  // Get mentor rating (default to 4.5)
  const rating = mentor?.rating || 4.5;
  const sessionsCompleted = mentor?.sessionsCompleted || 0;

  return (
    <div className="pt-20 px-6 max-w-5xl mx-auto pb-12">
      {/* 🔙 BACK */}
      <button
        onClick={() => navigate(-1)}
        className="mb-6 text-primary font-semibold hover:text-primary/80 transition"
      >
        ← Back
      </button>

      {/* 🔹 PROFILE CARD */}
      <div className="bg-white rounded-3xl shadow-xl p-6 md:flex gap-8 items-center">
        {/* ✅ MENTOR PROFILE IMAGE */}
        <div className="flex justify-center">
          <div className="relative group">
            {mentor.photo ? (
              <img
                src={mentor.photo}
                alt={mentor.name}
                className="w-40 h-40 rounded-full object-cover border-4 border-white shadow-xl group-hover:scale-105 transition"
              />
            ) : (
              <div className="w-40 h-40 rounded-full border-4 border-white shadow-xl bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-7xl group-hover:scale-105 transition">
                👤
              </div>
            )}
            {/* Glow */}
            <div className="absolute inset-0 rounded-full bg-indigo-200 blur-xl -z-10"></div>
          </div>
        </div>

        {/* 🔹 INFO */}
        <div className="flex-1 mt-6 md:mt-0">
          <h1 className="text-3xl font-bold text-gray-900">{mentor.name}</h1>

          <p className="text-gray-500 mt-1">{mentor.bio || "Experienced mentor ready to help you learn"}</p>

          {/* ⭐ Rating */}
          <div className="flex items-center gap-2 mt-3 text-lg">
            <div className="text-yellow-500">{renderStars(rating)}</div>
            <span className="text-gray-600 text-sm">({rating.toFixed(1)})</span>
          </div>

          {/* 🔹 Areas of Expertise */}
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Areas of Expertise</h3>
            <div className="flex flex-wrap gap-2">
              {mentor.areasOfExpertise && mentor.areasOfExpertise.length > 0 && (
                <>
                  {mentor.areasOfExpertise.map((item, i) => (
                    <span
                      key={i}
                      className="bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full text-sm"
                    >
                      {item}
                    </span>
                  ))}
                </>
              )}
              {(!mentor.areasOfExpertise || mentor.areasOfExpertise.length === 0) && (
                <span className="bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full text-sm">
                  {skill?.skillName || "Skill Exchange"}
                </span>
              )}
            </div>
          </div>

          {/* 🔹 Stats */}
          <div className="mt-4 text-gray-600 space-y-1">
            <p>📚 Sessions Completed: {sessionsCompleted}</p>
            <p>⏱️ Years of Experience: {mentor.yearsOfExperience || 0} years</p>
            {skill && (
              <p>🎯 Teaching: <span className="font-semibold">{skill.skillName}</span></p>
            )}
          </div>

          {/* 🔹 BUTTONS */}
          <RequestButtons mentor={mentor} skill={skill} navigate={navigate} />
        </div>
      </div>

      {/* 🔹 ABOUT */}
      <div className="mt-8 bg-gray-50 p-6 rounded-2xl">
        <h2 className="text-xl font-semibold mb-2">About Mentor</h2>
        <p className="text-gray-600">
          {mentor.name} is an experienced mentor specializing in {skill?.skillName || "skill exchange"}. They focus on practical learning, real-world projects, and helping students build strong careers. With {mentor.yearsOfExperience || 0} years of experience and a rating of {rating.toFixed(1)}/5, they're dedicated to providing quality education.
        </p>
      </div>

      {/* 🔹 QUALIFICATIONS */}
      {mentor.qualifications && mentor.qualifications.length > 0 && (
        <div className="mt-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold mb-4">Qualifications</h2>
          <ul className="space-y-2">
            {mentor.qualifications.map((qual, i) => (
              <li key={i} className="flex items-center gap-2 text-gray-700">
                <span className="text-green-600">✓</span> {qual}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function RequestButtons({ mentor, skill, navigate }) {
  const { user: currentUser } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const canRequest = currentUser && currentUser.role === 'learner' && currentUser._id !== mentor._id;

  const openChat = () => navigate("/chat", { state: { mentor, skill } });

  const openSchedule = () => navigate("/sessions", { state: { mentor, skill } });

  const sendRequest = async () => {
    if (!canRequest) {
      toast.error('Only learners can request sessions');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const body = { teacherId: mentor._id, skill: skill?.skillName || skill, message };
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.msg || 'Failed to send request');
      }

      toast.success('Request sent to mentor');
      setShowModal(false);
      setMessage('');
      // Optionally open chat with mentor
      navigate('/chat', { state: { mentor, skill } });
    } catch (err) {
      console.error('Request error', err);
      toast.error(err.message || 'Failed to send request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mt-6 flex gap-4">
        <button
          onClick={openChat}
          className="flex-1 bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 transition-all font-medium"
        >
           Chat
        </button>

        <button
          onClick={() => setShowModal(true)}
          disabled={!canRequest}
          className={`flex-1 ${canRequest ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-gray-200 cursor-not-allowed'} text-white py-3 rounded-xl transition-all font-medium`}
        >
           Request Session
        </button>

        <button
          onClick={openSchedule}
          className="flex-1 bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition-all font-medium"
        >
          📅 Book Session
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-2">Request a session with {mentor.name}</h3>
            <p className="text-sm text-slate-500 mb-4">Include an optional message to introduce yourself and your goals.</p>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write a short message (optional)"
              className="w-full border p-3 rounded-lg mb-4 h-28"
            />

            <div className="flex gap-2">
              <button
                onClick={sendRequest}
                disabled={loading}
                className="flex-1 bg-yellow-500 text-white py-2 rounded-xl hover:bg-yellow-600 transition-all disabled:opacity-60"
              >
                {loading ? 'Sending...' : 'Send Request'}
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-white border border-slate-200 py-2 rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
