import React, { useMemo } from 'react';
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
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { purifiers, alerts, isLiveMode, refreshData } = useTelemetry();
  const navigate = useNavigate();

  // Greeting
  const userName = user?.name || 'Administrator';
  const userRole = user?.role?.replace('_', ' ') || 'Administrator';

  // KPI Calculations
  const totalPurifiers = purifiers.length || 12;
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

  // Distribution chart data
  const statusPieData = [
    { name: 'Safe Water', value: safeUnits, color: '#10b981' },
    { name: 'Warning', value: warningUnits, color: '#f59e0b' },
    { name: 'Critical', value: criticalUnits, color: '#ef4444' },
    { name: 'Offline', value: totalPurifiers - activePurifiers, color: '#94a3b8' },
  ];

  // Purifier comparison bar data (top 6 purifiers)
  const barData = useMemo(() => {
    return purifiers.slice(0, 6).map((p) => ({
      code: p.purifierCode,
      tds: p.currentTelemetry?.tds || 150,
      filterHealth: p.filter?.healthScore || 85,
    }));
  }, [purifiers]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header & Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Welcome back, {userName}
            </h1>
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
              {userRole}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time IoT telemetry, AI contamination scans, and predictive purifier health dashboard.
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => refreshData()}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
            title="Refresh All Data"
          >
            <RefreshCw size={15} />
          </button>
          <Link
            to="/ai-detection"
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-700"
          >
            <ScanEye size={15} className="text-sky-600 dark:text-sky-400" />
            <span>AI Scans</span>
          </Link>
          <Link
            to="/purifiers"
            className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm shadow-sky-600/20"
          >
            <Layers size={15} />
            <span>Manage Purifiers</span>
          </Link>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Purifiers */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium mb-1.5">
            <span>Total Purifiers</span>
            <div className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
              <Droplets size={16} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
            {totalPurifiers}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">Campus units</span>
        </div>

        {/* Active Purifiers */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium mb-1.5">
            <span>Active Purifiers</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Activity size={16} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
            {activePurifiers}
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 block">Online streaming</span>
        </div>

        {/* Safe Water Units */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium mb-1.5">
            <span>Safe Water Units</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck size={16} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
            {safeUnits}
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 block">100% compliant</span>
        </div>

        {/* Warning Units */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium mb-1.5">
            <span>Warning Units</span>
            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <AlertTriangle size={16} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
            {warningUnits}
          </div>
          <span className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5 block">Check filter/TDS</span>
        </div>

        {/* Critical Units */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium mb-1.5">
            <span>Critical Units</span>
            <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <AlertCircle size={16} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 font-mono">
            {criticalUnits}
          </div>
          <span className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5 block">Action required</span>
        </div>

        {/* Active Alerts */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium mb-1.5">
            <span>Active Alerts</span>
            <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Wrench size={16} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 font-mono">
            {activeAlerts}
          </div>
          <span className="text-[11px] text-purple-600 dark:text-purple-400 mt-0.5 block">Unresolved logs</span>
        </div>
      </div>

      {/* 3. Water Quality Overview Section */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
                <Activity size={18} />
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Water Quality Overview
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live campus average metrics across all operational purifiers.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 font-mono text-[11px]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Updated: Just now</span>
            </span>
          </div>
        </div>

        {/* 5 Distinct Cards for Water Quality Parameters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {/* pH Level Card */}
          <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">pH Level</span>
              <Gauge size={16} className="text-sky-500" />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                  {avgPh}
                </span>
                <span className="text-xs text-slate-400">pH</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${phStatus.color}`}>
                  Status: {phStatus.text}
                </span>
              </div>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">Range: 6.5 - 8.5</div>
          </div>

          {/* TDS Card */}
          <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">TDS</span>
              <Droplets size={16} className="text-cyan-500" />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                  {avgTds}
                </span>
                <span className="text-xs text-slate-400">ppm</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${tdsStatus.color}`}>
                  Status: {tdsStatus.text}
                </span>
              </div>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">Limit: &lt; 300 ppm</div>
          </div>

          {/* Turbidity Card */}
          <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Turbidity</span>
              <Waves size={16} className="text-teal-500" />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                  {avgTurbidity}
                </span>
                <span className="text-xs text-slate-400">NTU</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${turbStatus.color}`}>
                  Status: {turbStatus.text}
                </span>
              </div>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">Limit: &lt; 5.0 NTU</div>
          </div>

          {/* Temperature Card */}
          <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Temperature</span>
              <Thermometer size={16} className="text-amber-500" />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                  {avgTemp}
                </span>
                <span className="text-xs text-slate-400">°C</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800">
                  Status: Nominal
                </span>
              </div>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">Range: 10 - 35°C</div>
          </div>

          {/* Water Level Card */}
          <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Water Level</span>
              <Filter size={16} className="text-indigo-500" />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                  {avgWaterLevel}%
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-2">
                <div
                  className="bg-indigo-500 h-full rounded-full transition-all"
                  style={{ width: `${avgWaterLevel}%` }}
                />
              </div>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">Tank Reservoir</div>
          </div>
        </div>
      </div>

      {/* 4. Fleet Analytics & Comparison Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Fleet Distribution Donut Chart */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-2.5 mb-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Purifier Fleet Health Distribution
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Proportion of safe vs warning vs critical machines
            </p>
          </div>

          <div className="h-44 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
            {statusPieData.map((s, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                <span className="text-slate-600 dark:text-slate-400 truncate">{s.name}:</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Purifiers Performance Bar Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5 mb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Live Sensor Telemetry by Machine
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                TDS (ppm) and Filter Health (%) across primary campus nodes
              </p>
            </div>
            <Link
              to="/analytics"
              className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
            >
              <span>Full Analytics</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="code" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="tds" name="TDS (ppm)" fill="#0284c7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="filterHealth" name="Filter Health (%)" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 5. Live Fleet Table (Quick Overview) */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Campus Purifier Fleet Status
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Instant access to water quality, filter life, and building location.
            </p>
          </div>

          <Link
            to="/purifiers"
            className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
          >
            <span>View all 12 purifiers</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Purifier ID</th>
                <th className="py-2.5 px-3">Purifier Name</th>
                <th className="py-2.5 px-3">Building / Location</th>
                <th className="py-2.5 px-3">Water Quality</th>
                <th className="py-2.5 px-3">Filter Health</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {purifiers.slice(0, 6).map((p) => {
                const isSafe = p.status === 'HEALTHY';
                const isWarn = p.status === 'WARNING';
                const isCrit = p.status === 'CRITICAL';
                const isOff = p.status === 'OFFLINE';

                const filterHealth = p.filter?.healthScore ?? 80;

                return (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/purifiers/${p.id}`)}
                  >
                    <td className="py-3 px-3 font-mono font-bold text-sky-600 dark:text-sky-400">
                      {p.purifierCode}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-900 dark:text-white">
                      {p.name}
                    </td>
                    <td className="py-3 px-3 text-slate-500 dark:text-slate-400">
                      <div>{p.building}</div>
                      <div className="text-[10px] text-slate-400">{p.floor}</div>
                    </td>
                    <td className="py-3 px-3 font-mono">
                      <span className="font-semibold">TDS {p.currentTelemetry?.tds || 150} ppm</span>
                      <div className="text-[10px] text-slate-400">pH {p.currentTelemetry?.ph || 7.2}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2 font-mono">
                        <div className="w-16 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              filterHealth >= 70
                                ? 'bg-emerald-500'
                                : filterHealth >= 35
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${filterHealth}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {filterHealth}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isSafe
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                            : isWarn
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                            : isCrit
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        to={`/purifiers/${p.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
                      >
                        <span>View</span>
                        <ChevronRight size={13} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Bottom Grid: Recent Alerts & AI Scan Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Recent Alerts */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent System Alerts</h3>
            </div>
            <Link to="/alerts" className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-2.5">
            {alerts.slice(0, 3).map((a) => (
              <div
                key={a.id}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3 text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">{a.title}</div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{a.message}</p>
                </div>
                <span className="text-[10px] font-mono text-slate-400 shrink-0">
                  {new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Contaminant Detection Highlights */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <ScanEye size={16} className="text-sky-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">AI Vision Inspection Stream</h3>
            </div>
            <Link to="/ai-detection" className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline">
              AI Dashboard
            </Link>
          </div>

          <div className="space-y-2.5">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center font-bold text-xs">
                  AI
                </div>
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">Algae Detected in WP-004</span>
                  <div className="text-[11px] text-slate-500">Confidence: 94.2% &bull; Risk: Critical</div>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400">
                Action Required
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-bold text-xs">
                  AI
                </div>
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">Clean Water in WP-001</span>
                  <div className="text-[11px] text-slate-500">Confidence: 98.7% &bull; Risk: Safe</div>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                Optimal
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
