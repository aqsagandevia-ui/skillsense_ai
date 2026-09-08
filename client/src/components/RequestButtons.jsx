import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function RequestButtons({ mentor, skill, navigate: navProp }) {
  const navigate = navProp || useNavigate();
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
      const body = { teacherId: mentor._id || mentor.id, skill: skill?.skillName || skill, message };
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
           Book Session
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
