import React from 'react';

interface SeverityBadgeProps {
  severity: string;
  size?: 'sm' | 'md';
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  let colorClasses = 'bg-slate-800 text-slate-300 border-slate-700';
  let label = severity;

  switch (severity) {
    case 'P1_CRITICAL':
      colorClasses = 'bg-rose-950/80 text-rose-300 border-rose-800/80 shadow-sm shadow-rose-950/50';
      label = 'P1 Critical';
      break;
    case 'P2_HIGH':
      colorClasses = 'bg-amber-950/80 text-amber-300 border-amber-800/80 shadow-sm shadow-amber-950/50';
      label = 'P2 High';
      break;
    case 'P3_MEDIUM':
      colorClasses = 'bg-yellow-950/70 text-yellow-300 border-yellow-800/70';
      label = 'P3 Medium';
      break;
    case 'P4_LOW':
      colorClasses = 'bg-blue-950/70 text-blue-300 border-blue-800/70';
      label = 'P4 Low';
      break;
  }

  return (
    <span className={`inline-flex items-center font-mono font-medium rounded-full border ${sizeClasses} ${colorClasses}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current animate-pulse" />
      {label}
    </span>
  );
};
