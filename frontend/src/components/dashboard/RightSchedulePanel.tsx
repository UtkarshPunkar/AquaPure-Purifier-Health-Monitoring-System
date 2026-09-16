import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTelemetry } from '../../context/TelemetryContext';
import { useTheme } from '../../context/ThemeContext';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { MaintenanceRecordItem } from '../../types';
import {
  ChevronLeft,
  ChevronRight,
  Bell,
  Sun,
  Moon,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Droplets,
  ScanEye,
  Plus,
  User,
  Sparkles,
  ShieldCheck,
  Search,
  X,
  FileText,
  Compass,
  ArrowUpRight,
  KeyRound,
  LogOut,
  Settings,
} from 'lucide-react';
import { ManageAccountModal } from '../common/ManageAccountModal';

interface FilterCleanLog {
  id: string;
  purifierCode: string;
  purifierName: string;
  action: string;
  date: string;
  healthRestored: number;
}

export const RightSchedulePanel: React.FC = () => {
  const { user, logout } = useAuth();
  const { purifiers, alerts } = useTelemetry();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Profile dropdown & account modal state
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Maintenance Records from Backend
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceRecordItem[]>([]);

  useEffect(() => {
    const fetchMaintenance = async () => {
      try {
        const logs = await api.getMaintenanceLogs();
        setMaintenanceLogs(logs);
      } catch (err) {
        console.error('Failed to load maintenance logs for calendar:', err);
      }
    };
    fetchMaintenance();
  }, [purifiers]);

  // Close profile dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search state in Right Panel
  const [searchQuery, setSearchQuery] = useState('');

  // Real / Local today reference
  const today = useMemo(() => new Date(), []);

  // Selected date state (defaults to today)
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [selectedDay, setSelectedDay] = useState<number>(() => new Date().getDate());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Month navigation
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const shortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const currentMonthName = monthNames[currentMonth];

  // Days in current month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

  // Safe selected day clamped to month bounds
  const safeSelectedDay = Math.min(selectedDay, daysInMonth);
  const selectedDateObj = new Date(currentYear, currentMonth, safeSelectedDay);
  const selectedDayName = dayNames[selectedDateObj.getDay()];

  // Check if viewing current active month and year
  const isCurrentMonthView = currentMonth === today.getMonth() && currentYear === today.getFullYear();
  const todayDayNum = isCurrentMonthView ? today.getDate() : -1;

  // 1. FILTER CHANGED DATES (GREEN - Past maintenance completions)
  const filterChangedDays = useMemo(() => {
    const items: { day: number; purifierCode: string; description: string; restoredHealth: number }[] = [
      {
        day: 4,
        purifierCode: 'WP-2',
        description: 'EMTech Dept 3rd Floor UF Cartridge & Sediment Filter Replaced',
        restoredHealth: 100,
      },
      {
        day: 9,
        purifierCode: 'WP-1',
        description: 'EMTech Dept 2nd Floor Commercial RO Membrane Replacement Executed',
        restoredHealth: 100,
      },
    ];

    purifiers.forEach((p) => {
      if (p.filter?.lastReplacementDate) {
        const d = new Date(p.filter.lastReplacementDate);
        if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
          const dNum = d.getDate();
          if (!items.some((x) => x.day === dNum)) {
            items.push({
              day: dNum,
              purifierCode: p.purifierCode,
              description: `${p.name} - Filter Replacement Completed`,
              restoredHealth: 100,
            });
          }
        }
      }
    });

    return items;
  }, [purifiers, currentMonth, currentYear]);

  // 2. AI PREDICTED FILTER CHANGE DUE DATES (RED - Predictive exhaustion)
  const filterNeedChangeDays = useMemo(() => {
    const items: { day: number; purifierCode: string; currentHealth: number; reason: string }[] = [
      {
        day: 18,
        purifierCode: 'WP-5',
        currentHealth: 34,
        reason: 'AI Neural Degradation Model: Flow Resistance Spike & Membrane Exhaustion Forecast (Replacement Due)',
      },
      {
        day: 26,
        purifierCode: 'WP-3',
        currentHealth: 64,
        reason: 'AI Multivariate Slope: Carbon Sorbent Saturation Predicted (Filter Life < 12 Days)',
      },
    ];

    purifiers.forEach((p) => {
      if (p.filter && p.filter.healthScore <= 40) {
        const remainingDays = Math.max(1, p.filter.estimatedRemainingLifeDays || 3);
        const targetDate = new Date(today.getTime() + remainingDays * 86400000);
        if (targetDate.getMonth() === currentMonth && targetDate.getFullYear() === currentYear) {
          const dNum = targetDate.getDate();
          if (!items.some((x) => x.day === dNum)) {
            items.push({
              day: dNum,
              purifierCode: p.purifierCode,
              currentHealth: p.filter.healthScore,
              reason: `AI Predicts Replacement Required (Health: ${p.filter.healthScore}%)`,
            });
          }
        }
      }
    });

    return items;
  }, [purifiers, currentMonth, currentYear, today]);

  // 3. SCHEDULED MAINTENANCE DATES (AMBER - Active Work Orders / Booked Service)
  const scheduledMaintenanceDays = useMemo(() => {
    return maintenanceLogs
      .filter((r) => r.status === 'SCHEDULED' || r.status === 'PENDING')
      .map((r) => {
        const d = new Date(r.scheduledDate || r.date);
        return {
          day: d.getDate(),
          month: d.getMonth(),
          year: d.getFullYear(),
          purifierCode: r.purifier?.purifierCode || 'WP-1',
          purifierName: r.purifier?.name || 'Purifier Station',
          issue: r.issue || r.notes || 'Scheduled Maintenance Service',
          priority: r.priority || 'HIGH',
          record: r,
        };
      })
      .filter((item) => item.month === currentMonth && item.year === currentYear);
  }, [maintenanceLogs, currentMonth, currentYear]);

  // Selected date contextual indicators
  const selectedChangedRecord = filterChangedDays.find((d) => d.day === safeSelectedDay);
  const selectedNeedChangeRecord = filterNeedChangeDays.find((d) => d.day === safeSelectedDay);
  const selectedScheduledRecord = scheduledMaintenanceDays.find((d) => d.day === safeSelectedDay);
  const isSelectedToday = isCurrentMonthView && safeSelectedDay === todayDayNum;

  // Filter purifiers based on search query in the right panel
  const searchResults = searchQuery.trim()
    ? purifiers.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.purifierCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.building.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.location.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Month navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Filter Clean Logs State (Minimal & simple)
  const [cleanLogs, setCleanLogs] = useState<FilterCleanLog[]>([
    {
      id: 'cl-1',
      purifierCode: 'WP-1',
      purifierName: 'EMTech Dept 2nd Floor',
      action: 'RO Membrane High-Pressure Flush & Sanitization',
      date: 'Today, 10:30 AM',
      healthRestored: 100,
    },
    {
      id: 'cl-2',
      purifierCode: 'WP-2',
      purifierName: 'EMTech Dept 3rd Floor',
      action: 'Pre-Carbon Cartridge Chemical Wash',
      date: 'Yesterday, 03:15 PM',
      healthRestored: 100,
    },
    {
      id: 'cl-3',
      purifierCode: 'WP-4',
      purifierName: 'CSE Dept 1st Floor',
      action: 'UV Chamber Descaling & Quartz Clean',
      date: 'Sep 12, 2026',
      healthRestored: 95,
    },
  ]);

  const [isAddCleanModalOpen, setIsAddCleanModalOpen] = useState(false);
  const [newLogData, setNewLogData] = useState({
    purifierCode: 'WP-1',
    action: 'RO Membrane Flush & Sanitization',
    healthRestored: 100,
  });

  const handleAddCleanLog = (e: React.FormEvent) => {
    e.preventDefault();
    const matchedPurifier = purifiers.find((p) => p.purifierCode === newLogData.purifierCode);
    const newLog: FilterCleanLog = {
      id: `cl-${Date.now()}`,
      purifierCode: newLogData.purifierCode,
      purifierName: matchedPurifier?.building || 'Campus Unit',
      action: newLogData.action.trim() || 'Filter Cleaning & Maintenance',
      date: 'Just now',
      healthRestored: Number(newLogData.healthRestored) || 100,
    };
    setCleanLogs((prev) => [newLog, ...prev]);
    setIsAddCleanModalOpen(false);
    setNewLogData({
      purifierCode: 'WP-1',
      action: 'RO Membrane Flush & Sanitization',
      healthRestored: 100,
    });
  };

  return (
    <aside className="w-full bg-white dark:bg-[#0c1427] rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-xs flex flex-col space-y-5 transition-colors">
      {/* 1. Header Profile & Notifications (Matching Reference Image) */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800/80">
        {/* Dark/Light Mode Toggle & Notification Badges */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 flex items-center justify-center transition-all cursor-pointer shadow-2xs group"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <Moon size={16} className="text-slate-700 dark:text-slate-200 group-hover:scale-110 transition-transform" />
            ) : (
              <Sun size={16} className="text-amber-400 group-hover:scale-110 transition-transform" />
            )}
          </button>
          <div className="relative">
            <button
              onClick={() => navigate('/alerts')}
              className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 hover:text-amber-500 hover:border-amber-300 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
              title="Notifications"
            >
              <Bell size={16} />
            </button>
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-[10px] text-white font-bold flex items-center justify-center">
              {alerts.length || 3}
            </span>
          </div>
        </div>

        {/* User Profile Card with Interactive Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen((prev) => !prev)}
            className="flex items-center gap-2.5 p-1 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all focus:outline-none interactive-btn cursor-pointer"
            aria-label="User profile menu"
          >
            <div className="text-right">
              <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                {user?.name || 'Mithilesh Kose'}
              </div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                {user?.role === 'ADMIN' ? 'Super Admin' : user?.role?.replace('_', ' ') || 'Super Admin'}
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#00C0F0] text-slate-950 ring-4 ring-[#00C0F0]/25 dark:ring-[#00C0F0]/30 flex items-center justify-center shrink-0 shadow-xs hover:scale-105 transition-transform">
              <User size={19} className="stroke-[2.2]" />
            </div>
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-100 dark:border-slate-800 z-50 overflow-hidden animate-scale-up origin-top-right p-4 text-left">
              {/* Top Profile Header Block */}
              <div className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-[#00C0F0] text-slate-950 flex items-center justify-center shrink-0 shadow-xs">
                    <User size={22} className="stroke-[2.2]" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                      {user?.name || 'Utkarsh Punkar'}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5 truncate">
                      {user?.email || 'utkarshpunkar7@gmail.com'}
                    </div>
                  </div>
                </div>

                {/* Role Pill Badge */}
                <div className="mt-2.5">
                  <span className="inline-block text-[11px] font-semibold px-3 py-0.5 rounded-full bg-sky-100/90 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800">
                    Role: {user?.role === 'TECHNICAL_HEAD' ? 'Technical Head' : user?.role?.replace(/_/g, ' ') || 'Technical Head'}
                  </span>
                </div>
              </div>

              {/* Menu List */}
              <div className="pt-2 text-xs space-y-0.5 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    setIsAccountModalOpen(true);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sky-700 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/50 font-bold transition-colors text-left cursor-pointer"
                >
                  <KeyRound size={17} className="stroke-[2.2]" />
                  <span>Manage Account &amp; Credentials</span>
                </button>

                <Link
                  to="/settings"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium transition-colors"
                >
                  <Settings size={17} />
                  <span>Settings &amp; Thresholds</span>
                </Link>

                {(user?.role === 'TECHNICAL_HEAD' || user?.email?.toLowerCase() === 'utkarshpunkar7@gmail.com') && (
                  <Link
                    to="/users"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium transition-colors"
                  >
                    <User size={17} />
                    <span>User &amp; Role Management</span>
                  </Link>
                )}

                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold transition-colors text-left cursor-pointer"
                >
                  <LogOut size={17} className="stroke-[2.2]" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Search Bar */}
      <div className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
        {/* Search Bar Input Pill */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Rooms, Purifiers..."
            className="w-full pl-4 pr-9 py-2 rounded-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 text-slate-900 dark:text-white text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00E5FF]/40 focus:border-[#00E5FF] focus:bg-white dark:focus:bg-slate-900 shadow-2xs transition-all"
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X size={14} />
            </button>
          ) : (
            <Search size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          )}

          {/* Search Dropdown Results */}
          {searchQuery.trim() && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden max-h-56 overflow-y-auto p-1.5 animate-scale-up">
              {searchResults.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-400">
                  No purifiers found
                </div>
              ) : (
                searchResults.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      navigate(`/purifiers/${p.id}`);
                      setSearchQuery('');
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-sky-600 dark:text-[#00E5FF]">
                        {p.purifierCode}
                      </span>
                      <span className="ml-2 font-semibold text-slate-800 dark:text-slate-200">
                        {p.name}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {p.building} • {p.location}
                      </div>
                    </div>
                    <ArrowUpRight size={13} className="text-slate-400" />
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. Interactive Calendar & Date Navigator (With Border) */}
      <div className="p-3.5 sm:p-4 rounded-3xl border border-slate-200/90 dark:border-slate-800/90 bg-slate-50/50 dark:bg-slate-900/50 shadow-2xs space-y-3">
        {/* Month & Day Title with Navigation Arrows */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              {currentMonthName} {safeSelectedDay}, {currentYear}
            </h3>
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
              {selectedDayName}
            </span>
          </div>
          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => {
                setCurrentDate(new Date());
                setSelectedDay(new Date().getDate());
              }}
              className="px-2 py-1 text-[10px] font-bold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              title="Jump to Today"
            >
              Today
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Next Month"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Days of the Week Headers */}
        <div className="grid grid-cols-7 text-center text-[11px] font-bold text-slate-400 dark:text-slate-500">
          {shortDays.map((d) => (
            <span key={d} className="py-1">
              {d}
            </span>
          ))}
        </div>

        {/* Calendar Day Grid */}
        <div className="grid grid-cols-7 text-center gap-y-1.5 text-xs">
          {/* Empty spacer days for month start */}
          {Array.from({ length: firstDayIndex }).map((_, idx) => (
            <span key={`empty-${idx}`} className="text-slate-300 dark:text-slate-700 py-1.5 text-[11px]">
              {new Date(currentYear, currentMonth, 0).getDate() - firstDayIndex + idx + 1}
            </span>
          ))}

          {/* Actual days in month */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNum = idx + 1;
            const isToday = isCurrentMonthView && dayNum === todayDayNum;
            const changedRecord = filterChangedDays.find((d) => d.day === dayNum);
            const isFilterChanged = Boolean(changedRecord);
            const needChangeRecord = filterNeedChangeDays.find((d) => d.day === dayNum);
            const isFilterNeedChange = Boolean(needChangeRecord);
            const scheduledRecord = scheduledMaintenanceDays.find((d) => d.day === dayNum);
            const isScheduled = Boolean(scheduledRecord);
            const isSelected = dayNum === safeSelectedDay;

            // Color Rules (All Outline Circle Styles, not filled):
            // 1. Blue Outline Circle for Current Date (Today)
            // 2. Amber/Orange Outline Circle for Scheduled Maintenance
            // 3. Green/Emerald Outline Circle for Filter Changed (Past Replacement)
            // 4. Red Outline Circle for Filter Need Change (AI Predicted)
            // 5. Sky Outline Circle for Selected Date
            // 6. Clean neutral for standard days
            let colorClasses = '';

            if (isToday) {
              colorClasses = 'border-2 border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 bg-blue-50/60 dark:bg-blue-950/40 hover:bg-blue-100/80 dark:hover:bg-blue-900/50 font-black shadow-xs shadow-blue-500/15';
            } else if (isScheduled) {
              colorClasses = 'border-2 border-amber-500 dark:border-amber-400 text-amber-600 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-950/40 hover:bg-amber-100/80 dark:hover:bg-amber-900/50 font-bold shadow-xs shadow-amber-500/15';
            } else if (isFilterChanged) {
              colorClasses = 'border-2 border-emerald-500 dark:border-emerald-400 text-emerald-600 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/40 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/50 font-bold shadow-xs shadow-emerald-500/15';
            } else if (isFilterNeedChange) {
              colorClasses = 'border-2 border-rose-500 dark:border-rose-400 text-rose-600 dark:text-rose-400 bg-rose-50/60 dark:bg-rose-950/40 hover:bg-rose-100/80 dark:hover:bg-rose-900/50 font-extrabold shadow-xs shadow-rose-500/15';
            } else if (isSelected) {
              colorClasses = 'border-2 border-sky-500 dark:border-sky-400 text-sky-700 dark:text-sky-300 bg-sky-50/60 dark:bg-sky-950/40 font-bold ring-1 ring-sky-400/40';
            } else {
              colorClasses = 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border-2 border-transparent font-medium';
            }

            // Selection focus ring for buttons
            const activeRing = isSelected
              ? 'ring-2 ring-offset-1 ring-sky-400 dark:ring-sky-400 ring-offset-white dark:ring-offset-slate-900 scale-105'
              : '';

            return (
              <button
                key={dayNum}
                onClick={() => setSelectedDay(dayNum)}
                className="flex flex-col items-center justify-center p-0.5 cursor-pointer group relative"
                title={
                  isToday
                    ? `Today (${currentMonthName} ${dayNum})`
                    : isScheduled
                    ? `Scheduled Maintenance: ${scheduledRecord?.purifierCode} (${scheduledRecord?.issue})`
                    : isFilterChanged
                    ? `Filter Changed: ${changedRecord?.purifierCode} (${changedRecord?.description})`
                    : isFilterNeedChange
                    ? `AI Prediction: ${needChangeRecord?.purifierCode} Filter Replacement Due`
                    : `${currentMonthName} ${dayNum}, ${currentYear}`
                }
              >
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs transition-all ${colorClasses} ${activeRing}`}
                >
                  {dayNum}
                </div>
              </button>
            );
          })}
        </div>

        {/* 4-Color Legend Bar (All Outline Circle Badges) */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 pt-2.5 px-1 text-[10px] font-medium border-t border-slate-100 dark:border-slate-800/80 select-none">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border-2 border-blue-600 bg-blue-50 dark:bg-blue-950/60 shrink-0" />
            <span className="text-slate-600 dark:text-slate-400 font-semibold">Today</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border-2 border-amber-500 bg-amber-50 dark:bg-amber-950/60 shrink-0" />
            <span className="text-slate-600 dark:text-slate-400 font-semibold">Scheduled Maintenance</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 shrink-0" />
            <span className="text-slate-600 dark:text-slate-400 font-semibold">Filter Changed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border-2 border-rose-500 bg-rose-50 dark:bg-rose-950/60 shrink-0" />
            <span className="text-slate-600 dark:text-slate-400 font-semibold">AI Predicts Change</span>
          </div>
        </div>

        {/* Dynamic Context Card & Notifications for Selected Date */}
        <div className="text-xs transition-all animate-fade-in space-y-2">
          {selectedScheduledRecord && (
            <div className="flex items-start gap-2.5 text-amber-800 dark:text-amber-300 bg-amber-50/90 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 p-3 rounded-2xl shadow-xs animate-in fade-in">
              <div className="p-1.5 rounded-xl bg-amber-500 text-white shrink-0 mt-0.5 shadow-2xs">
                <Wrench size={14} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-black text-[11px] uppercase tracking-wider text-amber-900 dark:text-amber-200">
                    Maintenance Notification &bull; {selectedScheduledRecord.purifierCode}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200">
                    {selectedScheduledRecord.priority}
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                  {selectedScheduledRecord.issue}
                </div>
                <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-tight mt-0.5">
                  Scheduled for {currentMonthName} {selectedScheduledRecord.day}, {currentYear} &bull; {selectedScheduledRecord.purifierName}
                </p>
              </div>
            </div>
          )}

          {isSelectedToday ? (
            <div className="flex items-start gap-2 text-blue-700 dark:text-blue-300 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 p-2.5 rounded-2xl">
              <Clock size={15} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="font-bold block text-[11px] uppercase tracking-wider text-blue-800 dark:text-blue-300">
                  Current Date &bull; Live Fleet Active
                </span>
                <p className="text-[11px] text-blue-600 dark:text-blue-400 leading-tight mt-0.5">
                  {purifiers.filter((p) => p.status !== 'OFFLINE' && p.status !== 'INACTIVE').length}/{purifiers.length || 5} IoT telemetry nodes connected. Real-time water purity monitoring active.
                </p>
              </div>
            </div>
          ) : selectedChangedRecord ? (
            <div className="flex items-start gap-2 text-emerald-800 dark:text-emerald-300 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 p-2.5 rounded-2xl">
              <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="font-bold block text-[11px] uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  Filter Changed &bull; {selectedChangedRecord.purifierCode}
                </span>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 leading-tight mt-0.5">
                  {selectedChangedRecord.description}. Health restored to {selectedChangedRecord.restoredHealth}%.
                </p>
              </div>
            </div>
          ) : selectedNeedChangeRecord ? (
            <div className="flex items-start gap-2 text-rose-800 dark:text-rose-300 bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 p-2.5 rounded-2xl">
              <AlertTriangle size={15} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="font-bold block text-[11px] uppercase tracking-wider text-rose-800 dark:text-rose-300">
                  AI Replacement Due &bull; {selectedNeedChangeRecord.purifierCode}
                </span>
                <p className="text-[11px] text-rose-700 dark:text-rose-400 leading-tight mt-0.5">
                  {selectedNeedChangeRecord.reason}
                </p>
              </div>
            </div>
          ) : !selectedScheduledRecord ? (
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 p-2.5 rounded-2xl">
              <CalendarIcon size={14} className="text-slate-400 shrink-0" />
              <span className="text-[11px]">
                Selected: <strong className="font-bold text-slate-800 dark:text-slate-200">{currentMonthName} {safeSelectedDay}, {currentYear}</strong> &bull; Routine campus schedule
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {/* 3. Filter Clean Logs Dedicated Block (Separate Card) */}
      <div className="p-3.5 sm:p-4 rounded-3xl border border-slate-200/90 dark:border-slate-800/90 bg-slate-50/50 dark:bg-slate-900/50 shadow-2xs space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-500 shrink-0">
              <Sparkles size={14} />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 leading-tight">
                Filter Clean Logs
              </h4>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                Maintenance & Flush Records
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 border border-sky-200/80 dark:border-sky-800/80">
              {cleanLogs.length}
            </span>
            <button
              onClick={() => setIsAddCleanModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-sky-600 text-white hover:bg-sky-700 text-[11px] font-bold transition-all cursor-pointer group shadow-xs hover:shadow-sky-500/25"
              title="Add Filter Clean Log"
            >
              <Plus size={13} className="group-hover:rotate-90 transition-transform duration-200" />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* Minimal Clean Log List */}
        <div className="space-y-2 max-h-[280px] overflow-y-auto pr-0.5 custom-scrollbar">
          {cleanLogs.length === 0 ? (
            <div className="p-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
              No clean logs recorded yet.
            </div>
          ) : (
            cleanLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs transition-all text-xs group space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-sky-600 dark:text-sky-400 border border-slate-200 dark:border-slate-700 shadow-2xs shrink-0">
                      {log.purifierCode}
                    </span>
                    <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium truncate">
                      {log.purifierName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/80 dark:border-emerald-800/60 shrink-0">
                    <CheckCircle2 size={11} />
                    <span>{log.healthRestored}%</span>
                  </div>
                </div>

                <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  {log.action}
                </div>

                <div className="flex items-center justify-end text-[10px] text-slate-400 dark:text-slate-500 pt-0.5 font-mono">
                  <span>{log.date}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 4. Quick S.B. Jain Fleet Status Footer */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-900 text-sky-700 dark:text-sky-300 text-[10px] font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>
            S.B. Jain Fleet: {purifiers.filter((p) => p.status !== 'OFFLINE' && p.status !== 'INACTIVE').length}/{purifiers.length || 5} Purifiers Active
          </span>
        </div>
      </div>

      {/* Minimal Add Filter Clean Log Modal */}
      {isAddCleanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-scale-up p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-sky-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Add Filter Clean Log
                </h3>
              </div>
              <button
                onClick={() => setIsAddCleanModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 interactive-btn"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddCleanLog} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Purifier Unit
                </label>
                <select
                  value={newLogData.purifierCode}
                  onChange={(e) => setNewLogData({ ...newLogData, purifierCode: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs"
                >
                  {purifiers.map((p) => (
                    <option key={p.id} value={p.purifierCode}>
                      {p.purifierCode} - {p.name} ({p.building})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Cleaning / Maintenance Action
                </label>
                <input
                  type="text"
                  value={newLogData.action}
                  onChange={(e) => setNewLogData({ ...newLogData, action: e.target.value })}
                  placeholder="e.g. RO Membrane Flush & UV Chamber Clean"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs"
                />
                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[
                    'RO Membrane Flush',
                    'Carbon Filter Clean',
                    'UV Chamber Sterilization',
                    'Sediment Cartridge Clean',
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setNewLogData({ ...newLogData, action: preset })}
                      className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950 text-[10px] text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Health Restored (%)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={newLogData.healthRestored}
                  onChange={(e) => setNewLogData({ ...newLogData, healthRestored: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddCleanModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
                >
                  Save Clean Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Account & Password Modal */}
      <ManageAccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
      />
    </aside>
  );
};
