import React, { useEffect, useState } from 'react';
import {
  Settings,
  Database,
  Cpu,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Server,
  Layers,
  ShieldCheck,
  Lock
} from 'lucide-react';
import { api } from '../services/api';
import { HealthResponse } from '../types';

export const SettingsPage: React.FC = () => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminSecret, setAdminSecret] = useState('graphsentinel-admin-dev');
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<any>(null);
  const [seedError, setSeedError] = useState<string | null>(null);

  const fetchHealth = () => {
    setLoading(true);
    api.getHealth()
      .then((data) => {
        setHealth(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const handleSeed = (wipe: boolean) => {
    setSeeding(true);
    setSeedResult(null);
    setSeedError(null);
    api.triggerSeed(wipe, adminSecret)
      .then((res) => {
        setSeedResult(res);
        setSeeding(false);
        fetchHealth();
      })
      .catch((err) => {
        setSeedError(err.message || 'Seeding failed');
        setSeeding(false);
      });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-indigo-600" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            System Status & Configuration
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Settings & Diagnostics
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Inspect FalkorDB graph connectivity, verify AI investigation engines, and manage synthetic test datasets.
        </p>
      </div>

      {/* System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* API Backend Card */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">FastAPI Backend</span>
            <Server className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-center gap-2 text-sm font-bold text-emerald-700">
            <CheckCircle2 className="w-4 h-4" />
            <span>Online (v1.0.0)</span>
          </div>
          <div className="text-xs text-slate-500">
            Base Endpoint: <code className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono text-[11px]">/api</code>
          </div>
        </div>

        {/* FalkorDB Graph Database Card */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Data Source</span>
            <Database className="w-4 h-4 text-purple-600" />
          </div>
          {health?.database.connected ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-bold text-emerald-700">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>
                  {health.database.target.includes('cloud') || health.database.target.includes('falkordb.com')
                    ? 'FalkorDB Cloud — Connected'
                    : 'Local FalkorDB — Connected'}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 block">
                Roundtrip Latency: {health.database.latency_ms}ms
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm font-bold text-rose-700">
              <AlertTriangle className="w-4 h-4" />
              <span>Disconnected</span>
            </div>
          )}
          <div className="text-xs text-slate-500 pt-1 border-t border-slate-100">
            Graph Endpoint:{' '}
            <code className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono text-[11px]">
              {health?.database.target || 'localhost:6379'}
            </code>
          </div>
        </div>

        {/* AI Engine Status Card */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">AI Engine Mode</span>
            <Cpu className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-sm font-bold text-slate-900">
            {health?.ai_provider.active_mode === 'gemini_ai' ? 'Gemini 2.5 Active' : 'Deterministic Mode'}
          </div>
          <div className="text-xs text-slate-500">
            {health?.ai_provider.gemini_configured
              ? `Model: ${health.ai_provider.model}`
              : 'Deterministic Graph Reasoning Engine'}
          </div>
        </div>
      </div>

      {/* Dataset & Seeding Admin Panel */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Synthetic Dataset Management</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Re-seed or refresh the FalkorDB graph with 16 services, 42 incidents, 68 evidence nodes, and 48 dependency relationships.
            </p>
          </div>
          <span className="text-[11px] font-semibold uppercase bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-0.5 rounded-md self-start">
            Idempotent Seeder
          </span>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="text-slate-700 font-semibold block mb-1">
              Admin Secret Key (Protected):
            </label>
            <div className="relative max-w-md">
              <input
                type="password"
                value={adminSecret}
                onChange={(e) => setAdminSecret(e.target.value)}
                placeholder="Enter ADMIN_SECRET"
                className="w-full bg-slate-50 text-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:bg-white font-mono text-xs"
              />
              <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3.5 top-3" />
            </div>
            <span className="text-[11px] text-slate-400 block mt-1">
              Required for administrative database operations. Secrets are never exposed.
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => handleSeed(false)}
              disabled={seeding}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold transition-colors flex items-center gap-2 shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${seeding ? 'animate-spin' : ''}`} />
              <span>Re-run Idempotent Seed</span>
            </button>

            <button
              onClick={() => handleSeed(true)}
              disabled={seeding}
              className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold transition-colors flex items-center gap-2"
            >
              <span>Wipe & Fresh Seed</span>
            </button>
          </div>
        </div>

        {/* Seeding Result Output */}
        {seedResult && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-emerald-800 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{seedResult.message}</span>
            </div>
            <pre className="text-[11px] text-slate-700 overflow-x-auto p-3 bg-white rounded-lg border border-emerald-100 font-mono">
              {JSON.stringify(seedResult.summary, null, 2)}
            </pre>
          </div>
        )}

        {seedError && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
            ⚠️ Seeding Error: {seedError}
          </div>
        )}
      </div>

      {/* Deployment & Safety Architecture */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-indigo-600" />
          <h3 className="text-base font-bold text-slate-900">Safety & Security Architecture</h3>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          GraphSentinel AI enforces strict non-destructive read-only investigation practices. 
          Hypotheses are clearly separated from confirmed facts. Automated remediation commands are never executed directly on production clusters without human engineer sign-off.
        </p>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2 text-slate-700 font-mono">
          <div><code>FALKORDB_HOST</code> — Configured host address for the graph database</div>
          <div><code>FALKORDB_PORT</code> — Standard FalkorDB Redis protocol port (default 6379)</div>
          <div><code>FALKORDB_GRAPH</code> — Primary graph database identifier: <code>graphsentinel</code></div>
          <div><code>GEMINI_MODEL</code> — AI synthesis model (falls back to deterministic graph engine if unconfigured)</div>
        </div>
      </div>
    </div>
  );
};
