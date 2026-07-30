import { Request, Response } from 'express';
import { prisma } from '../db';
import { runPredictiveAnalysis } from '../engine/predictive.engine';

export async function getAllPredictions(req: Request, res: Response) {
  try {
    const purifiers = await prisma.purifier.findMany({
      include: {
        filters: true,
        sensorReadings: {
          orderBy: { timestamp: 'desc' },
          take: 60,
        },
      },
      orderBy: { purifierCode: 'asc' },
    });

    const predictions = purifiers.map((p) => {
      const filter = p.filters[0] || null;
      const analysis = runPredictiveAnalysis(p.sensorReadings, filter);
      return {
        purifierId: p.id,
        purifierCode: p.purifierCode,
        name: p.name,
        location: p.location,
        status: p.status,
        filterHealth: analysis.healthScore,
        riskLevel: analysis.riskLevel,
        predictedRulDays: analysis.predictedRulDays,
        degradationRate: analysis.degradationRate,
        confidence: analysis.confidence,
        failureMode: analysis.failureMode,
        recommendation: analysis.recommendation,
        insights: analysis.insights,
        anomaliesDetected: analysis.anomaliesDetected,
      };
    });

    // Sort by risk priority (CRITICAL -> HIGH -> MEDIUM -> LOW)
    const riskWeight: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    predictions.sort((a, b) => (riskWeight[b.riskLevel] || 0) - (riskWeight[a.riskLevel] || 0));

    return res.json(predictions);
  } catch (error) {
    console.error('getAllPredictions error:', error);
    return res.status(500).json({ error: 'Failed to generate predictive analysis' });
  }
}

export async function getPredictionsByPurifier(req: Request, res: Response) {
  try {
    const purifierId = String(req.params.purifierId);

    const purifier = await prisma.purifier.findFirst({
      where: {
        OR: [{ id: purifierId }, { purifierCode: purifierId }],
      },
      include: {
        filters: true,
        sensorReadings: {
          orderBy: { timestamp: 'desc' },
          take: 90,
        },
      },
    });

    if (!purifier) {
      return res.status(404).json({ error: 'Purifier not found' });
    }

    const filter = purifier.filters[0] || null;
    const analysis = runPredictiveAnalysis(purifier.sensorReadings, filter);

    return res.json({
      purifierId: purifier.id,
      purifierCode: purifier.purifierCode,
      name: purifier.name,
      ...analysis,
    });
  } catch (error) {
    console.error('getPredictionsByPurifier error:', error);
    return res.status(500).json({ error: 'Failed to get purifier predictions' });
  }
}
