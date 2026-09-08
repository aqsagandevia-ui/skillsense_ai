import React, { useEffect, useState } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function MyRequests() {
  const { user, loading: authLoading } = useAuth();
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    fetchRequests();
  }, [authLoading, user]);

  async function fetchRequests() {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/session', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setRequests(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const filtered = requests.filter((request) => filter === 'all' ? true : request.status === filter);
  const stats = {
    pending: requests.filter((req) => req.status === 'pending').length,
    accepted: requests.filter((req) => req.status === 'accepted').length,
    scheduled: requests.filter((req) => req.status === 'scheduled').length,
    completed: requests.filter((req) => req.status === 'completed').length,
    rejected: requests.filter((req) => req.status === 'rejected').length,
    cancelled: requests.filter((req) => req.status === 'cancelled').length,
  };

  return (
    <div className="min-h-screen pt-24 bg-slate-50 pb-12">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold">My Sessions</h2>
            <p className="text-sm text-slate-500">Track every session request, booking, and completed session.</p>
          </div>
          <Link to="/browse"><Button>Browse Mentors</Button></Link>
        </div>

        <div className="grid gap-3 md:grid-cols-6 mb-6">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="text-sm text-amber-700">Pending</div>
            <div className="text-2xl font-semibold text-amber-800">{stats.pending}</div>
          </div>
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
            <div className="text-sm text-green-700">Accepted</div>
            <div className="text-2xl font-semibold text-green-800">{stats.accepted}</div>
          </div>
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
            <div className="text-sm text-blue-700">Scheduled</div>
            <div className="text-2xl font-semibold text-blue-800">{stats.scheduled}</div>
          </div>
          <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
            <div className="text-sm text-violet-700">In Progress</div>
            <div className="text-2xl font-semibold text-violet-800">{requests.filter((req) => req.status === 'in-progress').length}</div>
          </div>
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
            <div className="text-sm text-indigo-700">Completed</div>
            <div className="text-2xl font-semibold text-indigo-800">{stats.completed}</div>
          </div>
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <div className="text-sm text-red-700">Rejected</div>
            <div className="text-2xl font-semibold text-red-800">{stats.rejected}</div>
          </div>
        </div>

        <Card>
          <div className="flex flex-wrap gap-2 mb-4">
            {['all', 'pending', 'accepted', 'rejected', 'completed'].map((filterType) => (
              <button key={filterType} onClick={() => setFilter(filterType)} className={`px-3 py-1 rounded-full ${filter === filterType ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              </button>
            ))}
          </div>

          {loading ? <div className="py-8 text-center">Loading...</div> : (
            filtered.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <div className="text-3xl mb-2">📭</div>
                <div className="text-lg font-medium mb-2">No requests found for this view.</div>
                <div className="text-sm mb-4">Browse mentors and send a request to get started.</div>
                <Link to="/browse"><Button>Browse Mentors</Button></Link>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((request) => (
                  <div key={request._id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="font-medium text-slate-900">{user?.role === 'mentor' ? request.learner?.name || 'Learner' : request.mentor?.name || 'Mentor'}</div>
                      <div className="text-sm text-slate-500">{request.skillTopic?.skillName || 'Skill'} • Requested {new Date(request.createdAt).toLocaleDateString()}</div>
                      {request.meetingLink && request.status === 'scheduled' && (
                        <div className="mt-1 text-sm text-slate-600">Meeting link set for this session.</div>
                      )}
                      {request.message && <div className="mt-1 text-sm text-slate-600">{request.message}</div>}
                      <div className="mt-2 text-xs text-slate-500">
                        {request.status === 'pending' && 'Waiting for the mentor to confirm this session.'}
                        {request.status === 'accepted' && user?.role === 'learner' && 'Mentor accepted this request. You can follow up by chat.'}
                        {request.status === 'accepted' && user?.role === 'mentor' && 'You have accepted this request. Coordinate with the learner as needed.'}
                        {request.status === 'scheduled' && 'This session is scheduled and ready to join when it starts.'}
                        {request.status === 'in-progress' && 'The session is currently in progress.'}
                        {request.status === 'completed' && 'This session is completed.'}
                        {request.status === 'rejected' && 'This request was rejected.'}
                        {request.status === 'cancelled' && 'This session request was cancelled.'}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className={`rounded-full px-3 py-1 text-sm font-medium ${request.status === 'accepted' ? 'bg-green-100 text-green-700' : request.status === 'scheduled' ? 'bg-blue-100 text-blue-700' : request.status === 'in-progress' ? 'bg-violet-100 text-violet-700' : request.status === 'completed' ? 'bg-indigo-100 text-indigo-700' : request.status === 'rejected' || request.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                        {request.status}
                      </div>
                      {(request.status === 'accepted' || request.status === 'completed' || request.status === 'scheduled' || request.status === 'in-progress') && user?.role === 'learner' && request.mentor?._id && <Link to={`/chat/${request.mentor?._id}`}><Button>Chat</Button></Link>}
                      {(request.status === 'accepted' || request.status === 'completed' || request.status === 'scheduled' || request.status === 'in-progress') && user?.role === 'mentor' && request.learner?._id && <Link to={`/chat/${request.learner?._id}`}><Button>Chat</Button></Link>}
                      {request.status === 'scheduled' && request.meetingLink && (
                        <button onClick={() => window.open(request.meetingLink, '_blank')} className="px-3 py-1 rounded-full bg-blue-600 text-white text-xs">Join</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </Card>
      </div>
    </div>
  );
}
