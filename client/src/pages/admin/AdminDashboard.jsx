import React, { useEffect, useState } from 'react';
import { adminAPI, messageAPI } from '../../services/api';
import toast from 'react-hot-toast';

const StatCard = ({ title, value, icon = '📊', color = 'bg-indigo-600' }) => (
  <div className="p-6 rounded-xl shadow-lg bg-white flex items-center gap-4 hover:shadow-xl transition-shadow">
    <div className={`w-14 h-14 rounded-lg flex items-center justify-center ${color} text-white text-xl`}>{icon}</div>
    <div>
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState({});
  const [sessions, setSessions] = useState([]);
  const [reviews, setReviews] = useState([]);

  const load = async () => {
    try {
      const res = await adminAPI.getDashboard();
      setStats(res.data);
    } catch (err) {
      console.error(err);
    }
    try {
      const s = await adminAPI.listSessions();
      setSessions(s.data.sessions || []);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => { load(); }, []);

  // Load reviews for admin panel
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await adminAPI.getReviews();
        if (res && res.data && res.data.reviews) setReviews(res.data.reviews || []);
      } catch (err) { console.error('Failed to load reviews', err); }
    };
    fetchReviews();
  }, []);

  const sendEmailForSession = async (session) => {
    try {
      await adminAPI.sendEmail(session.learner._id, { subject: `Session Link: ${session.skillTopic?.skillName}`, text: `Join: ${session.meetingLink}`, html: `<p>Join: <a href=\"${session.meetingLink}\">${session.meetingLink}</a></p>` });
      toast.success('Email queued to learner');
    } catch (err) {
      console.error(err);
      toast.error('Failed to queue email');
    }
  };

  const sendChatForSession = async (session) => {
    try {
      const text = `Session: ${session.skillTopic?.skillName}. Link: ${session.meetingLink}`;
      await messageAPI.sendMessage({ receiverId: session.learner._id, text });
      toast.success('Chat message sent to learner');
    } catch (err) {
      console.error(err);
      toast.error('Failed to send chat message');
    }
  };

  return (
    <div>
      <h3 className="text-2xl font-semibold mb-6">Admin Dashboard</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={stats?.totalUsers ?? '—'} color="bg-indigo-600" icon="👥" />
        <StatCard title="Total Mentors" value={stats?.totalMentors ?? '—'} color="bg-green-600" icon="🧑‍🏫" />
        <StatCard title="Total Learners" value={stats?.totalLearners ?? '—'} color="bg-blue-600" icon="🎓" />
        <StatCard title="Total Sessions" value={stats?.totalSessions ?? '—'} color="bg-yellow-500" icon="📅" />
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-2 bg-white rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium">Recent Sessions</h4>
            <button onClick={load} className="text-sm px-3 py-1 bg-gray-100 rounded">Refresh</button>
          </div>

          {sessions.length === 0 ? (
            <div className="text-sm text-gray-500">No recent sessions</div>
          ) : (
            <div className="space-y-3">
              {sessions.map(s => (
                <div key={s._id} className="p-3 rounded-lg border shadow-sm flex items-start justify-between bg-white">
                  <div>
                    <div className="font-medium text-gray-900">{s.skillTopic?.skillName}</div>
                    <div className="text-sm text-gray-600 mt-1">Learner: <span className="font-medium">{s.learner?.name}</span> • Mentor: <span className="font-medium">{s.mentor?.name}</span></div>
                    <div className="text-sm text-gray-500 mt-1">{s.status} • {s.scheduledAt ? new Date(s.scheduledAt).toLocaleString() : '—'}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={()=>sendChatForSession(s)} className="px-3 py-1 bg-green-600 text-white rounded text-sm">Send Chat</button>
                    <button onClick={()=>sendEmailForSession(s)} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">Send Email</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-lg">
          <h4 className="text-lg font-medium mb-3">Recent Reviews</h4>
          {reviews.length === 0 ? (
            <div className="text-sm text-gray-500">No reviews yet</div>
          ) : (
            <div className="space-y-3">
              {reviews.slice(0,6).map(r => (
                <div key={r._id || r.createdAt} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{r.fromUser?.name || 'Anonymous'}</div>
                      <div className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div className="text-sm text-yellow-500 font-bold">{r.rating} ★</div>
                  </div>
                  {r.comment && <div className="mt-2 text-sm text-gray-700">{r.comment}</div>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg p-4 shadow">
          <h4 className="text-lg font-medium mb-3">Overview</h4>
          <div className="text-sm text-gray-600 space-y-2">
            <div>Pending Requests: <span className="font-medium">{stats?.pendingRequests ?? 0}</span></div>
            <div>Completed Sessions: <span className="font-medium">{stats?.completedSessions ?? 0}</span></div>
            <div>Average Rating: <span className="font-medium">{stats?.averageRating ?? '—'}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
