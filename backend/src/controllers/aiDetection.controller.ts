import { Request, Response } from 'express';
import { prisma } from '../db';
import { snapshotStore } from '../services/snapshotStore';
import { fetchEsp32Frame } from './camera.controller';
import { analyzeVisionFrame } from '../services/visionAnalysis.service';

export async function getAllAiDetections(req: Request, res: Response) {
  try {
    const detections = await prisma.aiDetectionRecord.findMany({
      include: {
        purifier: true,
      },
      orderBy: { timestamp: 'desc' },
    });

    const parsed = detections.map((d) => ({
      ...d,
      capturedImageUrl: d.capturedImageUrl || `/api/camera/snapshot-image/live`,
      boundingBoxes: d.boundingBoxJson ? JSON.parse(d.boundingBoxJson) : [],
    }));

    return res.json(parsed);
  } catch (error) {
    console.error('getAllAiDetections error:', error);
    return res.status(500).json({ error: 'Failed to fetch AI contaminant detections' });
  }
}

export async function createAiScan(req: Request, res: Response) {
  try {
    const { purifierId, sampleType } = req.body;

    const purifier = await prisma.purifier.findUnique({
      where: { id: purifierId },
      include: { cameraDevice: true },
    });

    if (!purifier) {
      return res.status(404).json({ error: 'Purifier not found' });
    }

    const timestamp = new Date();
    const snapshotId = `ai-snap-${Date.now()}`;

    // 1. Try capturing a real live frame from direct upload, USB stream, or Wi-Fi
    let frameBuffer: Buffer | null = null;
    let frameContentType = 'image/jpeg';

    if (req.body.image) {
      try {
        const base64Data = req.body.image.replace(/^data:image\/\w+;base64,/, '');
        frameBuffer = Buffer.from(base64Data, 'base64');
      } catch (err) {
        console.warn('Failed to parse uploaded base64 image:', err);
      }
    }

    if (!frameBuffer) {
      const live = snapshotStore.getLatestLiveFrame();
      if (live && live.buffer.length > 200) {
        frameBuffer = live.buffer;
        frameContentType = live.contentType;
      }
    }

    if (!frameBuffer) {
      const streamUrl = purifier.cameraDevice?.streamUrl || 'http://192.168.4.1/capture';
      const frame = await fetchEsp32Frame(streamUrl, 1500);
      if (frame && frame.buffer.length > 200) {
        frameBuffer = frame.buffer;
        frameContentType = frame.contentType;
      }
    }

    let imageUrl = `/api/camera/snapshot-image/${snapshotId}`;
    if (frameBuffer && frameBuffer.length > 200) {
      snapshotStore.saveSnapshot(snapshotId, frameBuffer, frameContentType, purifier.cameraDevice?.deviceId || 'ESP32-CAM-1', purifier.purifierCode);
      snapshotStore.setLatestLiveFrame(frameBuffer, frameContentType);
    } else {
      imageUrl = `/api/camera/snapshot-image/live`;
    }

    // 2. Perform Dynamic Pixel-Level Computer Vision Analysis
    const analysis = analyzeVisionFrame(frameBuffer, {
      sampleType,
      purifierStatus: purifier.status,
    });

    // 3. Update purifier health state if a biological contaminant / hazard was detected
    let updatedPurifierStatus = purifier.status;
    if (analysis.riskLevel === 'CRITICAL') {
      updatedPurifierStatus = 'CRITICAL';
    } else if (analysis.riskLevel === 'WARNING' && purifier.status !== 'CRITICAL') {
      updatedPurifierStatus = 'WARNING';
    }

    if (updatedPurifierStatus !== purifier.status) {
      await prisma.purifier.update({
        where: { id: purifier.id },
        data: { status: updatedPurifierStatus },
      });
    }

    // 4. Automatically generate system alert if threat detected
    if (analysis.riskLevel === 'CRITICAL' || analysis.riskLevel === 'WARNING') {
      try {
        await prisma.alert.create({
          data: {
            purifierId: purifier.id,
            severity: analysis.riskLevel === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
            type: 'REACTIVE',
            category: 'CONTAMINANT',
            title: `Optical Alert: ${analysis.detectedObject}`,
            message: `${analysis.detectedObject} detected in chamber with ${analysis.confidence}% confidence.`,
            recommendation: analysis.recommendation,
            timestamp,
            isAcknowledged: false,
            isResolved: false,
          },
        });
      } catch (alertErr) {
        console.warn('Failed to auto-create alert for detection:', alertErr);
      }
    }

    // 5. Persist detection record
    const record = await prisma.aiDetectionRecord.create({
      data: {
        purifierId: purifier.id,
        timestamp,
        capturedImageUrl: imageUrl,
        detectedObject: analysis.detectedObject,
        confidence: analysis.confidence,
        riskLevel: analysis.riskLevel,
        boundingBoxJson: JSON.stringify(analysis.boundingBoxes),
        recommendation: analysis.recommendation,
        status: analysis.riskLevel === 'CRITICAL' ? 'ACTION_REQUIRED' : analysis.riskLevel === 'WARNING' ? 'REVIEWED' : 'RESOLVED',
      },
      include: {
        purifier: true,
      },
    });

    return res.status(201).json({
      message: 'AI Contaminant Optical Scan completed successfully',
      scanResult: {
        ...record,
        boundingBoxes: analysis.boundingBoxes,
        metrics: analysis.metrics,
      },
    });
  } catch (error) {
    console.error('createAiScan error:', error);
    return res.status(500).json({ error: 'Failed to run AI scan' });
  }
}

