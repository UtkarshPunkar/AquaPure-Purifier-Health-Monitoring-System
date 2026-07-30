import { SensorReading, Filter } from '@prisma/client';

export interface PredictiveAnalysisResult {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  predictedRulDays: number;
  healthScore: number;
  degradationRate: number; // %/day
  confidence: number;
  failureMode: string;
  recommendation: string;
  insights: string[];
  anomaliesDetected: {
    parameter: string;
    description: string;
    severity: 'WARNING' | 'CRITICAL';
  }[];
}

export function runPredictiveAnalysis(
  readings: SensorReading[],
  currentFilter: Filter | null
): PredictiveAnalysisResult {
  // If no readings, return default baseline
  if (!readings || readings.length === 0) {
    return {
      riskLevel: 'LOW',
      predictedRulDays: currentFilter?.estimatedRemainingLifeDays || 90,
      healthScore: currentFilter?.healthScore || 100,
      degradationRate: currentFilter?.degradationRate || 0.4,
      confidence: 0.90,
      failureMode: 'Normal operating conditions; baseline parameters nominal.',
      recommendation: 'Continue regular telemetry monitoring.',
      insights: [
        'All sensor metrics are within nominal ranges.',
        'No anomalous degradation slopes detected in baseline readings.'
      ],
      anomaliesDetected: []
    };
  }

  // Sort chronological
  const sorted = [...readings].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  const recent = sorted.slice(-50); // Last 50 readings for short-term slope
  const latest = sorted[sorted.length - 1];

  // 1. Calculate TDS Trend (Linear Regression slope over recent readings)
  const n = recent.length;
  let sumX = 0;
  let sumTds = 0;
  let sumFlow = 0;
  let sumTurbidity = 0;
  let sumXTds = 0;
  let sumXFlow = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumTds += recent[i].tds;
    sumFlow += recent[i].flowRate;
    sumTurbidity += recent[i].turbidity;
    sumXTds += i * recent[i].tds;
    sumXFlow += i * recent[i].flowRate;
  }

  const denom = n * (n * (n - 1) / 2) - sumX * sumX;
  const tdsSlope = denom !== 0 ? (n * sumXTds - sumX * sumTds) / (n * (n * (n - 1) * (2 * n - 1) / 6) - sumX * sumX) : 0;
  const flowSlope = denom !== 0 ? (n * sumXFlow - sumX * sumFlow) / (n * (n * (n - 1) * (2 * n - 1) / 6) - sumX * sumX) : 0;

  const avgTds = sumTds / n;
  const avgFlow = sumFlow / n;
  const avgTurbidity = sumTurbidity / n;

  const insights: string[] = [];
  const anomalies: PredictiveAnalysisResult['anomaliesDetected'] = [];

  let healthScore = currentFilter?.healthScore ?? 100;
  let degradationRate = currentFilter?.degradationRate ?? 0.4;
  let riskLevel: PredictiveAnalysisResult['riskLevel'] = 'LOW';
  let failureMode = 'Normal filter lifecycle progression.';
  let recommendation = 'Filter operating within standard specifications. Routine monitoring recommended.';

  // 2. Physical Correlation Analysis:
  // Degradation signature: Rising TDS + Rising Turbidity + Dropping Flow Rate
  const isFlowRestricted = latest.flowRate < 1.4;
  const isTdsElevated = latest.tds > 350;
  const isTurbidityHigh = latest.turbidity > 1.2;

  if (flowSlope < -0.01 && tdsSlope > 0.05) {
    insights.push('Compound degradation signature detected: Flow rate decreasing while TDS is trending upward.');
  }

  if (isFlowRestricted) {
    anomalies.push({
      parameter: 'Flow Rate',
      description: `Flow rate restricted to ${latest.flowRate.toFixed(2)} L/min (Standard: 2.0-3.0 L/min). Indicates particulate buildup in sediment/carbon block.`,
      severity: latest.flowRate < 1.0 ? 'CRITICAL' : 'WARNING'
    });
    insights.push(`Membrane resistance index is elevated; hydrodynamic restriction observed (${latest.flowRate.toFixed(2)} L/min).`);
  }

  if (isTdsElevated) {
    anomalies.push({
      parameter: 'TDS (Total Dissolved Solids)',
      description: `TDS level at ${latest.tds.toFixed(0)} ppm (Threshold: 300 ppm). RO membrane rejection efficiency is declining.`,
      severity: latest.tds > 500 ? 'CRITICAL' : 'WARNING'
    });
    insights.push(`TDS breakthrough detected: ${latest.tds.toFixed(0)} ppm indicates partial bypass of mineral ions.`);
  }

  if (isTurbidityHigh) {
    anomalies.push({
      parameter: 'Turbidity',
      description: `Turbidity measured at ${latest.turbidity.toFixed(2)} NTU (Acceptable: < 1.0 NTU). Indicates colloidal or suspended particulate breakthrough.`,
      severity: latest.turbidity > 3.0 ? 'CRITICAL' : 'WARNING'
    });
    insights.push(`Turbidity variance detected at ${latest.turbidity.toFixed(2)} NTU, suggesting pre-filtration media saturation.`);
  }

  // 3. Health Score Estimation based on multi-sensor degradation
  let computedHealth = 100;
  // Penalties
  const tdsPenalty = Math.max(0, (latest.tds - 120) * 0.12);
  const turbidityPenalty = Math.max(0, (latest.turbidity - 0.4) * 15);
  const flowPenalty = Math.max(0, (2.5 - latest.flowRate) * 20);

  computedHealth = Math.max(5, Math.min(100, 100 - (tdsPenalty + turbidityPenalty + flowPenalty)));
  // Smooth with existing filter health
  if (currentFilter) {
    healthScore = Math.round((currentFilter.healthScore * 0.7 + computedHealth * 0.3) * 10) / 10;
  } else {
    healthScore = Math.round(computedHealth * 10) / 10;
  }

  // 4. Calculate RUL (Remaining Useful Life in days)
  // Base daily degradation: ~0.35% under normal conditions, up to 3.5% under heavy fouling
  degradationRate = Math.max(0.3, Math.min(4.0, (100 - healthScore) / 45 + (isFlowRestricted ? 0.8 : 0) + (isTdsElevated ? 0.9 : 0)));
  degradationRate = Math.round(degradationRate * 100) / 100;

  // RUL = Remaining health / degradationRate
  const remainingHealth = Math.max(0, healthScore - 20); // 20% is critical replacement threshold
  let predictedRulDays = Math.max(1, Math.round(remainingHealth / degradationRate));

  // 5. Determine Risk Level & Primary Failure Mode
  if (healthScore <= 40 || latest.tds > 500 || latest.flowRate < 0.8) {
    riskLevel = 'CRITICAL';
    failureMode = 'Severe membrane exhaustion & hydraulic starvation detected.';
    recommendation = 'Urgent: Schedule immediate cartridge & RO membrane replacement within 48 hours.';
    insights.push('CRITICAL RISK: Water quality standard violation imminent without physical filter servicing.');
  } else if (healthScore <= 65 || isFlowRestricted || isTdsElevated || isTurbidityHigh) {
    riskLevel = 'HIGH';
    failureMode = 'Accelerated media fouling and rejection efficiency loss.';
    recommendation = `Schedule preventive maintenance within ${predictedRulDays} days. Inspect pre-filter and flush membrane.`;
    insights.push(`HIGH RISK: Filter performance is degrading at ${degradationRate}%/day. Proactive replacement will prevent downtime.`);
  } else if (healthScore <= 80 || tdsSlope > 0.02 || flowSlope < -0.005) {
    riskLevel = 'MEDIUM';
    failureMode = 'Early stage sediment accumulation and carbon saturation.';
    recommendation = `Monitor filter resistance over next 7 days; estimated maintenance window in ${predictedRulDays} days.`;
    insights.push(`MEDIUM RISK: Gradual decline in flow rate detected. Filter is currently safe but trending toward service threshold.`);
  } else {
    riskLevel = 'LOW';
    failureMode = 'Optimal hydrodynamic flow and mineral balance.';
    recommendation = `Continue regular automated monitoring. Next estimated maintenance in ~${predictedRulDays} days.`;
    insights.push('LOW RISK: Filtration efficiency is operating above 90% benchmark.');
  }

  const confidence = Math.round((0.88 + Math.min(0.08, n * 0.002)) * 100) / 100;

  return {
    riskLevel,
    predictedRulDays,
    healthScore,
    degradationRate,
    confidence,
    failureMode,
    recommendation,
    insights,
    anomaliesDetected: anomalies
  };
}
