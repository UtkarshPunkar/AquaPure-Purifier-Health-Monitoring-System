import axios from 'axios';
import {
  DashboardOverview,
  Purifier,
  AlertItem,
  MaintenanceRecordItem,
  PredictionInfo,
  DeviceInfo,
  CameraDeviceInfo,
  SimulationScenario,
  AiDetectionItem,
  UserItem,
  SystemSettingItem,
} from '../types';

const API_BASE = '/api';

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('smart_water_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const api = {
  // Auth
  login: async (email: string, password: string) => {
    const res = await apiClient.post('/auth/login', { email, password });
    return res.data;
  },
  getMe: async () => {
    const res = await apiClient.get('/auth/me');
    return res.data.user;
  },

  // Dashboard Overview
  getDashboardOverview: async (): Promise<DashboardOverview> => {
    const res = await apiClient.get('/dashboard/overview');
    return res.data;
  },

  // Purifiers
  getPurifiers: async (): Promise<Purifier[]> => {
    const res = await apiClient.get('/purifiers');
    return res.data;
  },
  getPurifierById: async (id: string): Promise<Purifier> => {
    const res = await apiClient.get(`/purifiers/${id}`);
    return res.data;
  },
  getPurifierReadings: async (id: string, timeframe: '24h' | '7d' | '30d' = '24h') => {
    const res = await apiClient.get(`/purifiers/${id}/readings?timeframe=${timeframe}`);
    return res.data;
  },

  // Simulation Controls & IoT Ingestion
  triggerScenario: async (purifierId: string, scenario: SimulationScenario) => {
    const res = await apiClient.post('/simulation/scenario', { purifierId, scenario });
    return res.data;
  },
  resetSimulation: async (purifierId?: string) => {
    const res = await apiClient.post('/simulation/reset', { purifierId });
    return res.data;
  },
  ingestPicoWReading: async (payload: {
    deviceId?: string;
    purifierCode?: string;
    purifier_id?: string;
    ph: number;
    tds: number;
    turbidity: number;
    temperature: number;
    flowRate?: number;
    water_level?: number;
  }) => {
    const res = await apiClient.post('/iot/sensor-data', payload);
    return res.data;
  },

  // Predictions / ML
  getPredictions: async (): Promise<PredictionInfo[]> => {
    const res = await apiClient.get('/predictions');
    return res.data;
  },
  getPredictionsByPurifier: async (purifierId: string): Promise<PredictionInfo> => {
    const res = await apiClient.get(`/predictions/${purifierId}`);
    return res.data;
  },

  // AI Contaminant Vision Detections
  getAiDetections: async (): Promise<AiDetectionItem[]> => {
    const res = await apiClient.get('/ai-detections');
    return res.data;
  },
  runAiScan: async (purifierId: string, sampleType?: string): Promise<{ message: string; scanResult: AiDetectionItem }> => {
    const res = await apiClient.post('/ai-detections/scan', { purifierId, sampleType });
    return res.data;
  },

  // Alerts
  getAlerts: async (params?: { severity?: string; type?: string; isResolved?: boolean }): Promise<AlertItem[]> => {
    const res = await apiClient.get('/alerts', { params });
    return res.data;
  },
  acknowledgeAlert: async (id: string): Promise<AlertItem> => {
    const res = await apiClient.patch(`/alerts/${id}/acknowledge`);
    return res.data;
  },
  resolveAlert: async (id: string): Promise<AlertItem> => {
    const res = await apiClient.patch(`/alerts/${id}/resolve`);
    return res.data;
  },

  // Maintenance
  getMaintenanceLogs: async (): Promise<MaintenanceRecordItem[]> => {
    const res = await apiClient.get('/maintenance');
    return res.data;
  },
  scheduleMaintenance: async (data: {
    purifierId: string;
    type: string;
    technician: string;
    date?: string;
    scheduledDate?: string;
    issue?: string;
    priority?: string;
    cost?: number;
    notes?: string;
  }): Promise<MaintenanceRecordItem> => {
    const res = await apiClient.post('/maintenance', data);
    return res.data;
  },
  completeMaintenance: async (
    id: string,
    data: { filterReplaced: boolean; notes?: string; technician?: string }
  ): Promise<MaintenanceRecordItem> => {
    const res = await apiClient.patch(`/maintenance/${id}/complete`, data);
    return res.data;
  },

  // Admin User Management
  getUsers: async (): Promise<UserItem[]> => {
    const res = await apiClient.get('/users');
    return res.data;
  },
  createUser: async (data: { name: string; email: string; password: string; role: string }): Promise<UserItem> => {
    const res = await apiClient.post('/users', data);
    return res.data;
  },
  updateUser: async (id: string, data: Partial<UserItem> & { password?: string }): Promise<UserItem> => {
    const res = await apiClient.put(`/users/${id}`, data);
    return res.data;
  },
  deleteUser: async (id: string) => {
    const res = await apiClient.delete(`/users/${id}`);
    return res.data;
  },

  // Settings
  getSettings: async (): Promise<SystemSettingItem> => {
    const res = await apiClient.get('/settings');
    return res.data;
  },
  updateSettings: async (data: Partial<SystemSettingItem>): Promise<{ message: string; settings: SystemSettingItem }> => {
    const res = await apiClient.put('/settings', data);
    return res.data;
  },

  // Devices & Hardware
  getDevices: async (): Promise<DeviceInfo[]> => {
    const res = await apiClient.get('/devices');
    return res.data;
  },
  getDeviceById: async (deviceId: string): Promise<DeviceInfo> => {
    const res = await apiClient.get(`/devices/${deviceId}`);
    return res.data;
  },

  // Camera
  getCameras: async (): Promise<CameraDeviceInfo[]> => {
    const res = await apiClient.get('/camera');
    return res.data;
  },
  captureCameraSnapshot: async (deviceId: string) => {
    const res = await apiClient.post(`/camera/${deviceId}/snapshot`);
    return res.data;
  },

  // Exports
  exportTelemetryUrl: (purifierId?: string, days = 30) => {
    return `/api/export/telemetry?days=${days}${purifierId ? `&purifierId=${purifierId}` : ''}`;
  },
  exportMaintenanceUrl: () => {
    return `/api/export/maintenance`;
  },
};
