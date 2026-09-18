import { Request, Response } from 'express';
import { prisma } from '../db';
import { simulationEngine } from '../engine/simulation.engine';
import { runPredictiveAnalysis } from '../engine/predictive.engine';

export async function getAllPurifiers(req: Request, res: Response) {
  try {
    const purifiers = await prisma.purifier.findMany({
      include: {
        filters: true,
        device: true,
        cameraDevice: true,
        sensorReadings: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
        predictions: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
      orderBy: { purifierCode: 'asc' },
    });

    const enriched = purifiers.map((p) => {
      const liveState = simulationEngine.getState(p.id);
      const latestReading = p.sensorReadings[0];
      const filter = p.filters[0];
      const prediction = p.predictions[0];
      const isPhysical = Boolean(p.isPhysicalHardware || p.purifierCode === 'WP-1' || p.purifierCode === 'PUR-001');
      const isHwActive = simulationEngine.isHardwareActive(p.id);

      const status = isPhysical ? (isHwActive ? (p.status === 'INACTIVE' ? 'HEALTHY' : p.status) : 'INACTIVE') : p.status;
      const deviceStatus = isPhysical ? (isHwActive ? 'ONLINE' : 'INACTIVE') : (p.device?.status || 'ONLINE');

      const ph = liveState?.currentPh ?? latestReading?.ph ?? 7.2;
      const tds = liveState?.currentTds ?? latestReading?.tds ?? 150;
      const turbidity = liveState?.currentTurbidity ?? latestReading?.turbidity ?? 0.4;
      const temperature = liveState?.currentTemperature ?? latestReading?.temperature ?? 24.0;
      const flowRate = liveState?.currentFlowRate ?? latestReading?.flowRate ?? 2.4;

      return {
        id: p.id,
        purifierCode: p.purifierCode,
        name: p.name,
        location: p.location,
        building: p.building,
        floor: p.floor,
        status,
        isPhysicalHardware: isPhysical,
        modelType: p.modelType,
        deviceId: p.deviceId,
        installationDate: p.installationDate,
        lastMaintenance: p.lastMaintenance,
        nextMaintenanceDue: p.nextMaintenanceDue,
        currentTelemetry: {
          ph: isPhysical && !isHwActive ? (liveState?.currentPh || 7.2) : ph,
          tds: isPhysical && !isHwActive ? (liveState?.currentTds || 150) : tds,
          turbidity: isPhysical && !isHwActive ? (liveState?.currentTurbidity || 0.4) : turbidity,
          temperature: isPhysical && !isHwActive ? (liveState?.currentTemperature || 24.0) : temperature,
          flowRate: isPhysical && !isHwActive ? 0 : flowRate,
          wqiScore: isPhysical && !isHwActive ? 0 : (latestReading?.wqiScore ?? 90),
          wqiStatus: isPhysical && !isHwActive ? 'STANDBY' : (latestReading?.wqiStatus ?? 'EXCELLENT'),
          lastSeen: isPhysical && !isHwActive ? (liveState?.lastHardwareReadingTime || null) : (liveState?.lastReadingTime ?? latestReading?.timestamp ?? new Date()),
        },
        filter: filter
          ? {
              id: filter.id,
              healthScore: liveState ? liveState.currentFilterHealth : filter.healthScore,
              degradationRate: filter.degradationRate,
              estimatedRemainingLifeDays: filter.estimatedRemainingLifeDays,
              flowResistanceIndex: filter.flowResistanceIndex,
              status: filter.status,
            }
          : null,
        device: p.device ? {
          ...p.device,
          status: deviceStatus,
          oledStatus: isPhysical && !isHwActive ? 'HARDWARE DISCONNECTED' : p.device.oledStatus,
          ledStatus: isPhysical && !isHwActive ? 'OFF' : p.device.ledStatus,
          buzzerStatus: isPhysical && !isHwActive ? false : p.device.buzzerStatus,
        } : null,
        prediction: prediction,
        scenario: liveState?.scenario ?? 'NORMAL',
      };
    });

    return res.json(enriched);
  } catch (error) {
    console.error('getAllPurifiers error:', error);
    return res.status(500).json({ error: 'Failed to fetch purifiers' });
  }
}

export async function getPurifierById(req: Request, res: Response) {
  try {
    const id = String(req.params.id);

    const purifier = await prisma.purifier.findFirst({
      where: {
        OR: [{ id: id }, { purifierCode: id }],
      },
      include: {
        filters: true,
        device: true,
        cameraDevice: true,
        predictions: {
          orderBy: { timestamp: 'desc' },
          take: 5,
        },
        alerts: {
          orderBy: { timestamp: 'desc' },
          take: 10,
        },
        maintenanceRecords: {
          orderBy: { date: 'desc' },
          take: 10,
        },
        sensorReadings: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
    });

    if (!purifier) {
      return res.status(404).json({ error: 'Purifier not found' });
    }

    const liveState = simulationEngine.getState(purifier.id);
    const filter = purifier.filters[0] || null;
    const latestReading = purifier.sensorReadings[0];
    const isPhysical = Boolean(purifier.isPhysicalHardware || purifier.purifierCode === 'WP-1' || purifier.purifierCode === 'PUR-001');
    const isHwActive = simulationEngine.isHardwareActive(purifier.id);

    const status = isPhysical ? (isHwActive ? (purifier.status === 'INACTIVE' ? 'HEALTHY' : purifier.status) : 'INACTIVE') : purifier.status;
    const deviceStatus = isPhysical ? (isHwActive ? 'ONLINE' : 'INACTIVE') : (purifier.device?.status || 'ONLINE');

    const ph = liveState?.currentPh ?? latestReading?.ph ?? 7.2;
    const tds = liveState?.currentTds ?? latestReading?.tds ?? 150;
    const turbidity = liveState?.currentTurbidity ?? latestReading?.turbidity ?? 0.4;
    const temperature = liveState?.currentTemperature ?? latestReading?.temperature ?? 24.0;
    const flowRate = liveState?.currentFlowRate ?? latestReading?.flowRate ?? 2.4;

    const recentReadings = await prisma.sensorReading.findMany({
      where: { purifierId: purifier.id },
      orderBy: { timestamp: 'desc' },
      take: 60,
    });

    const liveAnalysis = runPredictiveAnalysis(recentReadings, filter);

    return res.json({
      ...purifier,
      status,
      isPhysicalHardware: isPhysical,
      device: purifier.device ? {
        ...purifier.device,
        status: deviceStatus,
        oledStatus: isPhysical && !isHwActive ? 'HARDWARE DISCONNECTED' : purifier.device.oledStatus,
        ledStatus: isPhysical && !isHwActive ? 'OFF' : purifier.device.ledStatus,
        buzzerStatus: isPhysical && !isHwActive ? false : purifier.device.buzzerStatus,
      } : null,
      liveState: liveState || null,
      currentTelemetry: {
        ph: isPhysical && !isHwActive ? (liveState?.currentPh || 7.2) : ph,
        tds: isPhysical && !isHwActive ? (liveState?.currentTds || 150) : tds,
        turbidity: isPhysical && !isHwActive ? (liveState?.currentTurbidity || 0.4) : turbidity,
        temperature: isPhysical && !isHwActive ? (liveState?.currentTemperature || 24.0) : temperature,
        flowRate: isPhysical && !isHwActive ? 0 : flowRate,
        wqiScore: isPhysical && !isHwActive ? 0 : (latestReading?.wqiScore ?? 90),
        wqiStatus: isPhysical && !isHwActive ? 'STANDBY' : (latestReading?.wqiStatus ?? 'EXCELLENT'),
        filterHealth: liveState ? liveState.currentFilterHealth : filter?.healthScore ?? 90,
        lastSeen: isPhysical && !isHwActive ? (liveState?.lastHardwareReadingTime || null) : (liveState?.lastReadingTime ?? latestReading?.timestamp ?? new Date()),
      },
      livePredictiveAnalysis: liveAnalysis,
    });
  } catch (error) {
    console.error('getPurifierById error:', error);
    return res.status(500).json({ error: 'Failed to fetch purifier details' });
  }
}

export async function getPurifierReadings(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    const timeframe = (req.query.timeframe as string) || '24h';

    let hours = 24;
    if (timeframe === '7d') hours = 7 * 24;
    if (timeframe === '30d') hours = 30 * 24;

    const purifier = await prisma.purifier.findFirst({
      where: {
        OR: [{ id: id }, { purifierCode: id }],
      },
    });

    if (!purifier) {
      return res.status(404).json({ error: 'Purifier not found' });
    }

    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const readings = await prisma.sensorReading.findMany({
      where: {
        purifierId: purifier.id,
        timestamp: { gte: since },
      },
      orderBy: { timestamp: 'asc' },
    });

    // Downsample for chart responsiveness if dataset is large
    let sampledReadings = readings;
    if (readings.length > 80) {
      const step = Math.ceil(readings.length / 60);
      sampledReadings = readings.filter((_, idx) => idx % step === 0 || idx === readings.length - 1);
    }

    return res.json(sampledReadings);
  } catch (error) {
    console.error('getPurifierReadings error:', error);
    return res.status(500).json({ error: 'Failed to fetch sensor history' });
  }
}
