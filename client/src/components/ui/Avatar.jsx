import React from 'react';

export default function Avatar({ src, name, size = 10 }) {
  const classes = `w-${size} h-${size} rounded-full bg-slate-100 flex items-center justify-center text-sm font-semibold text-slate-700 overflow-hidden`;
  return (
    <div className={classes}>
      {src ? <img src={src} alt={name} className="w-full h-full object-cover" /> : (name ? name.charAt(0) : 'U')}
    </div>
  );
}
