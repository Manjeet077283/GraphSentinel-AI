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
  Clock,
  ShieldAlert,
  ChevronRight,
  TrendingUp,
  Layers
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
        setError(err.message || 'Failed to load system overview');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-sm font-medium text-slate-600">Loading system health and telemetry from FalkorDB...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 rounded-2xl border border-rose-200 bg-white shadow-sm text-center">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Failed to load Dashboard Metrics</h3>
        <p className="text-sm text-slate-500 mt-2 mb-6">{error}</p>
        <button
          onClick={fetchOverview}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const isHealthy = data.critical_incidents === 0;

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto">
      {/* Hero Welcome & System Status Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="space-y-2 max-w-3xl">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isHealthy ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`} />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              System Condition: {isHealthy ? 'Stable' : `${data.critical_incidents} Critical Issues Detected`}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Incident Intelligence & Dependency Cascade
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Real-time infrastructure topology powered by <strong className="text-slate-900">FalkorDB</strong>. Quickly discover what happened, trace multi-hop service dependencies, and review evidence-backed next steps.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            to="/chat"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <BotMessageSquare className="w-4 h-4" />
            <span>Ask Investigation AI</span>
          </Link>
          <Link
            to="/graph"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium border border-slate-200 shadow-2xs transition-colors"
          >
            <Network className="w-4 h-4 text-indigo-600" />
            <span>Explore Graph</span>
          </Link>
          <button
            onClick={fetchOverview}
            title="Refresh Dashboard"
            className="p-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 shadow-2xs transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Critical Incidents */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-600">Critical Incidents</span>
            <div className="text-3xl font-black text-rose-600 mt-1">{data.critical_incidents}</div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Requires immediate intervention</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
            <Flame className="w-6 h-6" />
          </div>
        </div>

        {/* Active Incidents */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">Open Incidents</span>
            <div className="text-3xl font-black text-amber-800 mt-1">{data.open_incidents}</div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Active & under investigation</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Cascade Risk Dependents */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">Cascade Risk</span>
            <div className="text-3xl font-black text-blue-700 mt-1">{data.potentially_affected_services}</div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Downstream dependent services</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Network className="w-6 h-6" />
          </div>
        </div>

        {/* Total Monitored Services */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700">Total Services</span>
            <div className="text-3xl font-black text-indigo-700 mt-1">{data.total_services}</div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Connected in dependency graph</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Server className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Distributions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Severity Breakdown */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Incident Severity</h3>
              <Activity className="w-4 h-4 text-slate-400" />
            </div>
            <div className="space-y-3.5 text-xs">
              <div>
                <div className="flex justify-between text-rose-700 font-semibold mb-1">
                  <span>P1 Critical</span>
                  <span>{data.severity_distribution.P1_CRITICAL}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full"
                    style={{ width: `${Math.min(100, (data.severity_distribution.P1_CRITICAL / 15) * 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-amber-800 font-semibold mb-1">
                  <span>P2 High</span>
                  <span>{data.severity_distribution.P2_HIGH}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${Math.min(100, (data.severity_distribution.P2_HIGH / 15) * 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-yellow-700 font-semibold mb-1">
                  <span>P3 Medium</span>
                  <span>{data.severity_distribution.P3_MEDIUM}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-500 rounded-full"
                    style={{ width: `${Math.min(100, (data.severity_distribution.P3_MEDIUM / 15) * 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-blue-700 font-semibold mb-1">
                  <span>P4 Low</span>
                  <span>{data.severity_distribution.P4_LOW}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${Math.min(100, (data.severity_distribution.P4_LOW / 15) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
          <span className="text-[11px] text-slate-500 mt-4 block border-t border-slate-100 pt-3">
            Real incident counts from FalkorDB graph catalog
          </span>
        </div>

        {/* Incident Lifecycle Status */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Incident Lifecycle</h3>
              <Clock className="w-4 h-4 text-slate-400" />
            </div>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-100">
                <span className="text-[11px] font-semibold text-rose-700 uppercase">Open</span>
                <div className="text-2xl font-black text-rose-700 mt-0.5">{data.status_distribution.OPEN}</div>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                <span className="text-[11px] font-semibold text-amber-800 uppercase">Investigating</span>
                <div className="text-2xl font-black text-amber-800 mt-0.5">{data.status_distribution.INVESTIGATING}</div>
              </div>
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                <span className="text-[11px] font-semibold text-blue-700 uppercase">Mitigated</span>
                <div className="text-2xl font-black text-blue-700 mt-0.5">{data.status_distribution.MITIGATED}</div>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                <span className="text-[11px] font-semibold text-emerald-700 uppercase">Resolved</span>
                <div className="text-2xl font-black text-emerald-700 mt-0.5">{data.status_distribution.RESOLVED}</div>
              </div>
            </div>
          </div>
          <span className="text-[11px] text-slate-500 mt-4 block border-t border-slate-100 pt-3">
            Active incidents require investigation and mitigation
          </span>
        </div>

        {/* Service Health State */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Service Health State</h3>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800">
                <span className="font-semibold">Healthy Services</span>
                <span className="font-bold text-base">{data.service_health_distribution.HEALTHY}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                <span className="font-semibold">Degraded Services</span>
                <span className="font-bold text-base">{data.service_health_distribution.DEGRADED}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
                <span className="font-semibold">Critical Services</span>
                <span className="font-bold text-base">{data.service_health_distribution.CRITICAL}</span>
              </div>
            </div>
          </div>
          <Link
            to="/services"
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center justify-between pt-3 border-t border-slate-100"
          >
            <span>Browse all services & dependencies</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Recent Incidents Feed */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Recent Incidents Requiring Attention</h3>
            <p className="text-xs text-slate-500">
              Live incidents retrieved via FalkorDB graph relationships. Click to inspect full evidence, dependency impact, and AI hypotheses.
            </p>
          </div>
          <Link
            to="/incidents"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5"
          >
            <span>View All Incidents</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {data.recent_incidents.map((inc) => (
            <div
              key={inc.id}
              className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 p-3 rounded-xl transition-colors"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                    {inc.id}
                  </span>
                  <SeverityBadge severity={inc.severity} size="sm" />
                  <StatusBadge status={inc.status} size="sm" />
                  <span className="text-xs text-slate-500">
                    Affected Service:{' '}
                    <strong className="text-slate-800 font-semibold">
                      {inc.affected_service_name || inc.affected_service_id}
                    </strong>
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">{inc.title}</h4>
                <p className="text-xs text-slate-600 line-clamp-1">{inc.description}</p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <Link
                  to={`/incidents/${inc.id}`}
                  className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  <span>Investigate Incident</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
