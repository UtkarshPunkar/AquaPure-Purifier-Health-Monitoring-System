import { Server } from 'socket.io';
import { prisma } from '../db';
import { calculateWQI } from './wqi.calculator';
import { runPredictiveAnalysis } from './predictive.engine';

export type SimulationScenario = 'NORMAL' | 'FILTER_DEGRADATION' | 'TURBIDITY_BURST' | 'TDS_SPIKE' | 'DEVICE_OFFLINE';

interface PurifierSimState {
  purifierId: string;
  purifierCode: string;
  scenario: SimulationScenario;
  degradationMultiplier: number;
  currentPh: number;
  currentTds: number;
  currentTurbidity: number;
  currentTemperature: number;
  currentFlowRate: number;
  currentFilterHealth: number;
  isOffline: boolean;
  lastReadingTime: Date;
}

export class SimulationEngine {
  private io: Server | null = null;
  private timer: NodeJS.Timeout | null = null;
  private states: Map<string, PurifierSimState> = new Map();
  private tickCounter = 0;
  public simulationMode = true; // Can be toggled

  public setSocketServer(io: Server) {
    this.io = io;
  }

  public async initialize() {
    console.log('🔄 Initializing Simulation & Physics Engine...');
    const purifiers = await prisma.purifier.findMany({
      include: {
        filters: true,
        sensorReadings: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
    });

    for (const p of purifiers) {
      const latest = p.sensorReadings[0];
      const filter = p.filters[0];

      this.states.set(p.id, {
        purifierId: p.id,
        purifierCode: p.purifierCode,
        scenario: p.purifierCode === 'PUR-005' ? 'FILTER_DEGRADATION' : 'NORMAL',
        degradationMultiplier: p.purifierCode === 'PUR-005' ? 3.0 : 1.0,
        currentPh: latest ? latest.ph : 7.2,
        currentTds: latest ? latest.tds : 150,
        currentTurbidity: latest ? latest.turbidity : 0.45,
        currentTemperature: latest ? latest.temperature : 24.0,
        currentFlowRate: latest ? latest.flowRate : 2.4,
        currentFilterHealth: filter ? filter.healthScore : 90,
        isOffline: false,
        lastReadingTime: new Date(),
      });
    }

    this.startLoop();
  }

  public startLoop(intervalMs = 3000) {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => this.tick(), intervalMs);
    console.log(`⚡ Simulation loop active (Ticker interval: ${intervalMs}ms)`);
  }

  public stopLoop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public setScenario(purifierId: string, scenario: SimulationScenario) {
    const state = this.states.get(purifierId);
    if (!state) return false;

    state.scenario = scenario;
    if (scenario === 'FILTER_DEGRADATION') {
      state.degradationMultiplier = 4.5;
      state.isOffline = false;
    } else if (scenario === 'TURBIDITY_BURST') {
      state.currentTurbidity = 3.8;
      state.isOffline = false;
    } else if (scenario === 'TDS_SPIKE') {
      state.currentTds = 490;
      state.isOffline = false;
    } else if (scenario === 'DEVICE_OFFLINE') {
      state.isOffline = true;
    } else if (scenario === 'NORMAL') {
      state.scenario = 'NORMAL';
      state.degradationMultiplier = 1.0;
      state.isOffline = false;
      state.currentTds = state.purifierCode === 'PUR-005' ? 220 : 145;
      state.currentTurbidity = 0.4;
      state.currentFlowRate = 2.4;
      state.currentPh = 7.25;
    }

    console.log(`🧪 Scenario [${scenario}] activated on purifier ${state.purifierCode}`);
    return true;
  }

  public async triggerReset(purifierId?: string) {
    if (purifierId) {
      this.setScenario(purifierId, 'NORMAL');
      const state = this.states.get(purifierId);
      if (state) state.currentFilterHealth = 98;
      await prisma.filter.updateMany({
        where: { purifierId },
        data: { healthScore: 98, status: 'OPTIMAL', degradationRate: 0.35, estimatedRemainingLifeDays: 85 },
      });
      await prisma.purifier.update({
        where: { id: purifierId },
        data: { status: 'HEALTHY' },
      });
    } else {
      for (const [id] of this.states) {
        this.setScenario(id, 'NORMAL');
        const state = this.states.get(id);
        if (state) state.currentFilterHealth = 95;
      }
      await prisma.filter.updateMany({
        data: { healthScore: 95, status: 'OPTIMAL', degradationRate: 0.35, estimatedRemainingLifeDays: 80 },
      });
      await prisma.purifier.updateMany({
        data: { status: 'HEALTHY' },
      });
    }
  }

  public getState(purifierId: string) {
    return this.states.get(purifierId);
  }

  public getAllStates() {
    return Array.from(this.states.values());
  }

  private async tick() {
    this.tickCounter++;
    const isDbPersistTick = this.tickCounter % 5 === 0; // Save to DB every 15s to keep historical trend crisp

    for (const [purifierId, state] of this.states.entries()) {
      if (state.isOffline) {
        // Emit offline status
        this.io?.emit('telemetry:offline', {
          purifierId,
          purifierCode: state.purifierCode,
          status: 'OFFLINE',
          lastSeen: state.lastReadingTime,
        });
        continue;
      }

      // Physics dynamics & coupled equations
      if (state.scenario === 'FILTER_DEGRADATION') {
        // Filter health decreases by ~0.08% per tick under accelerated mode
        state.currentFilterHealth = Math.max(15, state.currentFilterHealth - 0.08 * state.degradationMultiplier);
        // Flow rate reduces as pore fouling builds up
        state.currentFlowRate = Math.max(0.65, state.currentFlowRate - 0.008 + (Math.random() * 0.02 - 0.01));
        // TDS rises as RO membrane rejection efficiency deteriorates
        state.currentTds = Math.min(620, state.currentTds + 0.45 + (Math.random() * 2 - 1));
        // Turbidity slowly creeps
        state.currentTurbidity = Math.min(4.8, state.currentTurbidity + 0.008 + (Math.random() * 0.04 - 0.02));
      } else if (state.scenario === 'TURBIDITY_BURST') {
        state.currentTurbidity = Math.max(0.4, state.currentTurbidity - 0.04 + (Math.random() * 0.02 - 0.01));
        if (state.currentTurbidity <= 0.6) state.scenario = 'NORMAL';
      } else if (state.scenario === 'TDS_SPIKE') {
        state.currentTds = Math.max(150, state.currentTds - 1.5 + (Math.random() * 2 - 1));
        if (state.currentTds <= 220) state.scenario = 'NORMAL';
      } else {
        // Normal gentle telemetry oscillations
        state.currentPh += (Math.random() * 0.04 - 0.02);
        state.currentPh = Math.max(6.8, Math.min(7.8, state.currentPh));

        state.currentTds += (Math.random() * 1.2 - 0.6);
        state.currentTds = Math.max(110, Math.min(320, state.currentTds));

        state.currentTurbidity += (Math.random() * 0.02 - 0.01);
        state.currentTurbidity = Math.max(0.2, Math.min(1.1, state.currentTurbidity));

        state.currentFlowRate += (Math.random() * 0.04 - 0.02);
        state.currentFlowRate = Math.max(1.8, Math.min(3.2, state.currentFlowRate));

        state.currentTemperature += (Math.random() * 0.08 - 0.04);
        state.currentTemperature = Math.max(20.0, Math.min(27.0, state.currentTemperature));

        state.currentFilterHealth = Math.max(20, state.currentFilterHealth - 0.002);
      }

      state.lastReadingTime = new Date();

      // Rounded metrics
      const ph = Math.round(state.currentPh * 100) / 100;
      const tds = Math.round(state.currentTds * 10) / 10;
      const turbidity = Math.round(state.currentTurbidity * 100) / 100;
      const temperature = Math.round(state.currentTemperature * 10) / 10;
      const flowRate = Math.round(state.currentFlowRate * 100) / 100;
      const filterHealth = Math.round(state.currentFilterHealth * 10) / 10;

      // Calculate WQI
      const wqi = calculateWQI({ ph, tds, turbidity, temperature, flowRate });

      // Determine Purifier Overall Status & LED / Buzzer
      let purifierStatus = 'HEALTHY';
      let ledStatus = 'GREEN_NORMAL';
      let buzzerStatus = false;
      let oledText = `TDS:${tds.toFixed(0)} | pH:${ph.toFixed(1)} | WQI:${wqi.score}`;

      if (wqi.status === 'CRITICAL' || filterHealth < 40 || flowRate < 0.9) {
        purifierStatus = 'CRITICAL';
        ledStatus = 'RED_CRITICAL';
        buzzerStatus = true;
        oledText = `ALERT! TDS:${tds.toFixed(0)} | CHK FILTER`;
      } else if (wqi.status === 'POOR' || wqi.status === 'FAIR' || filterHealth < 70 || flowRate < 1.4) {
        purifierStatus = 'WARNING';
        ledStatus = 'YELLOW_WARNING';
        buzzerStatus = false;
        oledText = `WARN: FLT ${filterHealth}% | TDS:${tds.toFixed(0)}`;
      }

      const telemetryPayload = {
        purifierId,
        purifierCode: state.purifierCode,
        timestamp: state.lastReadingTime,
        ph,
        tds,
        turbidity,
        temperature,
        flowRate,
        wqiScore: wqi.score,
        wqiStatus: wqi.status,
        filterHealth,
        purifierStatus,
        device: {
          status: 'ONLINE',
          oledStatus: oledText,
          ledStatus,
          buzzerStatus,
          wifiRssi: -58,
          lastSeen: state.lastReadingTime,
        },
        source: 'SIMULATION',
      };

      // Broadcast live telemetry via Socket.IO
      this.io?.emit('telemetry:update', telemetryPayload);

      // Periodically persist to SQLite DB
      if (isDbPersistTick) {
        try {
          await prisma.sensorReading.create({
            data: {
              purifierId,
              timestamp: state.lastReadingTime,
              ph,
              tds,
              turbidity,
              temperature,
              flowRate,
              wqiScore: wqi.score,
              wqiStatus: wqi.status,
              source: 'SIMULATION',
            },
          });

          await prisma.filter.updateMany({
            where: { purifierId },
            data: {
              healthScore: filterHealth,
              estimatedRemainingLifeDays: Math.max(1, Math.round((filterHealth - 20) / (state.degradationMultiplier * 0.4))),
              status: filterHealth < 40 ? 'CRITICAL_REPLACE' : filterHealth < 70 ? 'DEGRADED' : 'OPTIMAL',
            },
          });

          await prisma.purifier.update({
            where: { id: purifierId },
            data: { status: purifierStatus },
          });

          await prisma.device.updateMany({
            where: { purifierId },
            data: {
              lastSeen: state.lastReadingTime,
              status: 'ONLINE',
              oledStatus: oledText,
              ledStatus,
              buzzerStatus,
            },
          });

          // Check if new predictive alert should be raised
          if (purifierStatus === 'CRITICAL' && state.scenario === 'FILTER_DEGRADATION') {
            const existingRecentAlert = await prisma.alert.findFirst({
              where: {
                purifierId,
                title: { contains: 'Critical Filter Media Exhaustion' },
                timestamp: { gte: new Date(Date.now() - 5 * 60 * 1000) },
              },
            });

            if (!existingRecentAlert) {
              const newAlert = await prisma.alert.create({
                data: {
                  purifierId,
                  severity: 'CRITICAL',
                  type: 'PREDICTIVE',
                  category: 'FILTER_HEALTH',
                  title: `Critical Filter Media Exhaustion (${state.purifierCode})`,
                  message: `Active degradation slope has reduced filter health to ${filterHealth}%. Flow rate restricted to ${flowRate} L/min.`,
                  recommendation: 'Replace RO Membrane and Pre-Carbon filter set immediately.',
                  timestamp: new Date(),
                },
              });
              this.io?.emit('alert:new', newAlert);
            }
          }
        } catch (err) {
          console.error('Error during DB periodic tick persist:', err);
        }
      }
    }
  }

  // Handle incoming real hardware reading from Raspberry Pi Pico W
  public async ingestHardwareReading(reading: {
    deviceId: string;
    purifierCode: string;
    ph: number;
    tds: number;
    turbidity: number;
    temperature: number;
    flowRate: number;
    timestamp?: string;
  }) {
    const purifier = await prisma.purifier.findFirst({
      where: {
        OR: [{ deviceId: reading.deviceId }, { purifierCode: reading.purifierCode }],
      },
      include: { filters: true },
    });

    if (!purifier) {
      throw new Error(`Purifier not found for device ${reading.deviceId} or code ${reading.purifierCode}`);
    }

    const wqi = calculateWQI({
      ph: reading.ph,
      tds: reading.tds,
      turbidity: reading.turbidity,
      temperature: reading.temperature,
      flowRate: reading.flowRate,
    });

    const timestamp = reading.timestamp ? new Date(reading.timestamp) : new Date();

    // Persist reading
    const savedReading = await prisma.sensorReading.create({
      data: {
        purifierId: purifier.id,
        timestamp,
        ph: reading.ph,
        tds: reading.tds,
        turbidity: reading.turbidity,
        temperature: reading.temperature,
        flowRate: reading.flowRate,
        wqiScore: wqi.score,
        wqiStatus: wqi.status,
        source: 'HARDWARE_PICO_W',
      },
    });

    // Update state memory
    const state = this.states.get(purifier.id);
    if (state) {
      state.currentPh = reading.ph;
      state.currentTds = reading.tds;
      state.currentTurbidity = reading.turbidity;
      state.currentTemperature = reading.temperature;
      state.currentFlowRate = reading.flowRate;
      state.lastReadingTime = timestamp;
      state.isOffline = false;
    }

    // Determine status & device twin
    let purifierStatus = 'HEALTHY';
    let ledStatus = 'GREEN_NORMAL';
    let buzzerStatus = false;
    let oledText = `TDS:${reading.tds.toFixed(0)} | pH:${reading.ph.toFixed(1)} | WQI:${wqi.score}`;

    if (wqi.status === 'CRITICAL' || reading.flowRate < 0.9) {
      purifierStatus = 'CRITICAL';
      ledStatus = 'RED_CRITICAL';
      buzzerStatus = true;
      oledText = `ALERT! TDS:${reading.tds.toFixed(0)} | CHK PURIFIER`;
    } else if (wqi.status === 'POOR' || wqi.status === 'FAIR' || reading.flowRate < 1.4) {
      purifierStatus = 'WARNING';
      ledStatus = 'YELLOW_WARNING';
      oledText = `WARN: TDS:${reading.tds.toFixed(0)} | FLOW ${reading.flowRate}L`;
    }

    await prisma.purifier.update({
      where: { id: purifier.id },
      data: { status: purifierStatus },
    });

    await prisma.device.updateMany({
      where: { purifierId: purifier.id },
      data: {
        lastSeen: timestamp,
        status: 'ONLINE',
        oledStatus: oledText,
        ledStatus,
        buzzerStatus,
      },
    });

    // Broadcast live telemetry
    const telemetryPayload = {
      purifierId: purifier.id,
      purifierCode: purifier.purifierCode,
      timestamp,
      ph: reading.ph,
      tds: reading.tds,
      turbidity: reading.turbidity,
      temperature: reading.temperature,
      flowRate: reading.flowRate,
      wqiScore: wqi.score,
      wqiStatus: wqi.status,
      filterHealth: state ? state.currentFilterHealth : 90,
      purifierStatus,
      device: {
        status: 'ONLINE',
        oledStatus: oledText,
        ledStatus,
        buzzerStatus,
        wifiRssi: -52,
        lastSeen: timestamp,
      },
      source: 'HARDWARE_PICO_W',
    };

    this.io?.emit('telemetry:update', telemetryPayload);

    return { success: true, readingId: savedReading.id, wqi };
  }
}

export const simulationEngine = new SimulationEngine();
