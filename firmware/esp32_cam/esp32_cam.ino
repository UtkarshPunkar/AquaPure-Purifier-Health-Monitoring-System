#include "esp_camera.h"
#include <WiFi.h>
#include <WebServer.h>
#include <HTTPClient.h>
#include <ESPmDNS.h>
#include "soc/soc.h"
#include "soc/rtc_cntl_reg.h"

// ==============================================================================
//                   AQUAPURE ESP32-CAM OPTICAL MONITORING NODE
//                   Optimized for OV3660 / OV2640 + ESP32-CAM-MB Adapter
// ==============================================================================
// Target Node: WP-1 (EMTech Dept Purifier - 2nd Floor)
// Device ID  : ESP32-CAM-1
// Operation  : Dual-Mode (Direct USB Port Stream + Seamless Wi-Fi Stream)
// ==============================================================================

// ------------------------------------------------------------------------------
// 1. Wi-Fi & Laptop Backend Gateway Configuration
// ------------------------------------------------------------------------------
// Wi-Fi Credentials (same as your Mobile Hotspot / Laptop Wi-Fi)
const char* WIFI_SSID     = "Galaxy F54";      // Your mobile hotspot or router Wi-Fi SSID
const char* WIFI_PASSWORD = "#utk1245";        // Your mobile hotspot Wi-Fi Password

// Laptop Backend Ingestion Candidates (Automatically announces & pushes to laptop)
const char* BACKEND_SERVER_URLS[] = {
  "http://10.240.75.78:5000",
  "http://192.168.43.1:5000",
  "http://192.168.1.100:5000"
};
const int NUM_BACKEND_URLS = 3;

// Fallback Access Point (starts if hotspot is unreachable)
const char* AP_SSID       = "AquaPure-CAM";
const char* AP_PASSWORD   = "aquapure123";

// On-board LED indicator (GPIO 33: Active LOW on AI Thinker)
#define LED_BUILTIN_PIN 33

// Local web server on port 80
WebServer server(80);

// ==============================================================================
// 2. AI Thinker ESP32-CAM Pin Configuration (OV3660 / OV2640)
// ==============================================================================
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27

#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

// ==============================================================================
// 3. Camera Sensor Initialization (OV3660 Native Support)
// ==============================================================================
bool initCamera() {
  camera_config_t config;

  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer   = LEDC_TIMER_0;

  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;

  config.pin_xclk     = XCLK_GPIO_NUM;
  config.pin_pclk     = PCLK_GPIO_NUM;
  config.pin_vsync    = VSYNC_GPIO_NUM;
  config.pin_href     = HREF_GPIO_NUM;
  config.pin_sccb_sda = SIOD_GPIO_NUM;
  config.pin_sccb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn     = PWDN_GPIO_NUM;
  config.pin_reset    = RESET_GPIO_NUM;

  // 20MHz XCLK for smooth 25-30 FPS optical stream
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;

  // Configure memory and buffers based on PSRAM detection
  if (psramFound()) {
    Serial.println("[PSRAM] PSRAM is ENABLED (Optimal for OV3660 3MP Sensor)");
    config.frame_size   = FRAMESIZE_VGA;  // 640x480 Crisp Inspection Frame
    config.jpeg_quality = 12;             // 10-12 optimal for low compression artifacts
    config.fb_count     = 2;              // Double buffering for non-tearing stream
    config.grab_mode    = CAMERA_GRAB_LATEST;
  } else {
    Serial.println("[WARN] PSRAM not found or disabled. Operating in SRAM fallback mode.");
    config.frame_size   = FRAMESIZE_QVGA; // 320x240 for internal SRAM
    config.jpeg_quality = 14;
    config.fb_count     = 1;
    config.grab_mode    = CAMERA_GRAB_WHEN_EMPTY;
  }

  // Initialize camera driver
  esp_err_t result = esp_camera_init(&config);
  if (result != ESP_OK) {
    Serial.printf("[WARN] 20MHz Camera init failed: 0x%x. Retrying at 10MHz XCLK...\n", result);
    config.xclk_freq_hz = 10000000;
    result = esp_camera_init(&config);
    if (result != ESP_OK) {
      Serial.printf("[FATAL] Camera initialization failed: 0x%x\n", result);
      return false;
    }
  }

  // Detect and tune sensor registers (specifically handling OV3660 vs OV2640)
  sensor_t* sensor = esp_camera_sensor_get();
  if (sensor != nullptr) {
    if (sensor->id.PID == OV3660_PID || sensor->id.PID == 0x3660) {
      Serial.println("[SENSOR DETECTED] OmniVision OV3660 (3MP HD Sensor)");
      sensor->set_vflip(sensor, 1);        // Flip vertically for correct orientation
      sensor->set_brightness(sensor, 1);   // Enhance exposure for clear water inspection
      sensor->set_saturation(sensor, -2);  // Natural saturation
    } else {
      Serial.printf("[SENSOR DETECTED] Sensor PID: 0x%x (OV2640 or Compatible)\n", sensor->id.PID);
      sensor->set_vflip(sensor, 0);
      sensor->set_brightness(sensor, 0);
      sensor->set_saturation(sensor, 0);
    }
    sensor->set_contrast(sensor, 1);
    sensor->set_whitebal(sensor, 1);
    sensor->set_awb_gain(sensor, 1);
  }

  Serial.println("[OK] Camera sensor initialized & calibrated successfully!");
  return true;
}

// ==============================================================================
// 4. Auto-Announce to Laptop Backend (Zero-Config Connection)
// ==============================================================================
void announceToBackend() {
  if (WiFi.status() != WL_CONNECTED) return;

  String myIp = WiFi.localIP().toString();
  String streamUrl = "http://" + myIp + "/stream";
  String payload = "{\"deviceId\":\"ESP32-CAM-1\",\"ipAddress\":\"" + myIp + "\",\"streamUrl\":\"" + streamUrl + "\",\"resolution\":\"640x480 VGA\"}";

  for (int i = 0; i < NUM_BACKEND_URLS; i++) {
    HTTPClient http;
    String targetUrl = String(BACKEND_SERVER_URLS[i]) + "/api/camera/config";
    http.begin(targetUrl);
    http.addHeader("Content-Type", "application/json");
    http.setTimeout(1500);

    int httpCode = http.POST(payload);
    if (httpCode == 200 || httpCode == 201) {
      Serial.printf("✓ [OK] Auto-Registered with AquaPure backend (%s)\n", targetUrl.c_str());
      http.end();
      break;
    }
    http.end();
  }
}

// ==============================================================================
// 5. Dual-Stream Frame Broadcaster (USB Serial Port + Wi-Fi POST)
// ==============================================================================
void pushLiveFrame() {
  camera_fb_t* fb = esp_camera_fb_get();
  if (!fb) return;

  // 1. Stream Frame directly to Laptop USB Serial Port (COM7)
  Serial.println("--AQUAPURE_FRAME_START--");
  Serial.write(fb->buf, fb->len);
  Serial.println();
  Serial.println("--AQUAPURE_FRAME_END--");

  // 2. Stream Frame over Wi-Fi HTTP POST to Laptop Backend (if connected)
  if (WiFi.status() == WL_CONNECTED) {
    for (int i = 0; i < NUM_BACKEND_URLS; i++) {
      HTTPClient http;
      String targetUrl = String(BACKEND_SERVER_URLS[i]) + "/api/camera/upload-frame/ESP32-CAM-1";
      http.begin(targetUrl);
      http.addHeader("Content-Type", "image/jpeg");
      http.setTimeout(250); // Non-blocking fast timeout

      int httpCode = http.POST(fb->buf, fb->len);
      if (httpCode == 200 || httpCode == 201) {
        http.end();
        break;
      }
      http.end();
    }
  }

  esp_camera_fb_return(fb);
}

// ==============================================================================
// 6. Local Web Server Endpoints (/stream, /capture, /)
// ==============================================================================
const char MAIN_PAGE[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>AquaPure Live Camera (OV3660)</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; text-align: center; background: #0f172a; color: #f8fafc; margin: 0; padding: 20px; }
    h1 { color: #38bdf8; margin-bottom: 4px; font-size: 24px; }
    .subtitle { color: #94a3b8; font-size: 14px; margin-bottom: 16px; }
    .card { background: #1e293b; max-width: 680px; margin: auto; padding: 24px; border-radius: 16px; border: 1px solid #334155; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
    img { width: 100%; max-width: 640px; border-radius: 12px; background: #000; border: 1px solid #334155; }
    .btn-group { margin-top: 16px; }
    button { padding: 10px 18px; margin: 6px; border: none; border-radius: 8px; background: #0284c7; color: white; font-size: 14px; font-weight: bold; cursor: pointer; transition: all 0.2s; }
    button:hover { background: #0369a1; transform: translateY(-1px); }
    .badge { display: inline-block; background: #064e3b; color: #34d399; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: bold; margin-bottom: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>AquaPure Optical Inspection Node</h1>
    <div class="subtitle">Sensor: OV3660 HD | Target Purifier: WP-1</div>
    <div class="badge">● DUAL-STREAM ACTIVE (USB PORT + WI-FI)</div>
    <br>
    <img id="camera" src="/stream" alt="Live camera stream">
    <br>
    <div class="btn-group">
      <button onclick="window.open('/capture', '_blank')">📸 Capture Snapshot</button>
      <button onclick="location.reload()">🔄 Refresh Stream</button>
    </div>
  </div>
</body>
</html>
)rawliteral";

void handleRoot() {
  server.send(200, "text/html", MAIN_PAGE);
}

void handleCapture() {
  camera_fb_t* fb = esp_camera_fb_get();
  if (!fb) {
    server.send(500, "text/plain", "Camera capture failed");
    return;
  }

  WiFiClient client = server.client();
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Content-Disposition", "inline; filename=aquapure.jpg");
  server.setContentLength(fb->len);
  server.send(200, "image/jpeg", "");

  client.write(fb->buf, fb->len);
  esp_camera_fb_return(fb);
}

void handleStream() {
  WiFiClient client = server.client();
  client.setTimeout(3);

  client.println("HTTP/1.1 200 OK");
  client.println("Access-Control-Allow-Origin: *");
  client.println("Content-Type: multipart/x-mixed-replace; boundary=frame");
  client.println("Cache-Control: no-cache, no-store, must-revalidate");
  client.println("Pragma: no-cache");
  client.println("Connection: close");
  client.println();

  while (client.connected()) {
    camera_fb_t* fb = esp_camera_fb_get();
    if (!fb) {
      delay(20);
      continue;
    }

    if (!client.connected()) {
      esp_camera_fb_return(fb);
      break;
    }

    client.println("--frame");
    client.println("Content-Type: image/jpeg");
    client.printf("Content-Length: %u\r\n\r\n", fb->len);
    client.write(fb->buf, fb->len);
    client.println();

    esp_camera_fb_return(fb);
    yield();
    delay(40);
  }
}

// ==============================================================================
// 7. Setup & Network Initialization
// ==============================================================================
void setup() {
  // 1. Disable brownout detector immediately to prevent voltage sag reset loops
  WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0);

  // 2. Setup Serial and Status LED
  Serial.begin(115200);
  pinMode(LED_BUILTIN_PIN, OUTPUT);
  digitalWrite(LED_BUILTIN_PIN, LOW); // Turn on LED briefly during boot

  delay(600);

  Serial.println();
  Serial.println("==========================================================");
  Serial.println("   💧 AQUAPURE ESP32-CAM (OV3660 / OV2640 DUAL STREAM)");
  Serial.println("==========================================================");

  // 3. Initialize Camera Hardware
  if (!initCamera()) {
    Serial.println("[FATAL ERROR] Camera sensor failed to initialize.");
    Serial.println("Please check:");
    Serial.println("1. Ribbon cable is seated firmly in the FPC camera connector.");
    Serial.println("2. In Arduino IDE Tools menu, set PSRAM -> 'Enabled'.");
    while (true) {
      // Rapid blink error pattern
      digitalWrite(LED_BUILTIN_PIN, LOW);
      delay(150);
      digitalWrite(LED_BUILTIN_PIN, HIGH);
      delay(150);
    }
  }

  digitalWrite(LED_BUILTIN_PIN, HIGH); // Turn off LED after successful init

  // 4. Configure Wi-Fi power and stability
  WiFi.mode(WIFI_STA);
  WiFi.setSleep(false);
  WiFi.setAutoReconnect(true);
  WiFi.setTxPower(WIFI_POWER_11dBm); // Reduces Wi-Fi current spikes from 450mA to 180mA to avoid USB port resets
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.print("[Wi-Fi] Connecting to '");
  Serial.print(WIFI_SSID);
  Serial.print("'");

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 24) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("==========================================================");
    Serial.println("✓ [OK] Wi-Fi Connected Successfully!");
    Serial.print("  SSID       : ");
    Serial.println(WIFI_SSID);
    Serial.print("  Camera IP  : http://");
    Serial.println(WiFi.localIP());
    Serial.print("  Stream URL : http://");
    Serial.print(WiFi.localIP());
    Serial.println("/stream");
    Serial.print("  Snapshot   : http://");
    Serial.print(WiFi.localIP());
    Serial.println("/capture");
    Serial.println("==========================================================");

    announceToBackend();

    if (MDNS.begin("aquapure-cam")) {
      Serial.println("[OK] mDNS responder active: http://aquapure-cam.local");
    }
  } else {
    Serial.println("[WARN] Wi-Fi connection timed out. Starting Fallback AP...");
    WiFi.mode(WIFI_AP);
    WiFi.softAP(AP_SSID, AP_PASSWORD);
    Serial.print("  AP SSID    : ");
    Serial.println(AP_SSID);
    Serial.print("  AP IP      : http://");
    Serial.println(WiFi.softAPIP());
    Serial.println("  Stream URL : http://192.168.4.1/stream");
    Serial.println("==========================================================");
  }

  // 5. Start HTTP Server
  server.on("/", HTTP_GET, handleRoot);
  server.on("/capture", HTTP_GET, handleCapture);
  server.on("/stream", HTTP_GET, handleStream);
  server.begin();
  Serial.println("[OK] Camera Web Server listening on port 80");
  Serial.println("==========================================================");
}

// ==============================================================================
// 8. Main Loop
// ==============================================================================
unsigned long lastPushTime = 0;
unsigned long lastAnnounceTime = 0;

void loop() {
  server.handleClient();

  // Periodically re-announce to backend every 30 seconds
  if (millis() - lastAnnounceTime > 30000) {
    lastAnnounceTime = millis();
    announceToBackend();
  }

  // Push live frames over USB Serial Port + Wi-Fi (~6-10 FPS)
  if (millis() - lastPushTime > 150) {
    lastPushTime = millis();
    pushLiveFrame();
  }

  delay(2);
}
