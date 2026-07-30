# AquaPure REST & WebSocket API Specification

Base URL: `http://localhost:5000/api`

---

## 1. Authentication Endpoints

### `POST /auth/login`
- **Body**: `{ "email": "mithilesh@aquapure.edu", "password": "admin123" }`
- **Response**: `{ "token": "jwt...", "user": { "id": "...", "name": "...", "role": "ADMIN" } }`

### `GET /auth/me`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ "user": { ... } }`

---

## 2. Dashboard & Purifier Telemetry Endpoints

### `GET /dashboard/overview`
Returns high-level KPI counts, fleet averages, active alerts, and recent AI predictions.

### `GET /purifiers`
Returns all registered purifiers with live sensor telemetry, filter health, and device twins.

### `GET /purifiers/:id`
Returns detailed purifier metadata, live telemetry, hardware twins, alerts, and maintenance logs.

### `GET /purifiers/:id/readings?timeframe=24h`
- **Parameters**: `timeframe`: `24h` | `7d` | `30d`
- Returns chronological time-series sensor readings for interactive charts.

---

## 3. IoT Hardware Ingestion Endpoint

### `POST /devices/readings`
Ingests telemetry from Raspberry Pi Pico W.
- **Body**:
```json
{
  "deviceId": "PICO-W-001",
  "purifierCode": "PUR-001",
  "ph": 7.25,
  "tds": 165.0,
  "turbidity": 0.45,
  "temperature": 24.2,
  "flowRate": 2.5
}
```

---

## 4. Simulation & Scenario Controls

### `POST /simulation/scenario`
- **Body**: `{ "purifierId": "uuid", "scenario": "FILTER_DEGRADATION" }`
- **Scenarios**: `NORMAL` | `FILTER_DEGRADATION` | `TURBIDITY_BURST` | `TDS_SPIKE` | `DEVICE_OFFLINE`

### `POST /simulation/reset`
- **Body**: `{ "purifierId": "optional-uuid" }`
- Resets simulation parameters to nominal healthy baseline.

---

## 5. Predictive Maintenance & Alerts

### `GET /predictions`
Returns risk-sorted predictive maintenance matrix across the fleet.

### `GET /alerts`
- **Query Params**: `severity`, `type` (`REACTIVE` | `PREDICTIVE`), `isResolved` (`true` | `false`)

### `PATCH /alerts/:id/acknowledge`
Marks alert as acknowledged.

### `PATCH /alerts/:id/resolve`
Marks alert as resolved.

---

## 6. Maintenance Management

### `GET /maintenance`
Returns all logged maintenance work orders.

### `POST /maintenance`
- **Body**: `{ "purifierId": "...", "type": "FILTER_REPLACEMENT", "technician": "Vikram Singh", "notes": "..." }`

### `PATCH /maintenance/:id/complete`
- **Body**: `{ "filterReplaced": true, "notes": "Completed" }`
- Automatically resets filter health score to 100% and marks purifier as healthy.

---

## 7. Data Exports

### `GET /export/telemetry?days=30&purifierId=...`
Streams CSV of sensor telemetry readings.

### `GET /export/maintenance`
Streams CSV of maintenance records.

---

## 8. Real-Time WebSocket Events (`Socket.IO`)

| Event Name | Direction | Payload Description |
|---|---|---|
| `telemetry:init` | Server -> Client | Initial state snapshot of all purifiers |
| `telemetry:update` | Server -> Client | Live sensor readings, WQI, filter health, device status |
| `telemetry:offline` | Server -> Client | Dispatched when a device goes offline |
| `alert:new` | Server -> Client | Real-time alert broadcast when threshold/trend breaches |
