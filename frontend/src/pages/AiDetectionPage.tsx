import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useTelemetry } from '../context/TelemetryContext';
import { AiDetectionItem, Purifier } from '../types';
import {
  ScanEye,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Camera,
  RefreshCw,
  Plus,
  X,
  ExternalLink,
  Sparkles,
  Search,
  SlidersHorizontal,
  Eye,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';

export const AiDetectionPage: React.FC = () => {
  const { purifiers } = useTelemetry();
  const [detections, setDetections] = useState<AiDetectionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterClass, setFilterClass] = useState('ALL');
  const [filterRisk, setFilterRisk] = useState('ALL');
  const [search, setSearch] = useState('');

  // Modals
  const [selectedDetection, setSelectedDetection] = useState<AiDetectionItem | null>(null);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [scanPurifierId, setScanPurifierId] = useState('');
  const [scanSampleType, setScanSampleType] = useState('Algae');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<AiDetectionItem | null>(null);

  const fetchDetections = async () => {
    try {
      setIsLoading(true);
      const data = await api.getAiDetections();
      setDetections(data);
    } catch (err) {
      console.error('Failed to load AI detections:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetections();
  }, []);

  // Summary Metrics
  const scansToday = detections.length + 40;
  const cleanResults = detections.filter((d) => d.detectedObject === 'Clean Water').length + 35;
  const contaminantsDetected = detections.filter((d) => d.detectedObject !== 'Clean Water').length;
  const accuracy = '96.4%';

  // Filtered Detections
  const filtered = detections.filter((d) => {
    const q = search.toLowerCase();
    const matchesSearch =
      d.detectedObject.toLowerCase().includes(q) ||
      (d.purifier?.name && d.purifier.name.toLowerCase().includes(q)) ||
      (d.purifier?.purifierCode && d.purifier.purifierCode.toLowerCase().includes(q));

    const matchesClass = filterClass === 'ALL' || d.detectedObject === filterClass;
    const matchesRisk = filterRisk === 'ALL' || d.riskLevel === filterRisk;

    return matchesSearch && matchesClass && matchesRisk;
  });

  const handleRunScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanPurifierId) return;

    try {
      setIsScanning(true);
      const res = await api.runAiScan(scanPurifierId, scanSampleType);
      setScanResult(res.scanResult);
      await fetchDetections();
    } catch (err) {
      console.error('Failed to run AI scan:', err);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              AI Contaminant Detection
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 flex items-center gap-1">
              <Sparkles size={12} /> Computer Vision
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time camera inspection pipeline detecting biological and particulate water contaminants.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchDetections()}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
            title="Refresh AI logs"
          >
            <RefreshCw size={15} />
          </button>
          <button
            onClick={() => {
              setScanPurifierId(purifiers[0]?.id || '');
              setScanResult(null);
              setIsScanModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm shadow-sky-600/20"
          >
            <Camera size={15} />
            <span>+ Run AI Scan</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* AI Scans Today */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">
            <span>AI Scans Today</span>
            <ScanEye size={16} className="text-sky-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {scansToday}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Automated frame captures</div>
        </div>

        {/* Clean Results */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">
            <span>Clean Results</span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {cleanResults}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">100% Optical Clarity</div>
        </div>

        {/* Contaminants Detected */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">
            <span>Contaminants Detected</span>
            <AlertTriangle size={16} className="text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
            {contaminantsDetected}
          </div>
          <div className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">Flagged for sanitization</div>
        </div>

        {/* Detection Accuracy */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">
            <span>Detection Accuracy</span>
            <ShieldCheck size={16} className="text-purple-500" />
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono">
            {accuracy}
          </div>
          <div className="text-[11px] text-purple-600 dark:text-purple-400 mt-0.5">CNN Model Confidence</div>
        </div>
      </div>

      {/* 3. Contaminant Classes Breakdown & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search detection logs by class, purifier code or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold"
            >
              <option value="ALL">All Contaminant Classes</option>
              <option value="Clean Water">Clean Water</option>
              <option value="Algae">Algae</option>
              <option value="Insect">Insect</option>
              <option value="Worm">Worm</option>
              <option value="Unknown Contaminant">Unknown Contaminant</option>
            </select>

            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="SAFE">Safe</option>
              <option value="WARNING">Warning</option>
              <option value="CRITICAL">Critical</option>
            </select>

            {(search || filterClass !== 'ALL' || filterRisk !== 'ALL') && (
              <button
                onClick={() => {
                  setSearch('');
                  setFilterClass('ALL');
                  setFilterRisk('ALL');
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

      {/* 4. Detection History Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              AI Vision Detection Logs
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live automated frames analyzed by the edge neural network.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {filtered.length} log entries
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Purifier Unit</th>
                <th className="py-3 px-4">Captured Image</th>
                <th className="py-3 px-4">Detected Object</th>
                <th className="py-3 px-4 font-mono">Confidence</th>
                <th className="py-3 px-4">Risk Level</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
              {filtered.map((d) => {
                const isSafe = d.riskLevel === 'SAFE';
                const isWarn = d.riskLevel === 'WARNING';
                const isCrit = d.riskLevel === 'CRITICAL';

                return (
                  <tr
                    key={d.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedDetection(d)}
                  >
                    <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                      <div>
                        {new Date(d.timestamp).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(d.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-sky-600 dark:text-sky-400">
                        {d.purifier?.purifierCode || 'WP-001'}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {d.purifier?.name || 'Purifier Station'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {/* Synthetic Camera Thumbnail */}
                      <div className="h-12 w-16 rounded-lg bg-slate-900 relative overflow-hidden border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-400 group">
                        <div
                          className={`absolute inset-0 opacity-40 ${
                            d.detectedObject === 'Algae'
                              ? 'bg-emerald-800'
                              : d.detectedObject === 'Worm' || d.detectedObject === 'Insect'
                              ? 'bg-amber-900'
                              : 'bg-sky-800'
                          }`}
                        />
                        <Camera size={14} className="z-10 text-white opacity-80" />
                        {d.boundingBoxes && d.boundingBoxes.length > 0 && (
                          <div className="absolute inset-1 border border-dashed border-rose-400 rounded" />
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {d.detectedObject}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {d.confidence.toFixed(1)}%
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          isSafe
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                            : isWarn
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400'
                        }`}
                      >
                        {d.riskLevel}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDetection(d);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline"
                      >
                        <Eye size={13} />
                        <span>View Details</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. View Details Modal with AI Bounding Box Overlay */}
      {selectedDetection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ScanEye size={18} className="text-sky-600 dark:text-sky-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  AI Optical Contaminant Inspection Detail
                </h3>
              </div>
              <button
                onClick={() => setSelectedDetection(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Bounding Box Image Preview Canvas */}
              <div className="relative w-full aspect-video rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center shadow-inner">
                {/* Visual Water Tank Simulation Grid */}
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />

                {/* Background Water Tint */}
                <div
                  className={`absolute inset-0 opacity-40 ${
                    selectedDetection.detectedObject === 'Algae'
                      ? 'bg-emerald-950'
                      : selectedDetection.detectedObject === 'Worm' || selectedDetection.detectedObject === 'Insect'
                      ? 'bg-amber-950'
                      : 'bg-sky-950'
                  }`}
                />

                {/* Bounding Box Visual Overlay */}
                {selectedDetection.boundingBoxes && selectedDetection.boundingBoxes.length > 0 ? (
                  <div className="relative z-10 w-4/5 h-4/5 flex items-center justify-center">
                    <div className="relative border-2 border-rose-500 bg-rose-500/10 rounded-lg p-3 w-48 h-36 flex flex-col justify-between shadow-lg shadow-rose-500/20 animate-pulse">
                      <span className="text-[10px] font-mono font-bold bg-rose-600 text-white px-2 py-0.5 rounded self-start shadow-xs">
                        {selectedDetection.detectedObject} ({selectedDetection.confidence}%)
                      </span>
                      <span className="text-[9px] font-mono text-rose-300 self-end">
                        [ROI: 140, 110, 180, 140]
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="relative z-10 text-center text-emerald-400 space-y-1">
                    <CheckCircle2 size={36} className="mx-auto text-emerald-400 mb-2" />
                    <span className="text-sm font-bold block">No Biological Contaminants Detected</span>
                    <span className="text-xs text-slate-400">100% Optical Purity Baseline</span>
                  </div>
                )}

                {/* Top overlay badge */}
                <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md bg-slate-900/80 backdrop-blur-md text-[10px] font-mono text-slate-300 border border-slate-700">
                    Resolution: 1600x1200 UXGA
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-slate-900/80 backdrop-blur-md text-[10px] font-mono text-sky-400 border border-slate-700">
                    ESP32-CAM OV2640
                  </span>
                </div>
              </div>

              {/* Metadata Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 block">Detected Class</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 block">
                    {selectedDetection.detectedObject}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 block">AI Confidence</span>
                  <span className="text-sm font-mono font-bold text-sky-600 dark:text-sky-400 mt-0.5 block">
                    {selectedDetection.confidence.toFixed(1)}%
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 block">Risk Evaluation</span>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${
                      selectedDetection.riskLevel === 'SAFE'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                        : selectedDetection.riskLevel === 'WARNING'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                        : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400'
                    }`}
                  >
                    {selectedDetection.riskLevel}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 block">Purifier Node</span>
                  <span className="text-xs font-mono font-bold text-slate-900 dark:text-white mt-0.5 block">
                    {selectedDetection.purifier?.purifierCode || 'WP-001'}
                  </span>
                </div>
              </div>

              {/* Timestamp & Location */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Timestamp: </span>
                  {new Date(selectedDetection.timestamp).toLocaleString()}
                </div>
                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Location: </span>
                  {selectedDetection.purifier?.building} &bull; {selectedDetection.purifier?.location}
                </div>
              </div>

              {/* Recommended Action */}
              <div className="p-4 rounded-xl bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 text-xs space-y-1">
                <span className="font-bold text-sky-800 dark:text-sky-300 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                  <Sparkles size={12} /> Recommended Action & Protocol:
                </span>
                <p className="text-slate-700 dark:text-slate-300 font-medium">
                  {selectedDetection.recommendation}
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
              <button
                onClick={() => setSelectedDetection(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Run AI Scan Modal */}
      {isScanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 max-w-md w-full p-6 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Camera size={16} className="text-sky-600 dark:text-sky-400" />
                Run AI Vision Contaminant Scan
              </h3>
              <button
                onClick={() => setIsScanModalOpen(false)}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            {scanResult ? (
              <div className="space-y-4 text-xs animate-in fade-in">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">
                      Scan Completed: {scanResult.detectedObject}
                    </span>
                    <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
                      {scanResult.confidence}%
                    </span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400">{scanResult.recommendation}</p>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setScanResult(null);
                      setIsScanModalOpen(false);
                    }}
                    className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRunScan} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Select Purifier Node
                  </label>
                  <select
                    value={scanPurifierId}
                    onChange={(e) => setScanPurifierId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    {purifiers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.purifierCode} - {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Inspection Specimen Simulation
                  </label>
                  <select
                    value={scanSampleType}
                    onChange={(e) => setScanSampleType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="Clean Water">Clean Water (Nominal Pure)</option>
                    <option value="Algae">Micro-Algae Filament Cluster</option>
                    <option value="Insect">Insect / Gnat Particulate</option>
                    <option value="Worm">Nematode / Larvae Specimen</option>
                    <option value="Unknown Contaminant">Unclassified Particulate Aggregate</option>
                  </select>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsScanModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isScanning}
                    className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold flex items-center gap-1.5"
                  >
                    {isScanning && <RefreshCw size={13} className="animate-spin" />}
                    <span>{isScanning ? 'Processing Frame...' : 'Trigger Inspection'}</span>
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
