import React from 'react';
import { Link } from 'react-router-dom';
import { Purifier } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { ArrowRight, Cpu } from 'lucide-react';

interface PurifierCardProps {
  purifier: Purifier;
}

export const PurifierCard: React.FC<PurifierCardProps> = ({ purifier }) => {
  const telemetry = purifier.currentTelemetry;
  const filter = purifier.filter;
  const isTargetHardware = purifier.isPhysicalHardware;

  return (
    <div className="app-card p-5 flex flex-col justify-between group">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800/60 px-2 py-0.5 rounded">
                {purifier.purifierCode}
              </span>
              {isTargetHardware && (
                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <Cpu size={11} /> Pico W
                </span>
              )}
            </div>
            <h3 className="font-semibold app-heading text-sm mt-1.5 line-clamp-1">
              {purifier.name}
            </h3>
            <p className="text-xs app-muted mt-0.5 line-clamp-1">
              📍 {purifier.location}
            </p>
          </div>

          <StatusBadge status={purifier.status} size="sm" showPulse />
        </div>

        {/* Health Scores Bar */}
        <div className="grid grid-cols-2 gap-2 my-3 app-card-subtle p-2.5">
          <div>
            <div className="flex justify-between text-xs app-muted mb-1">
              <span>Water Quality</span>
              <span className="font-mono font-semibold app-heading">{telemetry.wqiScore.toFixed(0)}/100</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  telemetry.wqiScore >= 80 ? 'bg-emerald-500' : telemetry.wqiScore >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${telemetry.wqiScore}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs app-muted mb-1">
              <span>Filter Health</span>
              <span className="font-mono font-semibold app-heading">
                {filter ? `${filter.healthScore.toFixed(0)}%` : 'N/A'}
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  (filter?.healthScore ?? 100) >= 70 ? 'bg-emerald-500' : (filter?.healthScore ?? 100) >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${filter?.healthScore ?? 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Live Telemetry Grid */}
        <div className="grid grid-cols-3 gap-2 text-xs font-mono my-3">
          <div className="app-soft p-2 rounded-lg text-center">
            <span className="app-muted text-[10px] block">TDS</span>
            <span className="font-semibold app-heading">{telemetry.tds.toFixed(0)} <span className="text-[10px] font-normal app-muted">ppm</span></span>
          </div>
          <div className="app-soft p-2 rounded-lg text-center">
            <span className="app-muted text-[10px] block">Turbidity</span>
            <span className="font-semibold app-heading">{telemetry.turbidity.toFixed(2)} <span className="text-[10px] font-normal app-muted">NTU</span></span>
          </div>
          <div className="app-soft p-2 rounded-lg text-center">
            <span className="app-muted text-[10px] block">Flow Rate</span>
            <span className="font-semibold app-heading">{telemetry.flowRate.toFixed(2)} <span className="text-[10px] font-normal app-muted">L/m</span></span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-3 border-t app-divider flex items-center justify-between mt-1">
        <div className="text-[11px] app-muted flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Live telemetry</span>
        </div>

        <Link
          to={`/purifiers/${purifier.id}`}
          className="inline-flex items-center space-x-1 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
        >
          <span>View Details</span>
          <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
};
