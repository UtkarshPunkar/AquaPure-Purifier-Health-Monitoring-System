import React, { useState, useEffect } from 'react';
import {
  Droplets,
  Activity,
  Cpu,
  ShieldCheck,
  Zap,
  Radio,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Waves,
  ScanEye,
  Filter,
} from 'lucide-react';

export const AnimatedSideDecorations: React.FC = () => {
  const [scrollY, setScrollY] = useState(0);
  const [activeTelemetry, setActiveTelemetry] = useState({
    tds: 42,
    flow: 5.2,
    purity: 99.4,
    temp: 24.1,
  });

  // Subtle real-time fluctuation to make telemetry look authentically live
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTelemetry({
        tds: Number((41 + Math.random() * 2).toFixed(1)),
        flow: Number((5.1 + Math.random() * 0.3).toFixed(2)),
        purity: Number((99.3 + Math.random() * 0.3).toFixed(1)),
        temp: Number((23.9 + Math.random() * 0.4).toFixed(1)),
      });
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  // Parallax scroll position
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden select-none">
      {/* =========================================================================
          LEFT SIDE TELEMETRY & WATER FLOW STREAM (Desktop / Tablet Viewports)
         ========================================================================= */}
      <div className="hidden xl:block absolute left-4 2xl:left-8 top-28 bottom-16 w-56 2xl:w-64">
        {/* Vertical Glowing Cyber Data Rail */}
        <div className="absolute left-6 top-0 bottom-0 w-[1.5px] bg-gradient-to-b from-sky-400/10 via-[#4FC3F7]/30 to-sky-500/10 dark:from-sky-500/5 dark:via-[#4FC3F7]/25 dark:to-transparent">
          {/* Laser Light Pulse moving downwards */}
          <div className="w-full h-24 bg-gradient-to-b from-transparent via-[#4FC3F7] to-transparent shadow-[0_0_12px_#4FC3F7] animate-side-laser-down" />
        </div>

        {/* Orbiting Radar Rings (Top Left) */}
        <div className="absolute left-3 top-8 -translate-x-1/2">
          <div className="relative w-8 h-8 flex items-center justify-center">
            <div className="absolute w-8 h-8 rounded-full border border-[#4FC3F7]/40 animate-orbit-slow" />
            <div className="absolute w-6 h-6 rounded-full border border-sky-400/30 animate-radar-ring" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#0288D1] dark:bg-[#4FC3F7] shadow-[0_0_8px_#4FC3F7]" />
          </div>
        </div>

        {/* Floating Bubble Molecules on Left */}
        <div className="absolute left-8 top-[18%] w-3 h-3 rounded-full bg-gradient-to-tr from-sky-400 to-cyan-200 blur-[0.5px] animate-bubble-1" />
        <div className="absolute left-14 top-[42%] w-2 h-2 rounded-full bg-gradient-to-tr from-[#4FC3F7] to-white blur-[0.5px] animate-bubble-2" />
        <div className="absolute left-4 top-[65%] w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-blue-400 to-sky-200 blur-[0.5px] animate-bubble-3" />
        <div className="absolute left-12 top-[82%] w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-cyan-400 to-white blur-[0.5px] animate-bubble-4" />

        {/* =========================================================================
            LEFT INTERACTIVE FLOATING TELEMETRY CARDS
           ========================================================================= */}
        <div
          className="space-y-6 pt-16 transition-transform duration-300 ease-out"
          style={{ transform: `translateY(${scrollY * -0.04}px)` }}
        >
          {/* Card 1: Live IoT Node Status */}
          <div className="pointer-events-auto group p-3.5 rounded-2xl bg-white/80 dark:bg-[#0c1629]/80 backdrop-blur-md border border-sky-200/80 dark:border-sky-900/60 shadow-lg shadow-sky-500/10 hover:shadow-xl hover:shadow-[#4FC3F7]/20 hover:border-[#4FC3F7] transition-all duration-300 animate-float-drift-left cursor-default">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800 dark:text-sky-300">
                Pico W Sensor
              </span>
              <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800">
                Live
              </span>
            </div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1">
                <Zap size={13} className="text-amber-500" />
                Telemetry Sync
              </span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                100ms
              </span>
            </div>
          </div>

          {/* Card 2: Live TDS Purity Meter */}
          <div
            className="pointer-events-auto group p-3.5 rounded-2xl bg-white/80 dark:bg-[#0c1629]/80 backdrop-blur-md border border-sky-200/80 dark:border-sky-900/60 shadow-lg shadow-sky-500/10 hover:shadow-xl hover:shadow-[#4FC3F7]/20 hover:border-[#4FC3F7] transition-all duration-300 animate-float-drift-left cursor-default"
            style={{ animationDelay: '1.2s' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg bg-sky-500/15 dark:bg-sky-400/20 text-[#0288D1] dark:text-[#4FC3F7] flex items-center justify-center">
                <Droplets size={14} className="stroke-[2.5]" />
              </div>
              <div>
                <div className="text-[11px] font-extrabold text-slate-900 dark:text-white leading-none">
                  TDS Level
                </div>
                <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  WHO Potable Standard
                </div>
              </div>
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <div className="font-mono text-base font-black text-slate-900 dark:text-white">
                {activeTelemetry.tds}{' '}
                <span className="text-[10px] font-medium text-slate-400">PPM</span>
              </div>
              <span className="text-[10px] font-bold text-sky-600 dark:text-[#4FC3F7] bg-sky-50 dark:bg-sky-950/80 px-2 py-0.5 rounded-full border border-sky-200 dark:border-sky-800">
                {activeTelemetry.purity}% Pure
              </span>
            </div>
          </div>

          {/* Card 3: Flow & Hydro Dynamics */}
          <div
            className="pointer-events-auto group p-3.5 rounded-2xl bg-white/80 dark:bg-[#0c1629]/80 backdrop-blur-md border border-sky-200/80 dark:border-sky-900/60 shadow-lg shadow-sky-500/10 hover:shadow-xl hover:shadow-[#4FC3F7]/20 hover:border-[#4FC3F7] transition-all duration-300 animate-float-drift-left cursor-default"
            style={{ animationDelay: '2.4s' }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Waves size={13} className="text-cyan-500" />
                Flow Stream
              </span>
              <span className="font-mono text-xs font-black text-cyan-600 dark:text-cyan-400">
                {activeTelemetry.flow} L/min
              </span>
            </div>
            {/* Hydro Pulse Bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-sky-400 to-[#4FC3F7] h-full rounded-full transition-all duration-500"
                style={{ width: `${(activeTelemetry.flow / 8) * 100}%` }}
              />
            </div>
            <div className="flex justify-between items-center mt-2 text-[9px] text-slate-500 dark:text-slate-400 font-medium">
              <span>Pressure: 45 PSI</span>
              <span>Temp: {activeTelemetry.temp}°C</span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          RIGHT SIDE AI PREDICTIVE & NEURAL HEALTH STREAM (Desktop / Tablet)
         ========================================================================= */}
      <div className="hidden xl:block absolute right-4 2xl:right-8 top-28 bottom-16 w-56 2xl:w-64">
        {/* Vertical Glowing Neural Data Rail */}
        <div className="absolute right-6 top-0 bottom-0 w-[1.5px] bg-gradient-to-b from-sky-500/10 via-[#4FC3F7]/30 to-blue-600/10 dark:from-transparent dark:via-[#4FC3F7]/25 dark:to-sky-500/5">
          {/* Laser Light Pulse moving upwards */}
          <div className="w-full h-24 bg-gradient-to-t from-transparent via-[#4FC3F7] to-transparent shadow-[0_0_12px_#4FC3F7] animate-side-laser-up" />
        </div>

        {/* Orbiting Neural Rings (Top Right) */}
        <div className="absolute right-3 top-8 translate-x-1/2">
          <div className="relative w-8 h-8 flex items-center justify-center">
            <div className="absolute w-8 h-8 rounded-full border border-blue-400/40 animate-orbit-reverse" />
            <div className="absolute w-6 h-6 rounded-full border border-[#4FC3F7]/30 animate-radar-ring" />
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-[0_0_8px_#29B6F6]" />
          </div>
        </div>

        {/* Floating Bubble Molecules on Right */}
        <div className="absolute right-10 top-[20%] w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-cyan-400 to-white blur-[0.5px] animate-bubble-5" />
        <div className="absolute right-4 top-[38%] w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-[#4FC3F7] to-blue-200 blur-[0.5px] animate-bubble-3" />
        <div className="absolute right-14 top-[60%] w-2 h-2 rounded-full bg-gradient-to-tr from-sky-400 to-emerald-200 blur-[0.5px] animate-bubble-1" />
        <div className="absolute right-6 top-[80%] w-3 h-3 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-300 blur-[0.5px] animate-bubble-4" />

        {/* =========================================================================
            RIGHT INTERACTIVE FLOATING AI CARDS
           ========================================================================= */}
        <div
          className="space-y-6 pt-16 transition-transform duration-300 ease-out"
          style={{ transform: `translateY(${scrollY * -0.04}px)` }}
        >
          {/* Card 1: AI Contamination Vision */}
          <div className="pointer-events-auto group p-3.5 rounded-2xl bg-white/80 dark:bg-[#0c1629]/80 backdrop-blur-md border border-sky-200/80 dark:border-sky-900/60 shadow-lg shadow-sky-500/10 hover:shadow-xl hover:shadow-[#4FC3F7]/20 hover:border-[#4FC3F7] transition-all duration-300 animate-float-drift-right cursor-default">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/15 dark:bg-emerald-400/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <ScanEye size={14} className="stroke-[2.5]" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-extrabold text-slate-900 dark:text-white leading-none">
                  AI Vision Model
                </div>
                <div className="text-[9px] text-slate-500 dark:text-slate-400 truncate">
                  ESP32-CAM Stream
                </div>
              </div>
              <span className="ml-auto text-[9px] font-black px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                0.00 NTU
              </span>
            </div>
            <div className="text-[10px] text-slate-600 dark:text-slate-300 font-medium flex items-center justify-between">
              <span>Bio-film &amp; Hazing:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                Clear (0 ppm)
              </span>
            </div>
          </div>

          {/* Card 2: Dynamic Equalizer & Fleet Health */}
          <div
            className="pointer-events-auto group p-3.5 rounded-2xl bg-white/80 dark:bg-[#0c1629]/80 backdrop-blur-md border border-sky-200/80 dark:border-sky-900/60 shadow-lg shadow-sky-500/10 hover:shadow-xl hover:shadow-[#4FC3F7]/20 hover:border-[#4FC3F7] transition-all duration-300 animate-float-drift-right cursor-default"
            style={{ animationDelay: '1.4s' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                <Activity size={13} className="text-[#0288D1] dark:text-[#4FC3F7]" />
                Fleet Telemetry
              </span>
              <span className="text-[9px] font-bold text-sky-600 dark:text-[#4FC3F7]">
                5/5 Online
              </span>
            </div>
            {/* Dynamic Telemetry Equalizer Bars */}
            <div className="flex items-end justify-between h-7 px-1 py-1 rounded-lg bg-sky-50/80 dark:bg-slate-900/80 border border-sky-100 dark:border-slate-800">
              <div className="w-1.5 bg-[#4FC3F7] rounded-full animate-equalizer-1" />
              <div className="w-1.5 bg-[#29B6F6] rounded-full animate-equalizer-2" />
              <div className="w-1.5 bg-[#0288D1] rounded-full animate-equalizer-3" />
              <div className="w-1.5 bg-[#4FC3F7] rounded-full animate-equalizer-4" />
              <div className="w-1.5 bg-[#29B6F6] rounded-full animate-equalizer-5" />
              <div className="w-1.5 bg-[#0288D1] rounded-full animate-equalizer-1" />
              <div className="w-1.5 bg-[#4FC3F7] rounded-full animate-equalizer-3" />
            </div>
            <div className="flex justify-between items-center mt-2 text-[9px] text-slate-500 dark:text-slate-400 font-semibold">
              <span>WQI Score: 98/100</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                Optimal
              </span>
            </div>
          </div>

          {/* Card 3: Predictive Membrane Clogging Engine */}
          <div
            className="pointer-events-auto group p-3.5 rounded-2xl bg-white/80 dark:bg-[#0c1629]/80 backdrop-blur-md border border-sky-200/80 dark:border-sky-900/60 shadow-lg shadow-sky-500/10 hover:shadow-xl hover:shadow-[#4FC3F7]/20 hover:border-[#4FC3F7] transition-all duration-300 animate-float-drift-right cursor-default"
            style={{ animationDelay: '2.6s' }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 rounded-lg bg-sky-500/15 dark:bg-sky-400/20 text-[#0288D1] dark:text-[#4FC3F7] flex items-center justify-center">
                <Filter size={14} className="stroke-[2.5]" />
              </div>
              <div>
                <div className="text-[11px] font-extrabold text-slate-900 dark:text-white leading-none">
                  Membrane Health
                </div>
                <div className="text-[9px] text-sky-600 dark:text-[#4FC3F7] font-semibold">
                  ML Prediction
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-slate-600 dark:text-slate-300 font-medium">
                Next Service in:
              </span>
              <span className="font-mono text-xs font-black text-[#0288D1] dark:text-[#4FC3F7]">
                24 Days
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          AMBIENT SIDE GRADIENT BEAMS (Left Cyan & Right Sky Glow)
         ========================================================================= */}
      <div className="absolute left-0 top-1/4 -translate-x-1/2 w-[380px] h-[600px] bg-gradient-to-r from-[#4FC3F7]/20 via-sky-400/10 to-transparent blur-[100px] rounded-full pointer-events-none animate-pulse-glow" />
      <div className="absolute right-0 top-1/3 translate-x-1/2 w-[420px] h-[650px] bg-gradient-to-l from-blue-600/20 via-[#4FC3F7]/15 to-transparent blur-[110px] rounded-full pointer-events-none animate-pulse-slow" />
    </div>
  );
};
