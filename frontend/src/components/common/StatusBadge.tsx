import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  showPulse?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showPulse = false,
}) => {
  const norm = status?.toUpperCase() || 'UNKNOWN';

  // Default neutral
  let bgClasses = 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
  let dotClasses = 'bg-slate-400 dark:bg-slate-500';

  if (['HEALTHY', 'ACTIVE', 'EXCELLENT', 'OPTIMAL', 'GOOD', 'ONLINE', 'COMPLETED', 'LOW', 'CONNECTED'].includes(norm)) {
    bgClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60';
    dotClasses = 'bg-emerald-500 dark:bg-emerald-400';
  } else if (['WARNING', 'FAIR', 'DEGRADED', 'MEDIUM', 'SCHEDULED', 'YELLOW_WARNING', 'SIMULATED_STANDBY', 'PREDICTIVE', 'ATTENTION'].includes(norm)) {
    bgClasses = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/60';
    dotClasses = 'bg-amber-500 dark:bg-amber-400';
  } else if (['CRITICAL', 'POOR', 'HIGH', 'CRITICAL_REPLACE', 'RED_CRITICAL', 'EMERGENCY_REPAIR'].includes(norm)) {
    bgClasses = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/60';
    dotClasses = 'bg-rose-500 dark:bg-rose-400';
  } else if (['OFFLINE', 'DISCONNECTED', 'INACTIVE', 'STANDBY'].includes(norm)) {
    bgClasses = 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
    dotClasses = 'bg-slate-400 dark:bg-slate-500';
  } else if (['MAINTENANCE_DUE', 'MAINTENANCE', 'PENDING', 'IN_PROGRESS'].includes(norm)) {
    bgClasses = 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800/60';
    dotClasses = 'bg-sky-500 dark:bg-sky-400';
  }

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 space-x-1.5 font-medium',
    md: 'text-xs px-2.5 py-1 space-x-1.5 font-medium',
    lg: 'text-xs px-3 py-1.5 space-x-2 font-semibold',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border ${bgClasses} ${sizeClasses} transition-colors`}
    >
      <span className="relative flex h-2 w-2 shrink-0">
        {showPulse && !['OFFLINE', 'COMPLETED', 'DISCONNECTED', 'INACTIVE', 'STANDBY'].includes(norm) && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${dotClasses}`}
          />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${dotClasses}`} />
      </span>
      <span className="capitalize tracking-tight">
        {norm.replace(/_/g, ' ').toLowerCase()}
      </span>
    </span>
  );
};
