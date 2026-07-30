# AquaPure Pro: Smart Water Safety & Purifier Health Monitoring System

> **A Retrofit IoT & AI Predictive Maintenance Web Platform for Centralized Water Safety in Organizations**

---

## 1. Product Overview

AquaPure Pro is an industrial-grade, full-stack responsive web application designed for institutions (colleges, hospitals, corporate offices, manufacturing plants) that manage multiple water purifiers across large campuses.

Rather than replacing expensive purification machinery, AquaPure retrofits existing purifiers with non-invasive IoT sensor nodes (Raspberry Pi Pico W + ESP32-CAM) to enable **centralized telemetry, WHO-standard water safety scoring, and predictive filter maintenance**.

### Key Value Proposition
$$\textbf{Measure} \longrightarrow \textbf{Analyze} \longrightarrow \textbf{Predict} \longrightarrow \textbf{Maintain}$$

- **Predictive AI vs Reactive Alarming**: Detects membrane fouling and salt breakthrough trends 18-25 days before drinking water standards are compromised.
- **Physical Device Digital Twin**: Live mirror showing 128x64 OLED telemetry text, 3 LED state indicators (Green/Yellow/Red), and active acoustic buzzer alarms.
- **Realistic Physics Simulation & Demo Suite**: Coupled sensor dynamics where filter clogging naturally drops flow rate while increasing turbidity and TDS leakage.
- **Standardized IoT Gateway Ready**: `POST /api/devices/readings` endpoint prepared to accept live MicroPython telemetry packets from Raspberry Pi Pico W.

---

## 2. Tech Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide React, Recharts, Socket.IO Client.
- **Backend**: Node.js, Express, TypeScript, Prisma ORM, Socket.IO, JWT, Zod.
- **Database**: SQLite (via Prisma) for instant zero-dependency local execution; 100% PostgreSQL schema compatible.
- **AI/ML Engine**: Multivariate linear/polynomial regression engine, NSF/WHO Water Quality Index ($WQI$) calculator, and anomaly detection framework.

---

## 3. Quick Start & Execution Guide

### Prerequisites
- Node.js v18+ and npm installed.

### Step 1: Start the Backend Server & Simulator
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts     # Seeds 30 days of realistic historical IoT telemetry for 5 demo purifiers
npm run dev               # Starts HTTP & Socket.IO server on http://localhost:5000
```

### Step 2: Start the Frontend Application
```bash
cd ../frontend
npm install
npm run dev               # Starts responsive dashboard on http://localhost:5173
```

### Step 3: Log In
- **URL**: `http://localhost:5173`
- **Admin Login**: `mithilesh@aquapure.edu` / `admin123`
- **Technician Login**: `vedant@aquapure.edu` / `admin123`

---

## 4. Live Demonstration Flow (Without Hardware)

1. **Central Dashboard Overview**:
   - Inspect Top KPI cards (Total Units, Healthy, Warning, Critical, Offline, Maintenance Due).
   - Observe live ticker updates in the telemetry stream.
2. **Explore the Fleet**:
   - Open **PUR-001** (Anchor unit for the physical Raspberry Pi Pico W retrofit).
   - View the **Digital Twin Panel** (SSD1306 OLED Screen, Status LEDs, Buzzer alarm).
   - Interact with 24-hour, 7-day, and 30-day historical trend charts for pH, TDS, Turbidity, and Flow.
3. **Simulate Active Filter Degradation**:
   - From the top **Simulation Bar**, select target unit `PUR-001` and click **"Simulate Degradation"**.
   - Watch the live physics engine update: Flow rate drops ($2.5 \to 0.9\text{ L/min}$), Turbidity rises ($0.4 \to 2.5\text{ NTU}$), TDS rises ($150 \to 450\text{ ppm}$).
   - Notice the physical OLED status switch to `WARN: FLT DEGRADED`, yellow LED turn on, and a **Predictive Maintenance Alert** appear.
4. **Predictive Maintenance & Work Orders**:
   - Navigate to **Predictive AI** to view the RUL countdown table.
   - Click **"Schedule Service"** -> assign a technician.
   - Go to **Work Orders** -> click **"Mark Complete"** to verify that filter health resets to 100% and normal baseline resumes.
5. **IoT Ingestion Playground**:
   - Open **IoT Gateways** -> send a mock payload via the built-in REST tester to verify real-time ingestion from Pico W.
6. **Optical Inspection & Exports**:
   - Open **Optical Camera** for the ESP32-CAM optical sediment inspection mockup.
   - Open **Analytics & Reports** to download historical sensor and maintenance CSV logs.

---

## 5. System Documentation

- [Hardware Integration & Microcontroller Specification](docs/HARDWARE_INTEGRATION.md) (Pico W pinout, MicroPython code, ESP32-CAM).
- [AI/ML Predictive Engine & Mathematical Formulations](docs/ML_PREDICTIVE_ENGINE.md) (NSF-WQI, degradation slopes, RUL formulas).
- [REST & WebSocket API Specification](docs/API_REFERENCE.md) (All endpoints, query params, and Socket.IO events).
