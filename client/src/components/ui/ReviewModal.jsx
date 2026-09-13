import { useEffect, useState } from 'react';
import Modal from './Modal';
import StarRating from './StarRating';

export default function ReviewModal({ open, title, initialRating = 5, initialComment = '', onClose, onSubmit, loading = false }) {
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState(initialComment);

  useEffect(() => {
    if (open) {
      setRating(initialRating);
      setComment(initialComment);
    }
  }, [open, initialRating, initialComment]);

  const handleSubmit = () => {
    if (!rating || rating < 1 || rating > 5) return;
    onSubmit({ rating, comment: comment.trim() });
  };

  return (
    <Modal open={open} onClose={onClose} title={title || 'Review Session'}>
      <div className="space-y-5">
        <div>
          <div className="text-sm font-medium text-slate-700 mb-2">Your rating</div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <StarRating value={rating} onChange={setRating} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Your feedback</label>
          <textarea
            className="w-full min-h-[130px] rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share what went well, what could be improved, and how the session helped you..."
          />
          <p className="mt-2 text-xs text-slate-500">This helps other learners understand the mentor experience.</p>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2.5 rounded-2xl border border-slate-300 text-slate-700 hover:bg-slate-100 transition">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !rating || rating < 1 || rating > 5}
            className="px-4 py-2.5 rounded-2xl bg-indigo-600 text-white font-medium shadow-sm hover:bg-indigo-700 transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Submit Review'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
