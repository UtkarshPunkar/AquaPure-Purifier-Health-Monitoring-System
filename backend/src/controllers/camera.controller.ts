import { Request, Response } from 'express';
import { prisma } from '../db';

export async function getAllCameras(req: Request, res: Response) {
  try {
    const cameras = await prisma.cameraDevice.findMany({
      include: { purifier: true },
      orderBy: { deviceId: 'asc' },
    });

    return res.json(cameras);
  } catch (error) {
    console.error('getAllCameras error:', error);
    return res.status(500).json({ error: 'Failed to fetch camera devices' });
  }
}

export async function captureSnapshot(req: Request, res: Response) {
  try {
    const deviceId = String(req.params.deviceId);

    const camera = await prisma.cameraDevice.findUnique({
      where: { deviceId },
      include: { purifier: true },
    });

    if (!camera) {
      return res.status(404).json({ error: 'Camera device not found' });
    }

    const timestamp = new Date();
    // Simulate optical inspection analysis
    const isDegraded = camera.purifier.status === 'CRITICAL';
    const opticalStatus = isDegraded
      ? 'SEDIMENT CARTRIDGE DISCOLORATION DETECTED - 78% PARTICULATE DENSITY'
      : 'OPTICAL INSPECTION NORMAL - 0% LEAKAGE / CLEAR FLOW';

    const updated = await prisma.cameraDevice.update({
      where: { deviceId },
      data: {
        lastSeen: timestamp,
        opticalInspectionStatus: opticalStatus,
        lastSnapshotUrl: `/api/camera/snapshot/${deviceId}?t=${timestamp.getTime()}`,
      },
      include: { purifier: true },
    });

    return res.json({
      message: 'Snapshot captured and optical inspection completed successfully',
      camera: updated,
      capturedAt: timestamp,
    });
  } catch (error) {
    console.error('captureSnapshot error:', error);
    return res.status(500).json({ error: 'Failed to capture snapshot' });
  }
}
