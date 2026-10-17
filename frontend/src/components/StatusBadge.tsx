import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-0.5 text-xs';

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';

  switch (status) {
    case 'OPEN':
      colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
      break;
    case 'INVESTIGATING':
      colorClasses = 'bg-amber-50 text-amber-800 border-amber-200';
      break;
    case 'MITIGATED':
      colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
      break;
    case 'RESOLVED':
      colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      break;
  }

  return (
    <span className={`inline-flex items-center font-medium rounded-md border ${sizeClasses} ${colorClasses}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70" />
      {status}
    </span>
  );
};
