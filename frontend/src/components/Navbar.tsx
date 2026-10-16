import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  ShieldAlert,
  LayoutDashboard,
  AlertOctagon,
  Server,
  Share2,
  BotMessageSquare,
  Settings,
  Database
} from 'lucide-react';
import { api } from '../services/api';

export const Navbar: React.FC = () => {
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);

  useEffect(() => {
    api.getHealth()
      .then((h) => setDbConnected(h.database.connected))
      .catch(() => setDbConnected(false));
  }, []);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/80 shadow-sm'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
    }`;

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-4">
            <NavLink to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-950/50 group-hover:scale-105 transition-transform">
                <ShieldAlert className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base tracking-tight text-white font-mono">
                    GraphSentinel<span className="text-cyan-400">.AI</span>
                  </span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-950/90 text-cyan-400 border border-cyan-800/60 font-semibold tracking-wider">
                    FalkorDB
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-normal leading-none hidden sm:block">
                  See the Impact. Find the Cause.
                </p>
              </div>
            </NavLink>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-1.5">
            <NavLink to="/" className={navLinkClass}>
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </NavLink>
            <NavLink to="/incidents" className={navLinkClass}>
              <AlertOctagon className="w-4 h-4" />
              Incidents
            </NavLink>
            <NavLink to="/services" className={navLinkClass}>
              <Server className="w-4 h-4" />
              Services
            </NavLink>
            <NavLink to="/graph" className={navLinkClass}>
              <Share2 className="w-4 h-4" />
              Graph Explorer
            </NavLink>
            <NavLink to="/chat" className={navLinkClass}>
              <BotMessageSquare className="w-4 h-4" />
              Investigation Chat
            </NavLink>
            <NavLink to="/settings" className={navLinkClass}>
              <Settings className="w-4 h-4" />
              Settings
            </NavLink>
          </nav>

          {/* Right Status Indicators */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full border border-slate-800 bg-slate-900/80 text-xs text-slate-300 font-mono">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span>FalkorDB:</span>
              {dbConnected === null ? (
                <span className="text-slate-400">Checking...</span>
              ) : dbConnected ? (
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Connected
                </span>
              ) : (
                <span className="flex items-center gap-1 text-rose-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  Offline
                </span>
              )}
            </div>

            <span className="text-[10px] font-mono uppercase bg-amber-950/60 text-amber-300 border border-amber-800/60 px-2 py-0.5 rounded tracking-wide hidden sm:inline-block">
              Synthetic Dataset
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
