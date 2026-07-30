import { Request, Response } from 'express';
import { prisma } from '../db';
import { simulationEngine, SimulationScenario } from '../engine/simulation.engine';
import { z } from 'zod';

export async function getDashboardOverview(req: Request, res: Response) {
  try {
    const purifiers = await prisma.purifier.findMany({
      include: {
        filters: true,
        device: true,
        sensorReadings: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
    });

    const totalPurifiers = purifiers.length;
    let healthyCount = 0;
    let warningCount = 0;
    let criticalCount = 0;
    let offlineCount = 0;
    let maintenanceDueCount = 0;

    let totalWqi = 0;
    let totalTds = 0;
    let totalTurbidity = 0;
    let totalFlow = 0;
    let totalPh = 0;
    let readingCount = 0;

    for (const p of purifiers) {
      const liveState = simulationEngine.getState(p.id);
      const isOffline = liveState?.isOffline ?? (p.device?.status === 'OFFLINE');
      const status = isOffline ? 'OFFLINE' : (liveState ? (p.status) : p.status);
      const filter = p.filters[0];

      if (isOffline) {
        offlineCount++;
      } else if (status === 'HEALTHY') {
        healthyCount++;
      } else if (status === 'WARNING') {
        warningCount++;
      } else if (status === 'CRITICAL') {
        criticalCount++;
      }

      if ((filter && filter.healthScore < 40) || p.status === 'CRITICAL') {
        maintenanceDueCount++;
      }

      const reading = p.sensorReadings[0];
      if (reading) {
        totalWqi += reading.wqiScore;
        totalTds += reading.tds;
        totalTurbidity += reading.turbidity;
        totalFlow += reading.flowRate;
        totalPh += reading.ph;
        readingCount++;
      }
    }

    const recentAlerts = await prisma.alert.findMany({
      where: { isResolved: false },
      include: { purifier: true },
      orderBy: { timestamp: 'desc' },
      take: 6,
    });

    const recentPredictions = await prisma.prediction.findMany({
      include: { purifier: true },
      orderBy: { timestamp: 'desc' },
      take: 5,
    });

    return res.json({
      kpis: {
        totalPurifiers,
        healthyCount,
        warningCount,
        criticalCount,
        offlineCount,
        maintenanceDueCount,
      },
      averages: {
        avgWqi: readingCount > 0 ? Math.round((totalWqi / readingCount) * 10) / 10 : 92.4,
        avgTds: readingCount > 0 ? Math.round(totalTds / readingCount) : 185,
        avgTurbidity: readingCount > 0 ? Math.round((totalTurbidity / readingCount) * 100) / 100 : 0.65,
        avgFlow: readingCount > 0 ? Math.round((totalFlow / readingCount) * 100) / 100 : 2.25,
        avgPh: readingCount > 0 ? Math.round((totalPh / readingCount) * 100) / 100 : 7.32,
      },
      recentAlerts,
      recentPredictions,
      simulationMode: simulationEngine.simulationMode,
    });
  } catch (error) {
    console.error('getDashboardOverview error:', error);
    return res.status(500).json({ error: 'Failed to fetch dashboard overview' });
  }
}

// IoT Ingestion Schema for Raspberry Pi Pico W
const PicoWReadingSchema = z.object({
  deviceId: z.string().optional().default('PICO-W-001'),
  purifierCode: z.string().optional().default('WP-001'),
  purifier_id: z.string().optional(),
  ph: z.number().min(0).max(14),
  tds: z.number().min(0).max(5000),
  turbidity: z.number().min(0).max(100),
  temperature: z.number().min(0).max(100),
  flowRate: z.number().min(0).max(50).optional().default(2.2),
  water_level: z.number().min(0).max(100).optional().default(80),
  waterLevel: z.number().min(0).max(100).optional(),
  timestamp: z.string().optional(),
});

export async function ingestIotSensorData(req: Request, res: Response) {
  try {
    const parseResult = PicoWReadingSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Invalid sensor payload format',
        details: parseResult.error.format(),
      });
    }

    const data = parseResult.data;
    const purifierCode = data.purifier_id || data.purifierCode || 'WP-001';
    const deviceId = data.deviceId || 'PICO-W-001';

    const result = await simulationEngine.ingestHardwareReading({
      deviceId,
      purifierCode,
      ph: data.ph,
      tds: data.tds,
      turbidity: data.turbidity,
      temperature: data.temperature,
      flowRate: data.flowRate || 2.2,
      timestamp: data.timestamp,
    });

    return res.status(201).json({
      message: 'Telemetry packet successfully processed and evaluated against WHO/NSF safety thresholds',
      purifier_id: purifierCode,
      ingestedAt: new Date(),
      ...result,
    });
  } catch (error: any) {
    console.error('ingestIotSensorData error:', error);
    return res.status(500).json({ error: error.message || 'Failed to ingest sensor data' });
  }
}

export async function ingestPicoWReading(req: Request, res: Response) {
  try {
    const parseResult = PicoWReadingSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Invalid sensor payload format',
        details: parseResult.error.format(),
      });
    }

    const result = await simulationEngine.ingestHardwareReading(parseResult.data as any);
    return res.status(201).json({
      message: 'Sensor reading ingested successfully from Raspberry Pi Pico W',
      ...result,
    });
  } catch (error: any) {
    console.error('ingestPicoWReading error:', error);
    return res.status(500).json({ error: error.message || 'Failed to ingest sensor reading' });
  }
}

export async function triggerScenario(req: Request, res: Response) {
  try {
    const { purifierId, scenario } = req.body as { purifierId: string; scenario: SimulationScenario };

    if (!purifierId || !scenario) {
      return res.status(400).json({ error: 'purifierId and scenario are required' });
    }

    const success = simulationEngine.setScenario(purifierId, scenario);
    if (!success) {
      return res.status(404).json({ error: 'Purifier state not found' });
    }

    return res.json({
      message: `Scenario [${scenario}] triggered successfully for purifier ${purifierId}`,
      scenario,
    });
  } catch (error) {
    console.error('triggerScenario error:', error);
    return res.status(500).json({ error: 'Failed to trigger scenario' });
  }
}

export async function resetSimulation(req: Request, res: Response) {
  try {
    const { purifierId } = req.body;
    await simulationEngine.triggerReset(purifierId);
    return res.json({ message: 'Simulation reset to nominal healthy baseline.' });
  } catch (error) {
    console.error('resetSimulation error:', error);
    return res.status(500).json({ error: 'Failed to reset simulation' });
  }
}
