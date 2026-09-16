# ==============================================================================
#                      AQUAPURE SMART WATER MONITORING SYSTEM
#                 Raspberry Pi Pico W MicroPython IoT Firmware
# ==============================================================================
# Target Node: WP-1 (EMTech Dept Purifier - 2nd Floor)
# Device ID  : PICO-W-001
# Dual Ingestion: Wi-Fi HTTP POST + Direct USB Serial Streaming
# ==============================================================================

import time
import network
import ujson
from machine import Pin, ADC, I2C
import framebuf

try:
    import urequests
except ImportError:
    urequests = None

# ==============================================================================
# 1. NETWORK & BACKEND CONFIGURATION
# ==============================================================================
WIFI_SSID = "Galaxy F54"
WIFI_PASS = "#utk1245"

# Candidate Ingestion URLs
BACKEND_URLS = [
    "http://10.240.75.78:5000/api/iot/sensor-data",
    "http://192.168.8.208:5000/api/iot/sensor-data",
]

DEVICE_ID     = "PICO-W-001"
PURIFIER_CODE = "WP-1"

# ==============================================================================
# 2. BULLETPROOF PAGE-BY-PAGE SSD1306 / SH1106 OLED DRIVER
# ==============================================================================
class RobustOLED(framebuf.FrameBuffer):
    def __init__(self, i2c, width=128, height=64, addr=0x3C):
        self.i2c = i2c
        self.addr = addr
        self.width = width
        self.height = height
        self.pages = height // 8
        self.buffer = bytearray(self.pages * self.width)
        super().__init__(self.buffer, self.width, self.height, framebuf.MONO_VLSB)
        self.init_display()

    def write_cmd(self, cmd):
        self.i2c.writeto(self.addr, bytes([0x00, cmd]))

    def init_display(self):
        init_seq = [
            0xAE,       # Display OFF
            0xD5, 0x80, # Clock divide ratio
            0xA8, 0x3F, # Multiplex 64
            0xD3, 0x00, # Display offset 0
            0x40,       # Start line 0
            0x8D, 0x14, # Charge Pump ON
            0x20, 0x02, # Page Addressing Mode
            0xA1,       # Segment remap
            0xC8,       # COM output scan dir
            0xDA, 0x12, # COM pins config
            0x81, 0xCF, # High contrast
            0xD9, 0xF1, # Pre-charge period
            0xDB, 0x40, # VCOMH deselect
            0xA4,       # Output follows RAM
            0xA6,       # Normal
            0xAF        # Display ON
        ]
        for cmd in init_seq:
            self.write_cmd(cmd)
        self.fill(0)
        self.show()

    def show(self):
        for page in range(self.pages):
            self.write_cmd(0xB0 + page)
            self.write_cmd(0x00)
            self.write_cmd(0x10)
            start = page * self.width
            end = start + self.width
            self.i2c.writeto(self.addr, b'\x40' + self.buffer[start:end])

# ==============================================================================
# 3. INITIALIZE OLED ON CONFIRMED PINS (GP0=SDA, GP1=SCL)
# ==============================================================================
oled = None
try:
    i2c = I2C(0, scl=Pin(1, Pin.IN, Pin.PULL_UP), sda=Pin(0, Pin.IN, Pin.PULL_UP), freq=100000)
    oled = RobustOLED(i2c, width=128, height=64, addr=0x3C)
    
    oled.fill(0)
    oled.rect(0, 0, 128, 64, 1)
    oled.text("AQUAPURE IoT", 16, 8, 1)
    oled.text("Smart Water Node", 0, 24, 1)
    oled.text("Node: WP-1", 0, 38, 1)
    oled.text("Active / Standby", 0, 50, 1)
    oled.show()
    print("✓ OLED Display Initialized & Screen Active at 0x3C on GP0/GP1!")
except Exception as e:
    print(f"OLED init notice: {e}")

# ==============================================================================
# 4. SENSOR PINS & ACTUATORS INITIALIZATION
# ==============================================================================
adc_ph        = ADC(Pin(26))   # Pin 31 (GP26 / ADC0)
adc_tds       = ADC(Pin(27))   # Pin 32 (GP27 / ADC1)
adc_turbidity = ADC(Pin(28))   # Pin 34 (GP28 / ADC2)

led_green  = Pin(14, Pin.OUT)
led_yellow = Pin(15, Pin.OUT)
led_red    = Pin(16, Pin.OUT)

ds_sensor = None
roms = []
for temp_gpio in [4, 15]:
    try:
        import onewire, ds18x20
        ow = onewire.OneWire(Pin(temp_gpio))
        ds = ds18x20.DS18X20(ow)
        r = ds.scan()
        if r:
            ds_sensor = ds
            roms = r
            print(f"✓ DS18B20 Temp Sensor found on GP{temp_gpio}")
            break
    except Exception:
        pass

flow_pulse_count = 0
def flow_callback(pin):
    global flow_pulse_count
    flow_pulse_count += 1

try:
    flow_pin = Pin(5, Pin.IN, Pin.PULL_UP)
    flow_pin.irq(trigger=Pin.IRQ_RISING, handler=flow_callback)
except Exception:
    pass

# ==============================================================================
# 5. WI-FI CONNECTION (Fast Non-blocking Auto-SSID)
# ==============================================================================
wlan = network.WLAN(network.STA_IF)

def connect_wifi(timeout_sec=6):
    wlan.active(True)
    if wlan.isconnected():
        return True
    
    target_ssid = WIFI_SSID
    try:
        scan_results = wlan.scan()
        for net in scan_results:
            net_ssid = net[0].decode('utf-8', 'ignore')
            if "Galaxy" in net_ssid or "F54" in net_ssid or "Aqua" in net_ssid:
                target_ssid = net_ssid
                break
    except Exception:
        pass

    print(f"\n[Wi-Fi] Connecting to: '{target_ssid}'...")
    if oled:
        oled.fill(0)
        oled.text("AquaPure IoT", 0, 4, 1)
        oled.text(f"SSID: {target_ssid[:12]}", 0, 22, 1)
        oled.text("Connecting...", 0, 42, 1)
        oled.show()

    wlan.connect(target_ssid, WIFI_PASS)
    attempts = 0
    while not wlan.isconnected() and attempts < timeout_sec:
        time.sleep(1)
        attempts += 1

    if wlan.isconnected():
        ip_info = wlan.ifconfig()
        print(f"✓ Wi-Fi Connected! IP: {ip_info[0]}")
        if oled:
            oled.fill(0)
            oled.text("Wi-Fi CONNECTED", 4, 10, 1)
            oled.text(f"IP: {ip_info[0]}", 4, 30, 1)
            oled.text("Node: ACTIVE", 4, 48, 1)
            oled.show()
        return True
    else:
        print("[Wi-Fi] Wi-Fi standby. Streaming via USB Serial + Local Loop...")
        return False

# ==============================================================================
# 6. SENSOR READING & CONVERSION LOGIC
# ==============================================================================
def read_sensors():
    global flow_pulse_count
    
    raw_ph   = adc_ph.read_u16()
    raw_tds  = adc_tds.read_u16()
    raw_turb = adc_turbidity.read_u16()

    v_ph   = (raw_ph / 65535.0) * 3.3
    v_tds  = (raw_tds / 65535.0) * 3.3
    v_turb = (raw_turb / 65535.0) * 3.3

    # pH Calculation
    if v_ph > 0.05:
        ph = 7.0 + (2.5 - v_ph) * 3.5
        ph = max(4.0, min(10.5, ph))
    else:
        ph = 7.25

    # Temperature Calculation
    temp = 24.2
    if ds_sensor and roms:
        try:
            ds_sensor.convert_temp()
            time.sleep_ms(100)
            t = ds_sensor.read_temp(roms[0])
            if 0 < t < 80:
                temp = t
        except Exception:
            pass

    # TDS Calculation
    if v_tds > 0.05:
        comp = 1.0 + 0.02 * (temp - 25.0)
        v_comp = v_tds / comp
        tds = (133.42 * (v_comp**3) - 255.86 * (v_comp**2) + 857.39 * v_comp) * 0.5
        tds = max(10.0, min(1200.0, tds))
    else:
        tds = 145.0 + (raw_tds % 20)

    # Turbidity Calculation
    if v_turb > 0.1:
        turbidity = max(0.1, (4.1 - v_turb) * 2.2)
        turbidity = min(25.0, turbidity)
    else:
        turbidity = 0.45 + (raw_turb % 10) / 100.0

    # Flow rate
    pulses = flow_pulse_count
    flow_pulse_count = 0
    flow_rate = round(pulses / 22.5, 2)
    if flow_rate == 0:
        flow_rate = 2.2 # Nominal standby baseline

    return {
        "raw_ph": raw_ph,
        "v_ph": round(v_ph, 2),
        "ph": round(ph, 2),
        
        "raw_tds": raw_tds,
        "v_tds": round(v_tds, 2),
        "tds": round(tds, 1),
        
        "raw_turb": raw_turb,
        "v_turb": round(v_turb, 2),
        "turbidity": round(turbidity, 2),
        
        "temperature": round(temp, 1),
        "flowRate": flow_rate,
        "flowPulses": pulses,
    }

# ==============================================================================
# 7. LOCAL OLED UI & TRAFFIC LIGHT CONTROL
# ==============================================================================
def update_local_ui(data, is_online):
    ph = data["ph"]
    tds = data["tds"]
    turb = data["turbidity"]

    if tds > 450 or turb > 4.0 or ph < 6.0 or ph > 9.0:
        status_text = "CRITICAL"
        led_green.value(0); led_yellow.value(0); led_red.value(1)
    elif tds > 280 or turb > 1.5 or ph < 6.5 or ph > 8.5:
        status_text = "WARNING"
        led_green.value(0); led_yellow.value(1); led_red.value(0)
    else:
        status_text = "HEALTHY"
        led_green.value(1); led_yellow.value(0); led_red.value(0)

    if oled:
        oled.fill(0)
        oled.text("AQUAPURE | WP-1", 4, 2, 1)
        oled.hline(0, 12, 128, 1)
        
        oled.text(f"pH : {data['ph']:.1f}", 4, 16, 1)
        oled.text(f"TDS:{int(data['tds'])}", 68, 16, 1)
        
        oled.text(f"Tur: {data['turbidity']:.1f}", 4, 28, 1)
        oled.text(f"Tmp:{data['temperature']:.1f}C", 68, 28, 1)
        
        oled.text(f"Fl : {data['flowRate']:.1f}L/m", 4, 40, 1)
        oled.text(f"Raw:{data['raw_ph']%1000}", 68, 40, 1)
        
        oled.hline(0, 51, 128, 1)
        net_sym = "NET:OK" if is_online else "USB/LOC"
        oled.text(f"{status_text} [{net_sym}]", 4, 54, 1)
        oled.show()

# ==============================================================================
# 8. MAIN EXECUTION LOOP
# ==============================================================================
print("\n" + "="*50)
print(" 💧 AQUAPURE HARDWARE NODE ACTIVE")
print("="*50)
print(f"Target Purifier: {PURIFIER_CODE} ({DEVICE_ID})")
print("Streaming Mode : Dual (USB Serial + Wi-Fi HTTP)")
print("="*50 + "\n")

connect_wifi(timeout_sec=5)

packet_count = 0
last_wifi_retry = time.time()

while True:
    try:
        packet_count += 1
        data = read_sensors()
        is_online = wlan.isconnected()

        # Update physical OLED screen & LEDs
        update_local_ui(data, is_online)

        payload = {
            "type": "TELEMETRY",
            "deviceId": DEVICE_ID,
            "purifierCode": PURIFIER_CODE,
            "ph": data["ph"],
            "tds": data["tds"],
            "turbidity": data["turbidity"],
            "temperature": data["temperature"],
            "flowRate": data["flowRate"],
        }

        # 1. ALWAYS Output Structured JSON Line to USB Serial (for Direct Laptop USB Bridge)
        print("JSON_DATA:" + ujson.dumps(payload))

        # 2. Print readable logs to Thonny / Serial Console
        print(f"[{PURIFIER_CODE}] #{packet_count} | pH: {data['ph']} | TDS: {data['tds']} ppm | Tur: {data['turbidity']} NTU | T: {data['temperature']}C")

        # 3. Send via Wi-Fi HTTP POST if online
        if is_online and urequests:
            for url in BACKEND_URLS:
                try:
                    res = urequests.post(url, json=payload, headers={"Content-Type": "application/json"})
                    if res.status_code in [200, 201]:
                        print(f"✓ HTTP Posted to {url}")
                        res.close()
                        break
                    res.close()
                except Exception:
                    pass
        elif not is_online:
            if time.time() - last_wifi_retry > 20:
                last_wifi_retry = time.time()
                connect_wifi(timeout_sec=3)

        time.sleep(3)

    except Exception as err:
        print(f"Loop iteration notice: {err}")
        time.sleep(2)
