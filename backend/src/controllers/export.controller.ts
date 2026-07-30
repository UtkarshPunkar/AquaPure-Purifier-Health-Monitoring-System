import { Request, Response } from 'express';
import { prisma } from '../db';

export async function exportTelemetryCsv(req: Request, res: Response) {
  try {
    const { purifierId, days } = req.query;
    const numDays = days ? parseInt(days as string) : 30;
    const since = new Date(Date.now() - numDays * 24 * 3600 * 1000);

    const where: any = {
      timestamp: { gte: since },
    };
    if (purifierId) {
      where.purifierId = purifierId as string;
    }

    const readings = await prisma.sensorReading.findMany({
      where,
      include: { purifier: true },
      orderBy: { timestamp: 'desc' },
      take: 2000,
    });

    const headers = [
      'Timestamp',
      'PurifierCode',
      'PurifierName',
      'Location',
      'pH',
      'TDS_ppm',
      'Turbidity_NTU',
      'Temperature_C',
      'FlowRate_Lpm',
      'WQI_Score',
      'WQI_Status',
      'Data_Source',
    ];

    const rows = readings.map((r) => [
      r.timestamp.toISOString(),
      `"${r.purifier.purifierCode}"`,
      `"${r.purifier.name.replace(/"/g, '""')}"`,
      `"${r.purifier.location.replace(/"/g, '""')}"`,
      r.ph.toFixed(2),
      r.tds.toFixed(1),
      r.turbidity.toFixed(2),
      r.temperature.toFixed(1),
      r.flowRate.toFixed(2),
      r.wqiScore.toFixed(1),
      r.wqiStatus,
      r.source,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="smart-water-telemetry-${new Date().toISOString().slice(0, 10)}.csv"`);
    return res.send(csvContent);
  } catch (error) {
    console.error('exportTelemetryCsv error:', error);
    return res.status(500).json({ error: 'Failed to export telemetry CSV' });
  }
}

export async function exportMaintenanceCsv(req: Request, res: Response) {
  try {
    const records = await prisma.maintenanceRecord.findMany({
      include: { purifier: true },
      orderBy: { date: 'desc' },
    });

    const headers = [
      'RecordID',
      'PurifierCode',
      'PurifierName',
      'Location',
      'Date',
      'ServiceType',
      'Technician',
      'Cost_USD',
      'Status',
      'FilterReplaced',
      'Notes',
    ];

    const rows = records.map((r) => [
      r.id,
      `"${r.purifier.purifierCode}"`,
      `"${r.purifier.name.replace(/"/g, '""')}"`,
      `"${r.purifier.location.replace(/"/g, '""')}"`,
      r.date.toISOString().slice(0, 10),
      r.type,
      `"${r.technician}"`,
      r.cost.toFixed(2),
      r.status,
      r.filterReplaced ? 'YES' : 'NO',
      `"${r.notes.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="purifier-maintenance-logs-${new Date().toISOString().slice(0, 10)}.csv"`);
    return res.send(csvContent);
  } catch (error) {
    console.error('exportMaintenanceCsv error:', error);
    return res.status(500).json({ error: 'Failed to export maintenance CSV' });
  }
}
