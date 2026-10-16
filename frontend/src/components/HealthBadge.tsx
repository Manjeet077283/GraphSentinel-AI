import React from 'react';

interface HealthBadgeProps {
  status: string;
}

export const HealthBadge: React.FC<HealthBadgeProps> = ({ status }) => {
  let colorClasses = 'bg-slate-800 text-slate-300 border-slate-700';

  switch (status) {
    case 'HEALTHY':
      colorClasses = 'bg-emerald-950/60 text-emerald-400 border-emerald-800/80';
      break;
    case 'DEGRADED':
      colorClasses = 'bg-amber-950/60 text-amber-400 border-amber-800/80';
      break;
    case 'CRITICAL':
      colorClasses = 'bg-rose-950/60 text-rose-400 border-rose-800/80';
      break;
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-mono font-medium rounded border ${colorClasses}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current" />
      {status}
    </span>
  );
};
