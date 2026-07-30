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

      return {
        id: p.id,
        purifierCode: p.purifierCode,
        name: p.name,
        location: p.location,
        building: p.building,
        floor: p.floor,
        status: p.status,
        isPhysicalHardware: p.isPhysicalHardware,
        modelType: p.modelType,
        deviceId: p.deviceId,
        installationDate: p.installationDate,
        lastMaintenance: p.lastMaintenance,
        nextMaintenanceDue: p.nextMaintenanceDue,
        currentTelemetry: {
          ph: liveState ? liveState.currentPh : latestReading?.ph ?? 7.2,
          tds: liveState ? liveState.currentTds : latestReading?.tds ?? 150,
          turbidity: liveState ? liveState.currentTurbidity : latestReading?.turbidity ?? 0.4,
          temperature: liveState ? liveState.currentTemperature : latestReading?.temperature ?? 24.0,
          flowRate: liveState ? liveState.currentFlowRate : latestReading?.flowRate ?? 2.4,
          wqiScore: latestReading?.wqiScore ?? 90,
          wqiStatus: latestReading?.wqiStatus ?? 'EXCELLENT',
          lastSeen: liveState?.lastReadingTime ?? latestReading?.timestamp ?? new Date(),
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
        device: p.device,
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

    // Compute on-the-fly comprehensive predictive analysis using recent readings
    const recentReadings = await prisma.sensorReading.findMany({
      where: { purifierId: purifier.id },
      orderBy: { timestamp: 'desc' },
      take: 60,
    });

    const liveAnalysis = runPredictiveAnalysis(recentReadings, filter);

    return res.json({
      ...purifier,
      liveState: liveState || null,
      currentTelemetry: {
        ph: liveState ? liveState.currentPh : latestReading?.ph ?? 7.2,
        tds: liveState ? liveState.currentTds : latestReading?.tds ?? 150,
        turbidity: liveState ? liveState.currentTurbidity : latestReading?.turbidity ?? 0.4,
        temperature: liveState ? liveState.currentTemperature : latestReading?.temperature ?? 24.0,
        flowRate: liveState ? liveState.currentFlowRate : latestReading?.flowRate ?? 2.4,
        wqiScore: latestReading?.wqiScore ?? 90,
        wqiStatus: latestReading?.wqiStatus ?? 'EXCELLENT',
        filterHealth: liveState ? liveState.currentFilterHealth : filter?.healthScore ?? 90,
        lastSeen: liveState?.lastReadingTime ?? latestReading?.timestamp ?? new Date(),
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
    const timeframe = (req.query.timeframe as string) || '24h'; // 24h, 7d, 30d

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

    return res.json(readings);
  } catch (error) {
    console.error('getPurifierReadings error:', error);
    return res.status(500).json({ error: 'Failed to fetch sensor history' });
  }
}
