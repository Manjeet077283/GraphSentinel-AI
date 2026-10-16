import React, { useEffect, useState } from 'react';
import {
  Settings,
  Database,
  Cpu,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Server,
  Layers,
  Terminal,
  ExternalLink
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
        setSeedError(err.message);
        setSeeding(false);
      });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Settings className="w-5 h-5 text-cyan-400" />
          <span className="text-xs font-mono font-medium text-cyan-400 uppercase tracking-wider">
            Configuration & Diagnostics
          </span>
        </div>
        <h1 className="text-2xl font-black text-white font-mono">System Status & Environment</h1>
        <p className="text-xs text-slate-400">
          Inspect FalkorDB graph connectivity, AI engine configuration, and manage synthetic test data.
        </p>
      </div>

      {/* System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* API Backend Card */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3 font-mono">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase">FastAPI Backend</span>
            <Server className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-center gap-2 text-sm font-bold text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>Online (v1.0.0)</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Endpoint: <code className="text-slate-300">/api</code>
          </div>
        </div>

        {/* FalkorDB Graph Database Card */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3 font-mono">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase">FalkorDB Database</span>
            <Database className="w-4 h-4 text-indigo-400" />
          </div>
          {health?.database.connected ? (
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Connected ({health.database.latency_ms}ms)</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm font-bold text-rose-400">
              <AlertTriangle className="w-4 h-4" />
              <span>Offline</span>
            </div>
          )}
          <div className="text-[11px] text-slate-400">
            Target: <code className="text-slate-300">{health?.database.target || 'localhost:6379'}</code>
          </div>
        </div>

        {/* AI Engine Status Card */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3 font-mono">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase">AI Engine Status</span>
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-center gap-2 text-sm font-bold text-cyan-300">
            <span>{health?.ai_provider.active_mode === 'gemini_ai' ? 'Gemini 2.5 Active' : 'Deterministic Mode'}</span>
          </div>
          <div className="text-[11px] text-slate-400">
            {health?.ai_provider.gemini_configured
              ? 'Model: ' + health.ai_provider.model
              : 'Deterministic Graph Intelligence Active'}
          </div>
        </div>
      </div>

      {/* Dataset & Seeding Admin Panel */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white font-mono">Synthetic Dataset Management</h3>
            <p className="text-xs text-slate-400">
              Re-seed or refresh the FalkorDB graph with 16 services, 42 incidents, 68 evidence nodes, and 48 dependency relationships.
            </p>
          </div>
          <span className="text-[10px] font-mono uppercase bg-cyan-950 text-cyan-400 border border-cyan-800 px-2 py-0.5 rounded">
            Idempotent Seed
          </span>
        </div>

        <div className="space-y-3 font-mono text-xs">
          <div>
            <label className="text-slate-300 block mb-1">Admin Secret Authorization Key:</label>
            <input
              type="password"
              value={adminSecret}
              onChange={(e) => setAdminSecret(e.target.value)}
              placeholder="Enter ADMIN_SECRET"
              className="w-full max-w-md bg-slate-950 text-slate-200 px-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-cyan-500 font-mono"
            />
            <span className="text-[10px] text-slate-500 block mt-1">
              Configured via <code>ADMIN_SECRET</code> environment variable in backend.
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => handleSeed(false)}
              disabled={seeding}
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold transition-colors flex items-center gap-2"
            >
              {seeding ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              <span>Re-run Idempotent Seed</span>
            </button>

            <button
              onClick={() => handleSeed(true)}
              disabled={seeding}
              className="px-4 py-2 rounded-lg bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-800/80 font-semibold transition-colors flex items-center gap-2"
            >
              <span>Wipe & Fresh Seed</span>
            </button>
          </div>
        </div>

        {/* Seeding Result Output */}
        {seedResult && (
          <div className="p-4 rounded-xl bg-slate-950 border border-emerald-800/60 space-y-2 text-xs font-mono">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>{seedResult.message}</span>
            </div>
            <pre className="text-[11px] text-slate-300 overflow-x-auto p-2 bg-slate-900 rounded">
              {JSON.stringify(seedResult.summary, null, 2)}
            </pre>
          </div>
        )}

        {seedError && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs font-mono text-rose-300">
            ⚠️ Seeding Error: {seedError}
          </div>
        )}
      </div>

      {/* Deployment & Environment Documentation Card */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white font-mono">Environment Configuration Reference</h3>
        <p className="text-xs text-slate-300 leading-relaxed font-mono">
          GraphSentinel AI operates on standard environment variables defined in <code>.env</code>:
        </p>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-850 font-mono text-xs space-y-2 text-slate-300">
          <div><code>FALKORDB_HOST=localhost</code> — FalkorDB host address</div>
          <div><code>FALKORDB_PORT=6379</code> — FalkorDB connection port</div>
          <div><code>FALKORDB_GRAPH=graphsentinel</code> — Primary graph database identifier</div>
          <div><code>GEMINI_API_KEY=</code> — Optional API key for Google Gemini model</div>
          <div><code>GEMINI_MODEL=gemini-2.5-flash</code> — Gemini model version</div>
          <div><code>ADMIN_SECRET=graphsentinel-admin-dev</code> — Secret header for administrative seeding</div>
        </div>
      </div>
    </div>
  );
};
