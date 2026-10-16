import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { IncidentDetailPage } from './pages/IncidentDetailPage';
import { ServicesPage } from './pages/ServicesPage';
import { GraphPage } from './pages/GraphPage';
import { ChatPage } from './pages/ChatPage';
import { SettingsPage } from './pages/SettingsPage';

export function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#06090e] text-slate-200 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
        <Navbar />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/incidents" element={<IncidentsPage />} />
            <Route path="/incidents/:incidentId" element={<IncidentDetailPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/graph" element={<GraphPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs font-mono text-slate-400">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>
              <span className="text-white font-bold">GraphSentinel AI</span> — See the Impact. Find the Cause.
            </div>
            <div className="text-[11px] text-slate-400">
              Powered by <strong className="text-cyan-400">FalkorDB</strong> Graph Engine • 100% Synthetic Demonstration Data
            </div>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
