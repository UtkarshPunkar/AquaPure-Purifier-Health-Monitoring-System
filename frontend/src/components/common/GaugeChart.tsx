import React from 'react';

interface GaugeChartProps {
  value: number; // 0 to 100
  title: string;
  subtitle?: string;
  size?: number; // width/height in px
  unit?: string;
  showStatusLabel?: boolean;
}

export const GaugeChart: React.FC<GaugeChartProps> = ({
  value,
  title,
  subtitle,
  size = 170,
  unit = '',
  showStatusLabel = true,
}) => {
  const clamped = Math.max(0, Math.min(100, value));
  const strokeWidth = 10;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  let strokeColor = '#10b981'; // green
  let statusText = 'Optimal Potability';
  let badgeColor = 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/60 dark:border-emerald-800/60';

  if (clamped >= 85) {
    strokeColor = '#10b981';
    statusText = 'Optimal Potability';
    badgeColor = 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/60 dark:border-emerald-800/60';
  } else if (clamped >= 70) {
    strokeColor = '#0284c7';
    statusText = 'Good Standard';
    badgeColor = 'text-sky-700 bg-sky-50 border-sky-200 dark:text-sky-300 dark:bg-sky-950/60 dark:border-sky-800/60';
  } else if (clamped >= 50) {
    strokeColor = '#f59e0b';
    statusText = 'Fair / Warning';
    badgeColor = 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-950/60 dark:border-amber-800/60';
  } else {
    strokeColor = '#ef4444';
    statusText = 'Critical Alert';
    badgeColor = 'text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-300 dark:bg-rose-950/60 dark:border-rose-800/60';
  }

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          {/* Track circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-slate-200 dark:text-slate-700"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Inner centered text */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <div className="flex items-baseline">
            <span className="text-3xl font-extrabold tracking-tight app-heading font-mono">
              {clamped.toFixed(0)}
            </span>
            {unit && <span className="text-xs font-semibold app-muted ml-0.5">{unit}</span>}
          </div>
          {showStatusLabel && (
            <span className={`text-[10px] font-semibold tracking-wide uppercase mt-1 px-2 py-0.5 rounded-full border ${badgeColor}`}>
              {statusText}
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 text-center">
        <h4 className="text-sm font-semibold app-heading">{title}</h4>
        {subtitle && <p className="text-xs app-muted mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
};
