import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TelemetryProvider } from './context/TelemetryContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppLayout } from './components/layout/AppLayout';

import { DashboardPage } from './pages/DashboardPage';
import { PurifiersPage } from './pages/PurifiersPage';
import { PurifierDetailPage } from './pages/PurifierDetailPage';
import { WaterQualityPage } from './pages/WaterQualityPage';
import { FilterHealthPage } from './pages/FilterHealthPage';
import { PredictiveMaintenancePage } from './pages/PredictiveMaintenancePage';
import { AiDetectionPage } from './pages/AiDetectionPage';
import { AlertsPage } from './pages/AlertsPage';
import { MaintenancePage } from './pages/MaintenancePage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ReportsPage } from './pages/ReportsPage';
import { UsersPage } from './pages/UsersPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import { RefreshCw } from 'lucide-react';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-sky-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-sky-600/30 mb-4 animate-pulse">
          AP
        </div>
        <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
          <RefreshCw size={14} className="animate-spin text-sky-600 dark:text-sky-400" />
          <span>Authenticating AquaPure session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <TelemetryProvider>
            <Routes>
              {/* Separate Login Page */}
              <Route path="/login" element={<LoginPage />} />

              {/* Protected Application Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardPage />} />
                <Route path="purifiers" element={<PurifiersPage />} />
                <Route path="purifiers/:id" element={<PurifierDetailPage />} />
                <Route path="water-quality" element={<WaterQualityPage />} />
                <Route path="filter-health" element={<FilterHealthPage />} />
                <Route path="ai-detection" element={<AiDetectionPage />} />
                <Route path="camera" element={<AiDetectionPage />} />
                <Route path="alerts" element={<AlertsPage />} />
                <Route path="maintenance" element={<MaintenancePage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="predictive-maintenance" element={<PredictiveMaintenancePage />} />
              </Route>

              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </TelemetryProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
