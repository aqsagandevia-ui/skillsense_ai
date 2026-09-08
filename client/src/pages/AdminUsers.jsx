import React, { useEffect, useState } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

export default function AdminUsers(){
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(()=>{ fetchUsers(); }, []);

  async function fetchUsers(){
    setLoading(true);
    try{
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setUsers(await res.json());
    }catch(e){ console.error(e); }
    setLoading(false);
  }

  const filtered = users.filter(u=> !query ? true : (u.name||'').toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="min-h-screen pt-24 bg-slate-50 pb-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Users</h2>
          <div className="flex items-center gap-2">
            <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search users" className="px-3 py-2 rounded-xl border" />
            <Button onClick={fetchUsers}>Refresh</Button>
          </div>
        </div>

        <Card>
          {loading ? <div className="py-8 text-center">Loading...</div> : (
            filtered.length===0 ? <div className="py-8 text-center text-slate-500">No users</div> : (
              <div className="space-y-3">
                {filtered.map(u => (
                  <div key={u._id} className="flex items-center justify-between p-3 rounded-2xl bg-white shadow-sm">
                    <div>
                      <div className="font-medium">{u.name}</div>
                      <div className="text-xs text-slate-500">{u.email} • {u.role}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="secondary">Block</Button>
                      <Button variant="ghost">Edit</Button>
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
