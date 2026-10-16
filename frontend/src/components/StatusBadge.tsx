import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-0.5 text-xs';

  let colorClasses = 'bg-slate-800 text-slate-300 border-slate-700';

  switch (status) {
    case 'OPEN':
      colorClasses = 'bg-rose-950/70 text-rose-400 border-rose-800/80';
      break;
    case 'INVESTIGATING':
      colorClasses = 'bg-amber-950/70 text-amber-300 border-amber-800/80';
      break;
    case 'MITIGATED':
      colorClasses = 'bg-cyan-950/70 text-cyan-300 border-cyan-800/80';
      break;
    case 'RESOLVED':
      colorClasses = 'bg-emerald-950/70 text-emerald-300 border-emerald-800/80';
      break;
  }

  return (
    <span className={`inline-flex items-center font-mono font-medium rounded border ${sizeClasses} ${colorClasses}`}>
      {status}
    </span>
  );
};
