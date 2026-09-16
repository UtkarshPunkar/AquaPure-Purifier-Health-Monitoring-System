import React from 'react';
import { DeviceInfo, TelemetryReading } from '../../types';
import { Cpu, Volume2, AlertCircle, CheckCircle2, AlertTriangle, ShieldAlert, Activity } from 'lucide-react';

interface PhysicalMirrorProps {
  device?: DeviceInfo;
  telemetry?: TelemetryReading;
  purifierCode?: string;
  isPhysicalHardware?: boolean;
}

export const PhysicalMirror: React.FC<PhysicalMirrorProps> = ({
  device,
  purifierCode = 'PUR-001',
}) => {
  const isInactive = device?.status === 'INACTIVE' || device?.status === 'OFFLINE';
  const led = isInactive ? 'OFF' : (device?.ledStatus || 'GREEN_NORMAL');
  const buzzer = isInactive ? false : (device?.buzzerStatus ?? false);
  const isGreen = !isInactive && led === 'GREEN_NORMAL';
  const isYellow = !isInactive && led === 'YELLOW_WARNING';
  const isRed = !isInactive && led === 'RED_CRITICAL';

  return (
    <div className="app-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b app-divider pb-3.5">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800/60 text-sky-600 dark:text-sky-400 shrink-0">
            <Cpu size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold app-heading flex items-center gap-2">
              Physical Microcontroller Twin
              <span className="font-mono text-xs text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/80 px-2 py-0.5 rounded-md border border-sky-200/80 dark:border-sky-800/80">
                {purifierCode}
              </span>
            </h3>
          </div>
        </div>
      </div>

      {/* Wide Diagnostic Status Panel */}
      <div className="app-card-subtle p-4 sm:p-5 rounded-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800/60 pb-3">
          <div className="flex items-center gap-2">
            <Activity size={15} className="text-sky-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Diagnostic Status Panel
            </h4>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Live Hardware State:</span>
            {isInactive && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700 text-[11px] font-bold">
                <Cpu size={12} /> Standby (Inactive)
              </span>
            )}
            {isGreen && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold">
                <CheckCircle2 size={12} /> Normal
              </span>
            )}
            {isYellow && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[11px] font-bold animate-pulse">
                <AlertTriangle size={12} /> Warning Alert
              </span>
            )}
            {isRed && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-[11px] font-bold animate-pulse">
                <ShieldAlert size={12} /> Critical Fault
              </span>
            )}
          </div>
        </div>

        {/* 4 Wide Indicator Columns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Normal Indicator */}
          <div
            className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
              isGreen
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-100 ring-1 ring-emerald-500/20 shadow-xs'
                : 'bg-white/60 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800 text-slate-400 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Normal</span>
              <div
                className={`w-3.5 h-3.5 rounded-full border transition-all ${
                  isGreen
                    ? 'bg-emerald-500 border-emerald-300 shadow-md shadow-emerald-500/50 animate-pulse'
                    : 'bg-slate-300 dark:bg-slate-700 border-slate-400 dark:border-slate-600'
                }`}
              />
            </div>
            <p className="text-[11px] leading-tight font-medium">
              {isGreen ? 'Telemetry within nominal ranges' : 'Standby'}
            </p>
          </div>

          {/* Warning Indicator */}
          <div
            className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
              isYellow
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-100 ring-1 ring-amber-500/20 shadow-xs'
                : 'bg-white/60 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800 text-slate-400 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Warning</span>
              <div
                className={`w-3.5 h-3.5 rounded-full border transition-all ${
                  isYellow
                    ? 'bg-amber-500 border-amber-300 shadow-md shadow-amber-500/50 animate-pulse'
                    : 'bg-slate-300 dark:bg-slate-700 border-slate-400 dark:border-slate-600'
                }`}
              />
            </div>
            <p className="text-[11px] leading-tight font-medium">
              {isYellow ? 'Threshold variance detected' : 'Inactive'}
            </p>
          </div>

          {/* Critical Indicator */}
          <div
            className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
              isRed
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-100 ring-1 ring-rose-500/20 shadow-xs'
                : 'bg-white/60 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800 text-slate-400 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Critical</span>
              <div
                className={`w-3.5 h-3.5 rounded-full border transition-all ${
                  isRed
                    ? 'bg-rose-500 border-rose-300 shadow-md shadow-rose-500/50 animate-pulse'
                    : 'bg-slate-300 dark:bg-slate-700 border-slate-400 dark:border-slate-600'
                }`}
              />
            </div>
            <p className="text-[11px] leading-tight font-medium">
              {isRed ? 'Immediate service required' : 'Inactive'}
            </p>
          </div>

          {/* Acoustic Buzzer */}
          <div
            className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
              buzzer
                ? 'bg-rose-500/15 border-rose-500/40 text-rose-900 dark:text-rose-100 ring-1 ring-rose-500/30 shadow-xs'
                : 'bg-white/60 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800 text-slate-400 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Buzzer</span>
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                  buzzer
                    ? 'bg-rose-600 border-rose-400 text-white shadow-md shadow-rose-500/50 animate-bounce'
                    : 'bg-slate-300 dark:bg-slate-700 border-slate-400 dark:border-slate-600 text-slate-400'
                }`}
              >
                <Volume2 size={11} />
              </div>
            </div>
            <p className="text-[11px] leading-tight font-medium">
              {buzzer ? 'Acoustic alarm sounding' : 'Muted (Normal)'}
            </p>
          </div>
        </div>

        {buzzer && (
          <div className="flex items-center space-x-2 text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 p-2.5 rounded-xl animate-pulse">
            <AlertCircle size={15} className="shrink-0" />
            <span className="font-semibold">Acoustic buzzer is currently sounding due to safety threshold breach.</span>
          </div>
        )}
      </div>
    </div>
  );
};
