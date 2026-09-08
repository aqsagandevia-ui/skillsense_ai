import { useState, useEffect } from 'react';

export default function StarRating({ value = 0, onChange, readOnly = false, size = 24 }) {
  const [hoverValue, setHoverValue] = useState(0);
  const displayValue = hoverValue || value;

  useEffect(() => {
    setHoverValue(0);
  }, [value]);

  const stars = Array.from({ length: 5 }, (_, index) => index + 1);

  return (
    <div className="flex items-center gap-1">
      {stars.map((star) => {
        const filled = star <= displayValue;
        return (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            onClick={() => onChange && onChange(star)}
            onMouseEnter={() => !readOnly && setHoverValue(star)}
            onMouseLeave={() => !readOnly && setHoverValue(0)}
            className={`transition ${filled ? 'text-yellow-400' : 'text-slate-300'} ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
            aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
            style={{ width: size, height: size }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-full h-full"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.955a1 1 0 00.95.69h4.173c.969 0 1.371 1.24.588 1.81l-3.376 2.454a1 1 0 00-.364 1.118l1.287 3.955c.3.921-.755 1.688-1.54 1.118l-3.376-2.454a1 1 0 00-1.176 0l-3.376 2.454c-.784.57-1.838-.197-1.539-1.118l1.286-3.955a1 1 0 00-.364-1.118L2.045 9.382c-.783-.57-.38-1.81.588-1.81h4.173a1 1 0 00.95-.69l1.286-3.955z" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
