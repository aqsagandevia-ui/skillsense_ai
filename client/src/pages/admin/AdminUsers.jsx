import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import { messageAPI } from '../../services/api';
import toast from 'react-hot-toast';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.listUsers();
      setUsers(res.data.users || []);
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const toggleBlock = async (u) => {
    try {
      await adminAPI.updateUser(u._id, { isBlocked: !u.isBlocked });
      fetchUsers();
    } catch (err) { console.error(err); }
  };

  const emailUser = async (u) => {
    setSelectedUser(u);
    setShowEmailModal(true);
  };

  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [userReviews, setUserReviews] = useState([]);

  const viewReviews = async (u) => {
    try {
      const res = await adminAPI.getUser(u._id);
      // adminAPI.getUser returns user object; fetch reviews via users API
      const token = localStorage.getItem('token');
      const r = await fetch(`/api/users/reviews/${u._id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!r.ok) throw new Error('Failed to fetch reviews');
      const data = await r.json();
      setUserReviews(data.reviews || []);
      setShowReviewsModal(true);
    } catch (err) {
      console.error('Failed to load user reviews', err);
    }
  };

  // Email modal states
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [emailForm, setEmailForm] = useState({ subject: '', body: '' });

  const submitEmail = async () => {
    if (!emailForm.subject.trim()) return toast.error('Subject required');
    if (!emailForm.body.trim()) return toast.error('Body required');
    try {
      await adminAPI.sendEmail(selectedUser._id, { subject: emailForm.subject, text: emailForm.body, html: `<p>${emailForm.body}</p>` });
      toast.success('Email queued');
      setShowEmailModal(false);
      setEmailForm({ subject: '', body: '' });
    } catch (err) {
      console.error(err);
      toast.error('Failed to send email');
    }
  };

  const sendViaChat = async () => {
    if (!emailForm.body.trim()) return toast.error('Message body required');
    try {
      await messageAPI.sendMessage({ receiverId: selectedUser._id, text: emailForm.body });
      toast.success('Message sent via chat');
      setShowEmailModal(false);
      setEmailForm({ subject: '', body: '' });
    } catch (err) {
      console.error(err);
      toast.error('Failed to send chat message');
    }
  };

  const removeUser = async (id) => {
    if (!confirm('Delete user?')) return;
    try { await adminAPI.deleteUser(id); fetchUsers(); } catch (err) { console.error(err); }
  };

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Users</h3>

      <div className="mb-4 flex items-center justify-between">
        <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search users..." className="px-3 py-2 border rounded w-1/3" />
        <div className="text-sm text-gray-500">Total: {users.length}</div>
      </div>

      {loading ? <div>Loading...</div> : (
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="text-left text-sm text-gray-600">
                <th className="py-2 px-3">Name</th>
                <th className="py-2 px-3">Email</th>
                <th className="py-2 px-3">Role</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.filter(u => `${u.name} ${u.email}`.toLowerCase().includes(query.toLowerCase())).map(u => (
                <tr key={u._id} className="border-t">
                  <td className="py-3 px-3">{u.name}</td>
                  <td className="py-3 px-3">{u.email}</td>
                  <td className="py-3 px-3">{u.role}</td>
                  <td className="py-3 px-3">{u.isBlocked ? <span className="text-red-600">Blocked</span> : <span className="text-green-600">Active</span>}</td>
                  <td className="py-3 px-3">
                    <button onClick={() => toggleBlock(u)} className="mr-2 px-3 py-1 rounded bg-indigo-600 text-white text-sm">{u.isBlocked ? 'Unblock' : 'Block'}</button>
                    <button onClick={() => viewReviews(u)} className="mr-2 px-3 py-1 rounded bg-purple-600 text-white text-sm">Reviews</button>
                    <button onClick={() => emailUser(u)} className="mr-2 px-3 py-1 rounded bg-yellow-500 text-white text-sm">Email</button>
                    <button onClick={async ()=>{ try{ await messageAPI.sendMessage({ receiverId: u._id, text: `Hello from admin ${u.name}.` }); toast.success('Quick chat sent'); } catch(e){ toast.error('Chat failed') } }} className="mr-2 px-3 py-1 rounded bg-green-600 text-white text-sm">Chat</button>
                    <button onClick={() => removeUser(u._id)} className="px-3 py-1 rounded bg-red-500 text-white text-sm">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Email Modal */}
      {showEmailModal && selectedUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Email {selectedUser.email}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium">Subject</label>
                <input value={emailForm.subject} onChange={(e)=>setEmailForm(f=>({...f, subject: e.target.value}))} className="mt-1 block w-full rounded border px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium">Body</label>
                <textarea value={emailForm.body} onChange={(e)=>setEmailForm(f=>({...f, body: e.target.value}))} className="mt-1 block w-full rounded border px-3 py-2 h-32" />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={()=>setShowEmailModal(false)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
              <button onClick={submitEmail} className="px-4 py-2 bg-indigo-600 text-white rounded">Send Email</button>
            </div>
          </div>
        </div>
      )}
      {/* Reviews Modal */}
      {showReviewsModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Reviews for {selectedUser?.name || 'User'}</h3>
            {userReviews.length === 0 ? (
              <div className="text-sm text-gray-500">No reviews</div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {userReviews.map(r => (
                  <div key={r._id || r.createdAt} className="p-3 border rounded">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{r.fromUser?.name || 'Anonymous'}</div>
                      <div className="text-sm text-yellow-500 font-bold">{r.rating} ★</div>
                    </div>
                    {r.comment && <div className="mt-2 text-sm text-gray-700">{r.comment}</div>}
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 text-right">
              <button onClick={()=>setShowReviewsModal(false)} className="px-4 py-2 bg-gray-200 rounded">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
