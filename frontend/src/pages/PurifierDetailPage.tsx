import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTelemetry } from '../context/TelemetryContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../api/client';
import { Purifier, AiDetectionItem } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { GaugeChart } from '../components/common/GaugeChart';
import { PhysicalMirror } from '../components/common/PhysicalMirror';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import {
  ArrowLeft,
  Droplets,
  Activity,
  Gauge,
  Thermometer,
  Wind,
  BrainCircuit,
  Wrench,
  RefreshCw,
  Cpu,
  Sparkles,
  Waves,
  ScanEye,
  Calendar,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

export const PurifierDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { purifiers, alerts } = useTelemetry();
  const { theme } = useTheme();
  const [purifier, setPurifier] = useState<Purifier | null>(null);
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d' | 'custom'>('24h');
  const [customDate, setCustomDate] = useState<string>('2026-09-02');
  const [historyReadings, setHistoryReadings] = useState<any[]>([]);
  const [selectedChart, setSelectedChart] = useState<
    'all' | 'tds' | 'turbidity' | 'flow' | 'ph' | 'temp' | 'filter'
  >('all');
  const [aiDetections, setAiDetections] = useState<AiDetectionItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleData, setScheduleData] = useState({
    type: 'FILTER_REPLACEMENT',
    technician: 'Vedant Bhanarkar',
    notes: 'Preventive membrane servicing based on telemetry trends.',
  });

  const loadData = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const p = await api.getPurifierById(id);
      setPurifier(p);

      const tf = timeframe === 'custom' ? '24h' : timeframe;
      const readings = await api.getPurifierReadings(id, tf as any);
      const formatted = readings.map((r: any) => ({
        ...r,
        formattedTime:
          timeframe === '24h' || timeframe === 'custom'
            ? new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : new Date(r.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' }),
      }));
      setHistoryReadings(formatted);

      // Load AI detections for this purifier
      const allAi = await api.getAiDetections();
      const unitAi = allAi.filter((a) => a.purifierId === p.id || a.purifier?.purifierCode === p.purifierCode);
      setAiDetections(unitAi);
    } catch (err) {
      console.error('Failed to load purifier detail:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id, timeframe]);

  // Sync live readings from context
  useEffect(() => {
    if (!id || !purifier) return;
    const live = purifiers.find((p) => p.id === id || p.purifierCode === id);
    if (live) {
      setPurifier((prev) =>
        prev
          ? {
              ...prev,
              currentTelemetry: live.currentTelemetry,
              status: live.status,
              filter: live.filter,
              device: live.device,
            }
          : null
      );
    }
  }, [purifiers, id]);

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purifier) return;
    try {
      await api.scheduleMaintenance({
        purifierId: purifier.id,
        type: scheduleData.type,
        technician: scheduleData.technician,
        notes: scheduleData.notes,
      });
      setIsScheduleModalOpen(false);
      await loadData();
    } catch (err) {
      console.error('Failed to schedule maintenance:', err);
    }
  };

  if (isLoading && !purifier) {
    return (
      <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
        <RefreshCw size={28} className="animate-spin mx-auto mb-3 text-sky-600 dark:text-sky-400" />
        <p className="text-sm font-semibold text-slate-900 dark:text-white">
          Loading purifier telemetry & historical charts...
        </p>
      </div>
    );
  }

  if (!purifier) {
    return (
      <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
        <p className="text-base font-semibold text-slate-900 dark:text-white">Purifier unit not found.</p>
        <Link to="/purifiers" className="text-sky-600 dark:text-sky-400 text-xs mt-2 inline-block hover:underline">
          &larr; Back to Purifier Fleet
        </Link>
      </div>
    );
  }

  const tel = purifier.currentTelemetry;
  const filter = purifier.filter;
  const analysis = purifier.livePredictiveAnalysis;

  // Filter alerts for this purifier
  const purifierAlerts = alerts.filter(
    (a) => a.purifierId === purifier.id || a.purifier?.purifierCode === purifier.purifierCode
  );

  // Chart styling tokens
  const isDark = theme === 'dark';
  const gridStroke = isDark ? '#334155' : '#e2e8f0';
  const textStroke = isDark ? '#94a3b8' : '#64748b';
  const tooltipBg = isDark ? '#0f172a' : '#ffffff';
  const tooltipBorder = isDark ? '#334155' : '#e2e8f0';
  const tooltipText = isDark ? '#f8fafc' : '#0f172a';

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-start gap-3">
          <Link
            to="/purifiers"
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-xs mt-0.5"
            title="Back to all purifiers"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/80 border border-sky-200 dark:border-sky-800 px-2 py-0.5 rounded-lg">
                {purifier.purifierCode}
              </span>
              {purifier.isPhysicalHardware && (
                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-lg font-medium flex items-center gap-1">
                  <Cpu size={11} /> Raspberry Pi Pico W
                </span>
              )}
              <StatusBadge status={purifier.status} size="sm" showPulse />
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white mt-1">
              {purifier.name}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              📍 {purifier.building} &bull; {purifier.floor} &bull; {purifier.location} &bull; Last Comm: 2 min ago
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsScheduleModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm shadow-sky-600/20"
          >
            <Wrench size={14} />
            <span>Schedule Service</span>
          </button>
        </div>
      </div>

      {/* 2. Sensor Cards (pH, TDS, Turbidity, Temperature, Water Level, Flow Rate, Filter Health) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {/* pH */}
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">
            <span>pH Level</span>
            <Gauge size={14} className="text-sky-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
            {tel.ph.toFixed(2)}
          </div>
          <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {tel.ph >= 6.5 && tel.ph <= 8.5 ? 'Safe (6.5-8.5)' : 'Warning Range'}
          </div>
        </div>

        {/* TDS */}
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">
            <span>TDS</span>
            <Droplets size={14} className="text-cyan-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
            {tel.tds.toFixed(0)} <span className="text-xs font-normal text-slate-400">ppm</span>
          </div>
          <div
            className={`text-[10px] font-bold mt-1 ${
              tel.tds <= 300
                ? 'text-emerald-600 dark:text-emerald-400'
                : tel.tds <= 400
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {tel.tds <= 300 ? 'Safe Potable' : tel.tds <= 400 ? 'Warning' : 'Critical TDS'}
          </div>
        </div>

        {/* Turbidity */}
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">
            <span>Turbidity</span>
            <Waves size={14} className="text-teal-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
            {tel.turbidity.toFixed(2)} <span className="text-xs font-normal text-slate-400">NTU</span>
          </div>
          <div
            className={`text-[10px] font-bold mt-1 ${
              tel.turbidity <= 1.0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
            }`}
          >
            {tel.turbidity <= 1.0 ? 'Clear Standard' : 'Elevated Turbidity'}
          </div>
        </div>

        {/* Temperature */}
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">
            <span>Temperature</span>
            <Thermometer size={14} className="text-amber-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
            {tel.temperature.toFixed(1)} <span className="text-xs font-normal text-slate-400">°C</span>
          </div>
          <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            Nominal Range
          </div>
        </div>

        {/* Water Level */}
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">
            <span>Water Level</span>
            <Activity size={14} className="text-indigo-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
            {tel.waterLevel || 82}%
          </div>
          <div className="text-[10px] font-bold text-sky-600 dark:text-sky-400 mt-1">
            Tank Capacity
          </div>
        </div>

        {/* Filter Health */}
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">
            <span>Filter Health</span>
            <Gauge size={14} className="text-purple-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
            {filter ? `${filter.healthScore.toFixed(0)}%` : 'N/A'}
          </div>
          <div
            className={`text-[10px] font-bold mt-1 ${
              (filter?.healthScore ?? 100) >= 70
                ? 'text-emerald-600 dark:text-emerald-400'
                : (filter?.healthScore ?? 100) >= 35
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {(filter?.healthScore ?? 100) >= 70
              ? 'Healthy'
              : (filter?.healthScore ?? 100) >= 35
              ? 'Replace Soon'
              : 'Critical'}
          </div>
        </div>

        {/* Remaining Life Days */}
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">
            <span>Remaining Life</span>
            <Calendar size={14} className="text-rose-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
            {filter?.estimatedRemainingLifeDays ?? 45} <span className="text-xs font-normal text-slate-400">Days</span>
          </div>
          <div className="text-[10px] font-bold text-sky-600 dark:text-sky-400 mt-1">
            Next Service: {filter?.estimatedRemainingLifeDays && filter.estimatedRemainingLifeDays <= 3 ? 'Immediate' : '~20 Days'}
          </div>
        </div>
      </div>

      {/* 3. Physical Hardware Twin & Water Quality Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <PhysicalMirror
            device={purifier.device}
            telemetry={tel}
            purifierCode={purifier.purifierCode}
            isPhysicalHardware={purifier.isPhysicalHardware}
          />
        </div>

        {/* Water Quality Score Radial Card */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col items-center justify-between">
          <div className="w-full text-center border-b border-slate-100 dark:border-slate-800 pb-2">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Water Quality Index
            </h3>
            <p className="text-[11px] text-slate-400">NSF & WHO Potability Scoring</p>
          </div>

          <div className="my-2">
            <GaugeChart
              value={tel.wqiScore}
              title="Combined Score"
              subtitle={tel.wqiStatus}
              size={160}
              unit="/100"
            />
          </div>

          <div className="w-full text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl text-center leading-relaxed">
            {tel.wqiScore >= 85
              ? 'Optimal drinking water compliance with WHO safety guidelines.'
              : tel.wqiScore >= 65
              ? 'Acceptable potability with early mineral saturation.'
              : 'Sub-standard water safety. Immediate filter overhaul required.'}
          </div>
        </div>
      </div>

      {/* 4. Historical Sensor Charts (pH, TDS, Turbidity, Temp vs Time) */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Historical Sensor Trends
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Interactive time-series curves for pH, TDS, Turbidity, and Temperature.
            </p>
          </div>

          {/* Timeframe Filter Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-mono">
              {(['24h', '7d', '30d'] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                    timeframe === tf
                      ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tf === '24h' ? 'Last 24 Hours' : tf === '7d' ? '7 Days' : '30 Days'}
                </button>
              ))}
              <button
                onClick={() => setTimeframe('custom')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  timeframe === 'custom'
                    ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Custom Date
              </button>
            </div>

            {timeframe === 'custom' && (
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-800 dark:text-slate-200"
              />
            )}
          </div>
        </div>

        {/* Metric Selection Tabs */}
        <div className="flex items-center flex-wrap gap-2 text-xs font-semibold">
          {[
            { id: 'all', label: 'All Parameters' },
            { id: 'ph', label: 'pH vs Time' },
            { id: 'tds', label: 'TDS vs Time (ppm)' },
            { id: 'turbidity', label: 'Turbidity vs Time (NTU)' },
            { id: 'temp', label: 'Temperature vs Time (°C)' },
            { id: 'filter', label: 'Filter Degradation Curve' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedChart(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl border transition-all ${
                selectedChart === tab.id
                  ? 'bg-sky-50 dark:bg-sky-950/80 border-sky-300 dark:border-sky-800 text-sky-700 dark:text-sky-300 font-bold shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Recharts Historical Graph */}
        <div className="h-64 sm:h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {selectedChart === 'tds' ? (
              <AreaChart data={historyReadings}>
                <defs>
                  <linearGradient id="tdsGrad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="formattedTime" stroke={textStroke} fontSize={11} />
                <YAxis stroke={textStroke} fontSize={11} domain={['dataMin - 20', 'dataMax + 20']} />
                <Tooltip contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '8px', fontSize: '12px', color: tooltipText }} />
                <Area type="monotone" dataKey="tds" stroke="#0284c7" strokeWidth={2} fillOpacity={1} fill="url(#tdsGrad2)" name="TDS (ppm)" />
              </AreaChart>
            ) : selectedChart === 'turbidity' ? (
              <LineChart data={historyReadings}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="formattedTime" stroke={textStroke} fontSize={11} />
                <YAxis stroke={textStroke} fontSize={11} domain={[0, 'dataMax + 0.5']} />
                <Tooltip contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '8px', fontSize: '12px', color: tooltipText }} />
                <Line type="monotone" dataKey="turbidity" stroke="#f59e0b" strokeWidth={2} dot={false} name="Turbidity (NTU)" />
              </LineChart>
            ) : selectedChart === 'ph' ? (
              <LineChart data={historyReadings}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="formattedTime" stroke={textStroke} fontSize={11} />
                <YAxis stroke={textStroke} fontSize={11} domain={[6.0, 8.5]} />
                <Tooltip contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '8px', fontSize: '12px', color: tooltipText }} />
                <Line type="monotone" dataKey="ph" stroke="#10b981" strokeWidth={2} dot={false} name="pH Value" />
              </LineChart>
            ) : selectedChart === 'temp' ? (
              <LineChart data={historyReadings}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="formattedTime" stroke={textStroke} fontSize={11} />
                <YAxis stroke={textStroke} fontSize={11} domain={[15, 35]} />
                <Tooltip contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '8px', fontSize: '12px', color: tooltipText }} />
                <Line type="monotone" dataKey="temperature" stroke="#f43f5e" strokeWidth={2} dot={false} name="Temperature (°C)" />
              </LineChart>
            ) : selectedChart === 'filter' ? (
              <LineChart data={historyReadings}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="formattedTime" stroke={textStroke} fontSize={11} />
                <YAxis stroke={textStroke} fontSize={11} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '8px', fontSize: '12px', color: tooltipText }} />
                <Line type="monotone" dataKey="filterHealth" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Filter Health (%)" />
              </LineChart>
            ) : (
              <LineChart data={historyReadings}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="formattedTime" stroke={textStroke} fontSize={11} />
                <YAxis stroke={textStroke} fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '8px', fontSize: '12px', color: tooltipText }} />
                <Line type="monotone" dataKey="wqiScore" stroke="#10b981" strokeWidth={2} dot={false} name="WQI Score (0-100)" />
                <Line type="monotone" dataKey="tds" stroke="#0284c7" strokeWidth={1.5} dot={false} name="TDS (ppm)" />
                <Line type="monotone" dataKey="flowRate" stroke="#0ea5e9" strokeWidth={1.5} dot={false} name="Flow Rate (L/min)" />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. Recent Alerts & AI Detections for this unit */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Recent Alerts */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active Unit Alerts</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {purifierAlerts.length} logged
            </span>
          </div>

          <div className="space-y-2.5">
            {purifierAlerts.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No active safety warnings on this machine.
              </div>
            ) : (
              purifierAlerts.map((a) => (
                <div
                  key={a.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs"
                >
                  <div className="font-bold text-slate-900 dark:text-white">{a.title}</div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{a.message}</p>
                  <div className="mt-1 text-[10px] text-sky-600 dark:text-sky-400 font-medium">
                    Rec: {a.recommendation}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* AI Contaminant Vision Detections for this unit */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <ScanEye size={16} className="text-sky-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent AI Detections</h3>
            </div>
            <Link to="/ai-detection" className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline">
              AI Vision Page
            </Link>
          </div>

          <div className="space-y-2.5">
            {aiDetections.length === 0 ? (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-500 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500" />
                <span>Water optical clarity verified clean (98.7% confidence).</span>
              </div>
            ) : (
              aiDetections.slice(0, 2).map((ai) => (
                <div
                  key={ai.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      {ai.detectedObject} Detected
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Confidence: {ai.confidence}% &bull; Risk: {ai.riskLevel}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                    {ai.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Schedule Maintenance Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 max-w-md w-full p-6 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Wrench size={16} className="text-sky-600 dark:text-sky-400" />
                Schedule Maintenance Service
              </h3>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Purifier Unit
                </label>
                <input
                  type="text"
                  readOnly
                  value={`${purifier.purifierCode} - ${purifier.name}`}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Service Type
                </label>
                <select
                  value={scheduleData.type}
                  onChange={(e) => setScheduleData({ ...scheduleData, type: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                >
                  <option value="FILTER_REPLACEMENT">Filter Cartridge & RO Replacement</option>
                  <option value="MEMBRANE_FLUSH">Membrane Flush & Sanitization</option>
                  <option value="ROUTINE_CHECKUP">Routine Diagnostic Checkup</option>
                  <option value="SENSOR_CALIBRATION">Sensor Probe Calibration</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Assigned Technician
                </label>
                <input
                  type="text"
                  required
                  value={scheduleData.technician}
                  onChange={(e) => setScheduleData({ ...scheduleData, technician: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Work Order Notes
                </label>
                <textarea
                  rows={3}
                  value={scheduleData.notes}
                  onChange={(e) => setScheduleData({ ...scheduleData, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold"
                >
                  Confirm Work Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
