@echo off
title AquaPure - USB Serial Hardware Bridge
cls
echo ===================================================
echo     AquaPure USB Serial Hardware Telemetry Bridge
echo ===================================================
echo Streaming live sensor telemetry from Pico W (COM Port)
echo to AquaPure Backend (http://localhost:5000)...
echo ===================================================
echo.

py firmware\usb_bridge.py
if %ERRORLEVEL% NEQ 0 (
    python firmware\usb_bridge.py
)

pause
