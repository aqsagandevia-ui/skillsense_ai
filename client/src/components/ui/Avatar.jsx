import React from 'react';

const getInitials = (name) => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

export default function Avatar({ src, name, size = 10 }) {
  const classes = `w-${size} h-${size} rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-semibold text-white overflow-hidden`;

  if (src) {
    return (
      <div className={classes}>
        <img src={src} alt={name || 'User'} className="w-full h-full object-cover" />
      </div>
    );
  }

  return <div className={classes}>{getInitials(name)}</div>;
}
