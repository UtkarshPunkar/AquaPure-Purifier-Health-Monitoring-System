import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../api/client';
import {
  Settings,
  ShieldCheck,
  Cpu,
  Sliders,
  Bell,
  Save,
  CheckCircle2,
  Building,
  Info,
  Sun,
  Moon,
  Users,
  Code2,
  Copy,
  KeyRound,
  Sparkles,
  Smartphone,
  Mail,
  SlidersHorizontal,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<'profile' | 'organization' | 'notifications' | 'thresholds' | 'appearance' | 'iot'>('thresholds');
  const [isSaved, setIsSaved] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  // Form State
  const [profile, setProfile] = useState({
    name: user?.name || 'Mithilesh Kose',
    email: user?.email || 'mithilesh@aquapure.edu',
    role: user?.role || 'ADMIN',
    department: 'Central Water & Facility Operations',
    phone: '+91 98765 43210',
  });

  const [organization, setOrganization] = useState({
    campusName: 'S.B. Jain Institute of Technology, Management & Research',
    campusAddress: 'Katol Road, Nagpur, Maharashtra 441501',
    facilityLead: 'Dr. S. L. Badjate',
    contactEmail: 'water-monitoring@sbjit.edu.in',
  });

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    smsAlerts: true,
    pushNotifications: true,
    alertFrequency: 'INSTANT',
    webhookUrl: 'https://webhook.sbjit.edu.in/iot/water-alerts',
  });

  const [thresholds, setThresholds] = useState({
    phMin: 6.5,
    phMax: 8.5,
    tdsMax: 300,
    turbidityMax: 5.0,
    tempMin: 10.0,
    tempMax: 35.0,
    filterWarning: 40,
    filterCritical: 20,
  });

  const [apiToken, setApiToken] = useState('aqp_live_9f8a3c42e1b87d60514a382c719e');

  useEffect(() => {
    // Fetch settings from server
    api.getSettings().then((s) => {
      if (s) {
        setThresholds({
          phMin: s.phMin || 6.5,
          phMax: s.phMax || 8.5,
          tdsMax: s.tdsMax || 300,
          turbidityMax: s.turbidityMax || 5.0,
          tempMin: s.tempMin || 10.0,
          tempMax: s.tempMax || 35.0,
          filterWarning: s.filterWarning || 40,
          filterCritical: s.filterCritical || 20,
        });
        setNotifications((prev) => ({
          ...prev,
          emailAlerts: s.emailAlerts ?? true,
          smsAlerts: s.smsAlerts ?? true,
          pushNotifications: s.pushAlerts ?? true,
        }));
      }
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateSettings({
        ...thresholds,
        emailAlerts: notifications.emailAlerts,
        smsAlerts: notifications.smsAlerts,
        pushAlerts: notifications.pushNotifications,
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  };

  const picoScript = `# ==============================================================================
# AquaPure IoT - Raspberry Pi Pico W Telemetry Streamer (MicroPython)
# Hardware: Raspberry Pi Pico W + Analog pH, TDS, Turbidity, DS18B20 Temp
# ==============================================================================

import network
import urequests
import utime
import machine

# 1. Wi-Fi Configuration
SSID = "Campus_WiFi_IoT"
PASSWORD = "SecurePassword123"

# 2. AquaPure IoT Backend Endpoint
API_URL = "http://192.168.1.100:5000/api/iot/sensor-data"
API_TOKEN = "${apiToken}"
PURIFIER_ID = "WP-001"

# 3. ADC Sensor Pin Mappings
PIN_PH = machine.ADC(26)         # GP26 / ADC0
PIN_TDS = machine.ADC(27)        # GP27 / ADC1
PIN_TURBIDITY = machine.ADC(28)  # GP28 / ADC2
LED_STATUS = machine.Pin("LED", machine.Pin.OUT)

def connect_wifi():
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)
    if not wlan.isconnected():
        print("Connecting to Wi-Fi...")
        wlan.connect(SSID, PASSWORD)
        while not wlan.isconnected():
            LED_STATUS.toggle()
            utime.sleep(0.5)
    print("Connected! IP:", wlan.ifconfig()[0])
    LED_STATUS.value(1)

def read_telemetry():
    # Convert 16-bit ADC (0-65535) to calibrated engineering values
    raw_ph = PIN_PH.read_u16()
    ph_voltage = (raw_ph / 65535.0) * 3.3
    ph_val = round(7.0 + ((2.5 - ph_voltage) * 3.5), 2)

    raw_tds = PIN_TDS.read_u16()
    tds_voltage = (raw_tds / 65535.0) * 3.3
    tds_val = round((133.42 * (tds_voltage**3) - 255.86 * (tds_voltage**2) + 857.39 * tds_voltage) * 0.5, 0)

    raw_turb = PIN_TURBIDITY.read_u16()
    turb_val = round((1.0 - (raw_turb / 65535.0)) * 5.0, 2)
    temp_val = 24.5
    water_level_val = 85

    return {
        "purifier_id": PURIFIER_ID,
        "ph": max(0.0, min(14.0, ph_val)),
        "tds": max(0.0, tds_val),
        "turbidity": max(0.0, turb_val),
        "temperature": temp_val,
        "water_level": water_level_val
    }

connect_wifi()

while True:
    try:
        payload = read_telemetry()
        headers = {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + API_TOKEN
        }
        res = urequests.post(API_URL, json=payload, headers=headers)
        print("Telemetry Synced! HTTP Status:", res.status_code)
        res.close()
    except Exception as e:
        print("Transmission Error:", e)
    utime.sleep(5)  # 5-second polling interval
`;

  const copyToClipboard = (text: string, type: 'code' | 'token') => {
    navigator.clipboard.writeText(text);
    if (type === 'code') {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            System & Threshold Configuration
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure safety thresholds, organization profile, alert channels, and copy Raspberry Pi Pico W IoT firmware.
          </p>
        </div>

        {isSaved && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold animate-in fade-in">
            <CheckCircle2 size={16} />
            <span>Settings Saved!</span>
          </div>
        )}
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex items-center gap-1.5 flex-wrap border-b border-slate-200 dark:border-slate-800 pb-3 text-xs font-semibold">
        {[
          { id: 'thresholds', label: 'Threshold Limits', icon: SlidersHorizontal },
          { id: 'profile', label: 'User Profile', icon: Users },
          { id: 'organization', label: 'Organization & Facility', icon: Building },
          { id: 'notifications', label: 'Notifications & Alerts', icon: Bell },
          { id: 'appearance', label: 'Appearance & Theme', icon: Sun },
          { id: 'iot', label: 'API & Raspberry Pi Pico W IoT', icon: Cpu },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all ${
                activeTab === tab.id
                  ? 'bg-sky-600 text-white font-bold shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* TAB 1: THRESHOLD SETTINGS */}
        {activeTab === 'thresholds' && (
          <div className="space-y-5 animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <SlidersHorizontal size={16} className="text-sky-600 dark:text-sky-400" />
                  Water Safety & Sensor Alarm Thresholds
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Set baseline parameter boundaries derived from WHO and IS 10500 standards.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
                {/* Minimum pH */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <label className="font-sans font-bold text-slate-700 dark:text-slate-300 block">
                    Minimum pH Level
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={thresholds.phMin}
                    onChange={(e) => setThresholds({ ...thresholds, phMin: parseFloat(e.target.value) || 6.5 })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                  />
                  <span className="font-sans text-[10px] text-slate-400 block">Nominal safe lower bound</span>
                </div>

                {/* Maximum pH */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <label className="font-sans font-bold text-slate-700 dark:text-slate-300 block">
                    Maximum pH Level
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={thresholds.phMax}
                    onChange={(e) => setThresholds({ ...thresholds, phMax: parseFloat(e.target.value) || 8.5 })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                  />
                  <span className="font-sans text-[10px] text-slate-400 block">Nominal safe upper bound</span>
                </div>

                {/* Maximum TDS */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <label className="font-sans font-bold text-slate-700 dark:text-slate-300 block">
                    Maximum TDS (ppm)
                  </label>
                  <input
                    type="number"
                    value={thresholds.tdsMax}
                    onChange={(e) => setThresholds({ ...thresholds, tdsMax: parseInt(e.target.value) || 300 })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                  />
                  <span className="font-sans text-[10px] text-slate-400 block">WHO potability recommendation</span>
                </div>

                {/* Maximum Turbidity */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <label className="font-sans font-bold text-slate-700 dark:text-slate-300 block">
                    Maximum Turbidity (NTU)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={thresholds.turbidityMax}
                    onChange={(e) => setThresholds({ ...thresholds, turbidityMax: parseFloat(e.target.value) || 5.0 })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                  />
                  <span className="font-sans text-[10px] text-slate-400 block">Suspended particulate ceiling</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono pt-2">
                {/* Minimum Temp */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <label className="font-sans font-bold text-slate-700 dark:text-slate-300 block">
                    Min Temperature (°C)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={thresholds.tempMin}
                    onChange={(e) => setThresholds({ ...thresholds, tempMin: parseFloat(e.target.value) || 10.0 })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                  />
                </div>

                {/* Maximum Temp */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <label className="font-sans font-bold text-slate-700 dark:text-slate-300 block">
                    Max Temperature (°C)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={thresholds.tempMax}
                    onChange={(e) => setThresholds({ ...thresholds, tempMax: parseFloat(e.target.value) || 35.0 })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                  />
                </div>

                {/* Filter Warning Health % */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <label className="font-sans font-bold text-slate-700 dark:text-slate-300 block">
                    Filter Warning Level (%)
                  </label>
                  <input
                    type="number"
                    value={thresholds.filterWarning}
                    onChange={(e) => setThresholds({ ...thresholds, filterWarning: parseInt(e.target.value) || 40 })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                  />
                  <span className="font-sans text-[10px] text-amber-600 dark:text-amber-400 block">Triggers &quot;Replace Soon&quot;</span>
                </div>

                {/* Filter Critical Health % */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <label className="font-sans font-bold text-slate-700 dark:text-slate-300 block">
                    Filter Critical Level (%)
                  </label>
                  <input
                    type="number"
                    value={thresholds.filterCritical}
                    onChange={(e) => setThresholds({ ...thresholds, filterCritical: parseInt(e.target.value) || 20 })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                  />
                  <span className="font-sans text-[10px] text-rose-600 dark:text-rose-400 block">Immediate service alert</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PROFILE SETTINGS */}
        {activeTab === 'profile' && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 animate-in fade-in">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users size={16} className="text-sky-600 dark:text-sky-400" />
                User Profile & Credentials
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Department</label>
                <input
                  type="text"
                  value={profile.department}
                  onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ORGANIZATION SETTINGS */}
        {activeTab === 'organization' && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 animate-in fade-in">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building size={16} className="text-sky-600 dark:text-sky-400" />
                Campus & Facility Details
              </h3>
            </div>

            <div className="space-y-3 text-xs font-sans">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Campus Institution Name</label>
                <input
                  type="text"
                  value={organization.campusName}
                  onChange={(e) => setOrganization({ ...organization, campusName: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Campus Address</label>
                <input
                  type="text"
                  value={organization.campusAddress}
                  onChange={(e) => setOrganization({ ...organization, campusAddress: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Facility Operations Lead</label>
                  <input
                    type="text"
                    value={organization.facilityLead}
                    onChange={(e) => setOrganization({ ...organization, facilityLead: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Operations Contact Email</label>
                  <input
                    type="email"
                    value={organization.contactEmail}
                    onChange={(e) => setOrganization({ ...organization, contactEmail: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: NOTIFICATIONS */}
        {activeTab === 'notifications' && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 animate-in fade-in">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Bell size={16} className="text-sky-600 dark:text-sky-400" />
                Notification Channels & Frequency
              </h3>
            </div>

            <div className="space-y-4 text-xs font-sans">
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.emailAlerts}
                    onChange={(e) => setNotifications({ ...notifications, emailAlerts: e.target.checked })}
                    className="h-4 w-4 rounded text-sky-600"
                  />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">Email Alerts</span>
                    <span className="text-slate-500 dark:text-slate-400">Send immediate notifications for critical water breaches.</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.smsAlerts}
                    onChange={(e) => setNotifications({ ...notifications, smsAlerts: e.target.checked })}
                    className="h-4 w-4 rounded text-sky-600"
                  />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">SMS Technician Alerts</span>
                    <span className="text-slate-500 dark:text-slate-400">Dispatch SMS notifications directly to on-duty maintenance engineers.</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.pushNotifications}
                    onChange={(e) => setNotifications({ ...notifications, pushNotifications: e.target.checked })}
                    className="h-4 w-4 rounded text-sky-600"
                  />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">Browser Push Notifications</span>
                    <span className="text-slate-500 dark:text-slate-400">Show desktop alert toasts for real-time sensor anomalies.</span>
                  </div>
                </label>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Webhook Dispatch URL
                </label>
                <input
                  type="text"
                  value={notifications.webhookUrl}
                  onChange={(e) => setNotifications({ ...notifications, webhookUrl: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: APPEARANCE */}
        {activeTab === 'appearance' && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 animate-in fade-in">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sun size={16} className="text-sky-600 dark:text-sky-400" />
                Appearance & Theme Preferences
              </h3>
            </div>

            <div className="space-y-4 text-xs font-sans">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`p-4 rounded-2xl border flex-1 text-center transition-all ${
                    theme === 'light'
                      ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/60 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                  }`}
                >
                  <Sun size={24} className="mx-auto text-amber-500 mb-2" />
                  <span className="font-bold text-slate-900 dark:text-white block">Light Theme (Default)</span>
                  <span className="text-[11px] text-slate-400">Clean white and slate aesthetics</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`p-4 rounded-2xl border flex-1 text-center transition-all ${
                    theme === 'dark'
                      ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/60 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                  }`}
                >
                  <Moon size={24} className="mx-auto text-sky-400 mb-2" />
                  <span className="font-bold text-slate-900 dark:text-white block">Dark Mode</span>
                  <span className="text-[11px] text-slate-400">High-contrast night monitoring</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: API & RASPBERRY PI PICO W IOT */}
        {activeTab === 'iot' && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5 animate-in fade-in">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Cpu size={16} className="text-sky-600 dark:text-sky-400" />
                  Raspberry Pi Pico W Hardware Integration & REST API
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Connect real physical IoT sensor nodes using standard HTTP REST requests.
                </p>
              </div>
            </div>

            {/* IoT Token Bar */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                IoT Ingestion Security Token (Bearer Auth)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={apiToken}
                  className="flex-1 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-800 dark:text-slate-200"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(apiToken, 'token')}
                  className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Copy size={13} />
                  <span>{copiedToken ? 'Copied!' : 'Copy Token'}</span>
                </button>
              </div>
            </div>

            {/* MicroPython Code Viewer */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Code2 size={15} className="text-sky-500" />
                  <span>MicroPython Ingestion Script (`main.py` for Raspberry Pi Pico W)</span>
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(picoScript, 'code')}
                  className="px-3 py-1 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Copy size={12} />
                  <span>{copiedCode ? 'Copied to Clipboard!' : 'Copy MicroPython Script'}</span>
                </button>
              </div>

              <pre className="p-4 rounded-xl bg-slate-950 text-slate-200 font-mono text-[11px] overflow-x-auto max-h-96 border border-slate-800 shadow-inner">
                <code>{picoScript}</code>
              </pre>
            </div>
          </div>
        )}

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
          <div className="text-xs text-slate-400 font-mono">
            {isSaved ? 'All parameters committed to live database' : 'Unsaved changes will apply immediately upon saving'}
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-sky-600/20 transition-all"
          >
            <Save size={15} />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};
