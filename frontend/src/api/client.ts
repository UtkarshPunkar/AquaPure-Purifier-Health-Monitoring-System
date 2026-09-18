import axios from 'axios';
import {
  Purifier,
  DashboardOverview,
  AlertItem,
  PredictionInfo,
  TelemetryReading,
  MaintenanceRecordItem,
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
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('aquapure_auth_token') || localStorage.getItem('smart_water_token') || sessionStorage.getItem('smart_water_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('smart_water_token');
      localStorage.removeItem('smart_water_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const api = {
  // Authentication
  login: async (credentialsOrEmail: any, password?: string) => {
    const payload = typeof credentialsOrEmail === 'string'
      ? { email: credentialsOrEmail, password }
      : credentialsOrEmail;
    const res = await apiClient.post('/auth/login', payload);
    return res.data;
  },
  signup: async (data: any) => {
    const res = await apiClient.post('/auth/signup', data);
    return res.data;
  },
  getMe: async () => {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },
  sendOtp: async (email: string, purpose = 'LOGIN') => {
    const res = await apiClient.post('/auth/send-otp', { email, purpose });
    return res.data;
  },
  verifyOtp: async (email: string, otp: string) => {
    const res = await apiClient.post('/auth/verify-otp', { email, otp });
    return res.data;
  },
  resetPassword: async (data: { email: string; otp: string; newPassword: string }) => {
    const res = await apiClient.post('/auth/reset-password', data);
    return res.data;
  },
  updateProfile: async (data: { name?: string; organizationName?: string }) => {
    const res = await apiClient.put('/auth/profile', data);
    return res.data;
  },
  changePassword: async (data: { currentPassword?: string; newPassword: string }) => {
    const res = await apiClient.post('/auth/change-password', data);
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
  getPurifierReadings: async (id: string, timeframe = '24h'): Promise<any[]> => {
    const res = await apiClient.get(`/purifiers/${id}/readings?timeframe=${timeframe}`);
    return res.data;
  },

  // Dashboard Overview
  getDashboardOverview: async (): Promise<DashboardOverview> => {
    const res = await apiClient.get('/dashboard/overview');
    return res.data;
  },

  // Telemetry Ingestion (Pico W / IoT Hardware)
  ingestTelemetry: async (reading: {
    deviceId: string;
    purifierCode: string;
    ph: number;
    tds: number;
    turbidity: number;
    temperature: number;
    flowRate?: number;
    waterLevel?: number;
    timestamp?: string;
  }) => {
    const res = await apiClient.post('/iot/sensor-data', reading);
    return res.data;
  },
  ingestPicoWReading: async (reading: any) => {
    const res = await apiClient.post('/devices/readings', reading);
    return res.data;
  },

  // Simulation Controls
  triggerScenario: async (purifierId: string, scenario: SimulationScenario) => {
    const res = await apiClient.post('/simulation/scenario', { purifierId, scenario });
    return res.data;
  },
  resetSimulation: async (purifierId?: string) => {
    const res = await apiClient.post('/simulation/reset', { purifierId });
    return res.data;
  },

  // Predictions
  getPredictions: async (): Promise<PredictionInfo[]> => {
    const res = await apiClient.get('/predictions');
    return res.data;
  },
  getPredictionsByPurifier: async (purifierId: string): Promise<PredictionInfo[]> => {
    const res = await apiClient.get(`/predictions/${purifierId}`);
    return res.data;
  },

  // AI Contaminant Vision
  getAiDetections: async (): Promise<AiDetectionItem[]> => {
    const res = await apiClient.get('/ai-detections');
    return res.data;
  },
  runAiScan: async (purifierId: string, sampleType?: string, image?: string): Promise<{ message: string; scanResult: AiDetectionItem }> => {
    const res = await apiClient.post('/ai-detections/scan', { purifierId, sampleType, image });
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
    technician?: string;
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

  // Camera & ESP32-CAM Gateway
  getCameras: async (): Promise<CameraDeviceInfo[]> => {
    const res = await apiClient.get('/camera');
    return res.data;
  },
  getCameraStatus: async (deviceId = 'ESP32-CAM-1'): Promise<{
    deviceId: string;
    purifierCode: string;
    isOnline: boolean;
    status: 'ONLINE' | 'OFFLINE';
    streamUrl: string;
    resolution: string;
    lastSeen: string;
    opticalInspectionStatus: string;
  }> => {
    const res = await apiClient.get(`/camera/status/${deviceId}`);
    return res.data;
  },
  updateCameraConfig: async (data: { deviceId?: string; ipAddress?: string; streamUrl?: string; resolution?: string }) => {
    const res = await apiClient.post('/camera/config', data);
    return res.data;
  },
  autoDiscoverCamera: async () => {
    const res = await apiClient.post('/camera/auto-discover');
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
