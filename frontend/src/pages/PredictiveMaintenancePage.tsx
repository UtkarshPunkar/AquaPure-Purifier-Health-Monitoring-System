import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTelemetry } from '../context/TelemetryContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { api } from '../api/client';
import {
  BrainCircuit,
  Wrench,
  AlertTriangle,
  Sparkles,
  Info,
} from 'lucide-react';

export const PredictiveMaintenancePage: React.FC = () => {
  const { predictions, purifiers, refreshData } = useTelemetry();
  const [selectedPurifier, setSelectedPurifier] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [serviceType, setServiceType] = useState('FILTER_REPLACEMENT');
  const [notes, setNotes] = useState('');

  const handleOpenSchedule = (pred: any) => {
    setSelectedPurifier(pred);
    setNotes(`Preventive maintenance scheduled based on predictive analysis: ${pred.failureMode}`);
    setIsModalOpen(true);
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPurifier) return;
    try {
      await api.scheduleMaintenance({
        purifierId: selectedPurifier.purifierId,
        type: serviceType,
        notes,
      });
      setIsModalOpen(false);
      await refreshData();
    } catch (err) {
      console.error('Failed to schedule maintenance:', err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="border-b app-divider pb-4">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight app-heading">
          Predictive Maintenance & Insights
        </h1>
        <p className="text-xs sm:text-sm app-muted mt-0.5">
          Proactive degradation trend analysis forecasting filter exhaustion before water quality compromise.
        </p>
      </div>

      {/* Reactive vs Proactive Guidance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="app-card p-4 space-y-1.5">
          <div className="flex items-center space-x-2 text-rose-600 dark:text-rose-400 font-bold text-xs">
            <AlertTriangle size={15} />
            <span>Reactive Maintenance (Threshold-Based)</span>
          </div>
          <p className="text-xs app-body leading-relaxed">
            Triggers immediately when a current sensor value breaches safe limits (e.g., TDS &gt; 500 ppm). Water potability is already compromised before intervention occurs.
          </p>
        </div>

        <div className="app-card p-4 space-y-1.5">
          <div className="flex items-center space-x-2 text-sky-600 dark:text-sky-400 font-bold text-xs">
            <BrainCircuit size={15} />
            <span>Predictive Insights (Trend-Based)</span>
          </div>
          <p className="text-xs app-body leading-relaxed">
            Analyzes multivariate slopes (e.g., flow rate declining over 7 days while TDS gradually increases) to schedule filter replacements 2–3 weeks in advance.
          </p>
        </div>
      </div>

      {/* Predictive Insights Table */}
      <div className="app-card p-5 space-y-4">
        <div>
          <h3 className="text-sm font-bold app-heading">
            Predictive Risk Assessment & Recommendations
          </h3>
          <p className="text-xs app-muted mt-0.5">
            Ranked by estimated Remaining Useful Life (RUL) and diagnosed failure pattern.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="app-soft border-b app-divider text-slate-600 dark:text-slate-400 uppercase font-semibold">
              <tr>
                <th className="py-3 px-3">Purifier Unit</th>
                <th className="py-3 px-3 font-mono">Filter Health</th>
                <th className="py-3 px-3">Risk Level</th>
                <th className="py-3 px-3 font-mono">Estimated Maintenance</th>
                <th className="py-3 px-3">Diagnostic Recommendation</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y app-divider font-sans">
              {predictions.map((pred) => {
                const p = purifiers.find((x) => x.id === pred.purifierId);
                const isCritical = pred.riskLevel === 'CRITICAL';

                return (
                  <tr
                    key={pred.purifierId}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-3.5 px-3 font-medium">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono font-bold text-sky-700 dark:text-sky-400">
                          {pred.purifierCode || p?.purifierCode}
                        </span>
                        <span className="app-heading font-semibold">- {p?.building || 'Facility'}</span>
                      </div>
                      <div className="text-[11px] app-muted">{p?.location}</div>
                    </td>

                    <td className="py-3.5 px-3 font-mono">
                      <span
                        className={`font-bold text-xs ${
                          pred.filterHealth >= 70
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : pred.filterHealth >= 40
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {pred.filterHealth.toFixed(0)}%
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      <StatusBadge status={pred.riskLevel} size="sm" showPulse={isCritical} />
                    </td>

                    <td className="py-3.5 px-3 font-mono font-semibold">
                      {pred.predictedRulDays <= 3 ? (
                        <span className="text-rose-600 dark:text-rose-400 font-bold">Within ~{pred.predictedRulDays} days</span>
                      ) : (
                        <span className="text-sky-700 dark:text-sky-400">~{pred.predictedRulDays} days</span>
                      )}
                    </td>

                    <td className="py-3.5 px-3 max-w-sm">
                      <p className="app-heading font-medium">{pred.recommendation}</p>
                      <p className="text-[11px] app-muted mt-0.5 line-clamp-1">
                        Pattern: {pred.failureMode}
                      </p>
                    </td>

                    <td className="py-3.5 px-3 text-right">
                      <button
                        onClick={() => handleOpenSchedule(pred)}
                        className={`px-3 py-1.5 rounded-md font-medium text-xs transition-colors ${
                          isCritical
                            ? 'primary-button'
                            : 'secondary-button'
                        }`}
                      >
                        Schedule Service
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Modal */}
      {isModalOpen &&
        selectedPurifier &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
            <div className="app-card max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b app-divider pb-3">
                <h3 className="text-sm font-bold app-heading flex items-center gap-2">
                  <Wrench size={16} className="text-sky-600 dark:text-sky-400" />
                  Schedule Maintenance Service
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="app-muted hover:text-slate-900 dark:hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleScheduleSubmit} className="space-y-4 text-xs font-sans">
                <div>
                  <label className="form-label">Target Purifier</label>
                  <input
                    type="text"
                    readOnly
                    value={`${selectedPurifier.purifierCode} (Risk: ${selectedPurifier.riskLevel})`}
                    className="app-input font-mono bg-slate-100 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="form-label">Service Type</label>
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                    className="app-input"
                  >
                    <option value="FILTER_REPLACEMENT">RO Membrane & Carbon Filter Replacement</option>
                    <option value="MEMBRANE_FLUSH">Pressure Line Flush & Sanitization</option>
                    <option value="ROUTINE_CHECKUP">Routine Preventive Inspection</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Work Order Notes</label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="app-input"
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2 border-t app-divider">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="secondary-button"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="primary-button"
                  >
                    Confirm Work Order
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
