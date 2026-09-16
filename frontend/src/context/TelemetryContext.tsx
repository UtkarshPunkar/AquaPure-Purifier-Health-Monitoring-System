import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Purifier, DashboardOverview, AlertItem, PredictionInfo, SimulationScenario } from '../types';
import { api } from '../api/client';
import { getSocket } from '../api/socket';

interface TelemetryContextType {
  purifiers: Purifier[];
  overview: DashboardOverview | null;
  alerts: AlertItem[];
  predictions: PredictionInfo[];
  isConnected: boolean;
  isLiveMode: boolean;
  toggleLiveMode: () => void;
  activeScenarioPurifierId: string | null;
  refreshData: () => Promise<void>;
  triggerScenario: (purifierId: string, scenario: SimulationScenario) => Promise<void>;
  resetSimulation: (purifierId?: string) => Promise<void>;
  getPurifier: (id: string) => Purifier | undefined;
}

const TelemetryContext = createContext<TelemetryContextType>({} as TelemetryContextType);

// 5 Standard Purifiers across S.B. Jain Campus
const samplePurifiers: Purifier[] = [
  {
    id: 'wp-001',
    purifierCode: 'WP-1',
    name: 'EMTech Dept Purifier (2nd Floor)',
    location: 'EMTech Dept 2nd floor',
    building: 'EMTech Dept',
    floor: '2nd Floor',
    status: 'INACTIVE',
    isPhysicalHardware: true,
    modelType: 'Commercial Multi-Stage RO + UV + Active Carbon',
    deviceId: 'PICO-W-001',
    installationDate: '2026-03-01',
    currentTelemetry: {
      ph: 0,
      tds: 0,
      turbidity: 0,
      temperature: 0,
      flowRate: 0,
      waterLevel: 84,
      wqiScore: 0,
      wqiStatus: 'STANDBY',
      lastSeen: new Date().toISOString(),
    },
    filter: {
      id: 'flt-001',
      healthScore: 88,
      degradationRate: 0.35,
      estimatedRemainingLifeDays: 52,
      flowResistanceIndex: 1.1,
      dailyUsageLiters: 140,
      status: 'OPTIMAL',
    },
  },
  {
    id: 'wp-002',
    purifierCode: 'WP-2',
    name: 'EMTech Dept Purifier (3rd Floor)',
    location: 'EMTech Dept 3rd floor',
    building: 'EMTech Dept',
    floor: '3rd Floor',
    status: 'HEALTHY',
    isPhysicalHardware: false,
    modelType: 'Industrial Heavy-Duty RO + UF',
    deviceId: 'PICO-W-002',
    installationDate: '2026-03-01',
    currentTelemetry: {
      ph: 7.35,
      tds: 128,
      turbidity: 0.35,
      temperature: 22.8,
      flowRate: 2.7,
      waterLevel: 92,
      wqiScore: 96,
      wqiStatus: 'EXCELLENT',
      lastSeen: new Date().toISOString(),
    },
    filter: {
      id: 'flt-002',
      healthScore: 95,
      degradationRate: 0.25,
      estimatedRemainingLifeDays: 78,
      flowResistanceIndex: 1.0,
      dailyUsageLiters: 165,
      status: 'OPTIMAL',
    },
  },
  {
    id: 'wp-003',
    purifierCode: 'WP-3',
    name: 'ETC Dept Purifier (Ground Floor)',
    location: 'ETC Dept Ground floor',
    building: 'ETC Dept',
    floor: 'Ground Floor',
    status: 'WARNING',
    isPhysicalHardware: false,
    modelType: 'Commercial RO + UV + TDS Stabilizer',
    deviceId: 'PICO-W-003',
    installationDate: '2026-02-15',
    currentTelemetry: {
      ph: 7.65,
      tds: 285,
      turbidity: 0.95,
      temperature: 25.1,
      flowRate: 1.55,
      waterLevel: 68,
      wqiScore: 78,
      wqiStatus: 'GOOD',
      lastSeen: new Date().toISOString(),
    },
    filter: {
      id: 'flt-003',
      healthScore: 64,
      degradationRate: 0.95,
      estimatedRemainingLifeDays: 24,
      flowResistanceIndex: 2.1,
      dailyUsageLiters: 190,
      status: 'DEGRADED',
    },
  },
  {
    id: 'wp-004',
    purifierCode: 'WP-4',
    name: 'CSE Dept Purifier (1st Floor)',
    location: 'CSE Dept 1st floor',
    building: 'CSE Dept',
    floor: '1st Floor',
    status: 'HEALTHY',
    isPhysicalHardware: false,
    modelType: 'Commercial RO + Carbon Filter',
    deviceId: 'PICO-W-004',
    installationDate: '2026-03-05',
    currentTelemetry: {
      ph: 7.15,
      tds: 172,
      turbidity: 0.52,
      temperature: 23.9,
      flowRate: 2.35,
      waterLevel: 76,
      wqiScore: 91,
      wqiStatus: 'EXCELLENT',
      lastSeen: new Date().toISOString(),
    },
    filter: {
      id: 'flt-004',
      healthScore: 82,
      degradationRate: 0.45,
      estimatedRemainingLifeDays: 45,
      flowResistanceIndex: 1.2,
      dailyUsageLiters: 110,
      status: 'OPTIMAL',
    },
  },
  {
    id: 'wp-005',
    purifierCode: 'WP-5',
    name: 'MBA Dept Purifier (2nd Floor)',
    location: 'MBA Dept 2nd floor',
    building: 'MBA Dept',
    floor: '2nd Floor',
    status: 'CRITICAL',
    isPhysicalHardware: false,
    modelType: 'High-Capacity Multi-Stage Industrial Purifier',
    deviceId: 'PICO-W-005',
    installationDate: '2026-01-10',
    currentTelemetry: {
      ph: 7.95,
      tds: 465,
      turbidity: 2.65,
      temperature: 26.8,
      flowRate: 0.95,
      waterLevel: 45,
      wqiScore: 52,
      wqiStatus: 'POOR',
      lastSeen: new Date().toISOString(),
    },
    filter: {
      id: 'flt-005',
      healthScore: 34,
      degradationRate: 2.2,
      estimatedRemainingLifeDays: 3,
      flowResistanceIndex: 3.4,
      dailyUsageLiters: 280,
      status: 'CRITICAL_REPLACE',
    },
  },
];

export const TelemetryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [purifiers, setPurifiers] = useState<Purifier[]>(samplePurifiers);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [predictions, setPredictions] = useState<PredictionInfo[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isLiveMode, setIsLiveMode] = useState<boolean>(true);
  const [activeScenarioPurifierId, setActiveScenarioPurifierId] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    try {
      const [pList, ov, alList, predList] = await Promise.all([
        api.getPurifiers(),
        api.getDashboardOverview(),
        api.getAlerts({ isResolved: false }),
        api.getPredictions(),
      ]);
      if (pList && pList.length > 0) setPurifiers(pList);
      if (ov) setOverview(ov);
      if (alList) setAlerts(alList);
      if (predList) setPredictions(predList);
      setIsConnected(true);
    } catch (err) {
      console.warn('API sync warning; utilizing synced demo state:', err);
      // Generate calculated overview from local fallback
      const totalPurifiers = samplePurifiers.length;
      const healthyCount = samplePurifiers.filter((p) => p.status === 'HEALTHY').length;
      const warningCount = samplePurifiers.filter((p) => p.status === 'WARNING').length;
      const criticalCount = samplePurifiers.filter((p) => p.status === 'CRITICAL').length;
      const offlineCount = samplePurifiers.filter((p) => p.status === 'OFFLINE').length;
      const maintenanceDueCount = samplePurifiers.filter(
        (p) => p.status === 'CRITICAL' || (p.filter && p.filter.healthScore < 40)
      ).length;

      setOverview({
        kpis: {
          totalPurifiers,
          healthyCount,
          warningCount,
          criticalCount,
          offlineCount,
          maintenanceDueCount,
        },
        averages: {
          avgWqi: 92.4,
          avgTds: 185,
          avgTurbidity: 0.65,
          avgFlow: 2.25,
          avgPh: 7.32,
          avgWaterLevel: 78,
        },
        recentAlerts: [
          {
            id: 'alt-1',
            purifierId: 'wp-005',
            severity: 'CRITICAL',
            type: 'REACTIVE',
            category: 'WATER_QUALITY',
            title: 'Critical TDS Level in MBA Dept Purifier (WP-5)',
            message: 'TDS measured at 465 ppm exceeding maximum allowable drinking water threshold (300 ppm).',
            recommendation: 'Temporarily lock dispenser valve and perform immediate RO membrane replacement.',
            timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
            isAcknowledged: false,
            isResolved: false,
          },
          {
            id: 'alt-2',
            purifierId: 'wp-003',
            severity: 'PREDICTIVE',
            type: 'PREDICTIVE',
            category: 'FILTER_HEALTH',
            title: 'Filter health degraded in WP-3',
            message: 'Predictive degradation model indicates filter health at 64%. Remaining life estimated under 24 days.',
            recommendation: 'Plan replacement of composite carbon filter.',
            timestamp: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
            isAcknowledged: false,
            isResolved: false,
          },
          {
            id: 'alt-3',
            purifierId: 'wp-004',
            severity: 'CRITICAL',
            type: 'REACTIVE',
            category: 'CONTAMINANT',
            title: 'Possible Algae Detected in WP-4',
            message: 'AI optical camera classified micro-algae cluster in reservoir with 94.2% confidence.',
            recommendation: 'Initiate chemical sanitization and flush reservoir chamber immediately.',
            timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
            isAcknowledged: false,
            isResolved: false,
          },
        ],
        recentPredictions: [],
        simulationMode: true,
      });
    }
  }, []);

  // Real-time live socket listener for Hardware Node & Simulation engine
  useEffect(() => {
    refreshData();

    const socket = getSocket();

    const handleTelemetryUpdate = (payload: any) => {
      if (!payload) return;

      setPurifiers((prev) =>
        prev.map((p) => {
          if (p.id === payload.purifierId || p.purifierCode === payload.purifierCode) {
            return {
              ...p,
              status: payload.purifierStatus || p.status,
              currentTelemetry: {
                ph: payload.ph,
                tds: payload.tds,
                turbidity: payload.turbidity,
                temperature: payload.temperature,
                flowRate: payload.flowRate,
                waterLevel: payload.waterLevel || p.currentTelemetry.waterLevel || 82,
                wqiScore: payload.wqiScore,
                wqiStatus: payload.wqiStatus,
                filterHealth: payload.filterHealth !== undefined ? payload.filterHealth : p.filter?.healthScore,
                lastSeen: payload.timestamp || new Date().toISOString(),
              },
              device: payload.device ? { ...p.device, ...payload.device } : p.device,
              filter: p.filter && payload.filterHealth !== undefined
                ? { ...p.filter, healthScore: payload.filterHealth }
                : p.filter,
            };
          }
          return p;
        })
      );
    };

    const handleNewAlert = (newAlert: AlertItem) => {
      setAlerts((prev) => [newAlert, ...prev.filter((a) => a.id !== newAlert.id)]);
    };

    const handleOffline = (offlineData: any) => {
      setPurifiers((prev) =>
        prev.map((p) => {
          if (p.id === offlineData.purifierId || p.purifierCode === offlineData.purifierCode) {
            return {
              ...p,
              status: offlineData.status || 'INACTIVE',
              device: p.device ? { ...p.device, status: offlineData.status || 'INACTIVE' } : p.device,
            };
          }
          return p;
        })
      );
    };

    socket.on('telemetry:update', handleTelemetryUpdate);
    socket.on('alert:new', handleNewAlert);
    socket.on('telemetry:offline', handleOffline);

    return () => {
      socket.off('telemetry:update', handleTelemetryUpdate);
      socket.off('alert:new', handleNewAlert);
      socket.off('telemetry:offline', handleOffline);
    };
  }, [refreshData]);

  const toggleLiveMode = () => setIsLiveMode((prev) => !prev);

  const triggerScenario = async (purifierId: string, scenario: SimulationScenario) => {
    setActiveScenarioPurifierId(purifierId);
    try {
      await api.triggerScenario(purifierId, scenario);
    } catch {
      // Local fallback simulation state
      setPurifiers((prev) =>
        prev.map((p) => {
          if (p.id === purifierId || p.purifierCode === purifierId) {
            if (scenario === 'FILTER_DEGRADATION') {
              return {
                ...p,
                status: 'CRITICAL',
                currentTelemetry: {
                  ...p.currentTelemetry,
                  tds: 480,
                  turbidity: 2.8,
                  flowRate: 0.8,
                  wqiScore: 48,
                  wqiStatus: 'POOR',
                },
                filter: p.filter ? { ...p.filter, healthScore: 22, status: 'CRITICAL_REPLACE' } : null,
              };
            }
          }
          return p;
        })
      );
    }
    await refreshData();
  };

  const resetSimulation = async (purifierId?: string) => {
    try {
      await api.resetSimulation(purifierId);
    } catch {
      setPurifiers(samplePurifiers);
    }
    setActiveScenarioPurifierId(null);
    await refreshData();
  };

  const getPurifier = (id: string) => {
    return purifiers.find((p) => p.id === id || p.purifierCode === id);
  };

  return (
    <TelemetryContext.Provider
      value={{
        purifiers,
        overview,
        alerts,
        predictions,
        isConnected,
        isLiveMode,
        toggleLiveMode,
        activeScenarioPurifierId,
        refreshData,
        triggerScenario,
        resetSimulation,
        getPurifier,
      }}
    >
      {children}
    </TelemetryContext.Provider>
  );
};

export const useTelemetry = () => useContext(TelemetryContext);
