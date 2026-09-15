import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../api/client';
import {
  Bell,
  Save,
  CheckCircle2,
  Sun,
  Moon,
  Users,
  SlidersHorizontal,
  Lock,
  Crown,
  ShieldCheck,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { theme, setTheme } = useTheme();

  const isTechHead = user?.role === 'TECHNICAL_HEAD' || user?.email === 'utkarshpunkar7@gmail.com';

  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'thresholds' | 'appearance'>('thresholds');
  const [isSaved, setIsSaved] = useState(false);

  // Form State
  const [profile, setProfile] = useState({
    name: user?.name || 'Utkarsh Punkar',
    email: user?.email || 'utkarshpunkar7@gmail.com',
    role: user?.role || 'TECHNICAL_HEAD',
    department: 'Department of Artificial Intelligence & Systems',
    phone: '+91 8010379670',
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

  useEffect(() => {
    if (user) {
      setProfile((prev) => ({
        ...prev,
        name: user.name,
        email: user.email,
        role: user.role,
      }));
    }
  }, [user]);

  useEffect(() => {
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
    if (activeTab === 'thresholds' && !isTechHead) {
      alert('Only Technical Head (Utkarsh Punkar) has authorization to modify safety thresholds.');
      return;
    }

    try {
      if (activeTab === 'profile') {
        if (profile.name.trim()) {
          await updateProfile(profile.name.trim());
        }
      } else {
        await api.updateSettings({
          ...thresholds,
          emailAlerts: notifications.emailAlerts,
          smsAlerts: notifications.smsAlerts,
          pushAlerts: notifications.pushNotifications,
        });
      }
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err: any) {
      console.error('Failed to save settings:', err);
      alert(err.response?.data?.error || 'Failed to save settings');
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
          { id: 'notifications', label: 'Notifications & Alerts', icon: Bell },
          { id: 'appearance', label: 'Appearance & Theme', icon: Sun },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
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
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <SlidersHorizontal size={16} className="text-sky-600 dark:text-sky-400" />
                    Water Safety & Sensor Alarm Thresholds
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Set baseline parameter boundaries derived from WHO and IS 10500 standards.
                  </p>
                </div>
                {!isTechHead && (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-semibold">
                    <Lock size={13} />
                    <span>View-only (Controlled by Technical Head)</span>
                  </div>
                )}
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
                    disabled={!isTechHead}
                    value={thresholds.phMin}
                    onChange={(e) => setThresholds({ ...thresholds, phMin: parseFloat(e.target.value) || 6.5 })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold disabled:opacity-75"
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
                    disabled={!isTechHead}
                    value={thresholds.phMax}
                    onChange={(e) => setThresholds({ ...thresholds, phMax: parseFloat(e.target.value) || 8.5 })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold disabled:opacity-75"
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
                    disabled={!isTechHead}
                    value={thresholds.tdsMax}
                    onChange={(e) => setThresholds({ ...thresholds, tdsMax: parseInt(e.target.value) || 300 })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold disabled:opacity-75"
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
                    disabled={!isTechHead}
                    value={thresholds.turbidityMax}
                    onChange={(e) => setThresholds({ ...thresholds, turbidityMax: parseFloat(e.target.value) || 5.0 })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold disabled:opacity-75"
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
                    disabled={!isTechHead}
                    value={thresholds.tempMin}
                    onChange={(e) => setThresholds({ ...thresholds, tempMin: parseFloat(e.target.value) || 10.0 })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold disabled:opacity-75"
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
                    disabled={!isTechHead}
                    value={thresholds.tempMax}
                    onChange={(e) => setThresholds({ ...thresholds, tempMax: parseFloat(e.target.value) || 35.0 })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold disabled:opacity-75"
                  />
                </div>

                {/* Filter Warning Health % */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <label className="font-sans font-bold text-slate-700 dark:text-slate-300 block">
                    Filter Warning Level (%)
                  </label>
                  <input
                    type="number"
                    disabled={!isTechHead}
                    value={thresholds.filterWarning}
                    onChange={(e) => setThresholds({ ...thresholds, filterWarning: parseInt(e.target.value) || 40 })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold disabled:opacity-75"
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
                    disabled={!isTechHead}
                    value={thresholds.filterCritical}
                    onChange={(e) => setThresholds({ ...thresholds, filterCritical: parseInt(e.target.value) || 20 })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold disabled:opacity-75"
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
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users size={16} className="text-sky-600 dark:text-sky-400" />
                User Profile & Credentials
              </h3>
              {isTechHead && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-gradient-to-r from-sky-500/20 to-blue-500/20 text-sky-600 dark:text-[#00E5FF] border border-sky-400/40 flex items-center gap-1">
                  <Crown size={12} className="text-amber-400" /> Technical Head
                </span>
              )}
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
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address (Registered)</label>
                <input
                  type="email"
                  readOnly
                  value={profile.email}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-mono"
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

        {/* TAB 3: NOTIFICATIONS */}
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

        {/* TAB 4: APPEARANCE */}
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
                  className={`p-4 rounded-2xl border flex-1 text-center transition-all cursor-pointer ${
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
                  className={`p-4 rounded-2xl border flex-1 text-center transition-all cursor-pointer ${
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

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
          <div className="text-xs text-slate-400 font-mono">
            {isSaved ? 'All parameters committed to live database' : 'Unsaved changes will apply immediately upon saving'}
          </div>

          <button
            type="submit"
            disabled={activeTab === 'thresholds' && !isTechHead}
            className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-sky-600/20 transition-all cursor-pointer"
          >
            <Save size={15} />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;
