"""
AquaPure Multi-Device USB Hardware Bridge (Plug & Play)
-------------------------------------------------------
Auto-detects:
1. Raspberry Pi Pico W (COM4) -> Real-time Sensor Telemetry (pH, TDS, Turbidity, Temp)
2. AI Thinker ESP32-CAM (COM7) -> Direct USB Optical Camera Stream to AquaPure Dashboard

Features:
- Seamless coexistence with Arduino IDE: If Arduino IDE is uploading or has Serial Monitor open,
  bridge backs off and re-attaches gracefully without throwing unhandled exceptions.
- Zero-config sync to AquaPure Backend at http://localhost:5000.
"""

import sys
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

BACKEND_URL = "http://localhost:5000"
ENDPOINT_INGEST = f"{BACKEND_URL}/api/iot/sensor-data"
ENDPOINT_DISCONNECT = f"{BACKEND_URL}/api/iot/disconnect"
ENDPOINT_CAM_UPLOAD = f"{BACKEND_URL}/api/camera/upload-frame/ESP32-CAM-1"
ENDPOINT_CAM_DISCONNECT = f"{BACKEND_URL}/api/camera/disconnect/ESP32-CAM-1"

def send_sensor_data(payload):
    try:
        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(
            ENDPOINT_INGEST,
            data=data,
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        with urllib.request.urlopen(req, timeout=2) as resp:
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
        with urllib.request.urlopen(req, timeout=2) as resp:
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
        with urllib.request.urlopen(req, timeout=2) as resp:
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
        with urllib.request.urlopen(req, timeout=2) as resp:
            pass
    except Exception:
        pass

def parse_sensor_line(line_str):
    line_str = line_str.strip()
    if not line_str:
        return None

    if "JSON_DATA:" in line_str:
        try:
            return json.loads(line_str.split("JSON_DATA:")[1].strip())
        except Exception:
            pass

    if line_str.startswith("{") and line_str.endswith("}"):
        try:
            return json.loads(line_str)
        except Exception:
            pass

    ph_match = re.search(r'ph\s*[:=]\s*([\d\.]+)', line_str, re.IGNORECASE)
    tds_match = re.search(r'tds\s*[:=]\s*([\d\.]+)', line_str, re.IGNORECASE)
    turb_match = re.search(r'tur(?:bidity)?\s*[:=]\s*([\d\.]+)', line_str, re.IGNORECASE)
    temp_match = re.search(r'temp(?:erature)?\s*[:=]\s*([\d\.]+)', line_str, re.IGNORECASE)
    flow_match = re.search(r'flow(?:rate)?\s*[:=]\s*([\d\.]+)', line_str, re.IGNORECASE)

    if ph_match or tds_match:
        return {
            "deviceId": "PICO-W-001",
            "purifierCode": "WP-1",
            "ph": float(ph_match.group(1)) if ph_match else 7.2,
            "tds": float(tds_match.group(1)) if tds_match else 150.0,
            "turbidity": float(turb_match.group(1)) if turb_match else 0.45,
            "temperature": float(temp_match.group(1)) if temp_match else 24.0,
            "flowRate": float(flow_match.group(1)) if flow_match else 2.2,
        }

    return None

# ============================================================================
# THREAD 1: RASPBERRY PI PICO W SENSOR STREAMER
# ============================================================================
def pico_worker():
    was_connected = False
    while True:
        try:
            ports = list(serial.tools.list_ports.comports())
            pico_port = None
            for p in ports:
                d = (p.description or "").lower()
                if ("pico" in d or "2e8a" in (p.hwid or "").lower() or p.device.upper() == "COM4") and p.device.upper() != "COM7":
                    pico_port = p.device
                    break

            if not pico_port:
                if was_connected:
                    print("[PICO W] USB Cable Disconnected! Dashboard status -> INACTIVE")
                    notify_pico_disconnect("WP-1")
                    was_connected = False
                time.sleep(2)
                continue

            ser = serial.Serial(pico_port, 115200, timeout=1)
            ser.dtr = False
            ser.rts = False
            print(f"[PICO W CONNECTED] Streaming sensor telemetry on {pico_port}...")
            was_connected = True

            while True:
                line = ser.readline().decode('utf-8', errors='ignore')
                if not line:
                    continue
                payload = parse_sensor_line(line)
                if payload:
                    send_sensor_data(payload)
                    ph = payload.get('ph', 0)
                    tds = payload.get('tds', 0)
                    turb = payload.get('turbidity', 0)
                    print(f"[Sensor Data] pH: {ph:<4} | TDS: {tds:<5} ppm | Turbidity: {turb:<4} NTU")

        except Exception:
            if was_connected:
                notify_pico_disconnect("WP-1")
                was_connected = False
            time.sleep(2)

# ============================================================================
# THREAD 2: ESP32-CAM DIRECT USB VIDEO STREAMER
# ============================================================================
def esp32_cam_worker():
    was_connected = False
    while True:
        try:
            ports = list(serial.tools.list_ports.comports())
            cam_port = None
            for p in ports:
                d = (p.description or "").lower()
                dev = p.device.upper()
                if dev == "COM7" or "ch340" in d or "cp210" in d or "ftdi" in d or "usb-serial" in d:
                    if dev != "COM4":
                        cam_port = p.device
                        break

            if not cam_port:
                if was_connected:
                    print("[ESP32-CAM] USB Disconnected! Camera status -> OFFLINE")
                    notify_camera_disconnect()
                    was_connected = False
                time.sleep(2)
                continue

            ser = serial.Serial()
            ser.port = cam_port
            ser.baudrate = 115200
            ser.timeout = 0.5
            ser.dtr = False
            ser.rts = False
            ser.open()
            print(f"[ESP32-CAM CONNECTED] Direct USB Optical Stream active on {cam_port}!")
            was_connected = True

            buf = bytearray()
            last_frame_time = time.time()

            while True:
                waiting = ser.in_waiting
                if waiting > 0:
                    chunk = ser.read(waiting)
                    buf.extend(chunk)
                else:
                    time.sleep(0.02)
                    continue

                # 1. Look for framed packet delimiters
                start_marker = b"--AQUAPURE_FRAME_START--"
                end_marker = b"--AQUAPURE_FRAME_END--"

                if start_marker in buf and end_marker in buf:
                    s_idx = buf.find(start_marker)
                    e_idx = buf.find(end_marker, s_idx)
                    if s_idx != -1 and e_idx != -1:
                        header_end = buf.find(b"\n", s_idx)
                        if header_end != -1 and header_end < e_idx:
                            frame_data = buf[header_end + 1:e_idx].strip()
                            if len(frame_data) > 200:
                                ok = send_camera_frame(bytes(frame_data))
                                if ok and (time.time() - last_frame_time > 1.0):
                                    print(f"[ESP32-CAM USB Stream] Live frame synced ({len(frame_data):,} bytes)")
                                    last_frame_time = time.time()
                        buf = buf[e_idx + len(end_marker):]

                # 2. Look for raw JPEG delimiters (SOI 0xFFD8 ... EOI 0xFFD9)
                elif b"\xff\xd8" in buf and b"\xff\xd9" in buf:
                    s_idx = buf.find(b"\xff\xd8")
                    e_idx = buf.find(b"\xff\xd9", s_idx)
                    if s_idx != -1 and e_idx != -1 and e_idx > s_idx:
                        frame_data = buf[s_idx:e_idx + 2]
                        if len(frame_data) > 800:
                            send_camera_frame(bytes(frame_data))
                            if time.time() - last_frame_time > 1.0:
                                print(f"[ESP32-CAM JPEG Synced] {len(frame_data):,} bytes")
                                last_frame_time = time.time()
                        buf = buf[e_idx + 2:]

                # Prevent buffer growth
                if len(buf) > 200000:
                    buf = buf[-40000:]

        except Exception as e:
            if was_connected:
                notify_camera_disconnect()
                was_connected = False
            time.sleep(2)

def main():
    print("=" * 65)
    print("   AQUAPURE MULTI-DEVICE USB HARDWARE BRIDGE")
    print("=" * 65)
    print("   * Auto-syncs Pico W (Sensors on COM4)")
    print("   * Auto-syncs ESP32-CAM (Direct USB Camera on COM7)")
    print("   * Live Web Dashboard: http://localhost:5173")
    print("=" * 65 + "\n")

    t1 = threading.Thread(target=pico_worker, daemon=True)
    t2 = threading.Thread(target=esp32_cam_worker, daemon=True)
    t1.start()
    t2.start()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nStopping bridge...")

if __name__ == "__main__":
    main()
