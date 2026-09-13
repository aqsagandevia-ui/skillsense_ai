import StarRating from './StarRating';

export default function ReviewCard({ review, onEdit, canEdit = false, canDelete = false, onDelete }) {
  const reviewer = review.learner || review.fromUser;
  const reviewerName = reviewer?.name || 'Learner';
  const skill = review.session?.skillTopic?.skillName || '';
  const date = new Date(review.updatedAt || review.createdAt).toLocaleDateString();

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="text-base font-semibold text-slate-800">{reviewerName}</div>
            {review.editCount > 0 && (
              <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-slate-600">
                Edited
              </span>
            )}
          </div>
          {skill && <div className="mt-1 text-xs font-medium text-indigo-600">{skill}</div>}
          <div className="mt-3 text-slate-700 text-sm leading-6">{review.comment || 'No comment provided.'}</div>
        </div>
        <div className="flex items-center gap-3 sm:flex-col sm:items-end">
          <div className="text-2xl font-bold text-slate-900">{review.rating}★</div>
          <StarRating value={review.rating} readOnly />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <div>{date}</div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <button onClick={() => onEdit && onEdit(review)} className="rounded-full bg-indigo-600 px-3 py-1.5 text-white text-xs font-medium">Edit</button>
          )}
          {canDelete && (
            <button onClick={() => onDelete && onDelete(review)} className="rounded-full bg-red-600 px-3 py-1.5 text-white text-xs font-medium">Delete</button>
          )}
        </div>
      </div>
    </div>
  );
}
