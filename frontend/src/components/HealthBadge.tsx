import React from 'react';

interface HealthBadgeProps {
  status: string;
}

export const HealthBadge: React.FC<HealthBadgeProps> = ({ status }) => {
  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';

  switch (status) {
    case 'HEALTHY':
      colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      break;
    case 'DEGRADED':
      colorClasses = 'bg-amber-50 text-amber-800 border-amber-200';
      break;
    case 'CRITICAL':
      colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
      break;
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md border ${colorClasses}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current" />
      {status}
    </span>
  );
};
