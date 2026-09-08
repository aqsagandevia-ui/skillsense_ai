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
    if (!comment.trim()) return;
    onSubmit({ rating, comment });
  };

  return (
    <Modal open={open} onClose={onClose} title={title || 'Review Session'}>
      <div className="space-y-4">
        <div>
          <div className="text-sm text-slate-600 mb-2">Your rating</div>
          <StarRating value={rating} onChange={setRating} />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Review</label>
          <textarea
            className="w-full min-h-[120px] rounded-2xl border border-slate-200 p-3 text-sm text-slate-800 outline-none focus:border-indigo-500"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this mentor..."
          />
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-2xl border border-slate-300 text-slate-700 hover:bg-slate-100 transition">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !comment.trim()}
            className="px-4 py-2 rounded-2xl bg-indigo-600 text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Review'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
