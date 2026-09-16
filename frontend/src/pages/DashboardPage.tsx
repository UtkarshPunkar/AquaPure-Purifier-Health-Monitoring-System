import React, { useMemo, useState } from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import {
  Droplets,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Activity,
  Filter,
  ArrowRight,
  ChevronRight,
  Layers,
  Thermometer,
  Gauge,
  Waves,
  ScanEye,
  Wrench,
  Sparkles,
  RefreshCw,
  PlusCircle,
  CheckCircle2,
  Search,
  SlidersHorizontal,
  TrendingUp,
  ArrowUpRight,
  Check,
  Clock,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';
import { RightSchedulePanel } from '../components/dashboard/RightSchedulePanel';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { purifiers, alerts, isLiveMode, refreshData } = useTelemetry();
  const navigate = useNavigate();

  // Greeting
  const userName = user?.name || 'Campus Administrator';

  // 5 standard filters for S.B. Jain campus
  const fiveFilters = useMemo(() => {
    return purifiers.slice(0, 5);
  }, [purifiers]);

  // Average health of all 5 filters
  const avgFilterHealth = useMemo(() => {
    const total = fiveFilters.reduce((sum, p) => sum + (p.filter?.healthScore ?? 98), 0);
    return Math.round(total / 5);
  }, [fiveFilters]);

  // Total water flow of all 5 filters
  const totalWaterFlow = useMemo(() => {
    const sumDaily = fiveFilters.reduce((sum, p) => sum + (p.filter?.dailyUsageLiters ?? 4800), 0);
    return sumDaily || 24000;
  }, [fiveFilters]);

  // Sorted list of 5 campus purifiers
  const sortedPurifiers = useMemo(() => {
    return [...purifiers.slice(0, 5)].sort((a, b) =>
      a.purifierCode.localeCompare(b.purifierCode, undefined, { numeric: true })
    );
  }, [purifiers]);

  // KPI Calculations
  const totalPurifiers = purifiers.length || 5;
  const activePurifiers = purifiers.filter((p) => p.status !== 'OFFLINE' && p.status !== 'INACTIVE').length;
  const safeUnits = purifiers.filter((p) => p.status === 'HEALTHY' || p.status === 'ACTIVE').length;
  const warningUnits = purifiers.filter((p) => p.status === 'WARNING').length;
  const criticalUnits = purifiers.filter((p) => p.status === 'CRITICAL').length;
  const activeAlerts = alerts.filter((a) => !a.isResolved).length;

  // Water Quality Overview averages
  const activeList = purifiers.filter((p) => p.status !== 'OFFLINE' && p.status !== 'INACTIVE');
  const count = activeList.length || 1;

  const avgPh = Number((activeList.reduce((acc, p) => acc + (p.currentTelemetry?.ph || 7.2), 0) / count).toFixed(1));
  const avgTds = Math.round(activeList.reduce((acc, p) => acc + (p.currentTelemetry?.tds || 180), 0) / count);
  const avgTurbidity = Number((activeList.reduce((acc, p) => acc + (p.currentTelemetry?.turbidity || 0.6), 0) / count).toFixed(1));
  const avgTemp = Number((activeList.reduce((acc, p) => acc + (p.currentTelemetry?.temperature || 24.5), 0) / count).toFixed(1));
  const avgFlow = Number((activeList.reduce((acc, p) => acc + (p.currentTelemetry?.flowRate || 2.4), 0) / count).toFixed(2));

  // Status helper for Water Quality Overview
  const getPhStatus = (ph: number) => {
    if (ph >= 6.5 && ph <= 8.5) return { text: 'Safe', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800' };
    if (ph >= 6.0 && ph <= 9.0) return { text: 'Warning', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border-amber-300 dark:border-amber-800' };
    return { text: 'Critical', color: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400 border-rose-300 dark:border-rose-800' };
  };

  const getTdsStatus = (tds: number) => {
    if (tds <= 300) return { text: 'Safe', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800' };
    if (tds <= 400) return { text: 'Warning', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border-amber-300 dark:border-amber-800' };
    return { text: 'Critical', color: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400 border-rose-300 dark:border-rose-800' };
  };

  const getTurbidityStatus = (turb: number) => {
    if (turb <= 1.5) return { text: 'Safe', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800' };
    if (turb <= 3.0) return { text: 'Warning', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border-amber-300 dark:border-amber-800' };
    return { text: 'Critical', color: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400 border-rose-300 dark:border-rose-800' };
  };

  const phStatus = getPhStatus(avgPh);
  const tdsStatus = getTdsStatus(avgTds);
  const turbStatus = getTurbidityStatus(avgTurbidity);

  // Sparkline mini data
  const sparklineData = useMemo(() => {
    return [
      { t: '08:00', wqi: 94 },
      { t: '09:00', wqi: 92 },
      { t: '10:00', wqi: 89 },
      { t: '11:00', wqi: 93 },
      { t: '12:00', wqi: 95 },
      { t: '13:00', wqi: 91 },
      { t: '14:00', wqi: 94 },
    ];
  }, []);

  // Distribution chart data
  const statusPieData = [
    { name: 'Safe Water', value: safeUnits, color: '#10b981' },
    { name: 'Warning', value: warningUnits, color: '#f59e0b' },
    { name: 'Critical', value: criticalUnits, color: '#ef4444' },
    { name: 'Offline', value: totalPurifiers - activePurifiers, color: '#94a3b8' },
  ];

  // Purifier comparison bar data (strictly 5 purifiers)
  const barData = useMemo(() => {
    return purifiers.slice(0, 5).map((p) => ({
      code: p.purifierCode,
      tds: p.currentTelemetry?.tds || 150,
      filterHealth: p.filter?.healthScore || 85,
    }));
  }, [purifiers]);

  return (
    <div className="dashboard-glow-shell relative isolate -m-3.5 sm:-m-5 lg:-m-6 p-3.5 sm:p-5 lg:p-6 space-y-6 animate-in fade-in duration-200">
      <div className="dashboard-glow-orb dashboard-glow-orb-left" aria-hidden="true" />
      <div className="dashboard-glow-orb dashboard-glow-orb-right" aria-hidden="true" />
      <div className="dashboard-glow-grid" aria-hidden="true" />

      {/* =========================================================================
          MAIN 2-COLUMN GRID: [MAIN DASHBOARD (Left)] + [CALENDAR & SCHEDULE (Right)]
         ========================================================================= */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* =======================================================================
            LEFT COLUMN: Main Dashboard Content (Span 7/8)
           ======================================================================= */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {/* Main Dashboard Section Header & Filter Tabs (Matching Reference Image) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Welcome, {userName}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  S.B. Jain Institute &bull; Centralized Water Quality &amp; Purifier Monitoring System
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => refreshData()}
                  className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 transition-colors shadow-2xs shrink-0 cursor-pointer"
                  title="Refresh Telemetry"
                >
                  <RefreshCw size={14} />
                </button>
                <button
                  onClick={() => navigate('/settings')}
                  className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-sky-600 flex items-center gap-1 cursor-pointer bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200/80 dark:border-slate-700/60"
                >
                  <span>Manage</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

          </div>

          {/* Top Hero Cards (Matching Reference Image Dimensions & Style) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {/* Card 1: Filter Active Status */}
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-4.5 rounded-[26px] border border-slate-200/80 dark:border-slate-800 shadow-[0_8px_24px_rgba(15,23,42,0.06)] flex flex-col justify-between h-[210px]">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 tracking-wider uppercase">
                  Filter Active Status
                </span>
                <Activity size={16} className="text-emerald-500" />
              </div>

              <div className="space-y-1 py-1">
                {fiveFilters.map((filter, index) => {
                  const isActive = filter.status !== 'OFFLINE' && filter.status !== 'INACTIVE';
                  return (
                    <div
                      key={filter.id || index}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {index + 1}. Filter {index + 1}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 text-[11px] font-bold ${
                          isActive
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isActive
                              ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]'
                              : 'bg-slate-400'
                          }`}
                        />
                        ({isActive ? 'Active' : 'Inactive'})
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400">
                <span>Total: 5 Campus Filters</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {fiveFilters.filter((p) => p.status !== 'OFFLINE' && p.status !== 'INACTIVE').length}/5 Active
                </span>
              </div>
            </div>

            {/* Card 2: Average Health of All Filters */}
            <div className="bg-[#F0BF38] p-4 sm:p-4.5 rounded-[26px] text-slate-950 shadow-[0_10px_26px_rgba(240,191,56,0.22)] flex flex-col justify-between h-[210px] relative overflow-hidden">
              <div className="flex items-center justify-between text-xs font-bold opacity-90 pb-1">
                <span>Average Filter Health</span>
                <ShieldCheck size={18} />
              </div>

              <div className="my-auto py-1">
                <div className="text-[44px] sm:text-[48px] font-black font-mono tracking-tight leading-none text-slate-950">
                  {avgFilterHealth}%
                </div>
                <span className="text-xs font-semibold text-slate-900/90 mt-1 block leading-snug">
                  Average Health of All 5 Filters
                </span>
              </div>

              <div className="text-[10px] font-semibold text-slate-900/75 pt-1.5 flex items-center justify-between border-t border-slate-950/10">
                <span>S.B. Jain Institute Grid</span>
                <span>All 5 Units</span>
              </div>
            </div>

            {/* Card 3: Total Water Flow & Peak Hours (White Minimal Card) */}
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-4.5 rounded-[26px] border border-slate-200/80 dark:border-slate-800 shadow-[0_8px_24px_rgba(15,23,42,0.06)] flex flex-col justify-between h-[210px]">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <Droplets size={15} className="text-sky-500 shrink-0" />
                  <span>Total Water Flow</span>
                </div>
              </div>

              <div className="my-auto py-1">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">
                  Total Water Flow of All Filters
                </span>
                <div className="text-[30px] sm:text-[34px] font-black font-mono text-slate-900 dark:text-white tracking-tight leading-tight mt-0.5">
                  {totalWaterFlow.toLocaleString()}{' '}
                  <span className="text-sm font-semibold text-sky-500 font-sans uppercase">
                    Liters
                  </span>
                </div>
              </div>

              <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                  <Clock size={13} className="text-sky-500 shrink-0" />
                  <span>
                    Peak Hours:{' '}
                    <strong className="text-slate-900 dark:text-white font-mono font-bold">
                      12:00 PM – 02:00 PM
                    </strong>
                  </span>
                </div>
                <Link
                  to="/purifiers"
                  className="p-1 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  title="View Purifiers"
                >
                  <ArrowUpRight size={15} />
                </Link>
              </div>
            </div>
          </div>

          {/* 1. Purifier Fleet Status Table (Minimal & Sorted) */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                S.B. Jain Campus Purifier Fleet (5 Units)
              </h3>
              <Link
                to="/purifiers"
                className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 transition-colors"
              >
                <span>View Fleet</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Node Code</th>
                    <th className="py-2.5 px-3">Purifier Name</th>
                    <th className="py-2.5 px-3">Location</th>
                    <th className="py-2.5 px-3">Filter Health</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80 dark:divide-slate-800/80">
                  {sortedPurifiers.map((p) => {
                    const healthScoreVal = Math.round(p.filter?.healthScore ?? 85);
                    const isHealthy = p.status === 'HEALTHY' || p.status === 'ACTIVE';
                    const isWarning = p.status === 'WARNING';
                    const isCritical = p.status === 'CRITICAL';

                    const healthColor =
                      healthScoreVal >= 70
                        ? 'bg-emerald-500'
                        : healthScoreVal >= 40
                        ? 'bg-amber-500'
                        : 'bg-rose-500';

                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                        onClick={() => navigate(`/purifiers/${p.id}`)}
                      >
                        <td className="py-3 px-3">
                          <span className="font-mono font-bold text-sky-600 dark:text-[#00E5FF] bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded-md border border-sky-200/60 dark:border-sky-800/60 text-[11px]">
                            {p.purifierCode}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-[#00E5FF] transition-colors">
                          {p.name}
                        </td>
                        <td className="py-3 px-3 text-slate-500 dark:text-slate-400">
                          {p.building}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-16 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`${healthColor} h-full rounded-full transition-all duration-300`}
                                style={{ width: `${healthScoreVal}%` }}
                              />
                            </div>
                            <span className="font-mono font-semibold text-slate-700 dark:text-slate-300 text-xs">
                              {healthScoreVal}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isHealthy
                                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800'
                                : isWarning
                                ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800'
                                : isCritical
                                ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isHealthy
                                  ? 'bg-emerald-500'
                                  : isWarning
                                  ? 'bg-amber-500'
                                  : isCritical
                                  ? 'bg-rose-500'
                                  : 'bg-slate-400'
                              }`}
                            />
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. Water Quality Standards & Ideal Benchmarks */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Ideal Water Quality Standards
              </h3>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 font-mono text-[11px] font-bold">
                <ShieldCheck size={13} className="text-emerald-500" />
                <span>Optimal Standard</span>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* pH Balance Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">pH Balance</span>
                    <Gauge size={14} className="text-sky-500" />
                  </div>
                  <div className="text-xl font-black font-mono text-slate-900 dark:text-white">
                    6.5 – 8.5 <span className="text-xs font-normal text-slate-400">pH</span>
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1">
                    Neutral Safe Range
                  </div>
                </div>
                <div className="mt-2.5">
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-md border bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 inline-block">
                    Ideal: 7.0 pH
                  </span>
                </div>
              </div>

              {/* TDS Level Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">TDS Level</span>
                    <Droplets size={14} className="text-cyan-500" />
                  </div>
                  <div className="text-xl font-black font-mono text-slate-900 dark:text-white">
                    50 – 300 <span className="text-xs font-normal text-slate-400">PPM</span>
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1">
                    Optimal Mineral Balance
                  </div>
                </div>
                <div className="mt-2.5">
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-md border bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 inline-block">
                    Standard: &lt; 300 PPM
                  </span>
                </div>
              </div>

              {/* Turbidity Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Turbidity</span>
                    <Waves size={14} className="text-teal-500" />
                  </div>
                  <div className="text-xl font-black font-mono text-slate-900 dark:text-white">
                    0.0 – 1.0 <span className="text-xs font-normal text-slate-400">NTU</span>
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1">
                    Clear Optical Clarity
                  </div>
                </div>
                <div className="mt-2.5">
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-md border bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 inline-block">
                    Standard: &lt; 1.0 NTU
                  </span>
                </div>
              </div>

              {/* Temperature Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Temperature</span>
                    <Thermometer size={14} className="text-amber-500" />
                  </div>
                  <div className="text-xl font-black font-mono text-slate-900 dark:text-white">
                    10 – 25 <span className="text-xs font-normal text-slate-400">°C</span>
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1">
                    Ambient Dispenser Range
                  </div>
                </div>
                <div className="mt-2.5">
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-md border bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 inline-block">
                    Optimal: 15 – 22°C
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar and schedule panel */}
        <div className="lg:col-span-5 xl:col-span-4 w-full lg:sticky lg:top-4">
          <RightSchedulePanel />
        </div>

      </div>
    </div>
  );
};

export default DashboardPage;
