"""
AquaPure Intelligent Multi-Device USB Hardware Bridge (Plug & Play)
------------------------------------------------------------------
Simultaneously auto-detects & streams from both devices when plugged into laptop:
1. Raspberry Pi Pico W  -> Real-time Water Telemetry (pH, TDS, Turbidity, Temp, Flow Rate)
2. AI Thinker ESP32-CAM -> High-Speed Direct USB Optical Inspection Stream (OV3660 / OV2640)

Features:
- Dynamic Port Discovery: Detects Pico and ESP32-CAM on ANY COM ports automatically.
- Zero-Conflict Locking: Threads claim their respective ports without stealing or race conditions.
- Auto-reconnect & Hot-plugging: Seamlessly resumes when boards are plugged, unplugged, or reset.
- Coexists with Arduino IDE & Thonny: Gracefully backs off if an IDE opens the serial port.
- Local Sync: Direct zero-latency stream to AquaPure Backend at http://localhost:5000.
"""

import sys
import os
import time
import json
import re
import threading
import urllib.request
import urllib.error

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

# Auto-install pyserial if missing
try:
    import serial
    import serial.tools.list_ports
except ImportError:
    print("[Bridge] Installing pyserial...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pyserial"])
    import serial
    import serial.tools.list_ports

BACKEND_URL = "http://127.0.0.1:5000"
ENDPOINT_INGEST = f"{BACKEND_URL}/api/iot/sensor-data"
ENDPOINT_DISCONNECT = f"{BACKEND_URL}/api/iot/disconnect"
ENDPOINT_CAM_UPLOAD = f"{BACKEND_URL}/api/camera/upload-frame/ESP32-CAM-1"
ENDPOINT_CAM_DISCONNECT = f"{BACKEND_URL}/api/camera/disconnect/ESP32-CAM-1"

# Shared port assignment tracking
active_claimed_ports = {
    "pico": None,
    "cam": None
}
lock = threading.Lock()

def send_sensor_data(payload):
    try:
        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(
            ENDPOINT_INGEST,
            data=data,
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        with urllib.request.urlopen(req, timeout=1.5) as resp:
            return resp.status in (200, 201)
    except Exception:
        return False

def notify_pico_disconnect(purifier_code="WP-1"):
    try:
        data = json.dumps({"purifierCode": purifier_code, "isConnected": False}).encode('utf-8')
        req = urllib.request.Request(
            ENDPOINT_DISCONNECT,
            data=data,
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        with urllib.request.urlopen(req, timeout=1.5) as resp:
            pass
    except Exception:
        pass

def send_camera_frame(jpeg_bytes):
    try:
        req = urllib.request.Request(
            ENDPOINT_CAM_UPLOAD,
            data=jpeg_bytes,
            headers={'Content-Type': 'image/jpeg'},
            method='POST'
        )
        with urllib.request.urlopen(req, timeout=1.5) as resp:
            return resp.status in (200, 201)
    except Exception:
        return False

def notify_camera_disconnect():
    try:
        req = urllib.request.Request(
            ENDPOINT_CAM_DISCONNECT,
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        with urllib.request.urlopen(req, timeout=1.5) as resp:
            pass
    except Exception:
        pass

class SensorLineAccumulator:
    """
    Thread-safe sensor line accumulator that handles:
    1. Direct JSON (JSON_DATA:{...} or raw {...})
    2. Multi-line formatted serial blocks (e.g. '--- Packet #X ---', 'pH : ...', 'TDS : ...', 'Turbidity : ...', 'Temperature : ...', 'Water Flow : ...')
    3. Single-line delimited logs (e.g. '[WP-1] #24 | pH: 7.2 | TDS: 150 | Tur: 0.4 | T: 24.0')
    """
    def __init__(self):
        self.state = {
            "deviceId": "PICO-W-001",
            "purifierCode": "WP-1",
            "ph": 7.2,
            "tds": 150.0,
            "turbidity": 0.45,
            "temperature": 24.0,
            "flowRate": 2.2,
        }
        self.updated = set()
        self.last_flush = time.time()

    def process_line(self, line_str):
        line = line_str.strip()
        if not line:
            return None

        # 1. Direct JSON payload
        if "JSON_DATA:" in line:
            try:
                data = json.loads(line.split("JSON_DATA:")[1].strip())
                self.state.update(data)
                self.updated.clear()
                self.last_flush = time.time()
                return dict(self.state)
            except Exception:
                pass

        if line.startswith("{") and line.endswith("}"):
            try:
                data = json.loads(line)
                self.state.update(data)
                self.updated.clear()
                self.last_flush = time.time()
                return dict(self.state)
            except Exception:
                pass

        # 2. Check for packet header / block boundary
        is_boundary = line.startswith("---") or line.startswith("===") or "packet #" in line.lower()
        if is_boundary and len(self.updated) >= 2:
            packet = dict(self.state)
            self.updated.clear()
            self.last_flush = time.time()
            return packet

        # 3. Extract individual parameters using regex
        ph_m = re.search(r'ph\s*[:=]\s*([\d\.]+)', line, re.IGNORECASE)
        tds_m = re.search(r'tds\s*[:=]\s*([\d\.]+)', line, re.IGNORECASE)
        turb_m = re.search(r'tur(?:bidity)?\s*[:=]\s*([\d\.]+)', line, re.IGNORECASE)
        temp_m = re.search(r'(?:temp(?:erature)?|\bt)\s*[:=]\s*([\d\.]+)', line, re.IGNORECASE)
        flow_m = re.search(r'(?:water\s*)?fl(?:ow)?(?:rate)?\s*[:=]\s*([\d\.]+)', line, re.IGNORECASE)

        if ph_m:
            self.state["ph"] = float(ph_m.group(1))
            self.updated.add("ph")
        if tds_m:
            self.state["tds"] = float(tds_m.group(1))
            self.updated.add("tds")
        if turb_m:
            self.state["turbidity"] = float(turb_m.group(1))
            self.updated.add("turbidity")
        if temp_m:
            self.state["temperature"] = float(temp_m.group(1))
            self.updated.add("temperature")
        if flow_m:
            self.state["flowRate"] = float(flow_m.group(1))
            self.updated.add("flowRate")

        # Emit if a full packet block was collected (flowRate is typically last line)
        if "flowRate" in self.updated and len(self.updated) >= 3:
            packet = dict(self.state)
            self.updated.clear()
            self.last_flush = time.time()
            return packet

        # Emit if a single line contains 3 or more parameters
        if len(self.updated) >= 3 and ("ph" in self.updated and "tds" in self.updated):
            packet = dict(self.state)
            self.updated.clear()
            self.last_flush = time.time()
            return packet

        # Fast timeout flush (0.3s) so multi-line output streams with zero human-perceptible delay
        if len(self.updated) >= 2 and (time.time() - self.last_flush > 0.3):
            packet = dict(self.state)
            self.updated.clear()
            self.last_flush = time.time()
            return packet

        return None

def find_available_port(target_type):
    """
    Intelligently identifies the correct COM port for 'pico' or 'cam'
    based on hardware VID/PID, description, and exclusivity.
    """
    global active_claimed_ports
    ports = list(serial.tools.list_ports.comports())
    if not ports:
        return None

    with lock:
        other_type = "cam" if target_type == "pico" else "pico"
        other_port = active_claimed_ports.get(other_type)

        for p in ports:
            dev = p.device.upper()
            if dev == other_port:
                continue

            hwid = (p.hwid or "").lower()
            desc = (p.description or "").lower()

            if target_type == "pico":
                # Raspberry Pi Pico VID: 2E8A
                if "2e8a" in hwid or "pico" in desc or "micropython" in desc or "rp2" in desc:
                    return p.device
            elif target_type == "cam":
                # ESP32 / CH340 / CP210x / FTDI / Espressif VIDs: 1a86, 10c4, 0403, 303a
                if "2e8a" not in hwid and (any(vid in hwid for vid in ["1a86", "10c4", "0403", "303a"]) or \
                   any(name in desc for name in ["ch340", "cp210", "ftdi", "esp32", "usb-serial", "uart"])):
                    return p.device

        # Fallback heuristic: If two generic ports are plugged in and one is unmatched
        for p in ports:
            dev = p.device.upper()
            if dev != other_port:
                if target_type == "pico" and "2e8a" in (p.hwid or "").lower():
                    return p.device
                elif target_type == "cam" and "2e8a" not in (p.hwid or "").lower():
                    return p.device

        return None

# ============================================================================
# THREAD 1: RASPBERRY PI PICO W SENSOR TELEMETRY STREAMER (ULTRA-LOW LATENCY)
# ============================================================================
def pico_worker():
    global active_claimed_ports
    was_connected = False
    accumulator = SensorLineAccumulator()

    while True:
        try:
            port = find_available_port("pico")
            if not port:
                if was_connected:
                    print("[PICO W] Disconnected from USB. Telemetry status -> STANDBY")
                    notify_pico_disconnect("WP-1")
                    with lock:
                        active_claimed_ports["pico"] = None
                    was_connected = False
                time.sleep(1.0)
                continue

            with lock:
                active_claimed_ports["pico"] = port.upper()

            ser = serial.Serial(port, 115200, timeout=0.1)
            ser.dtr = False
            ser.rts = False
            print(f"✓ [PICO W CONNECTED] Streaming real-time sensor telemetry on {port} (115200 baud)...")
            was_connected = True

            buf = bytearray()
            last_sync_time = time.time()
            last_known_payload = dict(accumulator.state)
            send_sensor_data(last_known_payload)

            while True:
                waiting = ser.in_waiting
                now = time.time()

                if waiting > 0:
                    chunk = ser.read(waiting)
                    buf.extend(chunk)

                    while b'\n' in buf:
                        line_bytes, _, rest = buf.partition(b'\n')
                        buf = bytearray(rest)
                        line_str = line_bytes.decode('utf-8', errors='ignore').strip()

                        if line_str:
                            payload = accumulator.process_line(line_str)
                            if payload:
                                last_known_payload = payload
                                ok = send_sensor_data(payload)
                                last_sync_time = now
                                ph = payload.get('ph', 0)
                                tds = payload.get('tds', 0)
                                turb = payload.get('turbidity', 0)
                                temp = payload.get('temperature', 0)
                                flow = payload.get('flowRate', 0)
                                status_flag = "✓ Live" if ok else "⚠ Ingestion Retry"
                                print(f"  📊 [Pico Real-Time -> {status_flag}] pH: {ph:<4} | TDS: {tds:<5} ppm | Turbidity: {turb:<4} NTU | Temp: {temp}°C | Flow: {flow} L/min")
                else:
                    time.sleep(0.01)

                # Periodic heartbeat keep-alive (1.0s) to keep backend watchdog fresh
                if last_known_payload and (now - last_sync_time >= 1.0):
                    send_sensor_data(last_known_payload)
                    last_sync_time = now

                # Protect buffer from unbounded growth
                if len(buf) > 10000:
                    buf = buf[-1000:]

        except (serial.SerialException, OSError, PermissionError):
            if was_connected:
                print(f"[PICO W] Port closed or disconnected. Re-attaching...")
                notify_pico_disconnect("WP-1")
                with lock:
                    active_claimed_ports["pico"] = None
                was_connected = False
            time.sleep(1.5)
        except Exception as e:
            if was_connected:
                notify_pico_disconnect("WP-1")
                with lock:
                    active_claimed_ports["pico"] = None
                was_connected = False
            time.sleep(1.5)

# ============================================================================
# THREAD 2: ESP32-CAM DIRECT USB OPTICAL VIDEO STREAMER
# ============================================================================
def esp32_cam_worker():
    global active_claimed_ports
    was_connected = False

    while True:
        try:
            port = find_available_port("cam")
            if not port:
                if was_connected:
                    print("[ESP32-CAM] Disconnected from USB. Camera status -> OFFLINE")
                    notify_camera_disconnect()
                    with lock:
                        active_claimed_ports["cam"] = None
                    was_connected = False
                time.sleep(1.5)
                continue

            with lock:
                active_claimed_ports["cam"] = port.upper()

            ser = serial.Serial()
            ser.port = port
            ser.baudrate = 115200
            ser.timeout = 0.5
            ser.dtr = False
            ser.rts = False
            ser.open()
            print(f"✓ [ESP32-CAM CONNECTED] Direct USB Optical Stream active on {port}!")
            was_connected = True

            buf = bytearray()
            last_frame_log = time.time()
            frames_count = 0

            start_marker = b"--AQUAPURE_FRAME_START--"
            end_marker = b"--AQUAPURE_FRAME_END--"

            while True:
                waiting = ser.in_waiting
                if waiting > 0:
                    chunk = ser.read(waiting)
                    buf.extend(chunk)
                else:
                    time.sleep(0.01)
                    continue

                # 1. Delimited frame extraction
                if start_marker in buf and end_marker in buf:
                    s_idx = buf.find(start_marker)
                    e_idx = buf.find(end_marker, s_idx)
                    if s_idx != -1 and e_idx != -1:
                        header_end = buf.find(b"\n", s_idx)
                        if header_end != -1 and header_end < e_idx:
                            frame_data = buf[header_end + 1:e_idx].strip()
                            if len(frame_data) > 200:
                                ok = send_camera_frame(bytes(frame_data))
                                if ok:
                                    frames_count += 1
                                    now = time.time()
                                    if now - last_frame_log >= 3.0:
                                        fps = round(frames_count / (now - last_frame_log), 1)
                                        print(f"  📷 [ESP32-CAM Stream] {fps} FPS | Frame Size: {len(frame_data):,} bytes -> Synced to Dashboard")
                                        frames_count = 0
                                        last_frame_log = now
                        buf = buf[e_idx + len(end_marker):]

                # 2. Raw JPEG SOI (0xFFD8) ... EOI (0xFFD9) fallback
                elif b"\xff\xd8" in buf and b"\xff\xd9" in buf:
                    s_idx = buf.find(b"\xff\xd8")
                    e_idx = buf.find(b"\xff\xd9", s_idx)
                    if s_idx != -1 and e_idx != -1 and e_idx > s_idx:
                        frame_data = buf[s_idx:e_idx + 2]
                        if len(frame_data) > 800:
                            ok = send_camera_frame(bytes(frame_data))
                            if ok:
                                frames_count += 1
                                now = time.time()
                                if now - last_frame_log >= 3.0:
                                    fps = round(frames_count / (now - last_frame_log), 1)
                                    print(f"  📷 [ESP32-CAM Stream] {fps} FPS | Frame Size: {len(frame_data):,} bytes -> Synced to Dashboard")
                                    frames_count = 0
                                    last_frame_log = now
                        buf = buf[e_idx + 2:]

                # Prevent excessive memory growth
                if len(buf) > 300000:
                    buf = buf[-60000:]

        except serial.SerialException:
            if was_connected:
                print(f"[ESP32-CAM] Port {port} closed or busy (Flashing/Serial Monitor active). Re-attaching...")
                notify_camera_disconnect()
                with lock:
                    active_claimed_ports["cam"] = None
                was_connected = False
            time.sleep(2)
        except Exception as e:
            if was_connected:
                notify_camera_disconnect()
                with lock:
                    active_claimed_ports["cam"] = None
                was_connected = False
            time.sleep(2)

def main():
    print("=" * 70)
    print("   💧 AQUAPURE INTELLIGENT DUAL USB HARDWARE BRIDGE")
    print("=" * 70)
    print("   [1] Raspberry Pi Pico W  -> Auto-detects & streams Water Telemetry")
    print("   [2] AI Thinker ESP32-CAM -> Auto-detects & streams Optical Video Feed")
    print("   [3] Backend Ingestion    -> http://localhost:5000")
    print("   [4] Live Web Dashboard   -> http://localhost:5173")
    print("=" * 70)
    print("   Plug in both boards via USB into your laptop. Auto-sync active...\n")

    t1 = threading.Thread(target=pico_worker, daemon=True, name="PicoWorker")
    t2 = threading.Thread(target=esp32_cam_worker, daemon=True, name="CamWorker")
    t1.start()
    t2.start()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n[Bridge] Shutting down cleanly...")

if __name__ == "__main__":
    main()
