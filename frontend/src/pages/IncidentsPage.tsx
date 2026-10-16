import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertOctagon,
  Search,
  Filter,
  ArrowRight,
  RefreshCw,
  BotMessageSquare,
  Network
} from 'lucide-react';
import { api } from '../services/api';
import { IncidentSummary } from '../types';
import { SeverityBadge } from '../components/SeverityBadge';
import { StatusBadge } from '../components/StatusBadge';

export const IncidentsPage: React.FC = () => {
  const [incidents, setIncidents] = useState<IncidentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchIncidents = () => {
    setLoading(true);
    setError(null);
    const params: any = {};
    if (severityFilter !== 'ALL') params.severity = severityFilter;
    if (statusFilter !== 'ALL') params.status = statusFilter;
    if (search.trim()) params.search = search.trim();

    api.getIncidents(params)
      .then((data) => {
        setIncidents(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchIncidents();
  }, [severityFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchIncidents();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <AlertOctagon className="w-5 h-5 text-rose-500" />
            <span className="text-xs font-mono font-medium text-rose-400 uppercase tracking-wider">
              Incident Management
            </span>
          </div>
          <h1 className="text-2xl font-black text-white font-mono">Incident Explorer</h1>
          <p className="text-xs text-slate-400">
            Search and filter active and historical infrastructure incidents recorded in FalkorDB.
          </p>
        </div>

        <button
          onClick={fetchIncidents}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white transition-colors font-mono self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by incident ID, title, keyword (e.g. 'Payment', 'Redis', 'Pool', 'INC-001')..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 text-slate-200 text-xs rounded-lg pl-9 pr-3 py-2 border border-slate-800 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-semibold transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-xs font-mono">
          {/* Severity Tabs */}
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-slate-400 mr-1.5">Severity:</span>
            {['ALL', 'P1_CRITICAL', 'P2_HIGH', 'P3_MEDIUM', 'P4_LOW'].map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  severityFilter === sev
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {sev === 'ALL' ? 'All Severities' : sev.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-slate-400 mr-1.5">Status:</span>
            {['ALL', 'OPEN', 'INVESTIGATING', 'MITIGATED', 'RESOLVED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  statusFilter === st
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {st === 'ALL' ? 'All Statuses' : st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Incidents List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 gap-3">
          <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
          <p className="text-xs font-mono text-slate-400">Loading incidents from graph...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl border border-rose-800 bg-rose-950/30 text-rose-300 text-xs font-mono">
          Failed to load incidents: {error}
        </div>
      ) : incidents.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400 font-mono text-xs">
          No incidents matched the selected filters.
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-xs font-mono text-slate-400 px-1">
            Showing {incidents.length} incidents
          </div>
          {incidents.map((inc) => (
            <div
              key={inc.id}
              className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-mono text-xs font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                    {inc.id}
                  </span>
                  <SeverityBadge severity={inc.severity} size="sm" />
                  <StatusBadge status={inc.status} size="sm" />
                  <span className="text-xs font-mono text-slate-400">
                    Affected Service:{' '}
                    <strong className="text-cyan-300">{inc.affected_service_name || inc.affected_service_id}</strong>
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white">{inc.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{inc.description}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  to={`/incidents/${inc.id}`}
                  className="px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-medium transition-colors flex items-center gap-1.5 shadow-md shadow-cyan-950/40"
                >
                  <span>Investigate</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <Link
                  to={`/chat?incident=${inc.id}`}
                  title="Ask AI Agent about this incident"
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 transition-colors"
                >
                  <BotMessageSquare className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
