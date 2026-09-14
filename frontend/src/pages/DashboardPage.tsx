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
  Calendar,
  Building2,
  Check,
  Edit2,
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

  // Active Category Tab (Matching reference image: Booking, Amenities, Customization, Locality)
  const [activeTab, setActiveTab] = useState<'overview' | 'health' | 'ai' | 'campus'>('overview');
  const [task1Active, setTask1Active] = useState(true);
  const [task2Active, setTask2Active] = useState(false);

  // Greeting
  const userName = user?.name || 'Campus Administrator';
  const userRole = user?.role === 'ADMIN' ? 'Super Admin' : user?.role?.replace('_', ' ') || 'Super Admin';

  // KPI Calculations
  const totalPurifiers = purifiers.length || 5;
  const activePurifiers = purifiers.filter((p) => p.status !== 'OFFLINE').length;
  const safeUnits = purifiers.filter((p) => p.status === 'HEALTHY').length;
  const warningUnits = purifiers.filter((p) => p.status === 'WARNING').length;
  const criticalUnits = purifiers.filter((p) => p.status === 'CRITICAL').length;
  const activeAlerts = alerts.filter((a) => !a.isResolved).length;

  // Water Quality Overview averages
  const activeList = purifiers.filter((p) => p.status !== 'OFFLINE');
  const count = activeList.length || 1;

  const avgPh = Number((activeList.reduce((acc, p) => acc + (p.currentTelemetry?.ph || 7.2), 0) / count).toFixed(1));
  const avgTds = Math.round(activeList.reduce((acc, p) => acc + (p.currentTelemetry?.tds || 180), 0) / count);
  const avgTurbidity = Number((activeList.reduce((acc, p) => acc + (p.currentTelemetry?.turbidity || 0.6), 0) / count).toFixed(1));
  const avgTemp = Number((activeList.reduce((acc, p) => acc + (p.currentTelemetry?.temperature || 24.5), 0) / count).toFixed(1));
  const avgWaterLevel = Math.round(activeList.reduce((acc, p) => acc + (p.currentTelemetry?.waterLevel || 78), 0) / count);

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
  const sparklineData = [
    { value: 160 }, { value: 165 }, { value: 172 }, { value: 168 },
    { value: 175 }, { value: 182 }, { value: 178 }, { value: 180 },
  ];

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
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* =========================================================================
          MAIN 2-COLUMN GRID: [MAIN DASHBOARD (Left)] + [CALENDAR & SCHEDULE (Right)]
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* =======================================================================
            LEFT COLUMN: Main Dashboard Content (Span 7/8)
           ======================================================================= */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {/* Main Dashboard Section Header & Filter Tabs (Matching Reference Image) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Main Dashboard
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

            {/* Sub-Header Tabs: Booking / Amenities / Customization / Locality style */}
            <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto pb-1 text-xs font-bold">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Fleet Overview
              </button>
              <button
                onClick={() => setActiveTab('health')}
                className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                  activeTab === 'health'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Filter Health
              </button>
              <button
                onClick={() => setActiveTab('ai')}
                className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                  activeTab === 'ai'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                AI Scans
              </button>
              <button
                onClick={() => setActiveTab('campus')}
                className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                  activeTab === 'campus'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                S.B. Jain Campus
              </button>
            </div>
          </div>

          {/* Top Hero Cards (Matching the 4 Hero Cards in Reference Image) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Card 1: Water Quality / TDS Score with Sparkline */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold mb-1">
                  <span>Water Quality Index</span>
                  <TrendingUp size={14} className="text-emerald-500" />
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                  {avgTds} <span className="text-xs font-normal text-slate-400">PPM</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                  100% Safe Drinking Quality
                </span>
              </div>

              {/* Sparkline mini chart */}
              <div className="h-14 w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sparklineData}>
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#0284c7"
                      strokeWidth={2.5}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Card 2: Bright Yellow Demographics / Health Score Card (Matching Reference Yellow Card) */}
            <div className="bg-[#F9C74F] p-4 rounded-3xl text-slate-950 shadow-xs flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-center justify-between text-xs font-bold opacity-85">
                <span>Fleet Health Score</span>
                <ShieldCheck size={18} />
              </div>
              <div className="my-2">
                <div className="text-4xl font-black font-mono tracking-tight">
                  98%
                </div>
                <span className="text-[11px] font-bold opacity-90 block">
                  All 5 Purifier Units Operational
                </span>
              </div>
              <div className="text-[10px] font-semibold opacity-75">
                S.B. Jain Institute Grid
              </div>
            </div>

            {/* Card 3: Modern Purifier Architecture Showcase Card */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-tr from-slate-900 via-sky-950 to-slate-900 text-white p-4 flex flex-col justify-between shadow-xs border border-sky-900/60 group">
              <div className="flex items-center justify-between z-10">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/40">
                  SMART FLEET
                </span>
                <Link
                  to="/purifiers"
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-[#00E5FF] hover:text-slate-950 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <ArrowUpRight size={14} />
                </Link>
              </div>

              <div className="my-3 z-10">
                <div className="text-lg font-black leading-tight text-white">
                  5 Campus Nodes
                </div>
                <p className="text-[11px] text-sky-200/80 mt-0.5">
                  Live IoT Telemetry &amp; UV Filtration
                </p>
              </div>

              <div className="flex items-center justify-between text-[10px] text-sky-300/90 z-10 pt-2 border-t border-white/10">
                <span>Today's Flow: 24,000L</span>
                <span className="text-emerald-400 font-bold font-mono">99.9% Uptime</span>
              </div>
            </div>
          </div>

          {/* Active Bookings / Active Purifier Tasks (Matching Reference Image bottom cards) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                Active Purifier Maintenance &amp; Tasks
              </h3>
              <Link
                to="/maintenance"
                className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-sky-600 flex items-center gap-1"
              >
                <span>Check All</span>
                <ChevronRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Task 1 Card (Matching "Award Ceremony" Card from Reference) */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      RO Filter Flush &amp; Purity Audit
                    </h4>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                      12:30 &ndash; 15:45 &bull; WP-001 Admin Complex
                    </div>
                  </div>
                  {/* Toggle Switch */}
                  <button
                    onClick={() => setTask1Active(!task1Active)}
                    className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                      task1Active ? 'bg-teal-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                        task1Active ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/60">
                    S.B. Jain
                  </span>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-200/60">
                    Scheduled
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  {/* Technician Avatars */}
                  <div className="flex items-center -space-x-2">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80"
                      alt="Tech 1"
                      className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 object-cover"
                    />
                    <img
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80"
                      alt="Tech 2"
                      className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 object-cover"
                    />
                    <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[9px] font-bold text-slate-600 dark:text-slate-300">
                      +2
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => navigate('/maintenance')}
                      className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 flex items-center justify-center transition-colors"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      onClick={() => navigate('/purifiers/1')}
                      className="w-7 h-7 rounded-full bg-teal-700 text-white flex items-center justify-center hover:bg-teal-800 transition-colors"
                    >
                      <ArrowUpRight size={13} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Task 2 Card (Matching "Design Discussion" Card from Reference) */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      AI Vision Contaminant Review
                    </h4>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                      16:30 &ndash; 20:00 &bull; WP-004 Science Complex
                    </div>
                  </div>
                  {/* Toggle Switch */}
                  <button
                    onClick={() => setTask2Active(!task2Active)}
                    className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                      task2Active ? 'bg-teal-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                        task2Active ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/60">
                    AI Vision
                  </span>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60">
                    Inspection
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  {/* Technician Avatars */}
                  <div className="flex items-center -space-x-2">
                    <img
                      src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop&q=80"
                      alt="Tech 3"
                      className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 object-cover"
                    />
                    <img
                      src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&auto=format&fit=crop&q=80"
                      alt="Tech 4"
                      className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 object-cover"
                    />
                    <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[9px] font-bold text-slate-600 dark:text-slate-300">
                      +1
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => navigate('/ai-detection')}
                      className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 flex items-center justify-center transition-colors"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      onClick={() => navigate('/ai-detection')}
                      className="w-7 h-7 rounded-full bg-teal-700 text-white flex items-center justify-center hover:bg-teal-800 transition-colors"
                    >
                      <ArrowUpRight size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Water Quality Overview Metrics */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Live Water Quality Telemetry
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Real-time sensor metrics aggregated across S.B. Jain Campus
                </p>
              </div>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 font-mono text-[11px]">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Sync Live</span>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* pH Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/50">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>pH Balance</span>
                  <Gauge size={14} className="text-sky-500" />
                </div>
                <div className="text-xl font-black font-mono text-slate-900 dark:text-white">
                  {avgPh} <span className="text-xs font-normal text-slate-400">pH</span>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border mt-2 inline-block ${phStatus.color}`}>
                  {phStatus.text}
                </span>
              </div>

              {/* TDS Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/50">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>TDS Level</span>
                  <Droplets size={14} className="text-cyan-500" />
                </div>
                <div className="text-xl font-black font-mono text-slate-900 dark:text-white">
                  {avgTds} <span className="text-xs font-normal text-slate-400">PPM</span>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border mt-2 inline-block ${tdsStatus.color}`}>
                  {tdsStatus.text}
                </span>
              </div>

              {/* Turbidity Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/50">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>Turbidity</span>
                  <Waves size={14} className="text-teal-500" />
                </div>
                <div className="text-xl font-black font-mono text-slate-900 dark:text-white">
                  {avgTurbidity} <span className="text-xs font-normal text-slate-400">NTU</span>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border mt-2 inline-block ${turbStatus.color}`}>
                  {turbStatus.text}
                </span>
              </div>

              {/* Temperature Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/50">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>Temperature</span>
                  <Thermometer size={14} className="text-amber-500" />
                </div>
                <div className="text-xl font-black font-mono text-slate-900 dark:text-white">
                  {avgTemp}°C
                </div>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-md border bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 mt-2 inline-block">
                  Nominal
                </span>
              </div>
            </div>
          </div>

          {/* Purifier Fleet Status Table (Strictly 5 Purifiers) */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  S.B. Jain Campus Purifier Fleet (5 Units)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Instant telemetry, filter health, and location status
                </p>
              </div>
              <Link
                to="/purifiers"
                className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
              >
                <span>View Fleet</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Node Code</th>
                    <th className="py-2.5 px-3">Purifier Name</th>
                    <th className="py-2.5 px-3">Building Location</th>
                    <th className="py-2.5 px-3">TDS Telemetry</th>
                    <th className="py-2.5 px-3">Filter Health</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {purifiers.slice(0, 5).map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/purifiers/${p.id}`)}
                    >
                      <td className="py-3 px-3 font-mono font-bold text-[#0284c7] dark:text-[#00E5FF]">
                        {p.purifierCode}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-900 dark:text-white">
                        {p.name}
                      </td>
                      <td className="py-3 px-3 text-slate-500 dark:text-slate-400">
                        {p.building}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {p.currentTelemetry?.tds || 150} ppm
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2 font-mono">
                          <div className="w-16 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full"
                              style={{ width: `${p.filter?.healthScore || 85}%` }}
                            />
                          </div>
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {p.filter?.healthScore || 85}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* =======================================================================
            RIGHT COLUMN: Calendar & Maintenance Schedule Panel (Span 4/5)
            (Matching the Circled Section from Reference Image)
           ======================================================================= */}
        <div className="lg:col-span-5 xl:col-span-4 w-full lg:sticky lg:top-4">
          <RightSchedulePanel />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
