import { Request, Response } from 'express';
import { prisma } from '../db';

export async function getAllDevices(req: Request, res: Response) {
  try {
    const devices = await prisma.device.findMany({
      include: {
        purifier: true,
      },
      orderBy: { deviceId: 'asc' },
    });

    return res.json(devices);
  } catch (error) {
    console.error('getAllDevices error:', error);
    return res.status(500).json({ error: 'Failed to fetch devices' });
  }
}

export async function getDeviceById(req: Request, res: Response) {
  try {
    const deviceId = String(req.params.deviceId);

    const device = await prisma.device.findUnique({
      where: { deviceId },
      include: {
        purifier: {
          include: { filters: true, sensorReadings: { take: 1, orderBy: { timestamp: 'desc' } } },
        },
      },
    });

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    return res.json(device);
  } catch (error) {
    console.error('getDeviceById error:', error);
    return res.status(500).json({ error: 'Failed to fetch device' });
  }
}

export async function updateDeviceStatus(req: Request, res: Response) {
  try {
    const deviceId = String(req.params.deviceId);
    const { status, ledStatus, buzzerStatus, oledStatus, firmwareVersion } = req.body;

    const updated = await prisma.device.update({
      where: { deviceId },
      data: {
        status,
        ledStatus,
        buzzerStatus,
        oledStatus,
        firmwareVersion,
        lastSeen: new Date(),
      },
    });

    return res.json(updated);
  } catch (error) {
    console.error('updateDeviceStatus error:', error);
    return res.status(500).json({ error: 'Failed to update device status' });
  }
}
