import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import toast from 'react-hot-toast';
import { useAuth } from "../context/AuthContext";
import { reviewAPI } from "../services/api";
import ReviewModal from "../components/ui/ReviewModal";

export default function Sessions() {
  const { user } = useAuth();
  const location = useLocation();
  const [sessions, setSessions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [reviewSession, setReviewSession] = useState(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [reviewLoading, setReviewLoading] = useState(false);
  const [sessionReviews, setSessionReviews] = useState({});
  const [requestMessage, setRequestMessage] = useState('');
  const [requestLoading, setRequestLoading] = useState(false);

  const targetMentor = location.state?.mentor;
  const targetSkill = location.state?.skill;

  const [form, setForm] = useState({
    date: "",
    time: "",
    duration: 60,
    meetingLink: ""
  });

  const getSessionParticipants = (session) => {
    const participants = [];
    const seen = new Set();

    const addParticipant = (person) => {
      if (!person) return;
      const id = person._id || person.id;
      if (!id || seen.has(String(id))) return;
      seen.add(String(id));
      participants.push(person);
    };

    addParticipant(session?.learner);
    if (Array.isArray(session?.learners)) {
      session.learners.forEach(addParticipant);
    }

    return participants;
  };

  const fetchSessions = async () => {
    const token = localStorage.getItem("token");

    const res = await fetch("/api/session", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (!Array.isArray(data)) {
      setSessions([]);
      return;
    }

    if (user && user.role === 'mentor') {
      setSessions(data.filter((s) => String(s.mentor?._id || s.mentor) === String(user._id)));
    } else {
      const userId = String(user?._id || user?.id || '');
      setSessions(data.filter((s) => {
        if (!userId) return false;
        const sessionParticipants = getSessionParticipants(s);
        const isCurrentLearner = String(s.learner?._id || s.learner) === userId;
        const isInLearnersList = sessionParticipants.some((participant) => String(participant?._id || participant) === userId);
        return isCurrentLearner || isInLearnersList;
      }));
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchSessions();
    };
    // Wait for user to be available (AuthProvider may load asynchronously)
    if (!user) return;
    init();

    const liveRefresh = setInterval(() => {
      fetchSessions();
    }, 30000);

    return () => clearInterval(liveRefresh);
  }, [user]);

  const openModal = async (session) => {
    setSelectedSession(session);
    const gen = (() => {
      const rand = (n) => Math.random().toString(36).substring(2, 2 + n);
      return `https://meet.google.com/${rand(3)}-${rand(4)}-${rand(3)}`;
    })();
    setForm(f => ({ ...f, meetingLink: gen }));
    setShowModal(true);
  };

  const rejectRequest = async (session) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/session/reject`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ sessionId: session._id })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.msg || 'Failed to reject request');
      }
      toast.success('Request rejected');
      fetchSessions();
    } catch (err) {
      console.error('Reject error', err);
      toast.error(err.message || 'Failed to reject request');
    }
  };

  const scheduleSession = async () => {
    const token = localStorage.getItem("token");

    // Client-side validation: ensure date/time selected and in future
    if (!form.date || !form.time) {
      toast.error('Please select date and time');
      return;
    }
    const selected = new Date(`${form.date}T${form.time}`);
    const duration = Number(form.duration);
    if (isNaN(selected.getTime()) || selected <= new Date()) {
      toast.error('Please select a future date and time');
      return;
    }
    if (!Number.isFinite(duration) || duration < 15 || duration > 240) {
      toast.error('Please select a valid session duration between 15 and 240 minutes');
      return;
    }

    try {
      const res = await fetch(`/api/session/${selectedSession._id}/schedule`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ date: form.date, time: form.time, duration, meetingLink: form.meetingLink })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.msg || 'Failed to schedule');
      }

      toast.success('Session scheduled');
      setShowModal(false);
      fetchSessions();
    } catch (err) {
      console.error('Schedule error', err);
      toast.error(err.message || 'Failed to schedule session');
    }
  };

  const closeReviewModal = () => {
    setReviewModalOpen(false);
    setReviewSession(null);
    setReviewForm({ rating: 5, comment: '' });
  };

  const sendSessionRequest = async () => {
    if (!targetMentor) return;
    setRequestLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          teacherId: targetMentor._id,
          skill: targetSkill?.skillName || targetMentor?.skillName || '',
          message: requestMessage.trim()
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.msg || 'Failed to request session');
      }

      toast.success('Session request sent successfully');
      setRequestMessage('');
      fetchSessions();
    } catch (err) {
      console.error('Request error', err);
      toast.error(err.message || 'Failed to request session');
    } finally {
      setRequestLoading(false);
    }
  };

  const resolveSessionState = (session) => {
    const start = session?.startTime ? new Date(session.startTime) : session?.scheduledAt ? new Date(session.scheduledAt) : null;
    const end = session?.endTime ? new Date(session.endTime) : null;
    const now = new Date();

    if (session?.status === 'cancelled') {
      return { label: 'Cancelled', isUpcoming: false, isLive: false, isCompleted: false, joinAllowed: false, joinMessage: 'This session was cancelled.' };
    }

    if (!start || !end) {
      return { label: 'Upcoming', isUpcoming: true, isLive: false, isCompleted: false, joinAllowed: false, joinMessage: 'Join available at ' + (start ? start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'session time') };
    }

    if (now < start) {
      return { label: 'Upcoming', isUpcoming: true, isLive: false, isCompleted: false, joinAllowed: false, joinMessage: 'Join available at ' + start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) };
    }

    if (now >= start && now < end) {
      return { label: 'Live', isUpcoming: false, isLive: true, isCompleted: false, joinAllowed: true, joinMessage: 'Join Session' };
    }

    return { label: 'Completed', isUpcoming: false, isLive: false, isCompleted: true, joinAllowed: false, joinMessage: 'Session has ended' };
  };

  const isSessionCompleted = (session) => {
    if (!session) return false;
    if (session.status === 'completed') return true;
    const sessionState = resolveSessionState(session);
    return sessionState.isCompleted;
  };

  const openReviewModal = async (session) => {
    setReviewSession(session);
    setReviewLoading(true);

    try {
      const response = await reviewAPI.getSessionReview(session._id);
      const review = response.data.review;
      setSessionReviews((prev) => ({ ...prev, [session._id]: review }));
      setReviewForm({ rating: review.rating, comment: review.comment });
    } catch (err) {
      if (err.response?.status === 404) {
        setReviewForm({ rating: 5, comment: '' });
      } else {
        toast.error('Unable to load review details');
      }
    } finally {
      setReviewLoading(false);
      setReviewModalOpen(true);
    }
  };

  const handleReviewSubmit = async ({ rating, comment }) => {
    if (!reviewSession) return;
    setReviewLoading(true);

    try {
      const payload = { sessionId: reviewSession._id, rating, comment };
      if (sessionReviews[reviewSession._id]) {
        await reviewAPI.editReview(sessionReviews[reviewSession._id]._id, payload);
      } else {
        await reviewAPI.createReview(payload);
      }

      const updated = await reviewAPI.getSessionReview(reviewSession._id);
      setSessionReviews((prev) => ({ ...prev, [reviewSession._id]: updated.data.review }));
      toast.success('Review saved successfully');
      closeReviewModal();
    } catch (err) {
      console.error('Review submit error', err);
      toast.error(err.response?.data?.msg || err.message || 'Failed to save review');
    } finally {
      setReviewLoading(false);
    }
  };

  const mentorPending = sessions.filter((session) => session.status === 'pending');
  const mentorActive = sessions.filter((session) => ['accepted', 'scheduled', 'in-progress'].includes(session.status));

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">
        Sessions
      </h1>

      {user && user.role === 'mentor' ? (
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-semibold mb-3">Pending Requests</h2>
            {mentorPending.length === 0 ? (
              <div className="text-slate-600">No pending requests.</div>
            ) : (
              mentorPending.map((session) => {
                const participants = getSessionParticipants(session);
                return (
                  <div key={session._id} className="bg-white shadow rounded-xl p-5 mb-4">
                    <h2 className="font-semibold text-xl">{participants.map((person) => person.name).join(', ') || session.learner?.name}</h2>
                    <p>{session.skillTopic?.skillName}</p>
                    <p className="text-sm text-slate-500">Requested: {new Date(session.createdAt).toLocaleDateString()}</p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button onClick={() => openModal(session)} className="px-5 py-2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-lg">Schedule Session</button>
                      <button onClick={() => rejectRequest(session)} className="px-5 py-2 bg-red-500 text-white rounded-lg">Reject</button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">Upcoming Sessions</h2>
            {mentorActive.length === 0 ? (
              <div className="text-slate-600">No upcoming sessions.</div>
            ) : (
              mentorActive.map((session) => {
                const participants = getSessionParticipants(session);
                return (
                  <div key={session._id} className="bg-white shadow rounded-xl p-5 mb-4">
                    <h2 className="font-semibold text-xl">{participants.map((person) => person.name).join(', ') || session.learner?.name}</h2>
                    <p>{session.skillTopic?.skillName}</p>
                    <p className="text-sm text-slate-500">Status: {session.status}</p>
                    <p className="text-sm text-slate-500">Scheduled: {session.scheduledAt ? new Date(session.scheduledAt).toLocaleString() : 'TBD'}</p>
                    {session.status === 'scheduled' && session.meetingLink && (
                      <a href={session.meetingLink} target="_blank" rel="noreferrer" className="inline-block mt-3 px-5 py-2 bg-blue-600 text-white rounded-lg">Join Session</a>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">Completed Sessions</h2>
            {sessions.filter((session) => isSessionCompleted(session)).length === 0 ? (
              <div className="text-slate-600">No completed sessions yet.</div>
            ) : (
              sessions.filter((session) => isSessionCompleted(session)).map((session) => {
                const participants = getSessionParticipants(session);
                return (
                  <div key={session._id} className="bg-white shadow rounded-xl p-5 mb-4">
                    <h2 className="font-semibold text-xl">{participants.map((person) => person.name).join(', ') || session.learner?.name}</h2>
                    <p>{session.skillTopic?.skillName}</p>
                    <p className="text-sm text-slate-500">Completed: {session.completedAt ? new Date(session.completedAt).toLocaleDateString() : 'Completed'}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {targetMentor && (
            <div className="bg-white rounded-3xl shadow p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold">Request a session with {targetMentor.name}</h2>
                  <p className="text-sm text-slate-500">Send a request to book this mentor for {targetSkill?.skillName || 'your chosen skill'}.</p>
                </div>
                <div className="rounded-2xl bg-slate-100 px-4 py-2 text-sm text-slate-700">
                  Mentor rating: {targetMentor.rating?.toFixed(1) ?? 'N/A'}★
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <label className="block text-sm font-medium text-slate-700">Message to mentor</label>
                <textarea
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  placeholder="Tell the mentor why you'd like to book this session..."
                  className="w-full rounded-2xl border border-slate-200 p-4 text-sm text-slate-800 resize-none min-h-[140px]"
                />
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={sendSessionRequest}
                    disabled={requestLoading}
                    className="px-5 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition disabled:opacity-50"
                  >
                    {requestLoading ? 'Sending...' : 'Send Request'}
                  </button>
                  <button
                    onClick={() => window.history.back()}
                    className="px-5 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
          <div>
            <h2 className="text-2xl font-semibold mb-3">Active Sessions</h2>
            {sessions.filter((session) => ['scheduled', 'in-progress'].includes(session.status)).length === 0 ? (
              <div className="text-slate-600">No active sessions.</div>
            ) : (
              sessions
                .filter((session) => ['scheduled', 'in-progress'].includes(session.status))
                .map((session) => (
                  <div key={session._id} className="bg-white shadow rounded-xl p-5 mb-4">
                    <h2 className="font-semibold text-xl">{session.mentor?.name}</h2>
                    <p>{session.skillTopic?.skillName}</p>
                    <p className="text-sm text-slate-600">Status: {session.status}</p>
                    <p className="text-sm text-slate-600">Scheduled: {session.scheduledAt ? new Date(session.scheduledAt).toLocaleString() : 'TBD'}</p>
                    {session.status === 'scheduled' && session.meetingLink && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        <button
                          onClick={() => window.open(session.meetingLink, '_blank')}
                          className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                          Join Session
                        </button>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(session.meetingLink);
                            toast.success('Meeting link copied to clipboard');
                          }}
                          className="px-5 py-2 bg-slate-300 text-slate-800 rounded-lg hover:bg-slate-400 transition"
                        >
                          Copy Link
                        </button>
                      </div>
                    )}
                  </div>
                ))
            )}
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">Completed Sessions</h2>
            {sessions.filter((session) => isSessionCompleted(session)).length === 0 ? (
              <div className="text-slate-600">No completed sessions yet.</div>
            ) : (
              sessions
                .filter((session) => isSessionCompleted(session))
                .map((session) => {
                  const review = sessionReviews[session._id];
                  const completedLabel = session.completedAt ? new Date(session.completedAt).toLocaleString() : 'Completed';
                  return (
                    <div key={session._id} className="bg-white shadow rounded-2xl border border-slate-200 p-5 mb-4 transition hover:shadow-md">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h2 className="font-semibold text-xl text-slate-800">{session.mentor?.name}</h2>
                            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                              Completed
                            </span>
                          </div>
                          <p className="text-slate-600">{session.skillTopic?.skillName}</p>
                          <p className="text-sm text-slate-500 mt-1">Completed: {completedLabel}</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => openReviewModal(session)}
                            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-medium shadow-sm hover:bg-indigo-700 transition"
                          >
                            {review ? 'Edit Review' : 'Leave Review'}
                          </button>
                          {review && (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1.5 text-sm font-medium text-green-700">
                              Reviewed
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
            )}
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">Other Sessions</h2>
            {sessions.filter((session) => !['scheduled', 'in-progress', 'completed'].includes(session.status)).length === 0 ? (
              <div className="text-slate-600">No other sessions at the moment.</div>
            ) : (
              sessions
                .filter((session) => !['scheduled', 'in-progress', 'completed'].includes(session.status))
                .map((session) => (
                  <div key={session._id} className="bg-white shadow rounded-xl p-5 mb-4">
                    <h2 className="font-semibold text-xl">{session.mentor?.name}</h2>
                    <p>{session.skillTopic?.skillName}</p>
                    <p className="text-sm text-slate-600">Status: {session.status}</p>
                    <p className="text-sm text-slate-600">Requested: {new Date(session.createdAt).toLocaleDateString()}</p>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {reviewModalOpen && (
        <ReviewModal
          open={reviewModalOpen}
          title={sessionReviews[reviewSession?._id] ? 'Edit Review' : 'Leave a Review'}
          initialRating={reviewForm.rating}
          initialComment={reviewForm.comment}
          onClose={closeReviewModal}
          onSubmit={handleReviewSubmit}
          loading={reviewLoading}
        />
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
          <div className="bg-white p-6 rounded-xl w-[400px]">
            <h2 className="text-xl font-bold mb-4">Schedule Session</h2>

            <input type="date" value={form.date} min={new Date().toISOString().split('T')[0]} className="border p-2 w-full mb-3" onChange={(e) => setForm({ ...form, date: e.target.value })} />

            <input type="time" value={form.time} className="border p-2 w-full mb-3" onChange={(e) => setForm({ ...form, time: e.target.value })} />

            <label className="block text-sm font-medium text-slate-700 mb-1">Duration (minutes)</label>
            <select value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })} className="border p-2 w-full mb-3">
              {[15, 30, 45, 60, 90, 120, 180, 240].map((option) => (
                <option key={option} value={option}>{option} minutes</option>
              ))}
            </select>

            <input type="text" placeholder="Meeting Link" value={form.meetingLink} className="border p-2 w-full mb-3" onChange={(e) => setForm({ ...form, meetingLink: e.target.value })} />

            <div className="flex gap-2">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 bg-slate-200 rounded">Cancel</button>
              <button onClick={scheduleSession} className="flex-1 w-full bg-blue-600 text-white py-2 rounded-lg">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}