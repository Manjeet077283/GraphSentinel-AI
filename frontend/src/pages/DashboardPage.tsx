import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Server,
  AlertTriangle,
  Flame,
  Network,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  BotMessageSquare,
  Activity,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { api } from '../services/api';
import { OverviewResponse } from '../types';
import { SeverityBadge } from '../components/SeverityBadge';
import { StatusBadge } from '../components/StatusBadge';

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = () => {
    setLoading(true);
    setError(null);
    api.getOverview()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
        <p className="text-sm font-mono text-slate-400">Querying FalkorDB graph telemetry...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto my-12 p-6 rounded-xl border border-rose-800 bg-rose-950/30 text-rose-200">
        <div className="flex items-center gap-3 mb-2">
          <AlertTriangle className="w-6 h-6 text-rose-400" />
          <h3 className="text-lg font-bold">Failed to load Dashboard Metrics</h3>
        </div>
        <p className="text-sm font-mono text-rose-300 mb-4">{error}</p>
        <button
          onClick={fetchOverview}
          className="px-4 py-2 bg-rose-800 hover:bg-rose-700 text-white text-xs font-mono rounded-lg transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Welcome Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-mono font-medium text-cyan-400 uppercase tracking-wider">
              Autonomous Incident Intelligence
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Incident Overview & Dependency Cascade
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Real-time graph analysis powered by <strong className="text-slate-200">FalkorDB</strong>. Tracing multi-hop dependency failure cascades, connecting telemetry evidence, and retrieving proven remediations.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/chat"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-semibold shadow-lg shadow-cyan-950/50 transition-all hover:scale-105"
          >
            <BotMessageSquare className="w-4 h-4" />
            AI Investigation
          </Link>
          <Link
            to="/graph"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-medium border border-slate-700 transition-colors"
          >
            <Network className="w-4 h-4 text-cyan-400" />
            Explore Graph
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Services */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Total Services</span>
            <div className="text-3xl font-black text-white mt-1 font-mono">{data.total_services}</div>
            <span className="text-[11px] text-slate-400 mt-1 block">Tier 1 - Tier 4 Nodes</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-950/80 border border-blue-800/60 flex items-center justify-center text-blue-400">
            <Server className="w-6 h-6" />
          </div>
        </div>

        {/* Open Incidents */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Active Incidents</span>
            <div className="text-3xl font-black text-amber-400 mt-1 font-mono">{data.open_incidents}</div>
            <span className="text-[11px] text-slate-400 mt-1 block">Open & Investigating</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-950/80 border border-amber-800/60 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Critical Incidents */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-mono text-rose-400 uppercase tracking-wider font-semibold">Critical P1s</span>
            <div className="text-3xl font-black text-rose-500 mt-1 font-mono">{data.critical_incidents}</div>
            <span className="text-[11px] text-rose-400/80 mt-1 block">Requires Immediate Action</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-950/80 border border-rose-800/60 flex items-center justify-center text-rose-400">
            <Flame className="w-6 h-6" />
          </div>
        </div>

        {/* Potentially Affected Services */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold">Cascade Risk</span>
            <div className="text-3xl font-black text-cyan-400 mt-1 font-mono">{data.potentially_affected_services}</div>
            <span className="text-[11px] text-cyan-300/80 mt-1 block">Downstream Dependents</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
            <Network className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Distributions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Severity Breakdown */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">Severity Distribution</h3>
              <Activity className="w-4 h-4 text-slate-400" />
            </div>
            <div className="space-y-3 font-mono text-xs">
              <div>
                <div className="flex justify-between text-rose-400 mb-1">
                  <span>P1 Critical</span>
                  <span>{data.severity_distribution.P1_CRITICAL}</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full"
                    style={{ width: `${(data.severity_distribution.P1_CRITICAL / 42) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-amber-400 mb-1">
                  <span>P2 High</span>
                  <span>{data.severity_distribution.P2_HIGH}</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${(data.severity_distribution.P2_HIGH / 42) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-yellow-400 mb-1">
                  <span>P3 Medium</span>
                  <span>{data.severity_distribution.P3_MEDIUM}</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-500 rounded-full"
                    style={{ width: `${(data.severity_distribution.P3_MEDIUM / 42) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-blue-400 mb-1">
                  <span>P4 Low</span>
                  <span>{data.severity_distribution.P4_LOW}</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${(data.severity_distribution.P4_LOW / 42) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
          <span className="text-[11px] text-slate-400 font-mono mt-4 block border-t border-slate-800 pt-3">
            Total Synthetic Incidents: 42
          </span>
        </div>

        {/* Incident Status Breakdown */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">Incident Lifecycle</h3>
              <Clock className="w-4 h-4 text-slate-400" />
            </div>
            <div className="grid grid-cols-2 gap-3 font-mono text-center">
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/50">
                <span className="text-[10px] text-rose-400 uppercase">Open</span>
                <div className="text-xl font-bold text-rose-300 mt-0.5">{data.status_distribution.OPEN}</div>
              </div>
              <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-800/50">
                <span className="text-[10px] text-amber-400 uppercase">Investigating</span>
                <div className="text-xl font-bold text-amber-300 mt-0.5">{data.status_distribution.INVESTIGATING}</div>
              </div>
              <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-800/50">
                <span className="text-[10px] text-cyan-400 uppercase">Mitigated</span>
                <div className="text-xl font-bold text-cyan-300 mt-0.5">{data.status_distribution.MITIGATED}</div>
              </div>
              <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/50">
                <span className="text-[10px] text-emerald-400 uppercase">Resolved</span>
                <div className="text-xl font-bold text-emerald-300 mt-0.5">{data.status_distribution.RESOLVED}</div>
              </div>
            </div>
          </div>
          <span className="text-[11px] text-slate-400 font-mono mt-4 block border-t border-slate-800 pt-3">
            Resolution Rate: {Math.round((data.status_distribution.RESOLVED / 42) * 100)}%
          </span>
        </div>

        {/* Service Health State */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">Service Health</h3>
              <CheckCircle2 className="w-4 h-4 text-slate-400" />
            </div>
            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-emerald-300">
                <span>Healthy Services</span>
                <span className="font-bold text-sm">{data.service_health_distribution.HEALTHY}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-amber-950/30 border border-amber-800/40 text-amber-300">
                <span>Degraded Services</span>
                <span className="font-bold text-sm">{data.service_health_distribution.DEGRADED}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-rose-950/30 border border-rose-800/40 text-rose-300">
                <span>Critical Services</span>
                <span className="font-bold text-sm">{data.service_health_distribution.CRITICAL}</span>
              </div>
            </div>
          </div>
          <Link
            to="/services"
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center justify-between pt-3 border-t border-slate-800 font-mono"
          >
            <span>View all 16 services</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Recent Incidents Feed */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-white font-mono">Recent Incident Activity</h3>
            <p className="text-xs text-slate-400">Live incidents retrieved via FalkorDB graph relationships</p>
          </div>
          <Link
            to="/incidents"
            className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5"
          >
            <span>View All 42 Incidents</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-slate-800/80">
          {data.recent_incidents.map((inc) => (
            <div
              key={inc.id}
              className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-850/40 px-3 rounded-lg transition-colors"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-mono text-xs font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                    {inc.id}
                  </span>
                  <SeverityBadge severity={inc.severity} size="sm" />
                  <StatusBadge status={inc.status} size="sm" />
                  <span className="text-xs font-mono text-slate-400">
                    Service: <strong className="text-slate-200">{inc.affected_service_name || inc.affected_service_id}</strong>
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-slate-200">{inc.title}</h4>
                <p className="text-xs text-slate-400 line-clamp-1">{inc.description}</p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <Link
                  to={`/incidents/${inc.id}`}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-medium border border-slate-700 transition-colors flex items-center gap-1.5"
                >
                  <span>Investigate</span>
                  <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
