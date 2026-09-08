import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getReviews();
      setReviews(res.data.reviews || []);
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  const deleteReview = async (reviewId) => {
    if (!window.confirm('Delete this review permanently?')) return;
    try {
      await adminAPI.deleteReview(reviewId);
      toast.success('Review deleted');
      fetchReviews();
    } catch (err) {
      console.error(err);
      toast.error('Unable to delete review');
    }
  };

  useEffect(() => { fetchReviews(); }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold">Reviews</h3>
          <p className="text-sm text-gray-600">View and remove inappropriate reviews.</p>
        </div>
      </div>
      {loading ? <div>Loading...</div> : (
        <div className="space-y-4">
          {reviews.length === 0 && <div>No reviews yet.</div>}
          {reviews.map((r) => (
            <div key={r._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <div className="text-sm text-slate-500">Learner: <span className="font-medium text-slate-900">{r.learner?.name || 'Unknown'}</span></div>
                  <div className="text-sm text-slate-500">Mentor: <span className="font-medium text-slate-900">{r.mentor?.name || 'Unknown'}</span></div>
                  <div className="text-sm text-slate-500">Skill: <span className="font-medium text-slate-900">{r.session?.skillTopic?.skillName || 'N/A'}</span></div>
                  <div className="text-xs text-slate-400">{new Date(r.createdAt).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => deleteReview(r._id)}
                    className="rounded-full bg-red-500 px-3 py-1 text-sm font-medium text-white hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800">{r.rating} ★</span>
                <span className={`rounded-full px-3 py-1 ${r.sentiment === 'positive' ? 'bg-green-100 text-green-700' : r.sentiment === 'negative' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}>{r.sentiment}</span>
              </div>
              {r.keywords?.length > 0 && (
                <div className="mt-3 text-sm text-slate-600">Keywords: {r.keywords.join(', ')}</div>
              )}
              <div className="mt-3 text-sm text-slate-700">{r.comment || 'No comment provided.'}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminReviews;
