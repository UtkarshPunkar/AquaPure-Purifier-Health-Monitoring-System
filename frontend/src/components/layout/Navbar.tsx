import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTelemetry } from '../../context/TelemetryContext';
import { useTheme } from '../../context/ThemeContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Bell,
  Menu,
  LogOut,
  Sun,
  Moon,
  Search,
  CheckCircle2,
  AlertTriangle,
  Radio,
  User,
  Settings,
  X,
  ExternalLink,
} from 'lucide-react';

interface NavbarProps {
  onMenuToggle: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuToggle }) => {
  const { user, logout } = useAuth();
  const { isConnected, isLiveMode, toggleLiveMode, alerts, purifiers } = useTelemetry();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  const alertsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const unreadAlerts = alerts.filter((a) => !a.isAcknowledged);
  const unreadCount = unreadAlerts.length;

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (alertsRef.current && !alertsRef.current.contains(event.target as Node)) {
        setIsAlertsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter search results
  const searchResults = searchQuery.trim()
    ? purifiers.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.purifierCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.building.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.location.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleSelectPurifier = (id: string) => {
    navigate(`/purifiers/${id}`);
    setIsSearchModalOpen(false);
    setSearchQuery('');
  };

  // Get Page Title from Route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return 'Dashboard Overview';
    if (path.startsWith('/purifiers/')) return 'Purifier Telemetry & Health Details';
    if (path === '/purifiers') return 'Purifier Fleet Management';
    if (path === '/water-quality') return 'Water Quality Monitoring';
    if (path === '/ai-detection') return 'AI Contaminant Detection';
    if (path === '/filter-health') return 'Filter Health & Prediction';
    if (path === '/maintenance') return 'Maintenance Management';
    if (path === '/alerts') return 'System Alerts & Safety Logs';
    if (path === '/analytics') return 'Fleet Analytics & Historical Trends';
    if (path === '/reports') return 'System Reports & Compliance Exports';
    if (path === '/users') return 'Admin User Management';
    if (path === '/settings') return 'System Configuration & IoT Settings';
    return 'AquaPure Platform';
  };

  return (
    <header className="app-header sticky top-0 z-30 px-3 sm:px-5 py-2.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="flex items-center justify-between gap-3">
        {/* Left: Hamburger + Page Title / Brand */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden focus:outline-none transition-colors"
            aria-label="Toggle navigation menu"
          >
            <Menu size={20} />
          </button>

          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
              {getPageTitle()}
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate hidden md:block">
              Centralized Water Quality & IoT Purifier Monitoring System
            </p>
          </div>
        </div>

        {/* Center/Right: Search, Live toggle, Theme toggle, Notification bell, User dropdown */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Search trigger button */}
          <button
            onClick={() => setIsSearchModalOpen(true)}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-xs text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60 transition-all interactive-btn"
          >
            <Search size={14} className="text-slate-400" />
            <span>Search purifiers...</span>
            <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-slate-400">
              Ctrl+K
            </kbd>
          </button>

          {/* Mobile search icon */}
          <button
            onClick={() => setIsSearchModalOpen(true)}
            className="sm:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors interactive-btn"
            title="Search"
          >
            <Search size={18} />
          </button>

          {/* Live Simulation Indicator & Toggle */}
          <button
            onClick={toggleLiveMode}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all interactive-btn ${
              isLiveMode
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
            }`}
            title={isLiveMode ? 'Live simulation active (click to pause)' : 'Simulation paused (click to start)'}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isLiveMode ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            />
            <span className="text-[11px] uppercase tracking-wider">{isLiveMode ? 'Live' : 'Paused'}</span>
          </button>

          {/* Light / Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 transition-all interactive-btn"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <Moon size={17} className="text-slate-700" />
            ) : (
              <Sun size={17} className="text-amber-400" />
            )}
          </button>

          {/* Notifications Bell Dropdown */}
          <div className="relative" ref={alertsRef}>
            <button
              onClick={() => setIsAlertsOpen((prev) => !prev)}
              className="relative p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 transition-all interactive-btn"
              title="System Alerts & Notifications"
              aria-label="Notifications"
            >
              <Bell size={17} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-rose-600 rounded-full border-2 border-white dark:border-slate-900 shadow-xs animate-badge-ping">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {isAlertsOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-scale-up origin-top-right">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-2">
                    <Bell size={15} className="text-sky-600 dark:text-sky-400" />
                    <span className="font-semibold text-xs text-slate-900 dark:text-white">
                      Notifications & Alerts
                    </span>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 font-medium">
                    {unreadCount} Unresolved
                  </span>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {alerts.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No active alerts. All water purifiers nominal.
                    </div>
                  ) : (
                    alerts.slice(0, 5).map((alert) => (
                      <div
                        key={alert.id}
                        className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                        onClick={() => {
                          setIsAlertsOpen(false);
                          navigate('/alerts');
                        }}
                      >
                        <div className="flex items-start gap-2.5">
                          {alert.severity === 'CRITICAL' ? (
                            <div className="p-1 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-600 shrink-0">
                              <AlertTriangle size={14} />
                            </div>
                          ) : (
                            <div className="p-1 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-600 shrink-0">
                              <AlertTriangle size={14} />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                              {alert.title}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                              {alert.message}
                            </p>
                            <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                              {new Date(alert.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-center">
                  <Link
                    to="/alerts"
                    onClick={() => setIsAlertsOpen(false)}
                    className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center justify-center gap-1"
                  >
                    <span>View all system alerts</span>
                    <ExternalLink size={12} />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Pill & Dropdown */}
          <div className="relative pl-1 border-l border-slate-200 dark:border-slate-800" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen((prev) => !prev)}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all focus:outline-none interactive-btn"
              aria-label="User profile menu"
            >
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-sky-600 to-cyan-500 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                  {user?.name || 'Administrator'}
                </div>
                <div className="text-[10px] text-sky-600 dark:text-sky-400 font-medium uppercase tracking-wider leading-tight">
                  {user?.role?.replace('_', ' ') || 'ADMIN'}
                </div>
              </div>
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-scale-up origin-top-right">
                <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {user?.name || 'Administrator'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {user?.email || 'admin@aquapure.edu'}
                  </p>
                  <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                    Role: {user?.role?.replace('_', ' ') || 'Administrator'}
                  </span>
                </div>

                <div className="p-1 text-xs">
                  <Link
                    to="/settings"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Settings size={15} />
                    <span>Settings & Thresholds</span>
                  </Link>
                  <Link
                    to="/users"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <User size={15} />
                    <span>User Management</span>
                  </Link>
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left"
                  >
                    <LogOut size={15} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Global Search Modal */}
      {isSearchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in duration-150">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-scale-up">
            <div className="flex items-center gap-3 p-3.5 border-b border-slate-200 dark:border-slate-800">
              <Search size={18} className="text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by purifier name, code (WP-001), building or location..."
                className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                autoFocus
              />
              <button
                onClick={() => {
                  setIsSearchModalOpen(false);
                  setSearchQuery('');
                }}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 interactive-btn"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto p-2">
              {searchQuery.trim() === '' ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  Type to instantly search all 12 water purifiers across campus buildings.
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  No purifiers found matching "{searchQuery}".
                </div>
              ) : (
                searchResults.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPurifier(p.id)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-left interactive-btn"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-sky-600 dark:text-sky-400">
                          {p.purifierCode}
                        </span>
                        <span className="text-xs font-semibold text-slate-900 dark:text-white">
                          {p.name}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {p.building} • {p.floor} • {p.location}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        p.status === 'HEALTHY'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                          : p.status === 'WARNING'
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                          : p.status === 'CRITICAL'
                          ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {p.status}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
