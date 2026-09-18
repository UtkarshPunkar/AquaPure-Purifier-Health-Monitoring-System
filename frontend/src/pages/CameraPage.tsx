import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';
import { CameraDeviceInfo } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  Camera,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Wifi,
  WifiOff,
  Sliders,
  Play,
  Pause,
  Maximize2,
  ShieldCheck,
  Radio,
} from 'lucide-react';

export const CameraPage: React.FC = () => {
  const [cameras, setCameras] = useState<CameraDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<CameraDeviceInfo | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [isProbing, setIsProbing] = useState<boolean>(false);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [lastCaptureMessage, setLastCaptureMessage] = useState<string | null>(null);
  const [ipAddressInput, setIpAddressInput] = useState<string>('192.168.1.121');
  const [frameTimestamp, setFrameTimestamp] = useState<number>(Date.now());
  const [streamError, setStreamError] = useState<boolean>(false);
  const [snapshotResult, setSnapshotResult] = useState<any | null>(null);

  const streamIntervalRef = useRef<any>(null);

  const fetchCameras = async () => {
    try {
      const list = await api.getCameras();
      setCameras(list);
      if (list.length > 0 && !selectedCamera) {
        setSelectedCamera(list[0]);
        if (list[0].streamUrl) {
          const match = list[0].streamUrl.match(/\/\/([^/:]+)/);
          if (match) setIpAddressInput(match[1]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch cameras:', err);
    }
  };

  const checkCameraStatus = async (camId?: string) => {
    const id = camId || selectedCamera?.deviceId || 'ESP32-CAM-1';
    try {
      setIsProbing(true);
      const res = await api.getCameraStatus(id);
      setIsOnline(res.isOnline);
      setStreamError(!res.isOnline);
      if (res.isOnline) {
        setFrameTimestamp(Date.now());
      }
    } catch (err) {
      setIsOnline(false);
      setStreamError(true);
    } finally {
      setIsProbing(false);
    }
  };

  useEffect(() => {
    fetchCameras();
    checkCameraStatus();

    // Regular 4-second health probe to detect plug-in / plug-out
    const probeTimer = setInterval(() => {
      checkCameraStatus();
    }, 4000);

    return () => clearInterval(probeTimer);
  }, []);

  // Frame refresh loop when online and streaming is active
  useEffect(() => {
    if (isOnline && isStreaming) {
      streamIntervalRef.current = setInterval(() => {
        setFrameTimestamp(Date.now());
      }, 1000);
    } else {
      if (streamIntervalRef.current) {
        clearInterval(streamIntervalRef.current);
        streamIntervalRef.current = null;
      }
    }

    return () => {
      if (streamIntervalRef.current) {
        clearInterval(streamIntervalRef.current);
      }
    };
  }, [isOnline, isStreaming]);

  const handleSelectCamera = (c: CameraDeviceInfo) => {
    setSelectedCamera(c);
    setSnapshotResult(null);
    setLastCaptureMessage(null);
    if (c.streamUrl) {
      const match = c.streamUrl.match(/\/\/([^/:]+)/);
      if (match) setIpAddressInput(match[1]);
    }
    checkCameraStatus(c.deviceId);
  };

  const handleSaveIp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCamera) return;
    try {
      setIsProbing(true);
      const res = await api.updateCameraConfig({
        deviceId: selectedCamera.deviceId,
        ipAddress: ipAddressInput,
      });
      setSelectedCamera(res.camera);
      setIsOnline(res.camera.isOnline);
      setStreamError(!res.camera.isOnline);
      setLastCaptureMessage('Camera IP configured & tested successfully');
      await fetchCameras();
    } catch (err: any) {
      setLastCaptureMessage('Failed to connect to camera at this IP');
    } finally {
      setIsProbing(false);
    }
  };

  const handleCaptureSnapshot = async () => {
    if (!selectedCamera) return;
    try {
      setIsCapturing(true);
      const res = await api.captureCameraSnapshot(selectedCamera.deviceId);
      setLastCaptureMessage(res.message);
      setSnapshotResult(res.scanResult);
      if (res.camera) setSelectedCamera(res.camera);
      setIsOnline(true);
      setStreamError(false);
      setFrameTimestamp(Date.now());
      await fetchCameras();
    } catch (err: any) {
      setIsOnline(false);
      setStreamError(true);
      setLastCaptureMessage(err.response?.data?.error || 'Failed to capture frame (Camera offline)');
    } finally {
      setIsCapturing(false);
    }
  };

  const currentDeviceId = selectedCamera?.deviceId || 'ESP32-CAM-1';
  const liveFrameUrl = `/api/camera/stream/${currentDeviceId}?t=${frameTimestamp}`;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="border-b app-divider pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight app-heading flex items-center gap-2">
            <Camera className="text-sky-600 dark:text-sky-400" size={24} />
            Camera & Optical Inspection Monitoring
          </h1>
          <p className="text-xs sm:text-sm app-muted mt-0.5">
            Real-time visual sediment monitoring and contaminant detection via AI Thinker ESP32-CAM (OV2640).
          </p>
        </div>

        {/* Global Camera Node Status Pill */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => checkCameraStatus()}
            disabled={isProbing}
            className="secondary-button text-xs flex items-center gap-1.5 py-1.5 px-3"
            title="Ping camera hardware"
          >
            <RefreshCw size={13} className={isProbing ? 'animate-spin text-sky-500' : ''} />
            <span>{isProbing ? 'Checking...' : 'Check Status'}</span>
          </button>
          <StatusBadge status={isOnline ? 'ONLINE' : 'OFFLINE'} size="md" showPulse={isOnline} />
        </div>
      </div>

      {/* Main Grid: Live Camera Stream View + Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Live Stream Canvas */}
        <div className="lg:col-span-2 app-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b app-divider pb-3">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800/60 px-2 py-0.5 rounded">
                {currentDeviceId}
              </span>
              <h3 className="text-sm font-bold app-heading">
                {selectedCamera?.purifier?.name || 'EMTech Dept Purifier (2nd Floor)'}
              </h3>
            </div>

            <div className="flex items-center space-x-2">
              {isOnline ? (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  LIVE STREAM ACTIVE
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                  <WifiOff size={12} />
                  CAMERA OFFLINE / UNPLUGGED
                </span>
              )}
            </div>
          </div>

          {/* Video View Canvas */}
          <div className="relative rounded-xl overflow-hidden aspect-video bg-slate-950 border border-slate-800 flex items-center justify-center shadow-inner group">
            {isOnline && !streamError ? (
              <>
                {/* Real Live JPEG Frame from ESP32-CAM */}
                <img
                  src={liveFrameUrl}
                  alt="ESP32-CAM Live Feed"
                  onError={() => {
                    setStreamError(true);
                    setIsOnline(false);
                  }}
                  onLoad={() => {
                    setStreamError(false);
                  }}
                  className="w-full h-full object-contain bg-black transition-opacity duration-200"
                />

                {/* Top Overlay HUD */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                  <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 text-[11px] font-mono text-white">
                    <Radio size={12} className="text-rose-500 animate-pulse" />
                    <span className="font-bold text-rose-400">REC LIVE</span>
                    <span className="text-white/40">|</span>
                    <span>{selectedCamera?.resolution || '640x480 VGA'}</span>
                  </div>

                  <div className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 text-[10px] font-mono text-emerald-400 font-semibold flex items-center gap-1">
                    <ShieldCheck size={12} />
                    <span>AI Optical Clear</span>
                  </div>
                </div>

                {/* Bottom Overlay HUD */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                  <div className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 text-[10px] font-mono text-slate-300">
                    Target: <span className="text-sky-300 font-bold">{selectedCamera?.purifier?.purifierCode || 'WP-1'}</span> (Filter Chamber)
                  </div>
                  <div className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 text-[10px] font-mono text-slate-400">
                    {new Date(frameTimestamp).toLocaleTimeString()}
                  </div>
                </div>
              </>
            ) : (
              /* Plugged-out / Offline Standby Canvas - NO IMAGES DISPLAYED */
              <div className="p-8 flex flex-col items-center justify-center text-center max-w-md space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-1">
                  <WifiOff size={28} />
                </div>
                <h4 className="text-sm font-bold text-white">
                  ESP32-CAM Hardware Offline
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  The ESP32-CAM optical sensor node is currently <strong>unplugged or disconnected</strong> from power/Wi-Fi.
                </p>
                <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-amber-400 bg-amber-950/60 border border-amber-800/60 px-3 py-1 rounded-md mt-1">
                  <span>Stream automatically activates when hardware is connected</span>
                </div>
              </div>
            )}
          </div>

          {/* Controls & Snapshot Trigger Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <div className="text-xs app-muted">
              {lastCaptureMessage ? (
                <span className={`font-medium flex items-center gap-1 ${
                  isOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
                }`}>
                  {isOnline ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                  {lastCaptureMessage}
                </span>
              ) : (
                <span className="text-slate-400 text-[11px]">
                  {isOnline ? 'Live stream synchronized over local network.' : 'Connect ESP32-CAM to display live stream.'}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isOnline && (
                <button
                  onClick={() => setIsStreaming(!isStreaming)}
                  className="secondary-button flex items-center space-x-1.5 text-xs py-2 px-3"
                  title={isStreaming ? 'Pause live stream' : 'Resume live stream'}
                >
                  {isStreaming ? <Pause size={13} /> : <Play size={13} />}
                  <span>{isStreaming ? 'Pause Stream' : 'Play Stream'}</span>
                </button>
              )}

              <button
                onClick={handleCaptureSnapshot}
                disabled={isCapturing}
                className="primary-button flex items-center space-x-2 text-xs py-2 px-4 shadow-sm hover:shadow"
                title="Capture live frame and run AI optical inspection"
              >
                <Camera size={14} className={isCapturing ? 'animate-spin' : ''} />
                <span>{isCapturing ? 'Analyzing Frame...' : 'Capture Inspection Frame (AI)'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Camera Units, IP Configuration & Hardware Details */}
        <div className="space-y-4">
          {/* Camera Fleet Selector */}
          <div className="app-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold app-heading">Camera Fleet</h3>
              <span className="text-[11px] font-mono app-muted">
                {cameras.filter((c) => c.status === 'ONLINE').length}/{cameras.length} Active
              </span>
            </div>

            <div className="space-y-2">
              {cameras.map((c) => {
                const isSelected = selectedCamera?.id === c.id;
                const isCamOnline = isSelected ? isOnline : c.status === 'ONLINE';

                return (
                  <div
                    key={c.id}
                    onClick={() => handleSelectCamera(c)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'theme-choice-active'
                        : 'app-soft hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-1.5">
                        <Camera size={13} className={isCamOnline ? 'text-emerald-500' : 'text-slate-400'} />
                        <span className="font-mono font-semibold text-xs app-heading">
                          {c.deviceId}
                        </span>
                      </div>
                      <StatusBadge status={isCamOnline ? 'ONLINE' : 'OFFLINE'} size="sm" showPulse={isCamOnline} />
                    </div>
                    <div className="text-xs app-body font-medium">{c.purifier?.name || 'Purifier Unit'}</div>
                    <div className="text-[10px] font-mono app-muted mt-0.5 truncate">
                      {c.streamUrl || 'http://192.168.1.121/capture'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Hardware IP Config & Test */}
          <div className="app-card p-5 space-y-3">
            <div className="flex items-center space-x-2 text-sky-600 dark:text-sky-400 font-bold text-xs">
              <Sliders size={14} />
              <span>ESP32-CAM Network Config</span>
            </div>

            <form onSubmit={handleSaveIp} className="space-y-2.5">
              <div>
                <label className="text-[11px] font-medium app-muted block mb-1">
                  ESP32-CAM Local IP Address
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={ipAddressInput}
                    onChange={(e) => setIpAddressInput(e.target.value)}
                    placeholder="e.g. 192.168.43.50"
                    className="app-input text-xs font-mono py-1.5 px-3 flex-1"
                  />
                  <button
                    type="submit"
                    disabled={isProbing}
                    className="secondary-button text-xs py-1.5 px-3 font-semibold"
                  >
                    {isProbing ? 'Testing...' : 'Connect'}
                  </button>
                </div>
                <p className="text-[10px] app-muted mt-1 leading-relaxed">
                  Enter the IP shown in Arduino Serial Monitor when ESP32-CAM connects to Wi-Fi.
                </p>
              </div>
            </form>
          </div>

          {/* AI Detection Summary Card (if snapshot taken) */}
          {snapshotResult && (
            <div
              className={`app-card p-4 space-y-2 border transition-all animate-in fade-in ${
                snapshotResult.riskLevel === 'CRITICAL'
                  ? 'border-rose-500/50 bg-rose-50/70 dark:bg-rose-950/30 shadow-md shadow-rose-500/10'
                  : snapshotResult.riskLevel === 'WARNING'
                  ? 'border-amber-500/50 bg-amber-50/70 dark:bg-amber-950/30 shadow-md shadow-amber-500/10'
                  : 'border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20'
              }`}
            >
              <div
                className={`flex items-center justify-between text-xs font-bold ${
                  snapshotResult.riskLevel === 'CRITICAL'
                    ? 'text-rose-700 dark:text-rose-400'
                    : snapshotResult.riskLevel === 'WARNING'
                    ? 'text-amber-700 dark:text-amber-400'
                    : 'text-emerald-700 dark:text-emerald-400'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {snapshotResult.riskLevel === 'SAFE' ? (
                    <CheckCircle2 size={14} />
                  ) : (
                    <AlertCircle size={14} />
                  )}
                  <span>AI Optical Inspection Result</span>
                </span>
                <span className="font-mono">{snapshotResult.confidence}% Conf.</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  {snapshotResult.detectedObject}
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    snapshotResult.riskLevel === 'CRITICAL'
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300'
                      : snapshotResult.riskLevel === 'WARNING'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300'
                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300'
                  }`}
                >
                  {snapshotResult.riskLevel}
                </span>
              </div>

              <p className="text-[11px] app-muted leading-relaxed">
                {snapshotResult.recommendation}
              </p>

              {snapshotResult.boundingBoxes && snapshotResult.boundingBoxes.length > 0 && (
                <div className="text-[10px] font-mono text-rose-600 dark:text-rose-400 pt-1 border-t border-rose-200 dark:border-rose-900/50 flex items-center justify-between">
                  <span>Detected Contaminant ROIs:</span>
                  <span className="font-bold">{snapshotResult.boundingBoxes.length} Active Bounding Box(es)</span>
                </div>
              )}
            </div>
          )}

          {/* Hardware Pinout Specs */}
          <div className="app-card p-4 text-xs space-y-2">
            <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300 font-bold text-xs">
              <Cpu size={14} />
              <span>Microcontroller Specs</span>
            </div>
            <ul className="text-[11px] app-muted space-y-1 list-disc list-inside">
              <li>Module: AI Thinker ESP32-CAM + OV2640</li>
              <li>Wi-Fi: 802.11 b/g/n (2.4 GHz)</li>
              <li>Default Endpoint: <code className="font-mono text-[10px]">GET /capture</code></li>
              <li>Resolution: VGA (640x480) JPEG</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
