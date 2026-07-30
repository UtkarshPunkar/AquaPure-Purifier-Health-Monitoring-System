import { Request, Response } from 'express';
import { prisma } from '../db';

export async function getAllAlerts(req: Request, res: Response) {
  try {
    const { severity, type, isResolved } = req.query;

    const where: any = {};
    if (severity) where.severity = String(severity);
    if (type) where.type = String(type);
    if (isResolved !== undefined) where.isResolved = isResolved === 'true';

    const alerts = await prisma.alert.findMany({
      where,
      include: { purifier: true },
      orderBy: { timestamp: 'desc' },
    });

    return res.json(alerts);
  } catch (error) {
    console.error('getAllAlerts error:', error);
    return res.status(500).json({ error: 'Failed to fetch alerts' });
  }
}

export async function acknowledgeAlert(req: Request, res: Response) {
  try {
    const id = String(req.params.id);

    const updated = await prisma.alert.update({
      where: { id },
      data: { isAcknowledged: true },
    });

    return res.json(updated);
  } catch (error) {
    console.error('acknowledgeAlert error:', error);
    return res.status(500).json({ error: 'Failed to acknowledge alert' });
  }
}

export async function resolveAlert(req: Request, res: Response) {
  try {
    const id = String(req.params.id);

    const updated = await prisma.alert.update({
      where: { id },
      data: { isResolved: true, isAcknowledged: true },
    });

    return res.json(updated);
  } catch (error) {
    console.error('resolveAlert error:', error);
    return res.status(500).json({ error: 'Failed to resolve alert' });
  }
}
