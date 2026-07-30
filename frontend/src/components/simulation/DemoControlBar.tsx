import React, { useState } from 'react';
import { useTelemetry } from '../../context/TelemetryContext';
import { SimulationScenario } from '../../types';
import { RotateCcw, AlertTriangle, Droplets, ZapOff, CheckCircle2 } from 'lucide-react';

export const DemoControlBar: React.FC = () => {
  const { purifiers, triggerScenario, resetSimulation } = useTelemetry();
  const [selectedPurifierId, setSelectedPurifierId] = useState<string>('');
  const [activeScenario, setActiveScenario] = useState<SimulationScenario>('NORMAL');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const currentPurifierId = selectedPurifierId || purifiers[0]?.id || '';

  const handleScenarioChange = async (scenario: SimulationScenario) => {
    if (!currentPurifierId) return;
    setIsLoading(true);
    setActiveScenario(scenario);
    try {
      await triggerScenario(currentPurifierId, scenario);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    setIsLoading(true);
    setActiveScenario('NORMAL');
    try {
      await resetSimulation();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-100 dark:bg-slate-900 border-b app-divider px-4 py-2">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: Subtle Badge & Purifier Selector */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold tracking-wide border border-slate-300 dark:border-slate-700">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
            <span>DEMO MODE</span>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="app-muted font-medium hidden sm:inline">Target Unit:</span>
            <select
              value={currentPurifierId}
              onChange={(e) => setSelectedPurifierId(e.target.value)}
              className="app-input py-1 px-2 text-xs font-mono w-auto min-w-[160px]"
            >
              {purifiers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.purifierCode} {p.isPhysicalHardware ? '(Pico W)' : `(${p.building})`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Center/Right: Scenario Buttons */}
        <div className="flex items-center flex-wrap gap-1.5 text-xs">
          <button
            onClick={() => handleScenarioChange('NORMAL')}
            disabled={isLoading}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
              activeScenario === 'NORMAL'
                ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            <CheckCircle2 size={13} />
            <span>Nominal</span>
          </button>

          <button
            onClick={() => handleScenarioChange('FILTER_DEGRADATION')}
            disabled={isLoading}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
              activeScenario === 'FILTER_DEGRADATION'
                ? 'bg-rose-600 border-rose-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            <AlertTriangle size={13} />
            <span>Degradation</span>
          </button>

          <button
            onClick={() => handleScenarioChange('TURBIDITY_BURST')}
            disabled={isLoading}
            className={`hidden md:flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
              activeScenario === 'TURBIDITY_BURST'
                ? 'bg-amber-600 border-amber-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            <Droplets size={13} />
            <span>Turbidity Spike</span>
          </button>

          <button
            onClick={() => handleScenarioChange('DEVICE_OFFLINE')}
            disabled={isLoading}
            className={`hidden lg:flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
              activeScenario === 'DEVICE_OFFLINE'
                ? 'bg-slate-700 border-slate-700 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            <ZapOff size={13} />
            <span>Offline</span>
          </button>

          <button
            onClick={handleReset}
            disabled={isLoading}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ml-1"
            title="Reset simulation parameters to healthy nominal"
          >
            <RotateCcw size={12} className={isLoading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
};
