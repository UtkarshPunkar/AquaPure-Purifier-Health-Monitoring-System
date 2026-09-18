@echo off
title AquaPure - Dual USB Hardware Bridge (Pico W + ESP32-CAM)
cls
echo ======================================================================
echo           AQUAPURE DUAL USB HARDWARE TELEMETRY & CAMERA BRIDGE
echo ======================================================================
echo  1. Raspberry Pi Pico W  - Real-time Sensor Telemetry (pH, TDS, Turbidity)
echo  2. AI Thinker ESP32-CAM - Real-time Optical Inspection Video Stream
echo  3. Destination Backend  - http://localhost:5000
echo  4. AquaPure Dashboard   - http://localhost:5173
echo ======================================================================
echo.

py firmware\usb_bridge.py
if %ERRORLEVEL% NEQ 0 (
    python firmware\usb_bridge.py
)

pause
