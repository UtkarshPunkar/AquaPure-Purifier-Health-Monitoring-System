import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTelemetry } from '../context/TelemetryContext';
import { api } from '../api/client';
import { MaintenanceRecordItem } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  Wrench,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  RefreshCw,
  Search,
  Calendar,
  X,
  RotateCcw,
} from 'lucide-react';

export const MaintenancePage: React.FC = () => {
  const { purifiers, refreshData } = useTelemetry();
  const [records, setRecords] = useState<MaintenanceRecordItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    purifierId: '',
    issue: 'RO Membrane & Carbon Filter Replacement',
    priority: 'HIGH',
    scheduledDate: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString().split('T')[0],
    notes: 'Auto-triggered by predictive degradation threshold.',
  });

  const fetchRecords = async () => {
    try {
      setIsLoading(true);
      const data = await api.getMaintenanceLogs();
      setRecords(data);
    } catch (err) {
      console.error('Failed to fetch maintenance logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleComplete = async (id: string) => {
    try {
      await api.completeMaintenance(id, {
        filterReplaced: true,
        notes: 'Service successfully executed. Membrane replaced & filter health restored to 100%.',
      });
      await fetchRecords();
      await refreshData();
    } catch (err) {
      console.error('Failed to complete maintenance record:', err);
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pid = formData.purifierId || purifiers[0]?.id;
    if (!pid) return;

    try {
      await api.scheduleMaintenance({
        purifierId: pid,
        type: 'FILTER_REPLACEMENT',
        issue: formData.issue,
        priority: formData.priority,
        scheduledDate: formData.scheduledDate,
        notes: formData.notes,
      });
      setIsModalOpen(false);
      await fetchRecords();
      await refreshData();
    } catch (err) {
      console.error('Failed to schedule maintenance:', err);
    }
  };

  // Summary Counts
  const pendingCount = records.filter((r) => r.status === 'PENDING').length;
  const scheduledCount = records.filter((r) => r.status === 'SCHEDULED').length;
  const inProgressCount = records.filter((r) => r.status === 'IN_PROGRESS').length;
  const completedCount = records.filter((r) => r.status === 'COMPLETED').length;
  const overdueCount = records.filter((r) => {
    if (r.status === 'COMPLETED') return false;
    const sched = r.scheduledDate ? new Date(r.scheduledDate).getTime() : 0;
    return sched > 0 && sched < Date.now();
  }).length;

  // Filtered Records
  const filtered = useMemo(() => {
    return records.filter((r) => {
      const q = search.toLowerCase();
      const matchesSearch =
        (r.maintenanceCode && r.maintenanceCode.toLowerCase().includes(q)) ||
        (r.purifier?.purifierCode && r.purifier.purifierCode.toLowerCase().includes(q)) ||
        (r.purifier?.name && r.purifier.name.toLowerCase().includes(q)) ||
        (r.issue && r.issue.toLowerCase().includes(q));

      const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
      const matchesPriority = priorityFilter === 'ALL' || r.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [records, search, statusFilter, priorityFilter]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Maintenance Management
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchRecords()}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
            title="Refresh maintenance logs"
          >
            <RefreshCw size={15} />
          </button>
          <button
            onClick={() => {
              setFormData({
                purifierId: purifiers[0]?.id || '',
                issue: 'RO Membrane & Carbon Filter Replacement',
                priority: 'HIGH',
                scheduledDate: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString().split('T')[0],
                notes: 'Scheduled service dispatched based on telemetry analysis.',
              });
              setIsModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm shadow-sky-600/20"
          >
            <Plus size={16} />
            <span>+ Schedule Maintenance</span>
          </button>
        </div>
      </div>

      {/* 5 Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">
            <span>Pending</span>
            <Clock size={16} className="text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
            {pendingCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Awaiting dispatch</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">
            <span>Scheduled</span>
            <Calendar size={16} className="text-sky-500" />
          </div>
          <div className="text-2xl font-black text-sky-600 dark:text-sky-400 font-mono">
            {scheduledCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Assigned to techs</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">
            <span>In Progress</span>
            <Wrench size={16} className="text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
            {inProgressCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Active servicing</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">
            <span>Completed</span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {completedCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Resolved & verified</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">
            <span>Overdue</span>
            <AlertCircle size={16} className="text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
            {overdueCount}
          </div>
          <div className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">Requires escalation</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search work orders by ID, purifier code or issue..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold"
            >
              <option value="ALL">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>

            {(search || statusFilter !== 'ALL' || priorityFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearch('');
                  setStatusFilter('ALL');
                  setPriorityFilter('ALL');
                }}
                className="p-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                title="Reset Filters"
              >
                <RotateCcw size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Maintenance Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Maintenance ID</th>
                <th className="py-3 px-4">Purifier Unit</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Issue Description</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Scheduled Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
              {filtered.map((r) => {
                const isCrit = r.priority === 'CRITICAL';
                const isHigh = r.priority === 'HIGH';

                return (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-sky-600 dark:text-sky-400">
                      {r.maintenanceCode || 'MNT-1001'}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {r.purifier?.purifierCode || 'WP-1'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                      <div>{r.purifier?.building}</div>
                      <div className="text-[10px] text-slate-400">{r.purifier?.location}</div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200 max-w-xs leading-relaxed">
                      {r.issue || r.notes}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          isCrit
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400'
                            : isHigh
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {r.priority || 'MEDIUM'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400">
                      {r.scheduledDate ? new Date(r.scheduledDate).toLocaleDateString() : new Date(r.date).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={r.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {r.status !== 'COMPLETED' ? (
                        <button
                          onClick={() => handleComplete(r.id)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all"
                        >
                          Mark Done
                        </button>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-end gap-1">
                          <CheckCircle2 size={13} /> Completed
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Maintenance Modal */}
      {isModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 max-w-md w-full p-6 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Wrench size={16} className="text-sky-600 dark:text-sky-400" />
                  Schedule Maintenance Service
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleScheduleSubmit} className="space-y-3.5 text-xs font-sans">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Purifier Unit *
                  </label>
                  <select
                    value={formData.purifierId}
                    onChange={(e) => setFormData({ ...formData, purifierId: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    {purifiers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.purifierCode} - {p.name} ({p.building})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Issue Description *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.issue}
                    onChange={(e) => setFormData({ ...formData, issue: e.target.value })}
                    placeholder="e.g. RO membrane replacement & sanitization"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Priority Level
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Scheduled Date
                    </label>
                    <input
                      type="date"
                      value={formData.scheduledDate}
                      onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Service Notes & Protocol
                  </label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold"
                  >
                    Schedule Service
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
