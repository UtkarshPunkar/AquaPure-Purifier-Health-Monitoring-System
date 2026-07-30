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

// Realistic 12 sample purifiers for immediate fallback
const samplePurifiers: Purifier[] = [
  {
    id: 'wp-001',
    purifierCode: 'WP-001',
    name: 'Main Administrative Center Purifier',
    location: 'Main Administrative Block - Ground Floor Foyer',
    building: 'Main Administrative Block',
    floor: 'Ground Floor, Lobby West',
    status: 'HEALTHY',
    isPhysicalHardware: true,
    modelType: 'Commercial Multi-Stage RO + UV + Active Carbon',
    deviceId: 'PICO-W-001',
    installationDate: '2026-03-01',
    currentTelemetry: {
      ph: 7.25,
      tds: 145,
      turbidity: 0.42,
      temperature: 23.4,
      flowRate: 2.5,
      waterLevel: 84,
      wqiScore: 94,
      wqiStatus: 'EXCELLENT',
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
    purifierCode: 'WP-002',
    name: 'Central Library Water Station',
    location: 'Central Library - 2nd Floor Reading Room',
    building: 'Knowledge Center',
    floor: 'Floor 2, Hall B',
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
    purifierCode: 'WP-003',
    name: 'Computer Science Dept Purifier',
    location: 'Department of Computer Science - Block C',
    building: 'Computer Science Block',
    floor: '3rd Floor, Server Corridor',
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
    purifierCode: 'WP-004',
    name: 'Faculty & Executive Lounge Purifier',
    location: 'Administrative Wing - Faculty Common Hall',
    building: 'Admin Annex',
    floor: '1st Floor, Suite 108',
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
    purifierCode: 'WP-005',
    name: 'Campus Main Cafeteria Dispenser',
    location: 'Food Court & Dining Complex - Main Counter',
    building: 'Cafeteria Block',
    floor: 'Ground Floor, Dispenser 1',
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
  {
    id: 'wp-006',
    purifierCode: 'WP-006',
    name: 'Mechanical Workshop Purifier',
    location: 'Department of Mechanical Engineering - Ground Floor Bay',
    building: 'Mechanical Department',
    floor: 'Ground Floor, Bay 3',
    status: 'WARNING',
    isPhysicalHardware: false,
    modelType: 'Industrial Heavy RO + UV',
    deviceId: 'PICO-W-006',
    installationDate: '2026-02-01',
    currentTelemetry: {
      ph: 7.55,
      tds: 260,
      turbidity: 1.15,
      temperature: 27.2,
      flowRate: 1.8,
      waterLevel: 62,
      wqiScore: 81,
      wqiStatus: 'GOOD',
      lastSeen: new Date().toISOString(),
    },
    filter: {
      id: 'flt-006',
      healthScore: 58,
      degradationRate: 0.85,
      estimatedRemainingLifeDays: 20,
      flowResistanceIndex: 2.2,
      dailyUsageLiters: 150,
      status: 'DEGRADED',
    },
  },
  {
    id: 'wp-007',
    purifierCode: 'WP-007',
    name: 'Boys Hostel A Mess Purifier',
    location: 'Hostel Complex - Block A Dining Hall',
    building: 'Hostel Block A',
    floor: 'Ground Floor, Mess Area',
    status: 'HEALTHY',
    isPhysicalHardware: false,
    modelType: 'Commercial RO + UV Multi-Tap',
    deviceId: 'PICO-W-007',
    installationDate: '2026-03-01',
    currentTelemetry: {
      ph: 7.3,
      tds: 195,
      turbidity: 0.65,
      temperature: 24.5,
      flowRate: 2.2,
      waterLevel: 80,
      wqiScore: 89,
      wqiStatus: 'GOOD',
      lastSeen: new Date().toISOString(),
    },
    filter: {
      id: 'flt-007',
      healthScore: 79,
      degradationRate: 0.55,
      estimatedRemainingLifeDays: 41,
      flowResistanceIndex: 1.3,
      dailyUsageLiters: 220,
      status: 'OPTIMAL',
    },
  },
  {
    id: 'wp-008',
    purifierCode: 'WP-008',
    name: 'Girls Hostel B Lounge Purifier',
    location: 'Hostel Complex - Block B 1st Floor Common Room',
    building: 'Hostel Block B',
    floor: '1st Floor, Common Area',
    status: 'CRITICAL',
    isPhysicalHardware: false,
    modelType: 'Commercial RO + Active Carbon',
    deviceId: 'PICO-W-008',
    installationDate: '2026-01-15',
    currentTelemetry: {
      ph: 7.8,
      tds: 395,
      turbidity: 2.1,
      temperature: 25.8,
      flowRate: 1.1,
      waterLevel: 35,
      wqiScore: 61,
      wqiStatus: 'FAIR',
      lastSeen: new Date().toISOString(),
    },
    filter: {
      id: 'flt-008',
      healthScore: 12,
      degradationRate: 1.8,
      estimatedRemainingLifeDays: 2,
      flowResistanceIndex: 3.2,
      dailyUsageLiters: 195,
      status: 'CRITICAL_REPLACE',
    },
  },
  {
    id: 'wp-009',
    purifierCode: 'WP-009',
    name: 'Sports Complex & Gymnasium Dispenser',
    location: 'Indoor Stadium - Reception Lobby',
    building: 'Sports Complex',
    floor: 'Ground Floor, Foyer',
    status: 'HEALTHY',
    isPhysicalHardware: false,
    modelType: 'Chilled Multi-Stage RO + UV',
    deviceId: 'PICO-W-009',
    installationDate: '2026-03-10',
    currentTelemetry: {
      ph: 7.2,
      tds: 140,
      turbidity: 0.4,
      temperature: 18.5,
      flowRate: 2.6,
      waterLevel: 88,
      wqiScore: 95,
      wqiStatus: 'EXCELLENT',
      lastSeen: new Date().toISOString(),
    },
    filter: {
      id: 'flt-009',
      healthScore: 91,
      degradationRate: 0.3,
      estimatedRemainingLifeDays: 68,
      flowResistanceIndex: 1.1,
      dailyUsageLiters: 175,
      status: 'OPTIMAL',
    },
  },
  {
    id: 'wp-010',
    purifierCode: 'WP-010',
    name: 'Science Research Center Lab Purifier',
    location: 'Analytical Chemistry Wing - Lab 402',
    building: 'Science Research Center',
    floor: '4th Floor, Clean Room Corridor',
    status: 'HEALTHY',
    isPhysicalHardware: false,
    modelType: 'Ultra-Pure RO + UV + Deionizer',
    deviceId: 'PICO-W-010',
    installationDate: '2026-03-01',
    currentTelemetry: {
      ph: 7.05,
      tds: 45,
      turbidity: 0.15,
      temperature: 21.0,
      flowRate: 2.8,
      waterLevel: 95,
      wqiScore: 99,
      wqiStatus: 'EXCELLENT',
      lastSeen: new Date().toISOString(),
    },
    filter: {
      id: 'flt-010',
      healthScore: 96,
      degradationRate: 0.2,
      estimatedRemainingLifeDays: 88,
      flowResistanceIndex: 1.0,
      dailyUsageLiters: 90,
      status: 'OPTIMAL',
    },
  },
  {
    id: 'wp-011',
    purifierCode: 'WP-011',
    name: 'Medical Health Center Purifier',
    location: 'Campus Clinic - Patient Waiting Hall',
    building: 'Medical Center',
    floor: 'Ground Floor, Reception',
    status: 'HEALTHY',
    isPhysicalHardware: false,
    modelType: 'Medical Grade RO + UV + Micro-filtration',
    deviceId: 'PICO-W-011',
    installationDate: '2026-02-28',
    currentTelemetry: {
      ph: 7.2,
      tds: 110,
      turbidity: 0.25,
      temperature: 22.0,
      flowRate: 2.4,
      waterLevel: 86,
      wqiScore: 97,
      wqiStatus: 'EXCELLENT',
      lastSeen: new Date().toISOString(),
    },
    filter: {
      id: 'flt-011',
      healthScore: 89,
      degradationRate: 0.35,
      estimatedRemainingLifeDays: 55,
      flowResistanceIndex: 1.1,
      dailyUsageLiters: 130,
      status: 'OPTIMAL',
    },
  },
  {
    id: 'wp-012',
    purifierCode: 'WP-012',
    name: 'Auditorium Backstage Dispenser',
    location: 'Main Auditorium - Backstage Green Room',
    building: 'Auditorium',
    floor: 'Basement Level 1',
    status: 'OFFLINE',
    isPhysicalHardware: false,
    modelType: 'Commercial RO + UV',
    deviceId: 'PICO-W-012',
    installationDate: '2025-12-01',
    currentTelemetry: {
      ph: 7.4,
      tds: 210,
      turbidity: 0.8,
      temperature: 24.0,
      flowRate: 0.0,
      waterLevel: 50,
      wqiScore: 80,
      wqiStatus: 'GOOD',
      lastSeen: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    },
    filter: {
      id: 'flt-012',
      healthScore: 72,
      degradationRate: 0.4,
      estimatedRemainingLifeDays: 38,
      flowResistanceIndex: 1.4,
      dailyUsageLiters: 40,
      status: 'OPTIMAL',
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
            title: 'Critical TDS Level in Cafeteria Dispenser (WP-005)',
            message: 'TDS measured at 465 ppm exceeding maximum allowable drinking water threshold (300 ppm).',
            recommendation: 'Temporarily lock dispenser valve and perform immediate RO membrane replacement.',
            timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
            isAcknowledged: false,
            isResolved: false,
          },
          {
            id: 'alt-2',
            purifierId: 'wp-008',
            severity: 'PREDICTIVE',
            type: 'PREDICTIVE',
            category: 'FILTER_HEALTH',
            title: 'Filter health below 20% in WP-008',
            message: 'Predictive degradation model indicates filter health at 12%. Remaining life estimated under 2 days.',
            recommendation: 'Replace composite carbon filter and primary RO membrane.',
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
            title: 'Possible Algae Detected in WP-004',
            message: 'AI optical camera classified micro-algae cluster in reservoir with 94.2% confidence.',
            recommendation: 'Initiate chemical sanitization and flush reservoir chamber immediately.',
            timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
            isAcknowledged: false,
            isResolved: false,
          },
          {
            id: 'alt-4',
            purifierId: 'wp-012',
            severity: 'OFFLINE',
            type: 'REACTIVE',
            category: 'HARDWARE_ERROR',
            title: 'Purifier WP-012 Offline',
            message: 'No Wi-Fi heartbeat received from IoT node for over 48 hours. Check power and gateway.',
            recommendation: 'Check power supply unit and verify 2.4GHz Wi-Fi gateway connection in Auditorium.',
            timestamp: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
            isAcknowledged: false,
            isResolved: false,
          },
        ],
        recentPredictions: [],
        simulationMode: true,
      });
    }
  }, []);

  // Real-time live jitter / simulation effect when Live mode is on
  useEffect(() => {
    refreshData();

    const interval = setInterval(() => {
      if (!isLiveMode) return;
      setPurifiers((prev) =>
        prev.map((p) => {
          if (p.status === 'OFFLINE') return p;
          const jitterTds = Math.round((p.currentTelemetry.tds + (Math.random() * 2 - 1)) * 10) / 10;
          const jitterPh = Math.round((p.currentTelemetry.ph + (Math.random() * 0.04 - 0.02)) * 100) / 100;
          const jitterTurb = Math.max(
            0.1,
            Math.round((p.currentTelemetry.turbidity + (Math.random() * 0.04 - 0.02)) * 100) / 100
          );
          const jitterFlow = Math.max(
            0,
            Math.round((p.currentTelemetry.flowRate + (Math.random() * 0.06 - 0.03)) * 100) / 100
          );
          const jitterLevel = Math.min(100, Math.max(20, (p.currentTelemetry.waterLevel || 80) + (Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0)));

          return {
            ...p,
            currentTelemetry: {
              ...p.currentTelemetry,
              tds: jitterTds,
              ph: jitterPh,
              turbidity: jitterTurb,
              flowRate: jitterFlow,
              waterLevel: jitterLevel,
              lastSeen: new Date().toISOString(),
            },
          };
        })
      );
    }, 3500);

    return () => clearInterval(interval);
  }, [isLiveMode, refreshData]);

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
