import React, { useEffect, useState } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import { useAuth } from '../context/AuthContext';

export default function MentorSessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');

  useEffect(()=>{ if (user) fetchSessions(); }, [user]);

  async function fetchSessions(){
    setLoading(true);
    try{
      const token = localStorage.getItem('token');
      const res = await fetch('/api/session', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setSessions(Array.isArray(data)?data:[]);
    }catch(e){ console.error(e); }
    setLoading(false);
  }

  const filtered = sessions.filter(s=>{
    if (filter!=='all' && s.status!==filter) return false;
    if (!query) return true;
    return (s.learner?.name||'').toLowerCase().includes(query.toLowerCase()) || (s.skillTopic?.skillName||'').toLowerCase().includes(query.toLowerCase());
  });

  return (
    <div className="min-h-screen pt-24 bg-slate-50 pb-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold">Sessions</h2>
            <div className="text-sm text-slate-500">Manage all your sessions</div>
          </div>
          <div className="flex items-center gap-3">
            <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search by learner or skill" className="px-3 py-2 rounded-xl border" />
            <Button onClick={()=>fetchSessions()}>Refresh</Button>
          </div>
        </div>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            {['all','incoming','pending','accepted','scheduled','completed','cancelled'].map(f=> (
              <button key={f} onClick={()=>setFilter(f)} className={`px-3 py-1 rounded-full text-sm ${filter===f?'bg-indigo-600 text-white':'bg-slate-100 text-slate-700'}`}>{f}</button>
            ))}
          </div>

          {loading ? <div className="py-8 text-center">Loading...</div> : (
            filtered.length===0 ? <div className="py-8 text-center text-slate-500">No sessions match</div> : (
              <div className="space-y-3">
                {filtered.map(s=> (
                  <div key={s._id} className="flex items-center justify-between p-3 rounded-2xl bg-white shadow-sm">
                    <div className="flex items-center gap-3">
                      <Avatar src={s.learner?.photo} name={s.learner?.name} size={12} />
                      <div>
                        <div className="font-medium">{s.learner?.name}</div>
                        <div className="text-xs text-slate-500">{s.skillTopic?.skillName} • {new Date(s.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-slate-600">{s.status}</div>
                      {s.status==='scheduled' && <a href={s.meetingLink} target="_blank" rel="noreferrer"><Button variant="secondary">Join</Button></a>}
                      {s.status==='pending' && <Button onClick={()=>{}}>Schedule Now</Button>}
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
