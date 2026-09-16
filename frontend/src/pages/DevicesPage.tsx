import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { DeviceInfo } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { useTelemetry } from '../context/TelemetryContext';
import {
  Cpu,
  Send,
  CheckCircle2,
  AlertTriangle,
  Terminal,
} from 'lucide-react';

export const DevicesPage: React.FC = () => {
  const { refreshData } = useTelemetry();
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [ingestSuccess, setIngestSuccess] = useState<string | null>(null);
  const [ingestError, setIngestError] = useState<string | null>(null);

  // Playground custom payload
  const [mockPayload, setMockPayload] = useState({
    deviceId: 'PICO-W-001',
    purifierCode: 'WP-1',
    ph: 7.25,
    tds: 165,
    turbidity: 0.45,
    temperature: 24.2,
    flowRate: 2.5,
  });

  const fetchDevices = async () => {
    try {
      setIsLoading(true);
      const data = await api.getDevices();
      setDevices(data);
    } catch (err) {
      console.error('Failed to fetch devices:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleSendPayload = async (e: React.FormEvent) => {
    e.preventDefault();
    setIngestSuccess(null);
    setIngestError(null);

    try {
      const res = await api.ingestPicoWReading(mockPayload);
      setIngestSuccess(`Reading transmitted! WQI calculated: ${res.wqi.score} (${res.wqi.status})`);
      await refreshData();
      await fetchDevices();
    } catch (err: any) {
      setIngestError(err.response?.data?.error || 'Failed to dispatch payload');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="border-b app-divider pb-4">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight app-heading">
          Device Connectivity & IoT Gateway
        </h1>
        <p className="text-xs sm:text-sm app-muted mt-0.5">
          Monitor connected microcontrollers, Wi-Fi signal strength, firmware builds, and ingestion endpoints.
        </p>
      </div>

      {/* Device List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {devices.map((d) => (
          <div
            key={d.id}
            className="app-card p-5 space-y-3 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400">
                    <Cpu size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold app-heading font-mono">{d.deviceId}</h3>
                    <p className="text-[11px] app-muted font-mono">{d.firmwareVersion}</p>
                  </div>
                </div>

                <StatusBadge status={d.status} size="sm" showPulse />
              </div>

              <div className="app-soft p-3 rounded-lg space-y-1.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="app-muted font-sans">Device Type:</span>
                  <span className="app-heading font-medium">{d.deviceType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="app-muted font-sans">IP Address:</span>
                  <span className="app-heading">{d.ipAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="app-muted font-sans">Wi-Fi RSSI:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">{d.wifiRssi} dBm</span>
                </div>
                <div className="flex justify-between">
                  <span className="app-muted font-sans">Indicator:</span>
                  <span className="text-sky-600 dark:text-sky-400">{d.ledStatus}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t app-divider text-[11px] font-mono app-muted flex justify-between">
              <span>Last Seen:</span>
              <span>{d.lastSeen ? new Date(d.lastSeen).toLocaleTimeString() : 'Awaiting Connection'}</span>
            </div>
          </div>
        ))}
      </div>

      {/* IoT Ingestion Live API Playground */}
      <div className="app-card p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b app-divider pb-3">
          <div className="flex items-center space-x-2 text-sky-600 dark:text-sky-400">
            <Terminal size={18} />
            <h3 className="text-sm font-bold app-heading">
              Raspberry Pi Pico W Hardware Ingestion Endpoint
            </h3>
          </div>
          <span className="text-xs font-mono app-soft px-2.5 py-1 rounded app-muted border app-divider">
            POST /api/devices/readings
          </span>
        </div>

        <p className="text-xs app-muted leading-relaxed">
          Test real-time hardware telemetry ingestion. MicroPython firmware transmits the following JSON payload structure over Wi-Fi:
        </p>

        <form onSubmit={handleSendPayload} className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs font-mono">
            <div>
              <label className="form-label font-sans">pH Level</label>
              <input
                type="number"
                step="0.01"
                value={mockPayload.ph}
                onChange={(e) => setMockPayload({ ...mockPayload, ph: parseFloat(e.target.value) || 7.0 })}
                className="app-input font-mono"
              />
            </div>
            <div>
              <label className="form-label font-sans">TDS (ppm)</label>
              <input
                type="number"
                value={mockPayload.tds}
                onChange={(e) => setMockPayload({ ...mockPayload, tds: parseFloat(e.target.value) || 150 })}
                className="app-input font-mono"
              />
            </div>
            <div>
              <label className="form-label font-sans">Turbidity (NTU)</label>
              <input
                type="number"
                step="0.01"
                value={mockPayload.turbidity}
                onChange={(e) => setMockPayload({ ...mockPayload, turbidity: parseFloat(e.target.value) || 0.5 })}
                className="app-input font-mono"
              />
            </div>
            <div>
              <label className="form-label font-sans">Temp (°C)</label>
              <input
                type="number"
                step="0.1"
                value={mockPayload.temperature}
                onChange={(e) => setMockPayload({ ...mockPayload, temperature: parseFloat(e.target.value) || 24.0 })}
                className="app-input font-mono"
              />
            </div>
            <div>
              <label className="form-label font-sans">Flow (L/m)</label>
              <input
                type="number"
                step="0.01"
                value={mockPayload.flowRate}
                onChange={(e) => setMockPayload({ ...mockPayload, flowRate: parseFloat(e.target.value) || 2.4 })}
                className="app-input font-mono"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="primary-button w-full flex items-center justify-center space-x-1.5 py-2 text-xs"
              >
                <Send size={13} />
                <span>Transmit</span>
              </button>
            </div>
          </div>

          {ingestSuccess && (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-mono flex items-center space-x-2">
              <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
              <span>{ingestSuccess}</span>
            </div>
          )}

          {ingestError && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-mono flex items-center space-x-2">
              <AlertTriangle size={15} className="text-rose-500 shrink-0" />
              <span>{ingestError}</span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
