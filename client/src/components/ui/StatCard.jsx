import React from 'react';

export default function StatCard({ title, value, icon, className = '' }) {
  return (
    <div className={`rounded-2xl bg-white shadow-sm p-5 flex items-center justify-between ${className}`}>
      <div>
        <div className="text-sm text-slate-500">{title}</div>
        <div className="text-2xl font-semibold text-slate-900">{value}</div>
      </div>
      {icon && <div className="text-indigo-500">{icon}</div>}
    </div>
  );
}
