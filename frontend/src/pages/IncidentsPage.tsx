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
        setError(err.message || 'Failed to fetch incidents');
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
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-indigo-600" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Incident Management
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Incident Explorer
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Search, filter, and inspect infrastructure incidents recorded in FalkorDB.
          </p>
        </div>

        <button
          onClick={fetchIncidents}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-50 transition-colors shadow-2xs self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          <span>Refresh Incidents</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by incident title, ID, or affected service (e.g. 'Payment', 'Redis', 'Pool', 'INC-001')..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50/70 text-slate-800 text-sm rounded-xl pl-10 pr-4 py-2.5 border border-slate-200 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400 transition-colors"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors shadow-sm"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          {/* Severity Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-500 font-medium mr-1">Severity:</span>
            {['ALL', 'P1_CRITICAL', 'P2_HIGH', 'P3_MEDIUM', 'P4_LOW'].map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  severityFilter === sev
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                }`}
              >
                {sev === 'ALL' ? 'All Severities' : sev.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-500 font-medium mr-1">Status:</span>
            {['ALL', 'OPEN', 'INVESTIGATING', 'MITIGATED', 'RESOLVED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === st
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                }`}
              >
                {st === 'ALL' ? 'All Statuses' : st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Incidents Feed */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 gap-3 bg-white rounded-2xl border border-slate-200">
          <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin" />
          <p className="text-xs font-medium text-slate-500">Querying incidents from graph...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl border border-rose-200 bg-white text-rose-700 text-sm">
          Failed to load incidents: {error}
        </div>
      ) : incidents.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 text-slate-500 text-sm">
          No incidents matched the selected filters.
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-xs font-medium text-slate-500 px-1">
            Displaying {incidents.length} incident(s)
          </div>
          {incidents.map((inc) => (
            <div
              key={inc.id}
              className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-2xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
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

                <h3 className="text-base font-bold text-slate-900">{inc.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{inc.description}</p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <Link
                  to={`/incidents/${inc.id}`}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  <span>Investigate</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <Link
                  to={`/chat?incident=${inc.id}`}
                  title="Ask AI Agent about this incident"
                  className="p-2 rounded-lg bg-white hover:bg-slate-50 text-indigo-600 border border-slate-200 shadow-2xs transition-colors"
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
