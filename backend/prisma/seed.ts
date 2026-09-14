import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { calculateWQI } from '../src/engine/wqi.calculator';
import { runPredictiveAnalysis } from '../src/engine/predictive.engine';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seed for AquaPure Smart Water Monitoring System...');

  // Clear existing
  try {
    await prisma.aiDetectionRecord.deleteMany();
    await prisma.alert.deleteMany();
    await prisma.prediction.deleteMany();
    await prisma.maintenanceRecord.deleteMany();
    await prisma.sensorReading.deleteMany();
    await prisma.filter.deleteMany();
    await prisma.cameraDevice.deleteMany();
    await prisma.device.deleteMany();
    await prisma.purifier.deleteMany();
    await prisma.user.deleteMany();
    await prisma.organization.deleteMany();
    await prisma.systemSetting.deleteMany();
  } catch (e) {
    console.log('Clearing tables info:', e);
  }

  // 1. Organization
  const org = await prisma.organization.create({
    data: {
      name: 'S.B. Jain Institute of Technology And Research',
      code: 'SBJAIN-CAMPUS-01',
      address: 'Katol Road, Nagpur, Maharashtra 441501',
    },
  });

  // 2. Users (Admin, Technical Head, Maintenance Staff, Viewer)
  const passwordHash = await bcrypt.hash('admin123', 10);
  const now = new Date();

  await prisma.user.create({
    data: {
      name: 'Mithilesh Kose',
      email: 'mithilesh@aquapure.edu',
      passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      lastLogin: new Date(now.getTime() - 10 * 60 * 1000),
      organizationId: org.id,
    },
  });

  await prisma.user.create({
    data: {
      name: 'Vedant Bhanarkar',
      email: 'vedant@aquapure.edu',
      passwordHash,
      role: 'TECHNICAL_HEAD',
      status: 'ACTIVE',
      lastLogin: new Date(now.getTime() - 45 * 60 * 1000),
      organizationId: org.id,
    },
  });

  await prisma.user.create({
    data: {
      name: 'Rajesh Sharma',
      email: 'rajesh@aquapure.edu',
      passwordHash,
      role: 'MAINTENANCE_STAFF',
      status: 'ACTIVE',
      lastLogin: new Date(now.getTime() - 3 * 3600 * 1000),
      organizationId: org.id,
    },
  });

  await prisma.user.create({
    data: {
      name: 'Priya Verma',
      email: 'priya@aquapure.edu',
      passwordHash,
      role: 'VIEWER',
      status: 'ACTIVE',
      lastLogin: new Date(now.getTime() - 24 * 3600 * 1000),
      organizationId: org.id,
    },
  });

  console.log('✅ Created organization and 4 role-based user accounts');

  // 3. System Settings
  await prisma.systemSetting.create({
    data: {
      organizationId: org.id,
      phMin: 6.5,
      phMax: 8.5,
      tdsMax: 300.0,
      turbidityMax: 5.0,
      tempMin: 10.0,
      tempMax: 35.0,
      filterWarning: 40.0,
      filterCritical: 20.0,
      emailAlerts: true,
      smsAlerts: false,
      pushAlerts: true,
      apiToken: 'aquapure_iot_live_sec_token_983742',
    },
    // 4. 5 Comprehensive Purifiers across Campus
  const purifierDefinitions = [
    {
      purifierCode: 'WP-001',
      name: 'Main Administrative Center Purifier',
      location: 'Main Administrative Block - Ground Floor Foyer',
      building: 'Main Administrative Block',
      floor: 'Ground Floor, Lobby West',
      deviceId: 'PICO-W-001',
      status: 'HEALTHY',
      isPhysicalHardware: true,
      modelType: 'Commercial Multi-Stage RO + UV + Active Carbon',
      baseHealth: 88,
      baseDegradation: 0.35,
      baseTds: 145,
      baseTurbidity: 0.42,
      baseFlow: 2.5,
      basePh: 7.25,
      baseTemp: 23.4,
      waterLevel: 84,
      profile: 'NORMAL',
    },
    {
      purifierCode: 'WP-002',
      name: 'Central Library Water Station',
      location: 'Central Library - 2nd Floor Reading Room',
      building: 'Knowledge Center',
      floor: 'Floor 2, Hall B',
      deviceId: 'PICO-W-002',
      status: 'HEALTHY',
      isPhysicalHardware: false,
      modelType: 'Industrial Heavy-Duty RO + UF',
      baseHealth: 95,
      baseDegradation: 0.25,
      baseTds: 128,
      baseTurbidity: 0.35,
      baseFlow: 2.7,
      basePh: 7.35,
      baseTemp: 22.8,
      waterLevel: 92,
      profile: 'OPTIMAL',
    },
    {
      purifierCode: 'WP-003',
      name: 'Computer Science Dept Purifier',
      location: 'Department of Computer Science - Block C',
      building: 'Computer Science Block',
      floor: '3rd Floor, Server Corridor',
      deviceId: 'PICO-W-003',
      status: 'WARNING',
      isPhysicalHardware: false,
      modelType: 'Commercial RO + UV + TDS Stabilizer',
      baseHealth: 64,
      baseDegradation: 0.95,
      baseTds: 285,
      baseTurbidity: 0.95,
      baseFlow: 1.55,
      basePh: 7.65,
      baseTemp: 25.1,
      waterLevel: 68,
      profile: 'DEGRADING_MEMBRANE',
    },
    {
      purifierCode: 'WP-004',
      name: 'Faculty & Executive Lounge Purifier',
      location: 'Administrative Wing - Faculty Common Hall',
      building: 'Admin Annex',
      floor: '1st Floor, Suite 108',
      deviceId: 'PICO-W-004',
      status: 'HEALTHY',
      isPhysicalHardware: false,
      modelType: 'Commercial RO + Carbon Filter',
      baseHealth: 82,
      baseDegradation: 0.45,
      baseTds: 172,
      baseTurbidity: 0.52,
      baseFlow: 2.35,
      basePh: 7.15,
      baseTemp: 23.9,
      waterLevel: 76,
      profile: 'NORMAL',
    },
    {
      purifierCode: 'WP-005',
      name: 'Campus Main Cafeteria Dispenser',
      location: 'Food Court & Dining Complex - Main Counter',
      building: 'Cafeteria Block',
      floor: 'Ground Floor, Dispenser 1',
      deviceId: 'PICO-W-005',
      status: 'CRITICAL',
      isPhysicalHardware: false,
      modelType: 'High-Capacity Multi-Stage Industrial Purifier',
      baseHealth: 34,
      baseDegradation: 2.2,
      baseTds: 465,
      baseTurbidity: 2.65,
      baseFlow: 0.95,
      basePh: 7.95,
      baseTemp: 26.8,
      waterLevel: 45,
      profile: 'SEVERE_FOULING',
    },
  ];

  let maintenanceTicketCounter = 1001;

  for (const def of purifierDefinitions) {
    const purifier = await prisma.purifier.create({
      data: {
        purifierCode: def.purifierCode,
        name: def.name,
        location: def.location,
        building: def.building,
        floor: def.floor,
        organizationId: org.id,
        deviceId: def.deviceId,
        status: def.status,
        isPhysicalHardware: def.isPhysicalHardware,
        modelType: def.modelType,
        installationDate: new Date(now.getTime() - 180 * 24 * 3600 * 1000),
        lastMaintenance: new Date(now.getTime() - 60 * 24 * 3600 * 1000),
        nextMaintenanceDue:
          def.status === 'CRITICAL'
            ? new Date(now.getTime() + 2 * 24 * 3600 * 1000)
            : new Date(now.getTime() + 25 * 24 * 3600 * 1000),
      },
    });

    const filter = await prisma.filter.create({
      data: {
        purifierId: purifier.id,
        filterType: 'Composite Carbon + 75 GPD RO Membrane + Sediment Pre-filter',
        installationDate: new Date(now.getTime() - 90 * 24 * 3600 * 1000),
        healthScore: def.baseHealth,
        degradationRate: def.baseDegradation,
        estimatedRemainingLifeDays: Math.max(2, Math.round((def.baseHealth - 20) / def.baseDegradation)),
        flowResistanceIndex: def.profile === 'SEVERE_FOULING' ? 3.4 : def.profile === 'DEGRADING_MEMBRANE' ? 2.1 : 1.1,
        dailyUsageLiters: Math.round(120 + Math.random() * 80),
        lastReplacementDate: new Date(now.getTime() - 90 * 24 * 3600 * 1000),
        predictedReplacementDate: new Date(
          now.getTime() + Math.max(2, Math.round((def.baseHealth - 20) / def.baseDegradation)) * 24 * 3600 * 1000
        ),
        status: def.baseHealth < 30 ? 'CRITICAL_REPLACE' : def.baseHealth < 65 ? 'DEGRADED' : 'OPTIMAL',
      },
    });

    // Device Twin
    const isOffline = def.status === 'OFFLINE';
    await prisma.device.create({
      data: {
        deviceId: def.deviceId,
        purifierId: purifier.id,
        deviceType: def.isPhysicalHardware ? 'Raspberry Pi Pico W Retrofit (Target Hardware)' : 'Simulated IoT Gateway Module',
        firmwareVersion: 'v2.4.1-pico-w',
        ipAddress: `192.168.1.${100 + parseInt(def.purifierCode.split('-')[1])}`,
        macAddress: `28:CD:C1:04:8A:${def.purifierCode.split('-')[1]}`,
        wifiRssi: isOffline ? -98 : -55 - Math.floor(Math.random() * 15),
        lastSeen: isOffline ? new Date(now.getTime() - 48 * 3600 * 1000) : now,
        status: isOffline ? 'OFFLINE' : 'ONLINE',
        oledStatus: def.status === 'CRITICAL' ? 'WARN: SERV DUE | TDS 465' : isOffline ? 'OFFLINE - NO SIGNAL' : 'ONLINE | TDS NOMINAL',
        ledStatus: def.status === 'CRITICAL' ? 'RED_CRITICAL' : def.status === 'WARNING' ? 'YELLOW_WARNING' : 'GREEN_NORMAL',
        buzzerStatus: def.status === 'CRITICAL',
      },
    });

    // Camera Twin
    await prisma.cameraDevice.create({
      data: {
        deviceId: `ESP32-CAM-${def.purifierCode.split('-')[1]}`,
        purifierId: purifier.id,
        resolution: '1600x1200 (UXGA OV2640)',
        streamUrl: `http://192.168.1.${120 + parseInt(def.purifierCode.split('-')[1])}:81/stream`,
        status: isOffline ? 'OFFLINE' : def.isPhysicalHardware ? 'ONLINE' : 'SIMULATED_STANDBY',
        opticalInspectionStatus:
          def.status === 'CRITICAL'
            ? 'SEDIMENT CARTRIDGE DISCOLORATION DETECTED'
            : isOffline
            ? 'FEED OFFLINE'
            : 'CLEAR - NO CONTAMINANTS DETECTED',
        lastSeen: isOffline ? new Date(now.getTime() - 48 * 3600 * 1000) : now,
      },
    });

    // Generate 30-Day realistic historical sensor readings
    const totalPoints = 90;
    const readingsData = [];

    for (let i = totalPoints; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 8 * 3600 * 1000);
      const dayFactor = (totalPoints - i) / totalPoints;
      const hourOfDay = timestamp.getHours();
      const isPeakHour = hourOfDay >= 10 && hourOfDay <= 17;

      let tds = def.baseTds;
      let turbidity = def.baseTurbidity;
      let flowRate = def.baseFlow;
      let ph = def.basePh;
      let temp = def.baseTemp + Math.sin((hourOfDay / 24) * Math.PI * 2) * 1.8;
      let waterLevel = def.waterLevel + Math.sin((hourOfDay / 12) * Math.PI) * 8;

      if (def.profile === 'SEVERE_FOULING') {
        tds = 180 + dayFactor * (def.baseTds - 180) + (Math.random() * 12 - 6);
        turbidity = 0.5 + dayFactor * (def.baseTurbidity - 0.5) + (isPeakHour ? Math.random() * 0.3 : 0);
        flowRate = Math.max(0.6, 2.5 - dayFactor * 1.55 + (Math.random() * 0.1 - 0.05));
        ph = 7.3 + dayFactor * 0.65 + (Math.random() * 0.08 - 0.04);
      } else if (def.profile === 'DEGRADING_MEMBRANE') {
        tds = 160 + dayFactor * (def.baseTds - 160) + (Math.random() * 10 - 5);
        turbidity = 0.45 + dayFactor * (def.baseTurbidity - 0.45) + (Math.random() * 0.1 - 0.05);
        flowRate = Math.max(1.2, 2.5 - dayFactor * 0.9 + (Math.random() * 0.1 - 0.05));
        ph = 7.2 + dayFactor * 0.4 + (Math.random() * 0.06 - 0.03);
      } else {
        tds = def.baseTds + dayFactor * 5 + (Math.random() * 6 - 3);
        turbidity = def.baseTurbidity + (isPeakHour ? 0.05 : 0) + (Math.random() * 0.04 - 0.02);
        flowRate = def.baseFlow - dayFactor * 0.1 + (Math.random() * 0.08 - 0.04);
        ph = def.basePh + (Math.random() * 0.08 - 0.04);
      }

      tds = Math.max(10, Math.round(tds * 10) / 10);
      turbidity = Math.max(0.05, Math.round(turbidity * 100) / 100);
      flowRate = Math.max(0, Math.round(flowRate * 100) / 100);
      ph = Math.max(5.5, Math.min(9.5, Math.round(ph * 100) / 100));
      temp = Math.round(temp * 10) / 10;
      waterLevel = Math.max(15, Math.min(100, Math.round(waterLevel)));

      const wqi = calculateWQI({ ph, tds, turbidity, temperature: temp, flowRate });

      readingsData.push({
        purifierId: purifier.id,
        timestamp,
        ph,
        tds,
        turbidity,
        temperature: temp,
        flowRate,
        waterLevel,
        wqiScore: wqi.score,
        wqiStatus: wqi.status,
        source: def.isPhysicalHardware ? 'HARDWARE_PICO_W' : 'SIMULATION',
      });
    }

    await prisma.sensorReading.createMany({ data: readingsData });

    // Predictions
    const allReadings = await prisma.sensorReading.findMany({
      where: { purifierId: purifier.id },
      orderBy: { timestamp: 'asc' },
    });
    const prediction = runPredictiveAnalysis(allReadings, filter);
    await prisma.prediction.create({
      data: {
        purifierId: purifier.id,
        predictionType: 'FILTER_DEGRADATION',
        riskLevel: prediction.riskLevel,
        predictedRulDays: prediction.predictedRulDays,
        predictedValue: prediction.healthScore,
        confidence: prediction.confidence,
        failureMode: prediction.failureMode,
        recommendation: prediction.recommendation,
        isPrototype: true,
      },
    });

    // Alerts
    if (def.status === 'CRITICAL') {
      await prisma.alert.create({
        data: {
          purifierId: purifier.id,
          severity: 'CRITICAL',
          type: 'REACTIVE',
          category: 'WATER_QUALITY',
          title: `Critical TDS Level in ${def.name} (${def.purifierCode})`,
          message: `TDS measured at ${def.baseTds} ppm exceeding maximum allowable drinking water threshold (300 ppm).`,
          recommendation: 'Temporarily lock dispenser valve and perform immediate RO membrane replacement.',
          timestamp: new Date(now.getTime() - 2 * 3600 * 1000),
          isAcknowledged: false,
          isResolved: false,
        },
      });

      await prisma.alert.create({
        data: {
          purifierId: purifier.id,
          severity: 'PREDICTIVE',
          type: 'PREDICTIVE',
          category: 'FILTER_HEALTH',
          title: `Filter health below 20% in ${def.purifierCode}`,
          message: `Predictive degradation model indicates filter health at ${def.baseHealth}%. Remaining life estimated under 3 days.`,
          recommendation: 'Replace composite carbon filter and primary RO membrane.',
          timestamp: new Date(now.getTime() - 12 * 3600 * 1000),
          isAcknowledged: true,
          isResolved: false,
        },
      });
    } else if (def.status === 'WARNING') {
      await prisma.alert.create({
        data: {
          purifierId: purifier.id,
          severity: 'WARNING',
          type: 'PREDICTIVE',
          category: 'FILTER_HEALTH',
          title: `Gradual Flow Rate Degradation in ${def.purifierCode}`,
          message: `Flow rate dropped to ${def.baseFlow} L/min with turbidity rising to ${def.baseTurbidity} NTU.`,
          recommendation: 'Inspect sediment pre-filter cartridge and flush secondary filter stage.',
          timestamp: new Date(now.getTime() - 8 * 3600 * 1000),
          isAcknowledged: false,
          isResolved: false,
        },
      });
    } else if (def.status === 'OFFLINE') {
      await prisma.alert.create({
        data: {
          purifierId: purifier.id,
          severity: 'OFFLINE',
          type: 'REACTIVE',
          category: 'HARDWARE_ERROR',
          title: `Purifier ${def.purifierCode} Offline`,
          message: 'No Wi-Fi heartbeat received from IoT node for over 48 hours. Check power and gateway.',
          recommendation: 'Check power supply unit and verify 2.4GHz Wi-Fi gateway connection in Auditorium.',
          timestamp: new Date(now.getTime() - 48 * 3600 * 1000),
          isAcknowledged: false,
          isResolved: false,
        },
      });
    }

    // Maintenance Records
    await prisma.maintenanceRecord.create({
      data: {
        maintenanceCode: `MNT-${maintenanceTicketCounter++}`,
        purifierId: purifier.id,
        date: new Date(now.getTime() - 60 * 24 * 3600 * 1000),
        scheduledDate: new Date(now.getTime() - 60 * 24 * 3600 * 1000),
        issue: 'Scheduled Periodic Sanitization & TDS Calibration',
        priority: 'LOW',
        type: 'ROUTINE_CHECKUP',
        technician: 'Rajesh Sharma',
        cost: 45.0,
        notes: 'Routine pressure sanitization, UV lamp check, and probe recalibration.',
        status: 'COMPLETED',
        filterReplaced: false,
        completedAt: new Date(now.getTime() - 60 * 24 * 3600 * 1000),
      },
    });

    if (def.status === 'CRITICAL' || def.status === 'WARNING') {
      await prisma.maintenanceRecord.create({
        data: {
          maintenanceCode: `MNT-${maintenanceTicketCounter++}`,
          purifierId: purifier.id,
          date: new Date(now.getTime() + 1 * 24 * 3600 * 1000),
          scheduledDate: new Date(now.getTime() + 1 * 24 * 3600 * 1000),
          issue:
            def.status === 'CRITICAL'
              ? 'Emergency Overhaul: Complete RO Membrane & Filter Replacement'
              : 'Sediment Pre-Filter Flush & Pressure Regulating Valve Inspection',
          priority: def.status === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
          type: def.status === 'CRITICAL' ? 'EMERGENCY_REPAIR' : 'MEMBRANE_FLUSH',
          technician: 'Rajesh Sharma',
          cost: def.status === 'CRITICAL' ? 185.0 : 65.0,
          notes: 'High priority dispatch assigned to technician on duty.',
          status: def.status === 'CRITICAL' ? 'SCHEDULED' : 'PENDING',
          filterReplaced: def.status === 'CRITICAL',
        },
      });
    }
  }

  // 5. Seed AI Contaminant Detection Records
  const purifiers = await prisma.purifier.findMany();
  const purMap = new Map(purifiers.map((p) => [p.purifierCode, p.id]));

  const aiSamples = [
    {
      purifierCode: 'WP-004',
      detectedObject: 'Algae',
      confidence: 94.2,
      riskLevel: 'CRITICAL',
      recommendation: 'Initiate chemical sanitization and flush reservoir chamber immediately.',
      hoursAgo: 2,
      boundingBox: [{ x: 140, y: 110, w: 180, h: 140, label: 'Micro-Algae Filament (94.2%)' }],
      status: 'ACTION_REQUIRED',
    },
    {
      purifierCode: 'WP-005',
      detectedObject: 'Worm',
      confidence: 91.5,
      riskLevel: 'CRITICAL',
      recommendation: 'Immediate shutoff of dispenser tap. Disinfect water tank and replace carbon block.',
      hoursAgo: 6,
      boundingBox: [{ x: 220, y: 160, w: 120, h: 90, label: 'Nematode Larvae (91.5%)' }],
      status: 'ACTION_REQUIRED',
    },
    {
      purifierCode: 'WP-003',
      detectedObject: 'Insect',
      confidence: 88.4,
      riskLevel: 'WARNING',
      recommendation: 'Inspect pre-filtration mesh and air vents for foreign particle intrusion.',
      hoursAgo: 14,
      boundingBox: [{ x: 90, y: 80, w: 150, h: 110, label: 'Gnat / Insect Specimen (88.4%)' }],
      status: 'REVIEWED',
    },
    {
      purifierCode: 'WP-001',
      detectedObject: 'Clean Water',
      confidence: 98.7,
      riskLevel: 'SAFE',
      recommendation: 'Optical clarity optimal. No particulate or biological contaminants detected.',
      hoursAgo: 1,
      boundingBox: [],
      status: 'RESOLVED',
    },
    {
      purifierCode: 'WP-002',
      detectedObject: 'Clean Water',
      confidence: 99.1,
      riskLevel: 'SAFE',
      recommendation: 'Water sample exhibits 100% optical purity.',
      hoursAgo: 4,
      boundingBox: [],
      status: 'RESOLVED',
    },
  ];

  for (const sample of aiSamples) {
    const pId = purMap.get(sample.purifierCode);
    if (pId) {
      await prisma.aiDetectionRecord.create({
        data: {
          purifierId: pId,
          timestamp: new Date(now.getTime() - sample.hoursAgo * 3600 * 1000),
          capturedImageUrl: `/sample-water-scan.jpg`,
          detectedObject: sample.detectedObject,
          confidence: sample.confidence,
          riskLevel: sample.riskLevel,
          boundingBoxJson: JSON.stringify(sample.boundingBox),
          recommendation: sample.recommendation,
          status: sample.status,
        },
      });
    }
  }

  console.log('✅ Seed completed successfully with 5 purifiers and full realistic datasets!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
