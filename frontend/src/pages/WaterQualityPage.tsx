import React, { useState, useMemo } from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { GaugeChart } from '../components/common/GaugeChart';
import { Link } from 'react-router-dom';
import {
  Activity,
  Droplets,
  Thermometer,
  Wind,
  Scale,
  ArrowRight,
  ShieldCheck,
  Filter,
  RotateCcw,
  Waves,
  Gauge,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

export const WaterQualityPage: React.FC = () => {
  const { purifiers, overview } = useTelemetry();

  // Filters State
  const [selectedPurifier, setSelectedPurifier] = useState('ALL');
  const [selectedBuilding, setSelectedBuilding] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [dateRange, setDateRange] = useState('24h');

  // Extract unique buildings
  const uniqueBuildings = useMemo(() => {
    const set = new Set<string>();
    purifiers.forEach((p) => {
      if (p.building) set.add(p.building);
    });
    return Array.from(set);
  }, [purifiers]);

  // Filtered Purifiers
  const filteredPurifiers = useMemo(() => {
    return purifiers.filter((p) => {
      const matchPurifier = selectedPurifier === 'ALL' || p.id === selectedPurifier || p.purifierCode === selectedPurifier;
      const matchBuilding = selectedBuilding === 'ALL' || p.building === selectedBuilding;
      let matchStatus = true;
      if (selectedStatus === 'SAFE') matchStatus = p.status === 'HEALTHY';
      if (selectedStatus === 'WARNING') matchStatus = p.status === 'WARNING';
      if (selectedStatus === 'CRITICAL') matchStatus = p.status === 'CRITICAL';
      if (selectedStatus === 'INACTIVE') matchStatus = p.status === 'INACTIVE';
      return matchPurifier && matchBuilding && matchStatus;
    });
  }, [purifiers, selectedPurifier, selectedBuilding, selectedStatus]);

  // Compute metrics from active filtered set (fallback if only inactive is selected)
  const activePurifiers = filteredPurifiers.filter((p) => p.status !== 'INACTIVE');
  const calculationSet = activePurifiers.length > 0 ? activePurifiers : filteredPurifiers;
  const count = calculationSet.length || 1;
  const avgWqi = Math.round(calculationSet.reduce((acc, p) => acc + (p.currentTelemetry?.wqiScore || 0), 0) / count);
  const avgPh = Number((calculationSet.reduce((acc, p) => acc + (p.currentTelemetry?.ph || 0), 0) / count).toFixed(1));
  const avgTds = Math.round(calculationSet.reduce((acc, p) => acc + (p.currentTelemetry?.tds || 0), 0) / count);
  const avgTurbidity = Number((calculationSet.reduce((acc, p) => acc + (p.currentTelemetry?.turbidity || 0), 0) / count).toFixed(1));
  const avgTemp = Number((calculationSet.reduce((acc, p) => acc + (p.currentTelemetry?.temperature || 0), 0) / count).toFixed(1));
  const avgFlow = Number((calculationSet.reduce((acc, p) => acc + (p.currentTelemetry?.flowRate || 0), 0) / count).toFixed(2));

  const isAllInactive = calculationSet.every((p) => p.status === 'INACTIVE');
  const wqiStatus = isAllInactive ? 'Standby (Inactive)' : avgWqi >= 85 ? 'Safe' : avgWqi >= 65 ? 'Warning' : 'Critical';

  // Multi-purifier comparison bar data
  const comparisonData = useMemo(() => {
    return filteredPurifiers.map((p) => ({
      code: p.purifierCode + (p.status === 'INACTIVE' ? ' (Inactive)' : ''),
      wqi: p.status === 'INACTIVE' ? 0 : (p.currentTelemetry?.wqiScore || 90),
      tds: p.status === 'INACTIVE' ? 0 : (p.currentTelemetry?.tds || 150),
      turbidity: p.status === 'INACTIVE' ? 0 : (p.currentTelemetry?.turbidity ? p.currentTelemetry.turbidity * 50 : 30),
      ph: p.status === 'INACTIVE' ? 0 : (p.currentTelemetry?.ph ? p.currentTelemetry.ph * 10 : 72),
    }));
  }, [filteredPurifiers]);

  const handleResetFilters = () => {
    setSelectedPurifier('ALL');
    setSelectedBuilding('ALL');
    setSelectedStatus('ALL');
    setDateRange('24h');
  };

  const standards = [
    {
      parameter: 'Total Dissolved Solids (TDS)',
      unit: 'ppm',
      whoLimit: '< 300 ppm (Optimal) / < 500 ppm (Max)',
      fleetAvg: `${avgTds} ppm`,
      status: avgTds <= 300 ? 'EXCELLENT' : avgTds <= 450 ? 'GOOD' : 'CRITICAL',
      weight: '35%',
      significance: 'Measures dissolved minerals and salts. Elevated levels indicate RO membrane saturation.',
    },
    {
      parameter: 'Turbidity (Optical Clarity)',
      unit: 'NTU',
      whoLimit: '< 1.0 NTU (Optimal) / < 5.0 NTU (Max)',
      fleetAvg: `${avgTurbidity} NTU`,
      status: avgTurbidity <= 1.5 ? 'EXCELLENT' : 'WARNING',
      weight: '25%',
      significance: 'Measures suspended particles and colloidal matter. Spikes indicate sediment filter failure.',
    },
    {
      parameter: 'pH Balance (Acidity / Alkalinity)',
      unit: 'pH',
      whoLimit: '6.5 - 8.5 pH (Neutral Safe Range)',
      fleetAvg: `${avgPh} pH`,
      status: avgPh >= 6.5 && avgPh <= 8.5 ? 'EXCELLENT' : 'WARNING',
      weight: '30%',
      significance: 'Chemical balance ensuring optimal potability and preventing pipeline corrosion.',
    },
    {
      parameter: 'Water Temperature',
      unit: '°C',
      whoLimit: '10 - 35 °C (Safe Range)',
      fleetAvg: `${avgTemp} °C`,
      status: 'EXCELLENT',
      weight: '10%',
      significance: 'Affects sensor probe temperature compensation and mineral dissolution rates.',
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          Water Quality Monitoring
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Multi-parameter potability scoring, WHO safety index benchmarks, and cross-machine comparisons.
        </p>
      </div>

      {/* Top Functional Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            {/* Purifier Filter */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                Purifier
              </label>
              <select
                value={selectedPurifier}
                onChange={(e) => setSelectedPurifier(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              >
                <option value="ALL">All Purifiers ({purifiers.length})</option>
                {purifiers.map((p) => (
                  <option key={p.id} value={p.purifierCode}>
                    {p.purifierCode} - {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Building Filter */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                Building
              </label>
              <select
                value={selectedBuilding}
                onChange={(e) => setSelectedBuilding(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              >
                <option value="ALL">All Campus Buildings</option>
                {uniqueBuildings.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                Water Safety Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              >
                <option value="ALL">All Statuses</option>
                <option value="SAFE">Safe Units Only</option>
                <option value="WARNING">Warning Units</option>
                <option value="CRITICAL">Critical Units</option>
                <option value="INACTIVE">Inactive / Offline</option>
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                Date Range
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              >
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleResetFilters}
            className="self-end px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-1 transition-colors border border-transparent hover:border-rose-200"
          >
            <RotateCcw size={13} />
            <span>Reset Filters</span>
          </button>
        </div>
      </div>

      {/* Main Water Quality Score Banner & WHO Standard Model */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col items-center justify-center space-y-3">
          <div className="text-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Water Quality Score
            </span>
            <div className="flex items-baseline justify-center gap-1.5 mt-1">
              <span className="text-4xl font-black text-slate-900 dark:text-white font-mono">
                {avgWqi}
              </span>
              <span className="text-slate-400 text-sm">/ 100</span>
            </div>
            <span
              className={`inline-block mt-1 text-xs font-bold px-3 py-0.5 rounded-full ${
                wqiStatus === 'Safe'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                  : wqiStatus === 'Warning'
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                  : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400'
              }`}
            >
              Status: {wqiStatus}
            </span>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 p-3 rounded-xl text-center text-xs text-slate-500 dark:text-slate-400">
            {wqiStatus === 'Safe'
              ? 'Meets 100% of drinking potability safety standards.'
              : 'Requires filter maintenance attention.'}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 mb-2">
              <Scale size={18} />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Standardized WQI Calculation Model
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
              The Water Quality Index ($WQI$) aggregates continuous sensor data using weighted sub-indices calculated against World Health Organization (WHO) and Bureau of Indian Standards (IS 10500) drinking water limits:
            </p>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 font-mono text-xs text-sky-700 dark:text-sky-300 border border-slate-200 dark:border-slate-700">
              WQI = (0.35 × Q_TDS) + (0.30 × Q_pH) + (0.25 × Q_Turbidity) + (0.10 × Q_Temp)
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-center text-xs">
            <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl">
              <span className="text-[10px] text-slate-400 block font-mono">90 - 100</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">EXCELLENT</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl">
              <span className="text-[10px] text-slate-400 block font-mono">75 - 89</span>
              <span className="font-bold text-sky-600 dark:text-sky-400">GOOD</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl">
              <span className="text-[10px] text-slate-400 block font-mono">50 - 74</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">WARNING</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl">
              <span className="text-[10px] text-slate-400 block font-mono">&lt; 50</span>
              <span className="font-bold text-rose-600 dark:text-rose-400">CRITICAL</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5 Sensor Parameter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="water-card-shine bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">
            <span>pH Balance</span>
            <Gauge size={14} className="text-sky-500 animate-water-float" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">{avgPh} pH</div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">Normal (6.5 - 8.5)</div>
        </div>

        <div className="water-card-shine bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">
            <span>TDS Level</span>
            <Droplets size={14} className="text-cyan-500 animate-water-float" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {avgTds} <span className="text-xs font-normal text-slate-400">ppm</span>
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">Optimal (&lt; 300 ppm)</div>
        </div>

        <div className="water-card-shine bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">
            <span>Turbidity</span>
            <Waves size={14} className="text-teal-500 animate-water-float" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {avgTurbidity} <span className="text-xs font-normal text-slate-400">NTU</span>
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">Clear (&lt; 5.0 NTU)</div>
        </div>

        <div className="water-card-shine bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">
            <span>Temperature</span>
            <Thermometer size={14} className="text-amber-500 animate-water-float" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {avgTemp} <span className="text-xs font-normal text-slate-400">°C</span>
          </div>
          <div className="text-[10px] text-slate-400 font-bold mt-1">Range: 10 - 35°C</div>
        </div>

        <div className="water-card-shine bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs col-span-2 sm:col-span-1 hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">
            <span>Water Flow</span>
            <Activity size={14} className="text-indigo-500 animate-water-float" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {avgFlow} <span className="text-xs font-normal text-slate-400">L/min</span>
          </div>
          <div className="text-[10px] text-sky-600 dark:text-sky-400 font-bold mt-1">Dispense Flow Rate</div>
        </div>
      </div>

      {/* Comparative Multi-Purifier Chart */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Comparative Machine Potability Analysis
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Comparison of WQI score and TDS values across filtered purifiers.
            </p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="code" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="wqi" name="Water Quality Score (WQI)" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="tds" name="TDS (ppm)" fill="#0284c7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* WHO / BIS Standards Reference Table */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Water Quality Benchmark Parameters
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Safe limits and relative scoring weights configured according to WHO and BIS guidelines.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase font-semibold">
              <tr>
                <th className="py-2.5 px-3">Parameter</th>
                <th className="py-2.5 px-3">Safe Standard Limit</th>
                <th className="py-2.5 px-3 font-mono">Fleet Mean</th>
                <th className="py-2.5 px-3 font-mono">Model Weight</th>
                <th className="py-2.5 px-3">Significance</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
              {standards.map((s, i) => (
                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                    {s.parameter}
                  </td>
                  <td className="py-3 px-3 font-mono text-sky-700 dark:text-sky-400 font-medium">
                    {s.whoLimit}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-900 dark:text-white font-bold">
                    {s.fleetAvg}
                  </td>
                  <td className="py-3 px-3 font-mono font-semibold text-purple-600 dark:text-purple-400">
                    {s.weight}
                  </td>
                  <td className="py-3 px-3 text-slate-500 dark:text-slate-400 max-w-xs">
                    {s.significance}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <StatusBadge status={s.status} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
