export interface WaterParams {
  ph: number;
  tds: number;
  turbidity: number;
  temperature: number;
  flowRate: number;
}

export interface WqiResult {
  score: number; // 0 - 100
  status: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL';
  subScores: {
    phScore: number;
    tdsScore: number;
    turbidityScore: number;
    temperatureScore: number;
  };
  summary: string;
}

export function calculateWQI(params: WaterParams): WqiResult {
  const { ph, tds, turbidity, temperature } = params;

  // 1. pH Sub-score (Weight: 0.30)
  // Ideal: 7.0 - 7.4. Tolerable: 6.5 - 8.5
  let phScore = 100;
  if (ph >= 7.0 && ph <= 7.6) {
    phScore = 100 - Math.abs(ph - 7.2) * 20;
  } else if (ph >= 6.5 && ph < 7.0) {
    phScore = 80 + (ph - 6.5) * 40; // 80 -> 100
  } else if (ph > 7.6 && ph <= 8.5) {
    phScore = 100 - (ph - 7.6) * 33.3; // 100 -> 70
  } else if (ph < 6.5) {
    phScore = Math.max(0, 80 - (6.5 - ph) * 60);
  } else {
    phScore = Math.max(0, 70 - (ph - 8.5) * 50);
  }

  // 2. TDS Sub-score (Weight: 0.35)
  // WHO: < 150 (Excellent), 150-300 (Good), 300-500 (Fair), 500-900 (Poor), > 900 (Unacceptable)
  let tdsScore = 100;
  if (tds <= 120) {
    tdsScore = 100;
  } else if (tds <= 250) {
    tdsScore = 100 - ((tds - 120) / 130) * 15; // 100 -> 85
  } else if (tds <= 500) {
    tdsScore = 85 - ((tds - 250) / 250) * 35; // 85 -> 50
  } else if (tds <= 900) {
    tdsScore = 50 - ((tds - 500) / 400) * 40; // 50 -> 10
  } else {
    tdsScore = Math.max(0, 10 - ((tds - 900) / 300) * 10);
  }

  // 3. Turbidity Sub-score (Weight: 0.25)
  // WHO: < 0.5 NTU (Excellent), 0.5 - 1.0 (Good), 1.0 - 4.0 (Fair), > 4.0 (Poor)
  let turbidityScore = 100;
  if (turbidity <= 0.3) {
    turbidityScore = 100;
  } else if (turbidity <= 1.0) {
    turbidityScore = 100 - ((turbidity - 0.3) / 0.7) * 20; // 100 -> 80
  } else if (turbidity <= 3.0) {
    turbidityScore = 80 - ((turbidity - 1.0) / 2.0) * 40; // 80 -> 40
  } else if (turbidity <= 5.0) {
    turbidityScore = 40 - ((turbidity - 3.0) / 2.0) * 30; // 40 -> 10
  } else {
    turbidityScore = Math.max(0, 10 - (turbidity - 5.0) * 5);
  }

  // 4. Temperature Sub-score (Weight: 0.10)
  // Ideal: 18 - 26 °C
  let temperatureScore = 100;
  if (temperature >= 18 && temperature <= 26) {
    temperatureScore = 100;
  } else if (temperature < 18) {
    temperatureScore = Math.max(50, 100 - (18 - temperature) * 5);
  } else {
    temperatureScore = Math.max(20, 100 - (temperature - 26) * 6);
  }

  // Weighted sum
  const weightedScore = (
    phScore * 0.30 +
    tdsScore * 0.35 +
    turbidityScore * 0.25 +
    temperatureScore * 0.10
  );

  const roundedScore = Math.round(Math.max(0, Math.min(100, weightedScore)) * 10) / 10;

  let status: WqiResult['status'] = 'EXCELLENT';
  let summary = 'Water quality is within optimal potable standards.';

  if (roundedScore >= 90) {
    status = 'EXCELLENT';
    summary = 'Optimal potable water quality. All chemical & physical parameters meet WHO safe drinking limits.';
  } else if (roundedScore >= 75) {
    status = 'GOOD';
    summary = 'Good water quality. Minor acceptable variations detected, safely potable.';
  } else if (roundedScore >= 60) {
    status = 'FAIR';
    summary = 'Moderate water quality. Parameter deviation indicates early stage filter exhaustion.';
  } else if (roundedScore >= 40) {
    status = 'POOR';
    summary = 'Poor water quality. Filter performance degraded; safe drinking limits approaching breach.';
  } else {
    status = 'CRITICAL';
    summary = 'Critical contamination detected. Sensor thresholds breached. Immediate maintenance mandatory.';
  }

  return {
    score: roundedScore,
    status,
    subScores: {
      phScore: Math.round(phScore),
      tdsScore: Math.round(tdsScore),
      turbidityScore: Math.round(turbidityScore),
      temperatureScore: Math.round(temperatureScore),
    },
    summary,
  };
}
