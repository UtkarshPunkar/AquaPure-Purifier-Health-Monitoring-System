import { Router } from 'express';
import * as authCtrl from '../controllers/auth.controller';
import * as purifierCtrl from '../controllers/purifier.controller';
import * as telemetryCtrl from '../controllers/telemetry.controller';
import * as predictionCtrl from '../controllers/prediction.controller';
import * as alertCtrl from '../controllers/alert.controller';
import * as maintenanceCtrl from '../controllers/maintenance.controller';
import * as deviceCtrl from '../controllers/device.controller';
import * as cameraCtrl from '../controllers/camera.controller';
import * as exportCtrl from '../controllers/export.controller';
import * as aiDetectionCtrl from '../controllers/aiDetection.controller';
import * as userCtrl from '../controllers/user.controller';
import * as settingCtrl from '../controllers/setting.controller';

const router = Router();

// Auth
router.post('/auth/login', authCtrl.login);
router.get('/auth/me', authCtrl.getMe);

// Dashboard Overview / Summary
router.get('/dashboard/overview', telemetryCtrl.getDashboardOverview);
router.get('/dashboard/summary', telemetryCtrl.getDashboardOverview);

// Purifiers
router.get('/purifiers', purifierCtrl.getAllPurifiers);
router.get('/purifiers/:id', purifierCtrl.getPurifierById);
router.get('/purifiers/:id/readings', purifierCtrl.getPurifierReadings);

// IoT Ingestion (Raspberry Pi Pico W standard endpoint)
router.post('/iot/sensor-data', telemetryCtrl.ingestIotSensorData);
router.post('/devices/readings', telemetryCtrl.ingestPicoWReading);

// Simulation Controls
router.post('/simulation/scenario', telemetryCtrl.triggerScenario);
router.post('/simulation/reset', telemetryCtrl.resetSimulation);

// Predictions / AI Insights
router.get('/predictions', predictionCtrl.getAllPredictions);
router.get('/predictions/:purifierId', predictionCtrl.getPredictionsByPurifier);

// AI Contaminant Vision Detections
router.get('/ai-detections', aiDetectionCtrl.getAllAiDetections);
router.post('/ai-detections', aiDetectionCtrl.createAiScan);
router.post('/ai-detections/scan', aiDetectionCtrl.createAiScan);

// Alerts
router.get('/alerts', alertCtrl.getAllAlerts);
router.patch('/alerts/:id/acknowledge', alertCtrl.acknowledgeAlert);
router.patch('/alerts/:id/resolve', alertCtrl.resolveAlert);

// Maintenance
router.get('/maintenance', maintenanceCtrl.getMaintenanceLogs);
router.post('/maintenance', maintenanceCtrl.scheduleMaintenance);
router.patch('/maintenance/:id/complete', maintenanceCtrl.completeMaintenance);

// Admin User Management
router.get('/users', userCtrl.getAllUsers);
router.post('/users', userCtrl.createUser);
router.put('/users/:id', userCtrl.updateUser);
router.delete('/users/:id', userCtrl.deleteUser);

// System Settings
router.get('/settings', settingCtrl.getSettings);
router.put('/settings', settingCtrl.updateSettings);

// Devices / Hardware Gateway
router.get('/devices', deviceCtrl.getAllDevices);
router.get('/devices/:deviceId', deviceCtrl.getDeviceById);
router.patch('/devices/:deviceId/status', deviceCtrl.updateDeviceStatus);

// Camera / ESP32-CAM
router.get('/camera', cameraCtrl.getAllCameras);
router.post('/camera/:deviceId/snapshot', cameraCtrl.captureSnapshot);

// Exports
router.get('/export/telemetry', exportCtrl.exportTelemetryCsv);
router.get('/export/maintenance', exportCtrl.exportMaintenanceCsv);

export default router;
