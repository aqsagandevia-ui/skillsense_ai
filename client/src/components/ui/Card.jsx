import React from 'react';

export default function Card({ children, className = '' }) {
  return (
    <div className={`rounded-2xl bg-white shadow-sm p-6 ${className}`}>{children}</div>
  );
}
