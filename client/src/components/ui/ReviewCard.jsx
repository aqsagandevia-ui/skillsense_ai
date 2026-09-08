import StarRating from './StarRating';

export default function ReviewCard({ review, onEdit, canEdit = false, canDelete = false, onDelete }) {
  const reviewer = review.learner || review.fromUser;
  const reviewerName = reviewer?.name || 'Learner';
  const skill = review.session?.skillTopic?.skillName || ''; 
  const date = new Date(review.updatedAt || review.createdAt).toLocaleDateString();

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="text-sm text-slate-500">{reviewerName}</div>
          {skill && <div className="text-xs text-slate-400">{skill}</div>}
          <div className="mt-2 text-slate-700 text-sm">{review.comment || 'No comment provided.'}</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-2xl font-semibold text-slate-900">{review.rating}★</div>
          <StarRating value={review.rating} readOnly />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <div>{date}</div>
        <div className="flex items-center gap-2">
          {review.editCount > 0 && <span className="rounded-full bg-slate-100 px-2 py-1">Edited</span>}
          {canEdit && (
            <button onClick={() => onEdit && onEdit(review)} className="rounded-full bg-indigo-600 px-3 py-1 text-white text-xs">Edit</button>
          )}
          {canDelete && (
            <button onClick={() => onDelete && onDelete(review)} className="rounded-full bg-red-600 px-3 py-1 text-white text-xs">Delete</button>
          )}
        </div>
      </div>
    </div>
  );
}
