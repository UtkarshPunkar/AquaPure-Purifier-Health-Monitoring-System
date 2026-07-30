import React from 'react';
import { DeviceInfo, TelemetryReading } from '../../types';
import { Cpu, Wifi, Volume2, AlertCircle } from 'lucide-react';

interface PhysicalMirrorProps {
  device?: DeviceInfo;
  telemetry?: TelemetryReading;
  purifierCode?: string;
  isPhysicalHardware?: boolean;
}

export const PhysicalMirror: React.FC<PhysicalMirrorProps> = ({
  device,
  telemetry,
  purifierCode = 'PUR-001',
  isPhysicalHardware = true,
}) => {
  const led = device?.ledStatus || 'GREEN_NORMAL';
  const buzzer = device?.buzzerStatus ?? false;
  const isGreen = led === 'GREEN_NORMAL';
  const isYellow = led === 'YELLOW_WARNING';
  const isRed = led === 'RED_CRITICAL';

  const oledText1 = purifierCode ? `${purifierCode} RETROFIT` : 'PICO-W RETROFIT';
  const oledText2 = telemetry
    ? `TDS:${telemetry.tds.toFixed(0)} pH:${telemetry.ph.toFixed(1)}`
    : 'INITIALIZING...';
  const oledText3 = telemetry
    ? `TURB:${telemetry.turbidity.toFixed(2)} FL:${telemetry.flowRate.toFixed(1)}L`
    : 'STANDBY';
  const oledText4 = telemetry
    ? `WQI:${telemetry.wqiScore.toFixed(0)} [${telemetry.wqiStatus.slice(0, 4)}]`
    : 'AWAITING LINK';

  return (
    <div className="app-card p-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b app-divider pb-3 mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800/60 text-sky-600 dark:text-sky-400">
            <Cpu size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold app-heading flex items-center gap-2">
              Physical Microcontroller Twin
              {isPhysicalHardware && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-sky-100 text-sky-700 dark:bg-sky-900/60 dark:text-sky-300 font-mono font-medium">
                  Raspberry Pi Pico W
                </span>
              )}
            </h3>
            <p className="text-xs app-muted font-mono">
              Device: {device?.deviceId || 'PICO-W-001'} • Firmware: {device?.firmwareVersion || 'v2.4.1'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono app-muted app-soft px-2.5 py-1 rounded-lg">
          <Wifi size={14} className={device?.status === 'ONLINE' ? 'text-emerald-500' : 'text-slate-400'} />
          <span>{device?.wifiRssi ? `${device.wifiRssi} dBm` : '-55 dBm'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        {/* SSD1306 128x64 OLED Twin Screen */}
        <div className="bg-slate-950 rounded-xl p-3.5 border border-slate-800 shadow-inner font-mono text-cyan-300">
          <div className="flex justify-between items-center text-[10px] text-cyan-500 border-b border-slate-800 pb-1 mb-2 font-medium">
            <span>SSD1306 0.96&quot; OLED</span>
            <span className="bg-cyan-950 text-cyan-400 px-1.5 py-0.2 rounded text-[9px]">ONLINE</span>
          </div>
          <div className="space-y-1 text-xs">
            <div className="text-cyan-100 font-bold tracking-wide">
              {oledText1}
            </div>
            <div className="text-cyan-200 font-medium">
              {oledText2}
            </div>
            <div className="text-cyan-300">
              {oledText3}
            </div>
            <div className="text-cyan-400 font-semibold pt-1 border-t border-slate-800/80 flex justify-between">
              <span>{oledText4}</span>
              <span className="text-[10px] text-emerald-400">● LIVE</span>
            </div>
          </div>
        </div>

        {/* Local Hardware Indicators (3 LEDs + Buzzer) */}
        <div className="app-card-subtle p-3.5 space-y-3">
          <div className="text-[11px] font-semibold app-muted uppercase tracking-wider">
            Diagnostic Status Panel
          </div>

          <div className="flex items-center justify-around py-1">
            {/* Green LED */}
            <div className="flex flex-col items-center space-y-1">
              <div
                className={`w-5 h-5 rounded-full border transition-colors ${
                  isGreen
                    ? 'bg-emerald-500 border-emerald-400'
                    : 'bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600 opacity-40'
                }`}
              />
              <span className="text-[10px] font-mono app-muted">Normal</span>
            </div>

            {/* Yellow LED */}
            <div className="flex flex-col items-center space-y-1">
              <div
                className={`w-5 h-5 rounded-full border transition-colors ${
                  isYellow
                    ? 'bg-amber-500 border-amber-400'
                    : 'bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600 opacity-40'
                }`}
              />
              <span className="text-[10px] font-mono app-muted">Warning</span>
            </div>

            {/* Red LED */}
            <div className="flex flex-col items-center space-y-1">
              <div
                className={`w-5 h-5 rounded-full border transition-colors ${
                  isRed
                    ? 'bg-rose-500 border-rose-400'
                    : 'bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600 opacity-40'
                }`}
              />
              <span className="text-[10px] font-mono app-muted">Critical</span>
            </div>

            {/* Active Buzzer */}
            <div className="flex flex-col items-center space-y-1">
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                  buzzer
                    ? 'bg-rose-600 border-rose-400 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-400 opacity-40'
                }`}
              >
                <Volume2 size={11} />
              </div>
              <span className="text-[10px] font-mono app-muted">Buzzer</span>
            </div>
          </div>

          {buzzer && (
            <div className="flex items-center space-x-1.5 text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 px-2.5 py-1 rounded-md">
              <AlertCircle size={14} />
              <span className="font-medium">Acoustic buzzer active (Threshold breach)</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
