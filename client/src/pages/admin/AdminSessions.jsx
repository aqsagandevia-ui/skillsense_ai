import React, { useEffect, useMemo, useState } from 'react';
import { adminAPI } from '../../services/api';

const AdminSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [mentorFilter, setMentorFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  const fetchMentors = async () => {
    try {
      const res = await adminAPI.listUsers({ role: 'mentor', limit: 100 });
      setMentors(res.data.users || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetch = async (filters = {}) => {
    setLoading(true);
    try {
      const res = await adminAPI.listSessions({
        page: 1,
        limit: 100,
        search: filters.search ?? search,
        status: filters.status ?? statusFilter,
        mentorId: filters.mentorId ?? mentorFilter,
      });
      setSessions(res.data.sessions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMentors();
    fetch();
  }, []);

  const stats = useMemo(() => ({
    total: sessions.length,
    completed: sessions.filter((session) => session.status === 'completed').length,
    remaining: sessions.filter((session) => session.status !== 'completed').length,
  }), [sessions]);

  const handleApply = () => {
    fetch({
      search,
      status: statusFilter,
      mentorId: mentorFilter,
    });
  };

  const cancel = async (id) => {
    if (!window.confirm('Force cancel this session?')) return;
    try {
      await adminAPI.cancelSession(id);
      fetch();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Session Management</h3>
          <p className="text-sm text-gray-600">Search sessions, review completed work, and inspect mentor-led sessions from one place.</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-lg font-semibold text-gray-900">{stats.total}</p>
          </div>
          <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2">
            <p className="text-xs text-green-700">Completed</p>
            <p className="text-lg font-semibold text-green-700">{stats.completed}</p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
            <p className="text-xs text-amber-700">Remaining</p>
            <p className="text-lg font-semibold text-amber-700">{stats.remaining}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">Search</label>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by learner, mentor, topic, or status"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="scheduled">Scheduled</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Mentor</label>
            <select
              value={mentorFilter}
              onChange={(event) => setMentorFilter(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            >
              <option value="all">All mentors</option>
              {mentors.map((mentor) => (
                <option key={mentor._id} value={mentor._id}>{mentor.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={handleApply}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Apply Filters
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full table-auto">
          <thead>
            <tr className="bg-gray-50 text-left text-sm text-gray-600">
              <th className="px-3 py-2">Learner</th>
              <th className="px-3 py-2">Mentor</th>
              <th className="px-3 py-2">Skill</th>
              <th className="px-3 py-2">Scheduled</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="px-3 py-6 text-center text-sm text-gray-500">Loading sessions...</td>
              </tr>
            ) : sessions.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-3 py-6 text-center text-sm text-gray-500">No sessions found for the selected filters.</td>
              </tr>
            ) : (
              sessions.map((session) => (
                <tr key={session._id} className="border-t text-sm text-gray-700">
                  <td className="px-3 py-3">{session.learner?.name || '—'}</td>
                  <td className="px-3 py-3">{session.mentor?.name || '—'}</td>
                  <td className="px-3 py-3">{session.skillTopic?.skillName || '—'}</td>
                  <td className="px-3 py-3">{session.scheduledAt ? new Date(session.scheduledAt).toLocaleString() : '—'}</td>
                  <td className="px-3 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${session.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                      {session.status}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <button onClick={() => cancel(session._id)} className="rounded bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600">
                      Force Cancel
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminSessions;
