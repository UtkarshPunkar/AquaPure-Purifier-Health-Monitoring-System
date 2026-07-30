import React, { useState, useEffect } from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { api } from '../api/client';
import { AlertItem } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { Link, useNavigate } from 'react-router-dom';
import {
  BellRing,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  ShieldCheck,
  RotateCcw,
  Search,
  ExternalLink,
  Wrench,
  X,
} from 'lucide-react';

export const AlertsPage: React.FC = () => {
  const { refreshData } = useTelemetry();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [activeTab, setActiveTab] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'INFO' | 'RESOLVED'>('ALL');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Assign Technician Modal
  const [assignModalAlert, setAssignModalAlert] = useState<AlertItem | null>(null);
  const [technicianName, setTechnicianName] = useState('Rajesh Sharma');
  const [assignSuccess, setAssignSuccess] = useState(false);

  const fetchAlerts = async () => {
    try {
      setIsLoading(true);
      const data = await api.getAlerts();
      setAlerts(data);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleResolve = async (id: string) => {
    try {
      await api.resolveAlert(id);
      await fetchAlerts();
      await refreshData();
    } catch (err) {
      console.error('Failed to resolve alert:', err);
    }
  };

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModalAlert) return;
    setAssignSuccess(true);
    setTimeout(() => {
      setAssignSuccess(false);
      setAssignModalAlert(null);
    }, 1800);
  };

  // Filter alerts by tab and search
  const filtered = alerts.filter((a) => {
    const q = search.toLowerCase();
    const matchesSearch =
      a.title.toLowerCase().includes(q) ||
      a.message.toLowerCase().includes(q) ||
      (a.purifier?.purifierCode && a.purifier.purifierCode.toLowerCase().includes(q)) ||
      (a.purifier?.name && a.purifier.name.toLowerCase().includes(q));

    if (activeTab === 'RESOLVED') return a.isResolved && matchesSearch;
    if (a.isResolved) return false; // non-resolved tabs hide resolved items

    if (activeTab === 'CRITICAL') return (a.severity === 'CRITICAL' || a.severity === 'OFFLINE') && matchesSearch;
    if (activeTab === 'WARNING') return a.severity === 'WARNING' && matchesSearch;
    if (activeTab === 'INFO') return (a.severity === 'INFO' || a.severity === 'PREDICTIVE') && matchesSearch;

    return matchesSearch;
  });

  const criticalCount = alerts.filter((a) => !a.isResolved && (a.severity === 'CRITICAL' || a.severity === 'OFFLINE')).length;
  const warningCount = alerts.filter((a) => !a.isResolved && a.severity === 'WARNING').length;
  const infoCount = alerts.filter((a) => !a.isResolved && (a.severity === 'INFO' || a.severity === 'PREDICTIVE')).length;
  const resolvedCount = alerts.filter((a) => a.isResolved).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            System Alerts & Incidents
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time threshold breaches, microbiological AI contaminant flags, and proactive predictive notices.
          </p>
        </div>

        <button
          onClick={fetchAlerts}
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 text-xs font-semibold shadow-xs"
        >
          <RotateCcw size={14} className={isLoading ? 'animate-spin' : ''} />
          <span>Refresh Alerts</span>
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs font-semibold">
            {[
              { id: 'ALL', label: `All Active (${criticalCount + warningCount + infoCount})` },
              { id: 'CRITICAL', label: `Critical Alerts (${criticalCount})`, badgeColor: 'bg-rose-500 text-white' },
              { id: 'WARNING', label: `Warnings (${warningCount})`, badgeColor: 'bg-amber-500 text-white' },
              { id: 'INFO', label: `Information (${infoCount})` },
              { id: 'RESOLVED', label: `Resolved (${resolvedCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  activeTab === tab.id
                    ? 'bg-sky-600 text-white shadow-xs font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-72">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search alerts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
          </div>
        </div>
      </div>

      {/* Alert Feed */}
      <div className="space-y-3">
        {filtered.map((a) => {
          const isCrit = a.severity === 'CRITICAL' || a.severity === 'OFFLINE';
          const isWarn = a.severity === 'WARNING';

          return (
            <div
              key={a.id}
              className={`bg-white dark:bg-slate-900 rounded-2xl border p-4 sm:p-5 transition-all shadow-xs ${
                a.isResolved
                  ? 'opacity-60 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40'
                  : isCrit
                  ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/10'
                  : isWarn
                  ? 'border-amber-300 dark:border-amber-900/60 bg-amber-50/20 dark:bg-amber-950/10'
                  : 'border-slate-200/80 dark:border-slate-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="mt-0.5 shrink-0">
                    {isCrit ? (
                      <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600">
                        <AlertCircle size={18} />
                      </div>
                    ) : isWarn ? (
                      <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600">
                        <AlertTriangle size={18} />
                      </div>
                    ) : (
                      <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600">
                        <Info size={18} />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        {a.title}
                      </span>
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                        {a.purifier?.purifierCode || 'WP-001'}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {a.category}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {a.message}
                    </p>

                    <div className="mt-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs">
                      <span className="font-bold text-sky-700 dark:text-sky-400">
                        Action Protocol: &nbsp;
                      </span>
                      <span className="text-slate-600 dark:text-slate-300">{a.recommendation}</span>
                    </div>
                  </div>
                </div>

                {/* Actions & Timestamp */}
                <div className="flex flex-row sm:flex-col items-end justify-between sm:justify-start gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-mono text-slate-400">
                    {new Date(a.timestamp).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>

                  <div className="flex items-center gap-2">
                    {/* View Purifier */}
                    {a.purifierId && (
                      <Link
                        to={`/purifiers/${a.purifierId}`}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1"
                      >
                        <span>View Purifier</span>
                        <ExternalLink size={12} />
                      </Link>
                    )}

                    {/* Assign Tech */}
                    {!a.isResolved && (
                      <button
                        onClick={() => setAssignModalAlert(a)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1"
                      >
                        <Wrench size={12} />
                        <span>Assign Tech</span>
                      </button>
                    )}

                    {/* Resolve Button */}
                    {!a.isResolved ? (
                      <button
                        onClick={() => handleResolve(a.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition-all"
                      >
                        Mark as Resolved
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 font-mono">
                        <CheckCircle2 size={14} /> Resolved
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
            <ShieldCheck size={36} className="mx-auto mb-2 text-emerald-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              No active alerts in this category
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              All water quality parameters and purifier health status are strictly within nominal thresholds.
            </p>
          </div>
        )}
      </div>

      {/* Assign Technician Modal */}
      {assignModalAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 max-w-sm w-full p-6 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Wrench size={16} className="text-sky-600 dark:text-sky-400" />
                Assign Maintenance Technician
              </h3>
              <button
                onClick={() => setAssignModalAlert(null)}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {assignSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>Technician assigned & dispatch notification sent!</span>
              </div>
            ) : (
              <form onSubmit={handleAssignSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Alert Incident
                  </label>
                  <p className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-medium">
                    {assignModalAlert.title}
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Select Technician
                  </label>
                  <select
                    value={technicianName}
                    onChange={(e) => setTechnicianName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="Rajesh Sharma">Rajesh Sharma (Senior HVAC & Water Tech)</option>
                    <option value="Vikram Singh">Vikram Singh (Membrane Specialist)</option>
                    <option value="Vedant Bhanarkar">Vedant Bhanarkar (Technical Lead)</option>
                  </select>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setAssignModalAlert(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold"
                  >
                    Confirm Dispatch
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
