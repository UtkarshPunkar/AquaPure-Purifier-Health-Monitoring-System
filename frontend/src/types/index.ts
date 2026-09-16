export type PurifierStatus = 'HEALTHY' | 'ACTIVE' | 'WARNING' | 'CRITICAL' | 'OFFLINE' | 'INACTIVE' | 'MAINTENANCE_DUE';
export type WqiStatus = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL' | 'STANDBY';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AlertSeverity = 'CRITICAL' | 'WARNING' | 'INFO' | 'PREDICTIVE' | 'MAINTENANCE' | 'OFFLINE';
export type SimulationScenario = 'NORMAL' | 'FILTER_DEGRADATION' | 'TURBIDITY_BURST' | 'TDS_SPIKE' | 'DEVICE_OFFLINE';
export type UserRole = 'ADMIN' | 'TECHNICAL_HEAD' | 'MAINTENANCE_STAFF' | 'VIEWER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status?: 'ACTIVE' | 'INACTIVE';
  lastLogin?: string | Date;
  organization?: {
    id: string;
    name: string;
    code: string;
    address?: string;
  };
}

export interface TelemetryReading {
  ph: number;
  tds: number;
  turbidity: number;
  temperature: number;
  flowRate: number;
  waterLevel?: number;
  wqiScore: number;
  wqiStatus: WqiStatus;
  filterHealth?: number;
  lastSeen?: string | Date | null;
}

export interface FilterInfo {
  id: string;
  healthScore: number;
  degradationRate: number;
  estimatedRemainingLifeDays: number;
  flowResistanceIndex: number;
  dailyUsageLiters?: number;
  lastReplacementDate?: string | Date;
  predictedReplacementDate?: string | Date | null;
  status: string;
}

export interface DeviceInfo {
  id: string;
  deviceId: string;
  deviceType: string;
  firmwareVersion: string;
  ipAddress: string;
  macAddress: string;
  wifiRssi: number;
  lastSeen: string | Date | null;
  status: 'ONLINE' | 'OFFLINE' | 'DEGRADED' | 'INACTIVE';
  oledStatus: string;
  ledStatus: 'GREEN_NORMAL' | 'YELLOW_WARNING' | 'RED_CRITICAL' | 'OFF';
  buzzerStatus: boolean;
}

export interface CameraDeviceInfo {
  id: string;
  deviceId: string;
  purifierId: string;
  resolution: string;
  streamUrl: string;
  lastSnapshotUrl?: string | null;
  status: 'ONLINE' | 'SIMULATED_STANDBY' | 'OFFLINE';
  opticalInspectionStatus: string;
  lastSeen: string | Date;
  purifier?: Purifier;
}

export interface PredictionInfo {
  id?: string;
  purifierId: string;
  purifierCode?: string;
  name?: string;
  location?: string;
  status?: string;
  filterHealth: number;
  riskLevel: RiskLevel;
  predictedRulDays: number;
  degradationRate: number;
  confidence: number;
  failureMode: string;
  recommendation: string;
  insights?: string[];
  anomaliesDetected?: {
    parameter: string;
    description: string;
    severity: 'WARNING' | 'CRITICAL';
  }[];
}

export interface AlertItem {
  id: string;
  purifierId: string;
  purifier?: Purifier;
  severity: AlertSeverity;
  type: 'REACTIVE' | 'PREDICTIVE';
  category: string;
  title: string;
  message: string;
  recommendation: string;
  timestamp: string | Date;
  isAcknowledged: boolean;
  isResolved: boolean;
}

export interface MaintenanceRecordItem {
  id: string;
  maintenanceCode?: string;
  purifierId: string;
  purifier?: Purifier;
  date: string | Date;
  scheduledDate?: string | Date;
  issue?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  type: string;
  technician: string;
  cost: number;
  notes: string;
  status: 'PENDING' | 'SCHEDULED' | 'COMPLETED' | 'IN_PROGRESS';
  filterReplaced: boolean;
  completedAt?: string | Date | null;
}

export interface AiDetectionItem {
  id: string;
  purifierId: string;
  purifier?: Purifier;
  timestamp: string | Date;
  capturedImageUrl: string;
  detectedObject: string; // Clean Water, Insect, Worm, Algae, Unknown Contaminant
  confidence: number;
  riskLevel: 'SAFE' | 'WARNING' | 'CRITICAL';
  boundingBoxJson?: string;
  boundingBoxes?: { x: number; y: number; w: number; h: number; label: string }[];
  recommendation: string;
  status: 'REVIEWED' | 'ACTION_REQUIRED' | 'RESOLVED';
}

export interface SystemSettingItem {
  id: string;
  organizationId: string;
  phMin: number;
  phMax: number;
  tdsMax: number;
  turbidityMax: number;
  tempMin: number;
  tempMax: number;
  filterWarning: number;
  filterCritical: number;
  emailAlerts: boolean;
  smsAlerts: boolean;
  pushAlerts: boolean;
  apiToken: string;
  updatedAt?: string | Date;
}

export interface UserItem {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'ACTIVE' | 'INACTIVE';
  lastLogin?: string | Date | null;
  createdAt: string | Date;
}

export interface Purifier {
  id: string;
  purifierCode: string;
  name: string;
  location: string;
  building: string;
  floor: string;
  status: PurifierStatus;
  isPhysicalHardware: boolean;
  modelType: string;
  deviceId?: string;
  installationDate: string | Date;
  lastMaintenance?: string | Date | null;
  nextMaintenanceDue?: string | Date | null;
  currentTelemetry: TelemetryReading;
  filter: FilterInfo | null;
  device?: DeviceInfo;
  cameraDevice?: CameraDeviceInfo;
  prediction?: PredictionInfo;
  scenario?: SimulationScenario;
  alerts?: AlertItem[];
  maintenanceRecords?: MaintenanceRecordItem[];
  livePredictiveAnalysis?: PredictionInfo;
}

export interface DashboardOverview {
  kpis: {
    totalPurifiers: number;
    healthyCount: number;
    warningCount: number;
    criticalCount: number;
    offlineCount: number;
    maintenanceDueCount: number;
  };
  averages: {
    avgWqi: number;
    avgTds: number;
    avgTurbidity: number;
    avgFlow: number;
    avgPh: number;
    avgWaterLevel?: number;
  };
  recentAlerts: AlertItem[];
  recentPredictions: PredictionInfo[];
  recentAiDetections?: AiDetectionItem[];
  simulationMode: boolean;
}
