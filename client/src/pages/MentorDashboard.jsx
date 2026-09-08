// import { useState, useEffect } from "react";
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';

export default function MentorDashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [incomingRequests, setIncomingRequests] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [learners, setLearners] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

  // Learner profile modal
  const [showLearnerModal, setShowLearnerModal] = useState(false);
  const [viewLearner, setViewLearner] = useState(null);

  // Scheduling modal
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleFor, setScheduleFor] = useState(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  const [success, setSuccess] = useState('');

  const getCalendarHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : null;
  };

  const handleCalendarUnauthorized = (response) => {
    if (response.status !== 401) return false;
    logout(navigate);
    return true;
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'mentor') return navigate('/');
    fetchData();
    fetchCalendarStatus();
    const calendarResult = new URLSearchParams(location.search).get('calendar');
    if (calendarResult === 'connected') setSuccess('Google Calendar connected successfully.');
    if (calendarResult === 'error') setError('Google Calendar connection was not completed.');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, location.search]);

  async function fetchCalendarStatus() {
    const headers = getCalendarHeaders();
    if (!headers) return;
    const res = await fetch('/api/calendar/status', { headers });
    if (handleCalendarUnauthorized(res)) return;
    if (res.ok) setCalendarConnected((await res.json()).connected);
  }

  async function connectCalendar() {
    setCalendarLoading(true);
    try {
      const headers = getCalendarHeaders();
      if (!headers) {
        logout(navigate);
        return;
      }
      const res = await fetch('/api/calendar/connect-url', { method: 'POST', headers });
      if (handleCalendarUnauthorized(res)) return;
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Unable to connect Google Calendar');
      window.location.assign(data.url);
    } catch (e) {
      setError(e.message);
      setCalendarLoading(false);
    }
  }

  async function disconnectCalendar() {
    const headers = getCalendarHeaders();
    if (!headers) return;
    const res = await fetch('/api/calendar/disconnect', { method: 'DELETE', headers });
    if (handleCalendarUnauthorized(res)) return;
    if (res.ok) setCalendarConnected(false);
  }

  async function fetchData() {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [reqRes, sessRes, learnersRes, reviewsRes, statsRes] = await Promise.all([
        fetch('/api/matches/requests/incoming', { headers }),
        fetch('/api/session', { headers }),
        fetch('/api/users/learners', { headers }),
        fetch('/api/reviews/mentor/me', { headers }),
        fetch('/api/reviews/stats/me', { headers })
      ]);

      if (reqRes.ok) setIncomingRequests(await reqRes.json());
      if (sessRes.ok) setSessions(await sessRes.json());
      if (learnersRes.ok) setLearners(await learnersRes.json());
      if (reviewsRes.ok) {
        const d = await reviewsRes.json();
        setReviews(d.reviews || []);
      }
      if (statsRes.ok) {
        setReviewStats(await statsRes.json());
      }
    } catch (e) {
      console.error(e);
      setError('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }

  const stats = useMemo(() => ({
    totalLearners: learners.length,
    activeRequests: incomingRequests.length + sessions.filter(s => ['pending', 'accepted', 'scheduled', 'in-progress'].includes(s.status)).length,
    upcomingSessions: sessions.filter(s => s.status === 'scheduled').length,
    completedSessions: sessions.filter(s => s.status === 'completed').length,
    avgRating: reviewStats?.averageRating ?? user?.rating ?? 'N/A'
  }), [learners, incomingRequests, sessions, reviewStats, user]);

  const filteredRequests = useMemo(() => {
    const q = query.trim().toLowerCase();
    return incomingRequests.filter(r => {
      if (filter !== 'all' && r.status !== filter) return false;
      if (!q) return true;
      return (r.learner?.name || '').toLowerCase().includes(q) || (r.skillTopic?.skillName || '').toLowerCase().includes(q);
    });
  }, [incomingRequests, query, filter]);

  const fetchLearner = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/users/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Failed');
      const d = await res.json();
      setViewLearner(d);
      setShowLearnerModal(true);
    } catch (e) {
      console.error(e);
      setError('Failed to load learner');
    }
  };

  const handleAcceptRequest = async (request) => {
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/matches/requests/${request._id}/accept`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.msg || 'Failed to accept request');
      }

      setSuccess('Request accepted. You may now schedule the session.');
      setScheduleFor(data.session);
      setShowScheduleModal(true);
      fetchData();
    } catch (e) {
      console.error(e);
      setError(e.message || 'Failed to accept request');
    }
  };

  const handleRejectRequest = async (request) => {
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/matches/requests/${request._id}/reject`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.msg || 'Failed to reject request');
      }

      setSuccess('Request rejected successfully.');
      fetchData();
    } catch (e) {
      console.error(e);
      setError(e.message || 'Failed to reject request');
    }
  };

  const schedule = async () => {
    if (!scheduleFor || !date || !time) return setError('Pick date and time');
    if (!calendarConnected) return setError('Connect Google Calendar before scheduling a session');
    try {
      const token = localStorage.getItem('token');
      const body = { date, time, note: '' };
      const res = await fetch(`/api/session/${scheduleFor._id}/schedule`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.msg || 'Failed to schedule');
      }
      setShowScheduleModal(false);
      setScheduleFor(null);
      setDate(''); setTime('');
      setSuccess('Session scheduled successfully.');
      fetchData();
    } catch (e) {
      console.error(e);
      setError(e.message || 'Failed to schedule');
    }
  };

  const handleCompleteSession = async (sessionId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/session/complete', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });
      if (!res.ok) throw new Error('Failed');
      fetchData();
    } catch (e) {
      console.error(e);
      setError('Failed to complete session');
    }
  };

  return (
    <div className="min-h-screen pt-24 bg-slate-50 pb-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Mentor Dashboard</h1>
            <p className="text-sm text-slate-500">Manage requests, sessions and learners</p>
          </div>
          <div className="flex items-center gap-3">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search learners or skills..." className="px-4 py-2 rounded-xl border border-slate-200 w-72" />
            <Button onClick={() => fetchData()}>Refresh</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
          <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Total Learners" value={stats.totalLearners} />
            <StatCard title="Active Requests" value={stats.activeRequests} />
            <StatCard title="Upcoming Sessions" value={stats.upcomingSessions} />
            <StatCard title="Completed Sessions" value={stats.completedSessions} />
          </div>
          <div className="md:col-span-2">
            <Card>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-sm text-slate-500">Avg Rating</div>
                  <div className="text-2xl font-semibold">{stats.avgRating}</div>
                </div>
                <div>
                  <Link to="/profile"><Button variant="secondary">Edit Profile</Button></Link>
                </div>
              </div>
              <div className="text-xs text-slate-400">Keep your availability updated so learners can book you.</div>
              <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <div>
                  <div className="text-sm font-medium text-slate-800">Google Calendar</div>
                  <div className="text-xs text-slate-500">{calendarConnected ? 'Connected. New sessions create Calendar events and Meet links.' : 'Connect it to schedule real Calendar events.'}</div>
                </div>
                {calendarConnected ? <Button variant="secondary" onClick={disconnectCalendar}>Disconnect</Button> : <Button onClick={connectCalendar} disabled={calendarLoading}>{calendarLoading ? 'Connecting...' : 'Connect Google'}</Button>}
              </div>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Recent Requests</h3>
                <div className="flex items-center gap-2">
                  {['all', 'pending', 'accepted', 'completed', 'cancelled'].map(f => (
                    <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 rounded-full text-sm ${filter === f ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
                  ))}
                </div>
              </div>

              {loading ? <div className="py-8 text-center text-slate-500">Loading...</div> : (
                filteredRequests.length === 0 ? (
                  <div className="py-8 text-center text-slate-500">No requests found.</div>
                ) : (
                  <div className="space-y-4">
                    {filteredRequests.map(r => (
                      <div key={r._id} className="flex items-start gap-4 p-4 rounded-2xl bg-white shadow-sm">
                        <Avatar src={r.learner?.photo} name={r.learner?.name} size={12} />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-slate-900">{r.learner?.name}</div>
                              <div className="text-xs text-slate-500">{r.skillTopic?.skillName} • {new Date(r.createdAt).toLocaleDateString()}</div>
                            </div>
                            <div className="text-xs px-3 py-1 rounded-full bg-amber-50 text-amber-700">{r.status || 'pending'}</div>
                          </div>
                          {r.message && <div className="mt-2 text-sm text-slate-600">{r.message}</div>}
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Button onClick={() => handleAcceptRequest(r)}>Accept</Button>
                            <Button variant="danger" onClick={() => handleRejectRequest(r)}>Reject</Button>
                            <Button variant="secondary" onClick={() => fetchLearner(r.learner?._id)}>View Learner</Button>
                            <Link to={`/chat/${r.learner?._id}`}><Button variant="ghost">Chat</Button></Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </Card>
          </div>

          <div>
            <Card>
              <h4 className="text-lg font-semibold mb-3">Upcoming Sessions</h4>
              {sessions.filter(s => ['scheduled', 'in-progress'].includes(s.status)).length === 0 ? (
                <div className="text-sm text-slate-500">No upcoming sessions.</div>
              ) : (
                <div className="space-y-3">
                  {sessions.filter(s => ['scheduled', 'in-progress'].includes(s.status)).slice(0, 5).map(s => (
                    <div key={s._id} className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium">{s.learner?.name}</div>
                        <div className="text-xs text-slate-500">{s.skillTopic?.skillName}</div>
                        <div className="text-xs text-slate-400">{s.scheduledAt ? new Date(s.scheduledAt).toLocaleString() : 'Pending'}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs uppercase tracking-wide text-slate-400">{s.status}</div>
                        {s.status === 'in-progress' && (
                          <button onClick={() => handleCompleteSession(s._id)} className="mt-2 text-sm text-indigo-600">Mark complete</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="mt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-semibold">Recent Reviews</h4>
                <Link to="/mentor-reviews" className="text-sm text-indigo-600 hover:underline">View all</Link>
              </div>
              {reviews.length === 0 ? (
                <div className="text-sm text-slate-500">No reviews yet.</div>
              ) : (
                <div className="space-y-3">
                  {reviews.slice(0, 5).map((r) => (
                    <div key={r._id || r.createdAt}>
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">{r.learner?.name || 'Learner'}</div>
                        <div className="text-sm text-amber-500">{r.rating}★</div>
                      </div>
                      {r.comment && <div className="text-sm text-slate-600">{r.comment}</div>}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      <Modal open={showLearnerModal} onClose={() => setShowLearnerModal(false)} title={viewLearner?.name || 'Learner'}>
        {viewLearner ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar src={viewLearner.photo} name={viewLearner.name} size={16} />
              <div>
                <div className="font-semibold text-slate-900">{viewLearner.name}</div>
                <div className="text-sm text-slate-500">{viewLearner.email}</div>
                <div className="text-xs text-slate-400">Joined {new Date(viewLearner.createdAt).toLocaleDateString()}</div>
              </div>
            </div>
            {viewLearner.bio && <div className="text-sm text-slate-700">{viewLearner.bio}</div>}
            {viewLearner.learningGoals && <div className="text-sm text-slate-600"><strong>Goals:</strong> {viewLearner.learningGoals}</div>}
            <div className="flex gap-2 mt-4">
              <Link to={`/chat/${viewLearner._id}`} className="flex-1"><Button>Chat</Button></Link>
              <Button variant="secondary" onClick={() => { setShowLearnerModal(false); }}>Close</Button>
            </div>
          </div>
        ) : <div>Loading...</div>}
      </Modal>

      <Modal open={showScheduleModal} onClose={() => setShowScheduleModal(false)} title="Schedule Session">
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-600">Date</label>
              <input type="date" min={today} value={date} onChange={e => setDate(e.target.value)} className="w-full px-3 py-2 border rounded-md" />
            </div>
            <div>
              <label className="block text-sm text-slate-600">Time</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full px-3 py-2 border rounded-md" />
            </div>
          </div>
          <div className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">A Google Calendar event and Google Meet link will be created for you and the learner.</div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowScheduleModal(false)}>Cancel</Button>
            <Button onClick={schedule}>Confirm</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
