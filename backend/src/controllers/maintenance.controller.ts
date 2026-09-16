import { Request, Response } from 'express';
import { prisma } from '../db';
import { simulationEngine } from '../engine/simulation.engine';

export async function getMaintenanceLogs(req: Request, res: Response) {
  try {
    const records = await prisma.maintenanceRecord.findMany({
      include: { purifier: true },
      orderBy: { date: 'desc' },
    });

    return res.json(records);
  } catch (error) {
    console.error('getMaintenanceLogs error:', error);
    return res.status(500).json({ error: 'Failed to fetch maintenance logs' });
  }
}

export async function scheduleMaintenance(req: Request, res: Response) {
  try {
    const { purifierId, date, scheduledDate: schedDate, type, priority, issue, technician, cost, notes } = req.body;

    if (!purifierId) {
      return res.status(400).json({ error: 'purifierId is required' });
    }

    const rawDate = schedDate || date;
    const scheduledDateObj = rawDate ? new Date(rawDate) : new Date(Date.now() + 24 * 3600 * 1000);

    const purifier = await prisma.purifier.findUnique({
      where: { id: String(purifierId) },
    });

    const count = await prisma.maintenanceRecord.count();
    const maintenanceCode = `MNT-${1000 + count + 1}`;

    const record = await prisma.maintenanceRecord.create({
      data: {
        maintenanceCode,
        purifierId: String(purifierId),
        date: scheduledDateObj,
        scheduledDate: scheduledDateObj,
        type: type ? String(type) : 'FILTER_REPLACEMENT',
        issue: issue ? String(issue) : 'Scheduled Preventive Maintenance & Filter Replacement',
        priority: priority ? String(priority) : 'HIGH',
        technician: technician ? String(technician) : 'Maintenance Team',
        cost: cost ? parseFloat(cost) : 0,
        notes: notes ? String(notes) : 'Scheduled maintenance service dispatched.',
        status: 'SCHEDULED',
      },
    });

    await prisma.purifier.update({
      where: { id: String(purifierId) },
      data: { nextMaintenanceDue: scheduledDateObj },
    });

    // Create notification alert for scheduled maintenance date
    await prisma.alert.create({
      data: {
        purifierId: String(purifierId),
        severity: priority === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
        type: 'PREDICTIVE',
        category: 'FILTER_HEALTH',
        title: `Maintenance Scheduled: ${purifier?.purifierCode || 'Purifier Unit'}`,
        message: `Maintenance scheduled for ${scheduledDateObj.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}: ${issue || 'Filter Replacement & Inspection'}.`,
        recommendation: `Execute scheduled maintenance and filter service on ${scheduledDateObj.toLocaleDateString()}.`,
      },
    });

    return res.status(201).json(record);
  } catch (error) {
    console.error('scheduleMaintenance error:', error);
    return res.status(500).json({ error: 'Failed to schedule maintenance' });
  }
}

export async function completeMaintenance(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    const { filterReplaced, notes, technician } = req.body;

    const record = await prisma.maintenanceRecord.findUnique({
      where: { id },
    });

    if (!record) {
      return res.status(404).json({ error: 'Maintenance record not found' });
    }

    const updated = await prisma.maintenanceRecord.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        filterReplaced: filterReplaced !== undefined ? Boolean(filterReplaced) : record.filterReplaced,
        notes: notes ? `${record.notes} | ${notes}` : record.notes,
        technician: technician ? String(technician) : record.technician,
      },
    });

    // If filter replaced, reset purifier health & reset simulation state
    if (filterReplaced) {
      await prisma.filter.updateMany({
        where: { purifierId: record.purifierId },
        data: {
          healthScore: 100.0,
          installationDate: new Date(),
          degradationRate: 0.35,
          estimatedRemainingLifeDays: 95,
          flowResistanceIndex: 1.0,
          status: 'OPTIMAL',
        },
      });

      await prisma.purifier.update({
        where: { id: record.purifierId },
        data: {
          status: 'HEALTHY',
          lastMaintenance: new Date(),
          nextMaintenanceDue: new Date(Date.now() + 90 * 24 * 3600 * 1000),
        },
      });

      // Clear active critical alerts for this purifier
      await prisma.alert.updateMany({
        where: { purifierId: record.purifierId, isResolved: false },
        data: { isResolved: true, isAcknowledged: true },
      });

      // Reset in simulation memory
      simulationEngine.triggerReset(record.purifierId);
    }

    return res.json(updated);
  } catch (error) {
    console.error('completeMaintenance error:', error);
    return res.status(500).json({ error: 'Failed to complete maintenance record' });
  }
}
