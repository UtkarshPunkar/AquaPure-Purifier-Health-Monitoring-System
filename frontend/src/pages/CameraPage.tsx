import React, { useState, useEffect } from 'react';
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
  Info,
} from 'lucide-react';

export const CameraPage: React.FC = () => {
  const [cameras, setCameras] = useState<CameraDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<CameraDeviceInfo | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [lastCaptureMessage, setLastCaptureMessage] = useState<string | null>(null);

  const fetchCameras = async () => {
    try {
      const list = await api.getCameras();
      setCameras(list);
      if (list.length > 0 && !selectedCamera) {
        setSelectedCamera(list[0]);
      }
    } catch (err) {
      console.error('Failed to fetch cameras:', err);
    }
  };

  useEffect(() => {
    fetchCameras();
  }, []);

  const handleCaptureSnapshot = async () => {
    if (!selectedCamera) return;
    try {
      setIsCapturing(true);
      const res = await api.captureCameraSnapshot(selectedCamera.deviceId);
      setLastCaptureMessage(res.message);
      setSelectedCamera(res.camera);
      await fetchCameras();
    } catch (err) {
      console.error('Failed to capture camera snapshot:', err);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="border-b app-divider pb-4">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight app-heading">
          Camera & Optical Inspection Monitoring
        </h1>
        <p className="text-xs sm:text-sm app-muted mt-0.5">
          Visual sediment monitoring and leak detection via optional ESP32-CAM Wi-Fi optical nodes.
        </p>
      </div>

      {/* Main Grid: Clean Camera View + Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Camera Status Card */}
        <div className="lg:col-span-2 app-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b app-divider pb-3">
            <div className="flex items-center space-x-2">
              <Camera size={18} className="text-sky-600 dark:text-sky-400" />
              <h3 className="text-sm font-bold app-heading">
                Camera Monitoring &mdash; {selectedCamera?.deviceId || 'PUR-001'}
              </h3>
            </div>

            <div className="flex items-center space-x-2">
              <StatusBadge status={selectedCamera?.status || 'OFFLINE'} size="sm" />
            </div>
          </div>

          {/* Clean Camera Standby Canvas */}
          <div className="app-soft rounded-xl p-8 aspect-video flex flex-col items-center justify-center text-center border app-divider">
            <div className="w-14 h-14 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center app-muted mb-3">
              <Camera size={26} />
            </div>
            <h4 className="text-sm font-semibold app-heading">
              {selectedCamera?.deviceId || 'ESP32-CAM-001'}
            </h4>
            <div className="text-xs font-mono app-muted mt-1">
              Camera Status: <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedCamera?.status || 'Offline'}</span>
            </div>
            <p className="text-xs app-muted max-w-sm mt-2 leading-relaxed">
              Camera device is not currently connected to the physical hardware module. Visual inspection stream is in standby.
            </p>
            <div className="mt-3 text-[11px] font-mono app-soft px-3 py-1 rounded-md border app-divider">
              Inspection Status: {selectedCamera?.opticalInspectionStatus || 'Not Available'}
            </div>
          </div>

          {/* Snapshot Trigger Action */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1">
            <div className="text-xs app-muted">
              {lastCaptureMessage && (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 size={13} /> {lastCaptureMessage}
                </span>
              )}
            </div>

            <button
              onClick={handleCaptureSnapshot}
              disabled={isCapturing}
              className="primary-button flex items-center space-x-2 text-xs"
            >
              <RefreshCw size={13} className={isCapturing ? 'animate-spin' : ''} />
              <span>Capture Inspection Frame</span>
            </button>
          </div>
        </div>

        {/* Right: Camera Fleet Selector & Architecture Info */}
        <div className="space-y-4">
          <div className="app-card p-5 space-y-3">
            <h3 className="text-sm font-bold app-heading">Camera Units</h3>
            <div className="space-y-2">
              {cameras.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedCamera(c)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedCamera?.id === c.id
                      ? 'theme-choice-active'
                      : 'app-soft hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-mono font-semibold text-xs app-heading">
                      {c.deviceId}
                    </span>
                    <StatusBadge status={c.status} size="sm" />
                  </div>
                  <div className="text-xs app-body">{c.purifier?.name || 'Purifier Unit'}</div>
                  <div className="text-[11px] app-muted mt-0.5 truncate">
                    {c.opticalInspectionStatus}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="app-card p-5 text-xs space-y-2">
            <div className="flex items-center space-x-2 text-sky-600 dark:text-sky-400 font-semibold">
              <Cpu size={15} />
              <span>Hardware Specification</span>
            </div>
            <p className="app-muted text-[11px] leading-relaxed">
              The optional ESP32-CAM OV2640 module operates independently over Wi-Fi, capturing macro images of the primary filter chamber to evaluate optical clarity and detect physical leakage.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
