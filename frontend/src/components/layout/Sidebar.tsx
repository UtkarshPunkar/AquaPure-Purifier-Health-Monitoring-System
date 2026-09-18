import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Droplets,
  ScanEye,
  Filter,
  Wrench,
  BellRing,
  BarChart3,
  Users,
  Settings,
  X,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import { useTelemetry } from '../../context/TelemetryContext';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItemConfig {
  to: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
  count?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const { alerts } = useTelemetry();
  const unreadAlerts = alerts.filter((a) => !a.isAcknowledged).length;

  const isTechHead = user?.role === 'TECHNICAL_HEAD' || user?.email?.toLowerCase() === 'utkarshpunkar7@gmail.com';

  const baseNavItems: NavItemConfig[] = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { to: '/purifiers', label: 'Purifiers', icon: Droplets },
    { to: '/ai-detection', label: 'AI Detection', icon: ScanEye },
    { to: '/filter-health', label: 'Filter Health', icon: Filter },
    { to: '/maintenance', label: 'Maintenance', icon: Wrench },
    { to: '/alerts', label: 'Alerts', icon: BellRing, count: unreadAlerts },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    ...(isTechHead ? [{ to: '/users', label: 'Users & Access', icon: Users }] : []),
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  const navItems = baseNavItems;

  const sidebarContent = (
    <div className="flex flex-col h-full w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 select-none transition-colors">
      {/* Brand Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
        <NavLink to="/" onClick={onClose} className="flex items-center gap-3 min-w-0 group interactive-btn">
          <img
            src="/aquapure-logo.png"
            alt="AquaPure Logo"
            className="h-9 w-9 rounded-xl object-contain bg-white dark:bg-slate-800 p-0.5 border border-slate-200/80 dark:border-slate-700/80 shadow-sm shrink-0 group-hover:scale-105 transition-transform"
          />
          <div className="min-w-0">
            <div className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
              AquaPure
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate leading-tight">
              Smart IoT Water Safety
            </div>
          </div>
        </NavLink>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white lg:hidden interactive-btn"
          aria-label="Close navigation"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation links */}
      <div className="flex-1 py-3 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Main Menu
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group ${
                  isActive
                    ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200/80 dark:border-sky-800/80 shadow-xs translate-x-1'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 hover:translate-x-1'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon size={17} className="transition-transform duration-200 group-hover:scale-110" />
                <span>{item.label}</span>
              </div>

              {item.count !== undefined && item.count > 0 && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold animate-pulse">
                  {item.count}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Sign Out Action Button */}
      <div className="px-3 pt-2 pb-1">
        <button
          type="button"
          onClick={() => {
            onClose();
            logout();
          }}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-900/60 text-xs font-bold transition-all shadow-2xs cursor-pointer interactive-btn group"
          title="Sign out of AquaPure account"
        >
          <LogOut size={16} className="transition-transform group-hover:-translate-x-0.5 stroke-[2.2]" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Bottom Institution / Organization Card */}
      <div className="p-3 m-3 mt-1 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-xs interactive-card">
        <div className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400 font-bold mb-1 text-[11px]">
          <ShieldCheck size={14} />
          <span>S.B. Jain Campus</span>
        </div>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
          5 Nodes Online &bull; Telemetry Active
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop static sidebar */}
      <aside className="hidden lg:block shrink-0 sticky top-0 h-screen z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />
          <div className="fixed inset-y-0 left-0 max-w-xs w-full shadow-2xl z-50 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
