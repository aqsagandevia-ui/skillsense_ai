// import { useState, useEffect } from "react";
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import MentorAvailabilityCalendar from '../components/MentorAvailabilityCalendar';

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
  const [selectedLearners, setSelectedLearners] = useState([]);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(60);
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

    const liveRefresh = setInterval(() => {
      fetchData();
    }, 30000);

    return () => clearInterval(liveRefresh);
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

      const initialParticipantIds = [request.learner?._id || request.learner || request.user?._id].filter(Boolean);
      setSelectedLearners(initialParticipantIds);
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
    const durationMinutes = Number(duration);
    if (!Number.isFinite(durationMinutes) || durationMinutes < 15 || durationMinutes > 240) {
      return setError('Select a valid session duration between 15 and 240 minutes');
    }
    if (!selectedLearners.length) return setError('Select at least one learner for this session');
    if (!calendarConnected) return setError('Connect Google Calendar before scheduling a session');
    try {
      const token = localStorage.getItem('token');
      const body = { date, time, duration: durationMinutes, note: '', learners: selectedLearners };
      const res = await fetch(`/api/session/${scheduleFor._id}/schedule`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.msg || 'Failed to schedule');
      }
      setShowScheduleModal(false);
      setScheduleFor(null);
      setSelectedLearners([]);
      setDate(''); setTime(''); setDuration(60);
      setSuccess('Session scheduled successfully.');
      fetchData();
    } catch (e) {
      console.error(e);
      setError(e.message || 'Failed to schedule');
    }
  };

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

  const getSessionWindow = (session) => {
    const start = session?.startTime ? new Date(session.startTime) : session?.scheduledAt ? new Date(session.scheduledAt) : null;
    const end = session?.endTime ? new Date(session.endTime) : null;
    const now = new Date();
    if (!start || !end) {
      return { label: 'Upcoming', badgeClass: 'bg-amber-50 text-amber-700', isUpcoming: true, isLive: false, isCompleted: false, joinAllowed: false, countdown: 'Waiting for session time' };
    }
    if (session?.status === 'cancelled') {
      return { label: 'Cancelled', badgeClass: 'bg-red-100 text-red-700', isUpcoming: false, isLive: false, isCompleted: false, joinAllowed: false, countdown: 'Cancelled' };
    }
    if (now < start) {
      const diffMs = start - now;
      const diffMinutes = Math.max(1, Math.ceil(diffMs / 60000));
      return { label: 'Upcoming', badgeClass: 'bg-amber-50 text-amber-700', isUpcoming: true, isLive: false, isCompleted: false, joinAllowed: false, countdown: `Starts in ${diffMinutes} minutes` };
    }
    if (now >= start && now < end) {
      return { label: 'Live', badgeClass: 'bg-emerald-50 text-emerald-700', isUpcoming: false, isLive: true, isCompleted: false, joinAllowed: true, countdown: 'Live now' };
    }
    return { label: 'Completed', badgeClass: 'bg-slate-200 text-slate-700', isUpcoming: false, isLive: false, isCompleted: true, joinAllowed: false, countdown: `Session ended at ${end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` };
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

  const handleCloseSession = async (sessionId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/session/close', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.msg || 'Failed to close session');
      setSuccess('Session closed successfully.');
      fetchData();
    } catch (e) {
      console.error(e);
      setError(e.message || 'Failed to close session');
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
              {sessions.filter(s => ['scheduled', 'live', 'completed'].includes(s.status) || new Date(s.startTime || s.scheduledAt) > new Date()).length === 0 ? (
                <div className="text-sm text-slate-500">No upcoming sessions.</div>
              ) : (
                <div className="space-y-3">
                  {sessions.filter(s => ['scheduled', 'live', 'completed'].includes(s.status) || new Date(s.startTime || s.scheduledAt) > new Date()).slice(0, 5).map(s => {
                    const state = getSessionWindow(s);
                    const start = s.startTime ? new Date(s.startTime) : s.scheduledAt ? new Date(s.scheduledAt) : null;
                    const end = s.endTime ? new Date(s.endTime) : null;
                    const participants = getSessionParticipants(s);
                    return (
                      <div key={s._id} className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-medium">{s.skillTopic?.skillName || 'Session'}</div>
                          <div className="text-xs text-slate-500">Learners: {participants.map((participant) => participant.name).join(', ') || s.learner?.name}</div>
                          <div className="text-xs text-slate-500">{start ? start.toLocaleDateString() : 'No date'} • {start ? `${start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} - ${end ? end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '—'}` : 'TBD'}</div>
                          <div className="mt-1 text-xs font-medium text-slate-600">{state.label}</div>
                          <div className="text-[11px] text-slate-500">{state.countdown}</div>
                        </div>
                        <div className="text-right">
                          {state.isLive ? (
                            <button onClick={() => window.open(s.meetingLink || '#', '_blank')} disabled={!s.meetingLink} className="mt-2 text-sm rounded-full bg-emerald-600 text-white px-3 py-1.5 disabled:opacity-50">Join Session</button>
                          ) : state.isUpcoming ? (
                            <button disabled className="mt-2 text-sm rounded-full bg-slate-200 text-slate-500 px-3 py-1.5">Join Session - Disabled</button>
                          ) : (
                            <button disabled className="mt-2 text-sm rounded-full bg-slate-200 text-slate-500 px-3 py-1.5">Session Ended</button>
                          )}
                          {state.isLive && (
                            <button onClick={() => handleCloseSession(s._id)} className="mt-2 block text-xs text-amber-700">Close session early</button>
                          )}
                          {state.isCompleted && (
                            <button onClick={() => handleCompleteSession(s._id)} className="mt-2 block text-xs text-indigo-600">Finalize completion</button>
                          )}
                        </div>
                      </div>
                    );
                  })}
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

        <div className="mt-6">
          <MentorAvailabilityCalendar sessions={sessions} />
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
          <div>
            <label className="block text-sm text-slate-600 mb-1">Session duration (minutes)</label>
            <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full px-3 py-2 border rounded-md bg-white">
              {[15, 30, 45, 60, 90, 120, 180, 240].map((option) => (
                <option key={option} value={option}>{option} minutes</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-2">Learners for this session</label>
            <div className="space-y-2 max-h-44 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-2">
              {learners.length === 0 ? (
                <div className="text-sm text-slate-500">No learners available yet.</div>
              ) : (
                learners.map((learner) => {
                  const id = learner._id || learner.id;
                  const checked = selectedLearners.includes(String(id));
                  return (
                    <label key={id} className="flex items-center gap-3 rounded-md bg-white px-2 py-2 shadow-sm">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          setSelectedLearners((current) => {
                            const next = new Set(current.map(String));
                            if (next.has(String(id))) next.delete(String(id));
                            else next.add(String(id));
                            return [...next];
                          });
                        }}
                      />
                      <div className="flex items-center gap-2">
                        <Avatar src={learner.photo} name={learner.name} size={8} />
                        <div>
                          <div className="text-sm font-medium text-slate-800">{learner.name}</div>
                          <div className="text-[11px] text-slate-500">{learner.email}</div>
                        </div>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </div>
          <div className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">A single Google Calendar event and shared Meet link will be created for all selected learners.</div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowScheduleModal(false)}>Cancel</Button>
            <Button onClick={schedule}>Confirm</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}