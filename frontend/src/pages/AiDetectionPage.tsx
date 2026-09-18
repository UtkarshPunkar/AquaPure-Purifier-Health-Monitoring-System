import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../api/client';
import { AiDetectionItem, Purifier } from '../types';
import {
  ScanEye,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Camera,
  Play,
  RotateCcw,
  Sparkles,
  Search,
  Filter,
  Layers,
  X,
  Radio,
  WifiOff,
  Maximize2,
  RefreshCw,
  Check,
  Globe,
  HelpCircle,
  ShieldCheck,
  Loader2,
} from 'lucide-react';

export const AiDetectionPage: React.FC = () => {
  const [detections, setDetections] = useState<AiDetectionItem[]>([]);
  const [purifiers, setPurifiers] = useState<Purifier[]>([]);
  const [selectedDetection, setSelectedDetection] = useState<AiDetectionItem | null>(null);
  const [viewMode, setViewMode] = useState<'SNAPSHOT' | 'LIVE'>('SNAPSHOT');
  const [filterRisk, setFilterRisk] = useState<string>('ALL');
  const [filterPurifier, setFilterPurifier] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isCameraOnline, setIsCameraOnline] = useState<boolean>(false);
  const [selectedPurifierId, setSelectedPurifierId] = useState<string>('');
  const [cameraIp, setCameraIp] = useState<string>('192.168.4.1');
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [connectMessage, setConnectMessage] = useState<string | null>(null);
  const [streamKey, setStreamKey] = useState<number>(Date.now());
  const [isStreamStalled, setIsStreamStalled] = useState<boolean>(false);

  const failedProbesRef = useRef<number>(0);

  const fetchData = async () => {
    try {
      const [detList, purList] = await Promise.all([
        api.getAiDetections(),
        api.getPurifiers(),
      ]);
      setDetections(detList);
      setPurifiers(purList);
      if (purList.length > 0 && !selectedPurifierId) {
        setSelectedPurifierId(purList[0].id);
      }
    } catch (err) {
      console.error('Failed to load AI detections:', err);
    }
  };

  const probeCamera = async () => {
    try {
      const status = await api.getCameraStatus('ESP32-CAM-1');
      if (status.isOnline) {
        failedProbesRef.current = 0;
        setIsCameraOnline(true);
      } else {
        failedProbesRef.current += 1;
        // Require 3 consecutive failed probes before flipping offline (anti-fluctuation smoothing)
        if (failedProbesRef.current >= 3) {
          setIsCameraOnline(false);
        }
      }

      if (status.streamUrl) {
        const match = status.streamUrl.match(/\/\/([^/:]+)/);
        if (match && match[1]) {
          setCameraIp(match[1]);
        }
      }
    } catch {
      failedProbesRef.current += 1;
      if (failedProbesRef.current >= 3) {
        setIsCameraOnline(false);
      }
    }
  };

  useEffect(() => {
    fetchData();
    probeCamera();

    // 7-second status health heartbeat to avoid flooding the single-threaded ESP32
    const timer = setInterval(() => {
      probeCamera();
    }, 7000);

    return () => clearInterval(timer);
  }, []);

  const handleConnectCamera = async (targetIp?: string) => {
    const ipToUse = targetIp || cameraIp;
    try {
      setIsConnecting(true);
      setConnectMessage('Connecting & testing stream...');
      const res = await api.updateCameraConfig({
        deviceId: 'ESP32-CAM-1',
        ipAddress: ipToUse,
      });
      failedProbesRef.current = 0;
      setIsCameraOnline(res.isOnline);
      if (res.isOnline) {
        setConnectMessage(`Connected to ESP32-CAM at ${ipToUse}! Live feed active.`);
        setStreamKey(Date.now());
      } else {
        setConnectMessage(`Camera IP saved. Waiting for ESP32-CAM at ${ipToUse} to respond...`);
      }
    } catch (err: any) {
      setConnectMessage('Connection test failed. Check power & Wi-Fi.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleRefreshStream = () => {
    setStreamKey(Date.now());
    setIsStreamStalled(false);
    failedProbesRef.current = 0;
    probeCamera();
  };

  const handleRunScan = async (sampleType?: string) => {
    if (!selectedPurifierId) return;
    try {
      setIsScanning(true);
      const res = await api.runAiScan(selectedPurifierId, sampleType);
      if (res.scanResult) {
        setDetections((prev) => [res.scanResult, ...prev]);
        setSelectedDetection(res.scanResult);
        setViewMode('SNAPSHOT');
      }
    } catch (err) {
      console.error('Scan execution error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const filteredDetections = detections.filter((d) => {
    const matchesRisk = filterRisk === 'ALL' || d.riskLevel === filterRisk;
    const matchesPurifier = filterPurifier === 'ALL' || d.purifierId === filterPurifier || d.purifier?.purifierCode === filterPurifier;
    const matchesSearch =
      searchQuery === '' ||
      d.detectedObject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.purifier?.name && d.purifier.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (d.purifier?.purifierCode && d.purifier.purifierCode.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesRisk && matchesPurifier && matchesSearch;
  });

  const streamSrc = `/api/camera/stream/ESP32-CAM-1?t=${streamKey}`;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header */}
      <div className="border-b app-divider pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight app-heading flex items-center gap-2">
            <ScanEye className="text-sky-600 dark:text-sky-400" size={24} />
            AI Contaminant Vision & Optical Inspection
          </h1>
        </div>

        {/* Live Camera Node Indicator & Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefreshStream}
            className="secondary-button text-xs flex items-center gap-1.5 py-1.5 px-3"
            title="Refresh stream connection"
          >
            <RefreshCw size={13} />
            <span>Refresh Stream</span>
          </button>

          {isCameraOnline ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              ESP32-CAM LIVE ONLINE
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-3 py-1 rounded-full">
              <WifiOff size={13} />
              STANDBY / READY TO CONNECT
            </span>
          )}
        </div>
      </div>

      {/* 2. ESP32-CAM Connection & IP Configuration Bar */}
      <div className={`app-card p-4 space-y-3 transition-all ${!isCameraOnline ? 'block' : 'hidden'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b app-divider pb-2.5">
          <div className="flex items-center gap-2">
            <Camera size={16} className="text-sky-600 dark:text-sky-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider app-heading">
              ESP32-CAM Hardware Network Link (AI-Thinker OV2640)
            </h3>
          </div>
          <div className="text-[11px] app-muted flex items-center gap-2">
            <span>Default AP: <code className="font-mono text-sky-600 dark:text-sky-400 font-bold">192.168.4.1</code></span>
            <span>&bull;</span>
            <span>Wi-Fi SSID: <code className="font-mono text-slate-700 dark:text-slate-300 font-semibold">AquaPure-CAM</code></span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-5 flex items-center gap-2">
            <label className="text-xs font-semibold app-muted whitespace-nowrap">Camera IP:</label>
            <input
              type="text"
              value={cameraIp}
              onChange={(e) => setCameraIp(e.target.value)}
              placeholder="e.g. 192.168.4.1 or 192.168.43.50"
              className="app-input text-xs font-mono py-1.5 px-3 flex-1"
            />
          </div>

          <div className="md:col-span-7 flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleConnectCamera()}
              disabled={isConnecting}
              className="primary-button text-xs py-1.5 px-3.5 flex items-center gap-1.5"
            >
              <RefreshCw size={13} className={isConnecting ? 'animate-spin' : ''} />
              <span>{isConnecting ? 'Connecting...' : 'Connect Camera'}</span>
            </button>

            <button
              onClick={() => handleConnectCamera('192.168.4.1')}
              disabled={isConnecting}
              className="secondary-button text-xs py-1.5 px-3 flex items-center gap-1"
              title="Quick connect to default ESP32-CAM AP address"
            >
              <span>192.168.4.1 (AP Mode)</span>
            </button>
          </div>
        </div>

        {connectMessage && (
          <div className="text-[11px] font-mono px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 flex items-center gap-2 animate-in fade-in">
            <Radio size={12} className="text-sky-500 animate-pulse" />
            <span>{connectMessage}</span>
          </div>
        )}
      </div>

      {/* 3. Top Banner: Live Camera Optical Inspection & Quick Scan Station */}
      <div className="app-card p-5 space-y-3">
        <div className="flex items-center justify-between border-b app-divider pb-2.5">
          <div className="flex items-center gap-2">
            <Camera size={16} className="text-sky-600 dark:text-sky-400" />
            <h3 className="text-sm font-bold app-heading">ESP32-CAM Live Optical Inspection Feed</h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">Target: WP-1 (EMTech 2nd Floor)</span>
        </div>

        <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center shadow-inner group">
          {isCameraOnline ? (
            <>
              {/* Live MJPEG Stream Element */}
              <img
                key={`stream-${streamKey}`}
                src={streamSrc}
                alt="Live ESP32-CAM Optical Stream"
                onLoad={() => setIsStreamStalled(false)}
                onError={() => {
                  setIsStreamStalled(true);
                }}
                className="w-full h-full object-contain bg-black"
              />

              {/* Stalled Recovery Overlay */}
              {isStreamStalled && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center pointer-events-none">
                  <div className="bg-slate-900/90 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-mono text-amber-300 flex items-center gap-2 shadow-lg">
                    <Loader2 size={13} className="animate-spin text-amber-400" />
                    <span>Synchronizing live feed...</span>
                  </div>
                </div>
              )}

              {/* Top Overlay HUD */}
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 text-[10px] font-mono text-white flex items-center gap-1.5 pointer-events-none">
                <Radio size={11} className="text-rose-500 animate-pulse" />
                <span className="font-bold text-rose-400">LIVE FEED</span>
                <span className="text-white/40">|</span>
                <span>640x480 VGA</span>
                <span className="text-white/40">|</span>
                <span className="text-sky-400 font-semibold">{cameraIp}</span>
              </div>

              <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 text-[10px] font-mono text-emerald-400 flex items-center gap-1 pointer-events-none">
                <ShieldCheck size={12} />
                <span>Optical Sensor Active</span>
              </div>

              {/* Bottom Overlay HUD */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                <div className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 text-[10px] font-mono text-slate-300">
                  Endpoint: <code className="text-sky-300">/api/camera/stream</code>
                </div>
                <div className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 text-[10px] font-mono text-slate-400">
                  {new Date().toLocaleTimeString()}
                </div>
              </div>
            </>
          ) : (
            /* Offline Guidance Display */
            <div className="p-6 text-center text-slate-400 space-y-3 max-w-md">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <Camera size={26} className="text-sky-500" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">ESP32-CAM Ready to Connect</div>
                <p className="text-xs text-slate-400 mt-1">
                  Connect your computer to Wi-Fi <strong>AquaPure-CAM</strong> (or local hotspot) and click Connect below.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <button
                  onClick={() => handleConnectCamera('192.168.4.1')}
                  disabled={isConnecting}
                  className="primary-button text-xs py-1.5 px-3.5 flex items-center gap-1.5 shadow-md"
                >
                  <RefreshCw size={12} className={isConnecting ? 'animate-spin' : ''} />
                  <span>Connect to 192.168.4.1</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2">
            <select
              value={selectedPurifierId}
              onChange={(e) => setSelectedPurifierId(e.target.value)}
              className="app-input text-xs font-semibold py-1.5 px-3"
            >
              {purifiers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.purifierCode} &mdash; {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleRefreshStream}
              className="secondary-button text-xs py-1.5 px-3 flex items-center gap-1"
              title="Refresh live video stream"
            >
              <RefreshCw size={13} />
              <span>Refresh Stream</span>
            </button>

            <button
              onClick={() => handleRunScan()}
              disabled={isScanning}
              className="primary-button text-xs py-1.5 px-4 flex items-center gap-1.5 shadow-md bg-sky-600 hover:bg-sky-500 text-white font-bold"
              title="Capture live frame from camera and run dynamic AI computer vision scan"
            >
              <ScanEye size={14} className={isScanning ? 'animate-spin' : ''} />
              <span>{isScanning ? 'Analyzing Optical Clarity...' : 'Capture & Run AI Vision Scan'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Filter & Search Controls */}
      <div className="app-card p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-2.5 app-muted" />
          <input
            type="text"
            placeholder="Search contaminant class or unit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="app-input pl-9 text-xs w-full py-1.5"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
            className="app-input text-xs font-semibold py-1.5 px-3 flex-1 sm:flex-initial"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="SAFE">Safe / Clean</option>
            <option value="WARNING">Warning</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>
      </div>

      {/* 5. Inspection History Log Table */}
      <div className="app-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b app-divider bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Purifier Unit</th>
                <th className="py-3 px-4">Captured Image</th>
                <th className="py-3 px-4">Detected Object</th>
                <th className="py-3 px-4">Confidence</th>
                <th className="py-3 px-4">Risk Level</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredDetections.map((d) => {
                const isSafe = d.riskLevel === 'SAFE';
                const isWarn = d.riskLevel === 'WARNING';
                const isCrit = d.riskLevel === 'CRITICAL';

                return (
                  <tr
                    key={d.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedDetection(d);
                      setViewMode('SNAPSHOT');
                    }}
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
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
                        {d.purifier?.purifierCode || 'WP-1'}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {d.purifier?.name || 'Purifier Station'}
                      </div>
                    </td>

                    {/* Captured Image Thumbnail */}
                    <td className="py-3.5 px-4">
                      <div className="h-12 w-16 rounded-lg bg-slate-900 relative overflow-hidden border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-400 group shadow-xs">
                        <img
                          src={d.capturedImageUrl || `/api/camera/snapshot-image/${d.id}`}
                          alt={d.detectedObject}
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                        {d.boundingBoxes && d.boundingBoxes.length > 0 ? (
                          d.boundingBoxes.map((b, i) => (
                            <div
                              key={i}
                              style={{
                                left: `${(b.x / 640) * 100}%`,
                                top: `${(b.y / 480) * 100}%`,
                                width: `${Math.max(15, (b.w / 640) * 100)}%`,
                                height: `${Math.max(15, (b.h / 480) * 100)}%`,
                              }}
                              className={`absolute border border-dashed rounded pointer-events-none ${
                                d.riskLevel === 'CRITICAL'
                                  ? 'border-rose-500 bg-rose-500/20'
                                  : d.riskLevel === 'WARNING'
                                  ? 'border-amber-500 bg-amber-500/20'
                                  : 'border-emerald-500 bg-emerald-500/20'
                              }`}
                            />
                          ))
                        ) : null}
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
                          setViewMode('SNAPSHOT');
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

      {/* 6. View Details Modal with Real Captured Frame & Live Feed Toggle */}
      {selectedDetection &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div className="flex items-center gap-2">
                  <ScanEye size={18} className="text-sky-600 dark:text-sky-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    AI Optical Contaminant Inspection Detail
                  </h3>
                </div>

                {/* View Switcher Pill */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[11px]">
                  <button
                    onClick={() => setViewMode('SNAPSHOT')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                      viewMode === 'SNAPSHOT'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    Captured Frame
                  </button>
                  <button
                    onClick={() => setViewMode('LIVE')}
                    className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1 transition-all ${
                      viewMode === 'LIVE'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    {isCameraOnline && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                    Live Camera
                  </button>
                </div>

                <button
                  onClick={() => setSelectedDetection(null)}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-white ml-2"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
                {/* High-Res Image Canvas */}
                <div className="relative w-full aspect-video rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center shadow-inner">
                  {viewMode === 'LIVE' ? (
                    isCameraOnline ? (
                      <>
                        <img
                          key={`modal-stream-${streamKey}`}
                          src={streamSrc}
                          alt="ESP32-CAM Live Feed"
                          className="w-full h-full object-contain bg-black"
                        />
                        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 text-[10px] font-mono text-white flex items-center gap-1.5">
                          <Radio size={11} className="text-rose-500 animate-pulse" />
                          <span className="font-bold text-rose-400">LIVE FEED</span>
                          <span className="text-white/40">|</span>
                          <span>640x480 VGA</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-6 text-slate-400 space-y-3">
                        <WifiOff size={28} className="mx-auto text-slate-500" />
                        <div className="text-xs font-bold text-white">ESP32-CAM Ready to Stream</div>
                        <p className="text-[11px] text-slate-400 max-w-sm">
                          Connect to Wi-Fi <strong>AquaPure-CAM</strong> (or your hotspot) to activate live stream.
                        </p>
                        <button
                          onClick={() => handleConnectCamera('192.168.4.1')}
                          className="primary-button text-xs py-1.5 px-3"
                        >
                          Connect to 192.168.4.1
                        </button>
                      </div>
                    )
                  ) : (
                    /* Captured Snapshot View */
                    <>
                      <img
                        src={selectedDetection.capturedImageUrl || `/api/camera/snapshot-image/${selectedDetection.id}`}
                        alt={selectedDetection.detectedObject}
                        className="w-full h-full object-contain bg-black"
                      />

                      {/* AI Dynamic Bounding Box Overlay if Detected */}
                      {selectedDetection.boundingBoxes && selectedDetection.boundingBoxes.length > 0 ? (
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                          {selectedDetection.boundingBoxes.map((box, bIdx) => {
                            const isCrit = selectedDetection.riskLevel === 'CRITICAL';
                            const isWarn = selectedDetection.riskLevel === 'WARNING';
                            const leftPct = (box.x / 640) * 100;
                            const topPct = (box.y / 480) * 100;
                            const widthPct = (box.w / 640) * 100;
                            const heightPct = (box.h / 480) * 100;

                            return (
                              <div
                                key={bIdx}
                                style={{
                                  left: `${Math.max(0, Math.min(92, leftPct))}%`,
                                  top: `${Math.max(0, Math.min(92, topPct))}%`,
                                  width: `${Math.max(10, Math.min(100 - leftPct, widthPct))}%`,
                                  height: `${Math.max(10, Math.min(100 - topPct, heightPct))}%`,
                                }}
                                className={`absolute border-2 ${
                                  isCrit
                                    ? 'border-rose-500 bg-rose-500/20 shadow-lg shadow-rose-500/40'
                                    : isWarn
                                    ? 'border-amber-500 bg-amber-500/20 shadow-lg shadow-amber-500/40'
                                    : 'border-emerald-500 bg-emerald-500/20 shadow-lg shadow-emerald-500/40'
                                } rounded-lg flex flex-col justify-between p-1.5 animate-pulse`}
                              >
                                <div className="flex items-center gap-1 self-start">
                                  <span
                                    className={`text-[10px] font-mono font-bold text-white px-2 py-0.5 rounded shadow-xs ${
                                      isCrit ? 'bg-rose-600' : isWarn ? 'bg-amber-600' : 'bg-emerald-600'
                                    }`}
                                  >
                                    {box.label || `${selectedDetection.detectedObject} (${selectedDetection.confidence.toFixed(1)}%)`}
                                  </span>
                                </div>
                                <span className="text-[9px] font-mono text-white/90 bg-black/70 px-1.5 py-0.5 rounded self-end">
                                  [{Math.round(box.w)}x{Math.round(box.h)}px]
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="absolute bottom-3 left-3 z-10 bg-emerald-950/80 backdrop-blur-md border border-emerald-700/60 px-3 py-1.5 rounded-lg flex items-center gap-2 text-emerald-400 text-xs font-bold">
                          <CheckCircle2 size={16} />
                          <span>Optical Clarity Verified (100% Potable Baseline)</span>
                        </div>
                      )}
                    </>
                  )}

                  {/* Top overlay badge */}
                  <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md bg-slate-900/80 backdrop-blur-md text-[10px] font-mono text-slate-300 border border-slate-700">
                      Resolution: 640x480 VGA
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
                      {selectedDetection.purifier?.purifierCode || 'WP-1'}
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

              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between shrink-0">
                <button
                  onClick={() => handleRunScan()}
                  disabled={isScanning}
                  className="secondary-button text-xs py-2 px-3 flex items-center gap-1.5"
                >
                  <ScanEye size={13} className={isScanning ? 'animate-spin' : ''} />
                  <span>Run New Scan</span>
                </button>

                <button
                  onClick={() => setSelectedDetection(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
