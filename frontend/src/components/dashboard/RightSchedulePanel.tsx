import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTelemetry } from '../../context/TelemetryContext';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Bell,
  Mail,
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
} from 'lucide-react';

interface ScheduleEvent {
  id: string;
  timeSlot: string;
  startTime: string;
  endTime: string;
  title: string;
  location: string;
  purifierCode: string;
  category: 'inspection' | 'maintenance' | 'audit' | 'ai_scan';
  color: 'teal' | 'amber' | 'rose' | 'indigo' | 'sky';
  icon: 'wrench' | 'droplets' | 'scan' | 'shield';
  technician: {
    name: string;
    avatar: string;
    role: string;
  };
}

export const RightSchedulePanel: React.FC = () => {
  const { user } = useAuth();
  const { purifiers, alerts } = useTelemetry();
  const navigate = useNavigate();

  // Search state in Right Panel
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'reports'>('overview');

  // Selected date state (defaults to current date)
  const [currentDate, setCurrentDate] = useState(new Date(2026, 8, 14)); // Sep 14, 2026
  const [selectedDay, setSelectedDay] = useState(14);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Month navigation
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const shortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const currentMonthName = monthNames[currentDate.getMonth()];
  const currentDayName = dayNames[currentDate.getDay()];
  const currentYear = currentDate.getFullYear();

  // Days in current month
  const daysInMonth = new Date(currentYear, currentDate.getMonth() + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentDate.getMonth(), 1).getDay();

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

  // Change date
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentDate.getMonth() + 1, 1));
  };

  // Schedule timeline events (Department & Role based, no individual names)
  const [events, setEvents] = useState<ScheduleEvent[]>([
    {
      id: 'sch-1',
      timeSlot: '09:00',
      startTime: '09:00 AM',
      endTime: '10:00 AM',
      title: 'RO Membrane Flush & Inspection',
      location: 'Admin Complex, S.B. Jain Campus',
      purifierCode: 'WP-001',
      category: 'inspection',
      color: 'teal',
      icon: 'droplets',
      technician: {
        name: 'Field Support Team',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        role: 'IoT Field Tech',
      },
    },
    {
      id: 'sch-2',
      timeSlot: '11:00',
      startTime: '11:00 AM',
      endTime: '12:30 PM',
      title: 'S.B. Jain Campus Water Purity Audit',
      location: 'Academic Block A, Floor 2',
      purifierCode: 'WP-002',
      category: 'audit',
      color: 'amber',
      icon: 'shield',
      technician: {
        name: 'Purity Audit Lab',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
        role: 'Quality Auditor',
      },
    },
    {
      id: 'sch-3',
      timeSlot: '12:30',
      startTime: '12:00 PM',
      endTime: '03:30 PM',
      title: 'UV Lamp & Sensor Recalibration',
      location: 'Central Library Main Hall',
      purifierCode: 'WP-003',
      category: 'maintenance',
      color: 'rose',
      icon: 'wrench',
      technician: {
        name: 'Maintenance Unit',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
        role: 'Senior Tech Unit',
      },
    },
    {
      id: 'sch-4',
      timeSlot: '16:00',
      startTime: '04:00 PM',
      endTime: '05:00 PM',
      title: 'AI Vision Contaminant Scan Review',
      location: 'Science Complex Lab 4',
      purifierCode: 'WP-004',
      category: 'ai_scan',
      color: 'indigo',
      icon: 'scan',
      technician: {
        name: 'AI Diagnostics Unit',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
        role: 'Vision & Telemetry',
      },
    },
  ]);

  // Hourly time slots for timeline
  const timeSlots = [
    '08:00',
    '08:30',
    '09:00',
    '09:30',
    '10:00',
    '10:30',
    '11:00',
    '11:30',
    '12:00',
    '12:30',
    '13:00',
    '13:30',
    '14:00',
    '14:30',
    '15:00',
    '15:30',
    '16:00',
    '16:30',
  ];

  // Calendar dates with active event markers
  const activeEventDays = [10, 12, 14, 20, 21];

  return (
    <aside className="w-full bg-white dark:bg-[#0c1427] rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-xs flex flex-col space-y-5 transition-colors">
      {/* 1. Header Profile & Notifications (Matching Reference Image) */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800/80">
        {/* Quick Message & Notification Badges */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/alerts')}
            className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 hover:border-sky-300 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
            title="Messages"
          >
            <Mail size={16} />
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

        {/* User Profile Card */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
              {user?.name || 'Campus Administrator'}
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
              {user?.role === 'ADMIN' ? 'Super Admin' : user?.role?.replace('_', ' ') || 'Super Admin'}
            </div>
          </div>
          <div className="w-10 h-10 rounded-full ring-2 ring-[#00E5FF]/40 overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0 shadow-2xs">
            <img
              src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80"
              alt="User Profile"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* 2. Overview, Reports & Search Bar (Matching Circled Reference Header) */}
      <div className="space-y-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
        {/* Navigation Tabs (Overview & Reports) */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs font-bold">
            <button
              onClick={() => setActiveTab('overview')}
              className={`relative pb-1 cursor-pointer transition-colors ${
                activeTab === 'overview'
                  ? 'text-slate-900 dark:text-white font-extrabold'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Overview
              {activeTab === 'overview' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 dark:bg-[#00E5FF] rounded-full" />
              )}
            </button>
            <Link
              to="/reports"
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              Reports
            </Link>
            <Link
              to="/analytics"
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              Analytics
            </Link>
          </div>

          <div className="text-[10px] font-bold text-[#00E5FF] bg-[#00E5FF]/10 px-2 py-0.5 rounded-full border border-[#00E5FF]/30">
            S.B. Jain
          </div>
        </div>

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

      {/* 2. Interactive Calendar & Date Navigator */}
      <div className="space-y-3">
        {/* Month & Day Title with Navigation Arrows */}
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
            {currentMonthName}, {selectedDay} {currentDayName}
          </h3>
          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Days of the Week Headers */}
        <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-slate-400 dark:text-slate-500">
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
              {new Date(currentYear, currentDate.getMonth(), 0).getDate() - firstDayIndex + idx + 1}
            </span>
          ))}

          {/* Actual days in month */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNum = idx + 1;
            const isSelected = dayNum === selectedDay;
            const isToday = dayNum === 14;
            const hasEvent = activeEventDays.includes(dayNum);

            // Special highlighted styled dates matching reference picture:
            // 10: Teal circle, 12: Dark Teal, 20: Orange, 21: Yellow
            let specialStyle = '';
            if (dayNum === 10) {
              specialStyle = 'bg-teal-700 text-white font-bold shadow-xs';
            } else if (dayNum === 12) {
              specialStyle = 'bg-teal-900 text-white font-bold';
            } else if (dayNum === 20) {
              specialStyle = 'bg-[#F27059] text-white font-bold';
            } else if (dayNum === 21) {
              specialStyle = 'bg-[#F9C74F] text-slate-900 font-bold';
            } else if (isSelected) {
              specialStyle = 'bg-sky-600 text-white font-bold shadow-md shadow-sky-600/30';
            } else {
              specialStyle = 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800';
            }

            return (
              <button
                key={dayNum}
                onClick={() => setSelectedDay(dayNum)}
                className="flex flex-col items-center justify-center p-0.5 cursor-pointer"
              >
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs transition-all ${specialStyle}`}
                >
                  {dayNum}
                </div>
                {hasEvent && !specialStyle.includes('bg-') && (
                  <span className="w-1 h-1 rounded-full bg-[#00E5FF] mt-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Schedule & Timeline Header */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock size={15} className="text-[#00E5FF]" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Campus Purity Timeline
          </h4>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
        >
          <Plus size={13} />
          <span>Add Task</span>
        </button>
      </div>

      {/* 4. Hourly Timeline Grid with Scheduled Event Cards */}
      <div className="relative space-y-3 max-h-[500px] overflow-y-auto pr-1">
        {timeSlots.map((time) => {
          // Check if any event starts at this timeSlot
          const matchingEvent = events.find((e) => e.timeSlot === time);

          return (
            <div key={time} className="relative flex items-start gap-4 text-xs group">
              {/* Left Time Label */}
              <div className="w-12 shrink-0 text-[11px] font-mono text-slate-400 dark:text-slate-500 pt-1 text-right">
                {time}
              </div>

              {/* Timeline Connector Line */}
              <div className="flex-1 border-t border-slate-100 dark:border-slate-800/60 pt-1 relative">
                {matchingEvent ? (
                  <div
                    className={`p-3 rounded-2xl border transition-all animate-scale-up ${
                      matchingEvent.color === 'teal'
                        ? 'bg-teal-50/90 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800/80 shadow-xs'
                        : matchingEvent.color === 'amber'
                        ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-300/80 dark:border-amber-700/80 shadow-xs'
                        : matchingEvent.color === 'rose'
                        ? 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/80 shadow-xs'
                        : 'bg-indigo-50/90 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/80 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {/* Icon Badge */}
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                            matchingEvent.color === 'teal'
                              ? 'bg-teal-600 text-white'
                              : matchingEvent.color === 'amber'
                              ? 'bg-amber-500 text-white'
                              : matchingEvent.color === 'rose'
                              ? 'bg-rose-500 text-white'
                              : 'bg-indigo-600 text-white'
                          }`}
                        >
                          {matchingEvent.icon === 'droplets' && <Droplets size={14} />}
                          {matchingEvent.icon === 'shield' && <ShieldCheck size={14} />}
                          {matchingEvent.icon === 'wrench' && <Wrench size={14} />}
                          {matchingEvent.icon === 'scan' && <ScanEye size={14} />}
                        </div>

                        <div>
                          <h5 className="font-bold text-slate-900 dark:text-white text-xs leading-snug">
                            {matchingEvent.title}
                          </h5>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-mono">
                            {matchingEvent.startTime} &ndash; {matchingEvent.endTime}
                          </span>
                        </div>
                      </div>

                      {/* Purifier Badge */}
                      <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-200 shrink-0">
                        {matchingEvent.purifierCode}
                      </span>
                    </div>

                    {/* Technician details */}
                    <div className="mt-2 pt-2 border-t border-slate-200/40 dark:border-slate-800/40 flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                        <img
                          src={matchingEvent.technician.avatar}
                          alt={matchingEvent.technician.name}
                          className="w-4 h-4 rounded-full object-cover"
                        />
                        <span>{matchingEvent.technician.name}</span>
                      </div>
                      <span className="text-slate-400 dark:text-slate-500">
                        {matchingEvent.location}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="h-4" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. Quick S.B. Jain Fleet Status Footer */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-900 text-sky-700 dark:text-sky-300 text-[10px] font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>S.B. Jain Fleet: 5/5 Purifiers Synchronized</span>
        </div>
      </div>
    </aside>
  );
};
