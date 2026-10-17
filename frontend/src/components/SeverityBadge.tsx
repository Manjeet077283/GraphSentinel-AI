import React from 'react';

interface SeverityBadgeProps {
  severity: string;
  size?: 'sm' | 'md';
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
  let label = severity;

  switch (severity) {
    case 'P1_CRITICAL':
      colorClasses = 'bg-red-50 text-red-700 border-red-200 font-semibold';
      label = 'P1 Critical';
      break;
    case 'P2_HIGH':
      colorClasses = 'bg-orange-50 text-orange-700 border-orange-200 font-semibold';
      label = 'P2 High';
      break;
    case 'P3_MEDIUM':
      colorClasses = 'bg-amber-50 text-amber-800 border-amber-200';
      label = 'P3 Medium';
      break;
    case 'P4_LOW':
      colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
      label = 'P4 Low';
      break;
  }

  return (
    <span className={`inline-flex items-center font-sans font-medium rounded-full border ${sizeClasses} ${colorClasses}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current" />
      {label}
    </span>
  );
};
