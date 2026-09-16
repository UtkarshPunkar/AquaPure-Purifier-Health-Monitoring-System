import { Server } from 'socket.io';
import { prisma } from '../db';
import { calculateWQI } from './wqi.calculator';
import { runPredictiveAnalysis } from './predictive.engine';

export type SimulationScenario = 'NORMAL' | 'FILTER_DEGRADATION' | 'TURBIDITY_BURST' | 'TDS_SPIKE' | 'DEVICE_OFFLINE';

export const HARDWARE_TIMEOUT_MS = 10000; // 10s timeout: prompt unplug detection (~3 missed cycles)

interface PurifierSimState {
  purifierId: string;
  purifierCode: string;
  isPhysicalHardware: boolean;
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
  lastHardwareReadingTime?: Date;
}

export class SimulationEngine {
  private io: Server | null = null;
  private timer: NodeJS.Timeout | null = null;
  private states: Map<string, PurifierSimState> = new Map();
  private tickCounter = 0;
  public simulationMode = true;

  public setSocketServer(io: Server) {
    this.io = io;
  }

  public async initialize() {
    console.log('⚡ Initializing Simulation & Physics Engine...');
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
      const isPhysicalHardware = Boolean(p.isPhysicalHardware || p.purifierCode === 'WP-1' || p.purifierCode === 'PUR-001');

      let lastHardwareReadingTime: Date | undefined = undefined;
      let isOffline = isPhysicalHardware;

      if (isPhysicalHardware) {
        if (latest && (latest.source === 'HARDWARE_PICO_W' || latest.source === 'HARDWARE')) {
          const timeSince = Date.now() - new Date(latest.timestamp).getTime();
          if (timeSince < HARDWARE_TIMEOUT_MS) {
            lastHardwareReadingTime = new Date(latest.timestamp);
            isOffline = false;
          } else {
            isOffline = true;
          }
        } else {
          isOffline = p.status === 'INACTIVE';
        }
      }

      this.states.set(p.id, {
        purifierId: p.id,
        purifierCode: p.purifierCode,
        isPhysicalHardware,
        scenario: p.purifierCode === 'PUR-005' || p.purifierCode === 'WP-5' ? 'FILTER_DEGRADATION' : 'NORMAL',
        degradationMultiplier: p.purifierCode === 'PUR-005' || p.purifierCode === 'WP-5' ? 3.0 : 1.0,
        currentPh: latest ? latest.ph : 7.2,
        currentTds: latest ? latest.tds : 150,
        currentTurbidity: latest ? latest.turbidity : 0.45,
        currentTemperature: latest ? latest.temperature : 24.0,
        currentFlowRate: latest ? latest.flowRate : (isPhysicalHardware ? 2.2 : 2.4),
        currentFilterHealth: filter ? filter.healthScore : 90,
        isOffline,
        lastReadingTime: latest ? new Date(latest.timestamp) : new Date(),
        lastHardwareReadingTime,
      });
    }

    this.startLoop();
  }

  public isHardwareActive(purifierIdOrCode: string): boolean {
    for (const state of this.states.values()) {
      if (state.purifierId === purifierIdOrCode || state.purifierCode === purifierIdOrCode) {
        if (!state.isPhysicalHardware) return true;
        if (state.lastHardwareReadingTime) {
          const age = Date.now() - state.lastHardwareReadingTime.getTime();
          return age < HARDWARE_TIMEOUT_MS;
        }
        return false;
      }
    }
    return false;
  }

  public async setHardwareDisconnected(purifierCodeOrId: string = 'WP-1') {
    for (const [purifierId, state] of this.states.entries()) {
      if (state.purifierId === purifierCodeOrId || state.purifierCode === purifierCodeOrId || state.isPhysicalHardware) {
        state.isOffline = true;
        state.lastHardwareReadingTime = undefined;

        console.log(`🔌 [Hardware Node] Unplugged/Disconnected: ${state.purifierCode} -> Setting INACTIVE`);

        this.io?.emit('telemetry:offline', {
          purifierId,
          purifierCode: state.purifierCode,
          status: 'INACTIVE',
          lastSeen: null,
        });

        this.io?.emit('telemetry:update', {
          purifierId,
          purifierCode: state.purifierCode,
          timestamp: new Date(),
          ph: state.currentPh || 7.2,
          tds: state.currentTds || 150,
          turbidity: state.currentTurbidity || 0.45,
          temperature: state.currentTemperature || 24.0,
          flowRate: 0,
          wqiScore: 0,
          wqiStatus: 'STANDBY',
          filterHealth: state.currentFilterHealth,
          purifierStatus: 'INACTIVE',
          device: {
            status: 'INACTIVE',
            oledStatus: 'HARDWARE DISCONNECTED',
            ledStatus: 'OFF',
            buzzerStatus: false,
            wifiRssi: 0,
            lastSeen: null,
          },
          isPhysicalHardware: true,
          source: 'HARDWARE_PICO_W',
        });

        try {
          await prisma.purifier.update({
            where: { id: purifierId },
            data: { status: 'INACTIVE' },
          });
          await prisma.device.updateMany({
            where: { purifierId },
            data: {
              status: 'INACTIVE',
              oledStatus: 'HARDWARE DISCONNECTED',
              ledStatus: 'OFF',
              buzzerStatus: false,
            },
          });
        } catch (err) {
          console.error('Error updating disconnect state in DB:', err);
        }
      }
    }
  }

  public startLoop(intervalMs = 3000) {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => this.tick(), intervalMs);
    console.log(`📡 Simulation loop active (Ticker interval: ${intervalMs}ms)`);
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
      state.currentTds = state.purifierCode === 'PUR-005' || state.purifierCode === 'WP-5' ? 220 : 145;
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
    const isDbPersistTick = this.tickCounter % 5 === 0;

    for (const [purifierId, state] of this.states.entries()) {
      // Handle Physical Hardware Node (e.g. Filter 1 / Raspberry Pi Pico W)
      if (state.isPhysicalHardware) {
        const timeSinceHardware = state.lastHardwareReadingTime
          ? Date.now() - state.lastHardwareReadingTime.getTime()
          : Infinity;

        const isHwActive = timeSinceHardware < HARDWARE_TIMEOUT_MS;

        if (!isHwActive) {
          if (!state.isOffline) {
            state.isOffline = true;
            console.log(`🔌 [Hardware Watchdog] No packets for ${Math.round(timeSinceHardware / 1000)}s -> Setting INACTIVE`);
            
            this.io?.emit('telemetry:offline', {
              purifierId,
              purifierCode: state.purifierCode,
              status: 'INACTIVE',
              lastSeen: state.lastHardwareReadingTime || null,
            });

            this.io?.emit('telemetry:update', {
              purifierId,
              purifierCode: state.purifierCode,
              timestamp: new Date(),
              ph: state.currentPh || 7.2,
              tds: state.currentTds || 150,
              turbidity: state.currentTurbidity || 0.45,
              temperature: state.currentTemperature || 24.0,
              flowRate: 0,
              wqiScore: 0,
              wqiStatus: 'STANDBY',
              filterHealth: state.currentFilterHealth,
              purifierStatus: 'INACTIVE',
              device: {
                status: 'INACTIVE',
                oledStatus: 'HARDWARE DISCONNECTED',
                ledStatus: 'OFF',
                buzzerStatus: false,
                wifiRssi: 0,
                lastSeen: state.lastHardwareReadingTime || null,
              },
              isPhysicalHardware: true,
              source: 'HARDWARE_PICO_W',
            });

            try {
              await prisma.purifier.update({
                where: { id: purifierId },
                data: { status: 'INACTIVE' },
              });
              await prisma.device.updateMany({
                where: { purifierId },
                data: {
                  status: 'INACTIVE',
                  oledStatus: 'HARDWARE DISCONNECTED',
                  ledStatus: 'OFF',
                  buzzerStatus: false,
                },
              });
            } catch (err) {
              console.error('Error updating inactive status for hardware purifier in DB:', err);
            }
          }
          continue;
        } else {
          state.isOffline = false;
          continue;
        }
      }

      if (state.isOffline) {
        this.io?.emit('telemetry:offline', {
          purifierId,
          purifierCode: state.purifierCode,
          status: 'OFFLINE',
          lastSeen: state.lastReadingTime,
        });
        continue;
      }

      // Physics dynamics & coupled equations for simulated campus nodes
      if (state.scenario === 'FILTER_DEGRADATION') {
        state.currentFilterHealth = Math.max(15, state.currentFilterHealth - 0.08 * state.degradationMultiplier);
        state.currentFlowRate = Math.max(0.65, state.currentFlowRate - 0.008 + (Math.random() * 0.02 - 0.01));
        state.currentTds = Math.min(620, state.currentTds + 0.45 + (Math.random() * 2 - 1));
        state.currentTurbidity = Math.min(4.8, state.currentTurbidity + 0.008 + (Math.random() * 0.04 - 0.02));
      } else if (state.scenario === 'TURBIDITY_BURST') {
        state.currentTurbidity = Math.max(0.4, state.currentTurbidity - 0.04 + (Math.random() * 0.02 - 0.01));
        state.currentFilterHealth = Math.max(30, state.currentFilterHealth - 0.015);
      } else if (state.scenario === 'TDS_SPIKE') {
        state.currentTds = Math.max(150, state.currentTds - 1.2 + (Math.random() * 4 - 2));
      } else {
        state.currentPh += (Math.random() * 0.04 - 0.02);
        state.currentPh = Math.max(6.8, Math.min(7.8, state.currentPh));

        state.currentTds += (Math.random() * 1.6 - 0.8);
        state.currentTds = Math.max(110, Math.min(220, state.currentTds));

        state.currentTurbidity += (Math.random() * 0.02 - 0.01);
        state.currentTurbidity = Math.max(0.2, Math.min(1.1, state.currentTurbidity));

        state.currentFlowRate += (Math.random() * 0.04 - 0.02);
        state.currentFlowRate = Math.max(1.8, Math.min(3.2, state.currentFlowRate));

        state.currentTemperature += (Math.random() * 0.08 - 0.04);
        state.currentTemperature = Math.max(20.0, Math.min(27.0, state.currentTemperature));

        state.currentFilterHealth = Math.max(20, state.currentFilterHealth - 0.002);
      }

      state.lastReadingTime = new Date();

      const ph = Math.round(state.currentPh * 100) / 100;
      const tds = Math.round(state.currentTds * 10) / 10;
      const turbidity = Math.round(state.currentTurbidity * 100) / 100;
      const temperature = Math.round(state.currentTemperature * 10) / 10;
      const flowRate = Math.round(state.currentFlowRate * 100) / 100;
      const filterHealth = Math.round(state.currentFilterHealth * 10) / 10;

      const wqi = calculateWQI({ ph, tds, turbidity, temperature, flowRate });

      let purifierStatus = 'HEALTHY';
      let ledStatus = 'GREEN_NORMAL';
      let buzzerStatus = false;
      let oledText = `TDS:${tds.toFixed(0)} | pH:${ph.toFixed(1)} | WQI:${wqi.score}`;

      if (wqi.status === 'CRITICAL' || filterHealth < 40 || (flowRate < 0.9 && flowRate > 0.05)) {
        purifierStatus = 'CRITICAL';
        ledStatus = 'RED_CRITICAL';
        buzzerStatus = true;
        oledText = `ALERT! TDS:${tds.toFixed(0)} | CHK FILTER`;
      } else if (wqi.status === 'POOR' || wqi.status === 'FAIR' || filterHealth < 70 || (flowRate < 1.4 && flowRate > 0.05)) {
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

      this.io?.emit('telemetry:update', telemetryPayload);

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
        } catch (err) {
          console.error('Error during DB periodic tick persist:', err);
        }
      }
    }
  }

  // Handle incoming real hardware reading from Raspberry Pi Pico W (via Wi-Fi or USB Bridge)
  public async ingestHardwareReading(reading: {
    deviceId?: string;
    purifierCode?: string;
    ph: number;
    tds: number;
    turbidity: number;
    temperature: number;
    flowRate: number;
    waterLevel?: number;
    timestamp?: string;
  }) {
    const deviceId = reading.deviceId || 'PICO-W-001';
    const purifierCode = reading.purifierCode || 'WP-1';

    const purifier = await prisma.purifier.findFirst({
      where: {
        OR: [
          { deviceId: deviceId },
          { purifierCode: purifierCode },
          { purifierCode: 'WP-1' },
          { purifierCode: 'PUR-001' },
          { isPhysicalHardware: true },
        ],
      },
      include: { filters: true, device: true },
    });

    if (!purifier) {
      throw new Error(`Purifier not found for device ${deviceId} or code ${purifierCode}`);
    }

    const wqi = calculateWQI({
      ph: reading.ph,
      tds: reading.tds,
      turbidity: reading.turbidity,
      temperature: reading.temperature,
      flowRate: reading.flowRate,
    });

    const timestamp = reading.timestamp ? new Date(reading.timestamp) : new Date();

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

    const state = this.states.get(purifier.id);
    if (state) {
      state.currentPh = reading.ph;
      state.currentTds = reading.tds;
      state.currentTurbidity = reading.turbidity;
      state.currentTemperature = reading.temperature;
      state.currentFlowRate = reading.flowRate;
      state.lastReadingTime = timestamp;
      state.lastHardwareReadingTime = new Date();
      state.isOffline = false;
    }

    // Determine status: ACTIVE / HEALTHY (or Warning/Critical if water quality is breached)
    let purifierStatus = 'HEALTHY';
    let ledStatus = 'GREEN_NORMAL';
    let buzzerStatus = false;
    let oledText = `TDS:${reading.tds.toFixed(0)} | pH:${reading.ph.toFixed(1)} | WQI:${wqi.score}`;

    if (wqi.status === 'CRITICAL' || reading.tds > 450 || reading.turbidity > 5.0 || reading.ph < 6.0 || reading.ph > 9.0) {
      purifierStatus = 'CRITICAL';
      ledStatus = 'RED_CRITICAL';
      buzzerStatus = true;
      oledText = `ALERT! TDS:${reading.tds.toFixed(0)} | CHK PURIFIER`;
    } else if (wqi.status === 'POOR' || wqi.status === 'FAIR' || reading.tds > 280 || reading.turbidity > 1.5 || reading.ph < 6.5 || reading.ph > 8.5) {
      purifierStatus = 'WARNING';
      ledStatus = 'YELLOW_WARNING';
      oledText = `WARN: TDS:${reading.tds.toFixed(0)} | pH ${reading.ph.toFixed(1)}`;
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
      waterLevel: reading.waterLevel ?? 82,
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
      isPhysicalHardware: true,
      source: 'HARDWARE_PICO_W',
    };

    this.io?.emit('telemetry:update', telemetryPayload);

    return { success: true, readingId: savedReading.id, wqi, purifierStatus };
  }
}

export const simulationEngine = new SimulationEngine();
