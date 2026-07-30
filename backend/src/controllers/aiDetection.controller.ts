import { Request, Response } from 'express';
import { prisma } from '../db';

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
    });

    if (!purifier) {
      return res.status(404).json({ error: 'Purifier not found' });
    }

    // Generate simulated AI vision detection based on choice or realistic randomness
    const sampleClasses = [
      {
        object: 'Clean Water',
        confidence: 98.4,
        riskLevel: 'SAFE',
        recommendation: 'Water sample exhibits 100% optical clarity and complies with safety standards.',
        boxes: [],
      },
      {
        object: 'Algae',
        confidence: 93.6,
        riskLevel: 'CRITICAL',
        recommendation: 'Biofilm and micro-algae growth detected. Immediately flush tank and sanitize filter bed.',
        boxes: [{ x: 130, y: 95, w: 190, h: 150, label: 'Algae Bloom Cluster (93.6%)' }],
      },
      {
        object: 'Insect',
        confidence: 89.1,
        riskLevel: 'WARNING',
        recommendation: 'Biological insect particulate detected. Inspect inlet filter mesh and housing seal.',
        boxes: [{ x: 100, y: 120, w: 140, h: 100, label: 'Insect Specimen (89.1%)' }],
      },
      {
        object: 'Worm',
        confidence: 91.8,
        riskLevel: 'CRITICAL',
        recommendation: 'Microscopic nematode / organism detected. Emergency service required before next dispense.',
        boxes: [{ x: 210, y: 140, w: 110, h: 80, label: 'Helminth / Nematode (91.8%)' }],
      },
      {
        object: 'Unknown Contaminant',
        confidence: 76.5,
        riskLevel: 'WARNING',
        recommendation: 'Unclassified particulate matter detected. Recommend physical laboratory verification.',
        boxes: [{ x: 170, y: 110, w: 130, h: 130, label: 'Unclassified Particulate (76.5%)' }],
      },
    ];

    let chosen = sampleClasses[0];
    if (sampleType) {
      const match = sampleClasses.find((s) => s.object.toLowerCase().includes(sampleType.toLowerCase()));
      if (match) chosen = match;
    } else {
      chosen = sampleClasses[Math.floor(Math.random() * sampleClasses.length)];
    }

    const record = await prisma.aiDetectionRecord.create({
      data: {
        purifierId: purifier.id,
        timestamp: new Date(),
        capturedImageUrl: '/sample-water-scan.jpg',
        detectedObject: chosen.object,
        confidence: chosen.confidence,
        riskLevel: chosen.riskLevel,
        boundingBoxJson: JSON.stringify(chosen.boxes),
        recommendation: chosen.recommendation,
        status: chosen.riskLevel === 'CRITICAL' ? 'ACTION_REQUIRED' : chosen.riskLevel === 'WARNING' ? 'REVIEWED' : 'RESOLVED',
      },
      include: {
        purifier: true,
      },
    });

    return res.status(201).json({
      message: 'AI Contaminant Scan completed successfully',
      scanResult: {
        ...record,
        boundingBoxes: chosen.boxes,
      },
    });
  } catch (error) {
    console.error('createAiScan error:', error);
    return res.status(500).json({ error: 'Failed to run AI scan' });
  }
}
