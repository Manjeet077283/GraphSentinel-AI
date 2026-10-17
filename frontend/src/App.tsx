import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { Navbar } from './components/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { IncidentDetailPage } from './pages/IncidentDetailPage';
import { ServicesPage } from './pages/ServicesPage';
import { GraphPage } from './pages/GraphPage';
import { ChatPage } from './pages/ChatPage';
import { DataWorkspacePage } from './pages/DataWorkspacePage';
import { InvestigationHistoryPage } from './pages/InvestigationHistoryPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';

function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span className="text-slate-900 font-semibold">GraphSentinel AI</span> — See the Impact. Find the Cause.
          </div>
          <div className="text-[11px] text-slate-400">
            Powered by <strong className="text-indigo-600 font-medium">FalkorDB</strong> Graph Engine • Multilingual Incident Intelligence
          </div>
        </div>
      </footer>
    </div>
  );
}

export function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Routes */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<DashboardPage />} />
              <Route path="/incidents" element={<IncidentsPage />} />
              <Route path="/incidents/:incidentId" element={<IncidentDetailPage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/graph" element={<GraphPage />} />
              <Route path="/data" element={<DataWorkspacePage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/history" element={<InvestigationHistoryPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
