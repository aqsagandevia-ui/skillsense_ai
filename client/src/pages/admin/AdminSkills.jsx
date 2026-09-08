import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';

const AdminSkills = () => {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchSkills = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.listSkills({ search });
      setSkills(res.data.skills || []);
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchSkills(); }, []);

  const removeSkill = async (id) => {
    if (!confirm('Delete this skill?')) return;
    try {
      await adminAPI.deleteSkill(id);
      fetchSkills();
    } catch (err) { console.error(err); }
  };

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Skills</h3>
      <div className="mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search skills..." className="px-3 py-2 border rounded w-full md:w-1/3" />
        <button onClick={fetchSkills} className="ml-2 px-3 py-2 bg-primary text-white rounded">Search</button>
      </div>

      {loading ? <div>Loading...</div> : (
        <div className="space-y-3">
          {skills.map(s => (
            <div key={s._id} className="p-4 border rounded flex justify-between items-center">
              <div>
                <div className="font-medium">{s.skillName}</div>
                <div className="text-sm text-gray-500">Category: {s.category} • By: {s.user?.name || 'Unknown'}</div>
              </div>
              <div>
                <button onClick={() => removeSkill(s._id)} className="px-3 py-1 bg-red-500 text-white rounded">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminSkills;
