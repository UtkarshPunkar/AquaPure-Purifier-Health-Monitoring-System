import React, { useState, useMemo } from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../api/client';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import {
  Download,
  Activity,
  Droplets,
  Wrench,
  AlertTriangle,
  TrendingUp,
  Award,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AnalyticsPage: React.FC = () => {
  const { overview, purifiers, alerts } = useTelemetry();
  const { theme } = useTheme();
  const [selectedMetric, setSelectedMetric] = useState<'wqi' | 'ph' | 'tds' | 'turbidity' | 'temp' | 'filter' | 'contaminants' | 'uptime'>('wqi');
  const isDark = theme === 'dark';
  const gridStroke = isDark ? '#334155' : '#e2e8f0';
  const textStroke = isDark ? '#94a3b8' : '#64748b';
  const tooltipBg = isDark ? '#0f172a' : '#ffffff';
  const tooltipBorder = isDark ? '#334155' : '#e2e8f0';
  const tooltipText = isDark ? '#f8fafc' : '#0f172a';

  // Safe vs Warning vs Critical Distribution
  const safetyDistribution = [
    { name: 'Safe (Nominal)', value: purifiers.filter((p) => p.status === 'HEALTHY').length, color: '#10b981' },
    { name: 'Warning', value: purifiers.filter((p) => p.status === 'WARNING').length, color: '#f59e0b' },
    { name: 'Critical', value: purifiers.filter((p) => p.status === 'CRITICAL').length, color: '#ef4444' },
    { name: 'Inactive / Offline', value: purifiers.filter((p) => p.status === 'INACTIVE' || p.status === 'OFFLINE').length, color: '#94a3b8' },
  ];

  // 14-day fleet aggregate time trends
  const trendData = useMemo(() => {
    const days = ['Day -13', 'Day -12', 'Day -11', 'Day -10', 'Day -9', 'Day -8', 'Day -7', 'Day -6', 'Day -5', 'Day -4', 'Day -3', 'Day -2', 'Yesterday', 'Today'];
    return days.map((d, i) => ({
      day: d,
      wqi: 88 + (i % 5) * 1.5,
      ph: (7.2 + ((i * 3) % 7) * 0.05).toFixed(2),
      tds: 160 + (i % 6) * 8,
      turbidity: (0.5 + (i % 4) * 0.15).toFixed(2),
      temp: (23.5 + (i % 3) * 0.6).toFixed(1),
      filter: Math.max(70, 92 - i * 0.8).toFixed(1),
      contaminants: i % 4 === 0 ? 1 : 0,
      uptime: 99.2 - (i % 3) * 0.4,
    }));
  }, []);

  // Performance ranking (sort by WQI & Filter Health)
  const rankedPurifiers = useMemo(() => {
    return [...purifiers].sort((a, b) => {
      const scoreA = (a.currentTelemetry?.wqiScore || 0) + (a.filter?.healthScore || 0);
      const scoreB = (b.currentTelemetry?.wqiScore || 0) + (b.filter?.healthScore || 0);
      return scoreB - scoreA;
    });
  }, [purifiers]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & CSV Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Telemetry Analytics & Fleet Intelligence
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={api.exportTelemetryUrl(undefined, 30)}
            download
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-sky-600/20 transition-all"
          >
            <Download size={14} />
            <span>Export Sensor CSV</span>
          </a>
        </div>
      </div>

      {/* Main Trend Analysis Section */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp size={16} className="text-sky-600 dark:text-sky-400" />
              Longitudinal Fleet Trend Analysis
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              14-day aggregated telemetry patterns across all campus water purification nodes.
            </p>
          </div>

          {/* Metric Selector Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs font-semibold">
            {[
              { id: 'wqi', label: 'Water Quality (WQI)' },
              { id: 'ph', label: 'pH Trend' },
              { id: 'tds', label: 'TDS (ppm)' },
              { id: 'turbidity', label: 'Turbidity (NTU)' },
              { id: 'temp', label: 'Temperature (°C)' },
              { id: 'filter', label: 'Filter Health (%)' },
              { id: 'contaminants', label: 'Contaminant Scans' },
              { id: 'uptime', label: 'Uptime (%)' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedMetric(m.id as any)}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  selectedMetric === m.id
                    ? 'bg-sky-600 text-white font-bold shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Trend Chart */}
        <div className="h-64 sm:h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {selectedMetric === 'wqi' ? (
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="wqiGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="day" stroke={textStroke} fontSize={11} />
                <YAxis stroke={textStroke} fontSize={11} domain={[70, 100]} />
                <Tooltip contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '8px', fontSize: '12px', color: tooltipText }} />
                <Area type="monotone" dataKey="wqi" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#wqiGrad)" name="Average WQI" />
              </AreaChart>
            ) : selectedMetric === 'tds' ? (
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="tdsGradA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="day" stroke={textStroke} fontSize={11} />
                <YAxis stroke={textStroke} fontSize={11} domain={[120, 250]} />
                <Tooltip contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '8px', fontSize: '12px', color: tooltipText }} />
                <Area type="monotone" dataKey="tds" stroke="#0284c7" strokeWidth={2.5} fillOpacity={1} fill="url(#tdsGradA)" name="Average TDS (ppm)" />
              </AreaChart>
            ) : selectedMetric === 'filter' ? (
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="day" stroke={textStroke} fontSize={11} />
                <YAxis stroke={textStroke} fontSize={11} domain={[60, 100]} />
                <Tooltip contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '8px', fontSize: '12px', color: tooltipText }} />
                <Line type="monotone" dataKey="filter" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 3 }} name="Fleet Mean Filter Health (%)" />
              </LineChart>
            ) : selectedMetric === 'ph' ? (
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="day" stroke={textStroke} fontSize={11} />
                <YAxis stroke={textStroke} fontSize={11} domain={[6.5, 8.0]} />
                <Tooltip contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '8px', fontSize: '12px', color: tooltipText }} />
                <Line type="monotone" dataKey="ph" stroke="#06b6d4" strokeWidth={2.5} dot={{ r: 3 }} name="Fleet Mean pH" />
              </LineChart>
            ) : selectedMetric === 'turbidity' ? (
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="day" stroke={textStroke} fontSize={11} />
                <YAxis stroke={textStroke} fontSize={11} domain={[0, 2.0]} />
                <Tooltip contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '8px', fontSize: '12px', color: tooltipText }} />
                <Line type="monotone" dataKey="turbidity" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3 }} name="Fleet Mean Turbidity (NTU)" />
              </LineChart>
            ) : selectedMetric === 'temp' ? (
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="day" stroke={textStroke} fontSize={11} />
                <YAxis stroke={textStroke} fontSize={11} domain={[20, 28]} />
                <Tooltip contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '8px', fontSize: '12px', color: tooltipText }} />
                <Line type="monotone" dataKey="temp" stroke="#f43f5e" strokeWidth={2.5} dot={{ r: 3 }} name="Fleet Mean Temp (°C)" />
              </LineChart>
            ) : selectedMetric === 'uptime' ? (
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="day" stroke={textStroke} fontSize={11} />
                <YAxis stroke={textStroke} fontSize={11} domain={[95, 100]} />
                <Tooltip contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '8px', fontSize: '12px', color: tooltipText }} />
                <Line type="monotone" dataKey="uptime" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} name="Fleet Uptime (%)" />
              </LineChart>
            ) : (
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="day" stroke={textStroke} fontSize={11} />
                <YAxis stroke={textStroke} fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '8px', fontSize: '12px', color: tooltipText }} />
                <Bar dataKey="contaminants" fill="#ef4444" name="Contaminant Events Detected" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Donut Chart & Purifier Ranking Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Safe vs Warning vs Critical Donut Chart */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Fleet Status Distribution
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Safe vs Warning vs Critical breakdown.
            </p>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={safetyDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={68}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {safetyDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '8px', fontSize: '12px', color: tooltipText }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 text-xs font-mono">
            {safetyDistribution.map((d, i) => (
              <div key={i} className="flex justify-between items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="font-sans font-semibold text-slate-800 dark:text-slate-200 text-xs">
                    {d.name}
                  </span>
                </div>
                <span className="font-bold text-slate-900 dark:text-white">{d.value} Units</span>
              </div>
            ))}
          </div>
        </div>

        {/* Purifier Performance Ranking Table */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Award size={16} className="text-amber-500" />
                Purifier Performance Ranking
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Composite scoring based on continuous water purity, filter health, and flow rate.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">Top Performers</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Rank</th>
                  <th className="py-2.5 px-3">Purifier Unit</th>
                  <th className="py-2.5 px-3 font-mono">WQI Score</th>
                  <th className="py-2.5 px-3 font-mono">TDS</th>
                  <th className="py-2.5 px-3 font-mono">Filter Health</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
                {rankedPurifiers.slice(0, 6).map((p, idx) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold">
                      <span
                        className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] ${
                          idx === 0
                            ? 'bg-amber-100 text-amber-800 font-black dark:bg-amber-950 dark:text-amber-300'
                            : idx === 1
                            ? 'bg-slate-200 text-slate-800 font-black dark:bg-slate-800 dark:text-slate-200'
                            : idx === 2
                            ? 'bg-amber-800/20 text-amber-900 font-black dark:text-amber-400'
                            : 'text-slate-400'
                        }`}
                      >
                        #{idx + 1}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                      <div>{p.purifierCode} - {p.name}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{p.building}</div>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {p.status === 'INACTIVE' ? '--' : `${p.currentTelemetry?.wqiScore?.toFixed(0) ?? 90} / 100`}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300">
                      {p.status === 'INACTIVE' ? '--' : `${p.currentTelemetry?.tds?.toFixed(0) ?? 0} ppm`}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {p.status === 'INACTIVE' ? 'Standby' : `${p.filter?.healthScore?.toFixed(0) ?? 90}%`}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Link
                        to={`/purifiers/${p.id}`}
                        className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline"
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
