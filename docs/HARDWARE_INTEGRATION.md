# Hardware Integration & Microcontroller Specification

## 1. Overview
AquaPure is designed as a **retrofit IoT module** that attaches to existing commercial or residential water purifiers (RO / UV / UF) without replacing the original water purification machinery.

```
Existing Purifier -> Retrofit Sensor Block -> Raspberry Pi Pico W -> Wi-Fi -> AquaPure Backend API
                                          \-> ESP32-CAM OV2640 -> Wi-Fi -> Optical Inspection Endpoint
```

---

## 2. Bill of Materials (BOM)

### Main Microcontroller
- **Raspberry Pi Pico W** (RP2040 Dual-Core ARM Cortex-M0+, 2.4GHz 802.11n Wi-Fi, 2MB Flash).

### Sensor Modules
1. **Analog pH Sensor Module** (e.g. Gravity: Analog pH Sensor / DFRobot PH0-14 with BNC probe).
2. **Analog TDS Sensor Module** (e.g. DFRobot Gravity TDS Sensor / 0-1000 ppm, 3.3V-5V compatible).
3. **Turbidity Sensor Module** (e.g. Gravity: Analog Turbidity Sensor / 0-3000 NTU optical phototransistor).
4. **Waterproof Temperature Sensor** (DS18B20 1-Wire Digital Waterproof Probe).
5. **Hall-Effect Flow Sensor** (YF-S201 1/2" Flow Meter / 1-30 L/min pulse counter).

### Local User Interface & Status Twin
1. **0.96" I2C OLED Display** (SSD1306 128x64 pixels, I2C address `0x3C`).
2. **Status LEDs** (3x 5mm LEDs: Green = Normal, Yellow = Warning, Red = Critical).
3. **Active Piezo Buzzer** (5V / 3.3V High-level trigger alarm).

### Optical Inspection Node
1. **ESP32-CAM Development Board** (AI-Thinker ESP32-CAM + OV2640 2MP Camera module + ESP32-CAM-MB Micro USB Programmer).

---

## 3. Raspberry Pi Pico W Wiring & Pinout Diagram

| Sensor / Component | Component Pin | Pico W Pin | Pico W GPIO | Notes |
|---|---|---|---|---|
| **pH Sensor** | Analog VOUT | Pin 31 | GPIO26 (ADC0) | Requires 0-3.3V calibration |
| **TDS Sensor** | Analog VOUT | Pin 32 | GPIO27 (ADC1) | Linear voltage to PPM conversion |
| **Turbidity Sensor** | Analog VOUT | Pin 34 | GPIO28 (ADC2) | Inverted phototransistor reading |
| **DS18B20 Temp** | DQ (Data) | Pin 20 | GPIO15 | 4.7kΩ pull-up resistor to 3.3V |
| **YF-S201 Flow** | Pulse OUT | Pin 21 | GPIO16 (IRQ) | Interrupt on rising edge, 7.5 Hz/L/min |
| **OLED Display** | SDA | Pin 6 | GPIO4 (I2C0 SDA) | I2C Data line |
| **OLED Display** | SCL | Pin 7 | GPIO5 (I2C0 SCL) | I2C Clock line |
| **Green LED** | Anode (+) | Pin 14 | GPIO10 | 220Ω current limiting resistor |
| **Yellow LED** | Anode (+) | Pin 15 | GPIO11 | 220Ω current limiting resistor |
| **Red LED** | Anode (+) | Pin 16 | GPIO12 | 220Ω current limiting resistor |
| **Active Buzzer** | Signal | Pin 17 | GPIO13 | Transistor driver / direct GPIO |
| **Power Supply** | VCC / VIN | Pin 39 | VSYS (5V DC) | USB or 5V 2A buck converter |
| **Ground** | GND | Pin 38 / Pin 3 | GND | Common Ground |

---

## 4. Raspberry Pi Pico W MicroPython Ingestion Script (`main.py`)

```python
import time
import network
import urequests
import ujson
from machine import Pin, ADC, I2C
import ssd1306
import onewire, ds18x20

# 1. Wi-Fi Configuration
WIFI_SSID = "FACILITY_WIFI_SSID"
WIFI_PASS = "FACILITY_WIFI_PASSWORD"
BACKEND_ENDPOINT = "http://192.168.1.50:5000/api/devices/readings"

DEVICE_ID = "PICO-W-001"
PURIFIER_CODE = "PUR-001"

# 2. Hardware Peripherals Initialization
adc_ph = ADC(Pin(26))
adc_tds = ADC(Pin(27))
adc_turbidity = ADC(Pin(28))

ds_pin = Pin(15)
ds_sensor = ds18x20.DS18X20(onewire.OneWire(ds_pin))
roms = ds_sensor.scan()

led_green = Pin(10, Pin.OUT)
led_yellow = Pin(11, Pin.OUT)
led_red = Pin(12, Pin.OUT)
buzzer = Pin(13, Pin.OUT)

i2c = I2C(0, scl=Pin(5), sda=Pin(4), freq=400000)
oled = ssd1306.SSD1306_I2C(128, 64, i2c)

flow_pulse_count = 0
def flow_callback(pin):
    global flow_pulse_count
    flow_pulse_count += 1

flow_pin = Pin(16, Pin.IN, Pin.PULL_UP)
flow_pin.irq(trigger=Pin.IRQ_RISING, handler=flow_callback)

def connect_wifi():
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)
    wlan.connect(WIFI_SSID, WIFI_PASS)
    while not wlan.isconnected():
        time.sleep(0.5)
    print("Wi-Fi connected:", wlan.ifconfig())

def read_sensors():
    global flow_pulse_count
    # Read ADCs (16-bit raw: 0 - 65535)
    v_ph = (adc_ph.read_u16() / 65535.0) * 3.3
    ph = 7.0 + (2.5 - v_ph) * 3.5  # Calibration formula

    v_tds = (adc_tds.read_u16() / 65535.0) * 3.3
    tds = (133.42 * (v_tds**3) - 255.86 * (v_tds**2) + 857.39 * v_tds) * 0.5

    v_turb = (adc_turbidity.read_u16() / 65535.0) * 3.3
    turbidity = max(0.1, (4.2 - v_turb) * 2.5)

    # DS18B20 Temp
    temp = 24.0
    if roms:
        ds_sensor.convert_temp()
        time.sleep_ms(100)
        temp = ds_sensor.read_temp(roms[0])

    # Flow Rate in L/min = (pulses / 7.5) for a 1-second sample
    flow_rate = flow_pulse_count / 7.5
    flow_pulse_count = 0

    return {
        "deviceId": DEVICE_ID,
        "purifierCode": PURIFIER_CODE,
        "ph": round(ph, 2),
        "tds": round(tds, 1),
        "turbidity": round(turbidity, 2),
        "temperature": round(temp, 1),
        "flowRate": round(flow_rate, 2),
    }

def update_local_ui(data):
    oled.fill(0)
    oled.text("AQUAPURE", 0, 0)
    oled.text(f"TDS:{data['tds']} pH:{data['ph']}", 0, 18)
    oled.text(f"TURB:{data['turbidity']} FL:{data['flowRate']}", 0, 32)
    oled.text("STATUS: ONLINE", 0, 48)
    oled.show()

    # LED Indicator Logic
    if data['tds'] > 450 or data['flowRate'] < 1.0:
        led_green.value(0); led_yellow.value(0); led_red.value(1)
        buzzer.value(1)
    elif data['tds'] > 280 or data['turbidity'] > 1.2:
        led_green.value(0); led_yellow.value(1); led_red.value(0)
        buzzer.value(0)
    else:
        led_green.value(1); led_yellow.value(0); led_red.value(0)
        buzzer.value(0)

# Main Loop
connect_wifi()
while True:
    try:
        data = read_sensors()
        update_local_ui(data)
        res = urequests.post(BACKEND_ENDPOINT, json=data)
        res.close()
    except Exception as e:
        print("Telemetry Dispatch Error:", e)
    time.sleep(3)
```

---

## 5. IoT Backend Ingestion Endpoint

### HTTP Request
- **URL**: `POST /api/devices/readings`
- **Headers**: `Content-Type: application/json`

### Payload JSON Schema
```json
{
  "deviceId": "PICO-W-001",
  "purifierCode": "PUR-001",
  "ph": 7.24,
  "tds": 154.2,
  "turbidity": 0.42,
  "temperature": 24.1,
  "flowRate": 2.45,
  "timestamp": "2026-08-26T06:00:00.000Z"
}
```

### Success Response (`201 Created`)
```json
{
  "message": "Sensor reading ingested successfully from Raspberry Pi Pico W",
  "success": true,
  "readingId": "clx...",
  "wqi": {
    "score": 93.4,
    "status": "EXCELLENT",
    "subScores": {
      "phScore": 98,
      "tdsScore": 95,
      "turbidityScore": 97,
      "temperatureScore": 100
    },
    "summary": "Optimal potable water quality. All chemical & physical parameters meet WHO safe drinking limits."
  }
}
```
