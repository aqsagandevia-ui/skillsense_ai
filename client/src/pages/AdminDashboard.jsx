import React, { useEffect, useState } from 'react';
import Card from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import Button from '../components/ui/Button';

export default function AdminDashboard(){
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(()=>{ fetchStats(); }, []);

  async function fetchStats(){
    setLoading(true);
    try{
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setStats(await res.json());
    }catch(e){ console.error(e); }
    setLoading(false);
  }

  return (
    <div className="min-h-screen pt-24 bg-slate-50 pb-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-slate-500">Overview and management tools</p>
          </div>
          <div>
            <Button onClick={fetchStats}>Refresh</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <StatCard title="Total Users" value={stats.totalUsers || 0} />
          <StatCard title="Total Mentors" value={stats.totalMentors || 0} />
          <StatCard title="Active Sessions" value={stats.activeSessions || 0} />
          <StatCard title="Pending Requests" value={stats.pendingRequests || 0} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <h3 className="text-lg font-semibold mb-3">User Management</h3>
            <p className="text-sm text-slate-500">Search, block/unblock and change roles.</p>
            <div className="mt-4"><Button>Open Users</Button></div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold mb-3">Session Monitoring</h3>
            <p className="text-sm text-slate-500">View sessions and issues.</p>
            <div className="mt-4"><Button>View Sessions</Button></div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold mb-3">Broadcast</h3>
            <p className="text-sm text-slate-500">Send notices to all users.</p>
            <div className="mt-4"><Button>Send Notice</Button></div>
          </Card>
        </div>
      </div>
    </div>
  );
}
