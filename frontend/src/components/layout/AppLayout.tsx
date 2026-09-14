import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export const AppLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-row antialiased transition-colors">
      {/* Left Sidebar (Desktop static / Mobile Drawer) */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Right Column: Main Content + Footer */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Main Content Area */}
        <main className="flex-1 p-3.5 sm:p-5 lg:p-6 max-w-[1750px] w-full mx-auto">
          <div key={location.pathname} className="page-enter">
            <Outlet />
          </div>

          <footer className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="font-bold text-slate-900 dark:text-slate-200">
                AquaPure &bull; Smart Water Safety & Purifier Monitoring
              </div>
              <div className="text-[11px] mt-0.5 text-slate-500 dark:text-slate-400">
                Centralized Water Quality, AI Contaminant Detection & Predictive Maintenance Platform
              </div>
            </div>
            <div className="sm:text-right text-[11px]">
              <div>WHO & NSF-WQI Compliant Telemetry Protocol</div>
              <div className="text-sky-600 dark:text-sky-400 mt-0.5">Raspberry Pi Pico W & ESP32-CAM Retrofit Ready</div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};
