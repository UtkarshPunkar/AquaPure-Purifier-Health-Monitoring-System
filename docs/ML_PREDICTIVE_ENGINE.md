# AI/ML Predictive Maintenance Engine Specification

## 1. Executive Summary
The core value differentiator of **AquaPure** is shifting water purifier management from **reactive threshold alarms** to **proactive predictive degradation forecasting**.

```
Conventional Monitor:  Sensor > Limit (e.g. TDS > 500) -> Reactive Alarm (Water already contaminated)
AquaPure AI:       dTDS/dt > 0.05 AND dFlow/dt < -0.01 -> Predictive Warning (18-25 Days before breach)
```

---

## 2. Mathematical Formulations & Algorithms

### 2.1 Water Quality Index ($WQI$) Calculation
AquaPure calculates a standardized 0-100 Water Quality Index based on the National Sanitation Foundation ($NSF-WQI$) and World Health Organization ($WHO$) guidelines:

$$WQI = \sum_{i=1}^{n} w_i \cdot Q_i$$

Where:
- $w_{\text{TDS}} = 0.35$
- $w_{\text{pH}} = 0.30$
- $w_{\text{Turbidity}} = 0.25$
- $w_{\text{Temp}} = 0.10$

Sub-index rating curves ($Q_i$) map raw sensor values non-linearly to a 0-100 sub-score:
- **TDS Sub-Score ($Q_{\text{TDS}}$)**: 100 for $\text{TDS} \le 120\text{ ppm}$, decaying to 50 at $500\text{ ppm}$, and $<10$ above $900\text{ ppm}$.
- **Turbidity Sub-Score ($Q_{\text{Turb}}$)**: 100 for $\text{Turb} \le 0.3\text{ NTU}$, decaying to 40 at $3.0\text{ NTU}$, and $<10$ above $5.0\text{ NTU}$.
- **pH Sub-Score ($Q_{\text{pH}}$)**: Peak 100 centered around $\text{pH} = 7.2$, decaying symmetrically outside $[6.5, 8.5]$.

---

### 2.2 Degradation Slope Regression & Anomaly Extraction
To detect compound degradation signatures, the engine computes ordinary least squares linear regression over moving time windows ($N = 50$ telemetry readings):

$$\beta_{\text{TDS}} = \frac{N \sum t \cdot \text{TDS} - \sum t \sum \text{TDS}}{N \sum t^2 - (\sum t)^2}$$

$$\beta_{\text{Flow}} = \frac{N \sum t \cdot \text{Flow} - \sum t \sum \text{Flow}}{N \sum t^2 - (\sum t)^2}$$

**Coupled Fouling Signature**:
$$\text{Signature} = (\beta_{\text{TDS}} > +0.02) \land (\beta_{\text{Flow}} < -0.01) \implies \text{Active Membrane Fouling}$$

---

### 2.3 Remaining Useful Life ($RUL$) Forecast
The current health score $H(t)$ degrades at estimated rate $\Delta H / \text{day}$:

$$RUL_{\text{days}} = \max\left(1, \left\lfloor \frac{H(t) - H_{\text{critical}}}{\text{DegradationRate}_{\%/\text{day}}} \right\rfloor\right)$$

Where $H_{\text{critical}} = 20\%$.

---

## 3. Failure Mode Diagnostic Taxonomy

| Failure Mode | Telemetry Pattern | Root Cause | Preventive Action |
|---|---|---|---|
| **Membrane Pore Fouling** | Flow $\downarrow$, Turbidity $\uparrow$, TDS $\uparrow$ | Particulate cake buildup on semipermeable layer | Membrane chemical flush & cartridge swap |
| **TDS Salt Breakthrough** | TDS $\uparrow > 15\%$ over 7d, Flow nominal | Active carbon exhaustion or RO bypass valve leak | Replace secondary RO cartridge |
| **Sediment Media Saturation** | Turbidity spikes during high flow periods | Pre-filtration polypropylene yarn saturated | Pre-filter cartridge replacement |
| **Hydraulic Starvation** | Flow $< 0.9\text{ L/min}$, TDS normal | Booster pump degradation or sediment choke | Pressure line inspection |

---

## 4. Connecting External Python ML Services

In production, the built-in TypeScript regression engine can be augmented with a standalone **Python FastAPI** service using `scikit-learn` and `IsolationForest`:

```python
# ml_service.py (FastAPI Python Model)
from fastapi import FastAPI
import pandas as pd
from sklearn.ensemble import IsolationForest
import numpy as np

app = FastAPI()
model = IsolationForest(contamination=0.05, random_state=42)

@app.post("/predict/rul")
def predict_rul(readings: list[dict]):
    df = pd.DataFrame(readings)
    features = df[['ph', 'tds', 'turbidity', 'temperature', 'flowRate']].values
    anomalies = model.fit_predict(features)
    
    # Regression on degradation slope
    t = np.arange(len(df))
    slope_tds, _ = np.polyfit(t, df['tds'], 1)
    slope_flow, _ = np.polyfit(t, df['flowRate'], 1)
    
    return {
        "anomalies_detected": int(np.sum(anomalies == -1)),
        "tds_slope": float(slope_tds),
        "flow_slope": float(slope_flow),
        "predicted_rul_days": max(2, int((100 - df['tds'].iloc[-1]/5) / (max(0.1, slope_tds * 2))))
    }
```
