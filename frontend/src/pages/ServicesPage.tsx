import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Server,
  Search,
  Filter,
  ArrowRight,
  Database,
  AlertTriangle,
  RefreshCw,
  Network,
  BotMessageSquare,
  ShieldCheck,
  Cpu,
  Layers
} from 'lucide-react';
import { api } from '../services/api';
import { ServiceSummary, ServiceDetail } from '../types';
import { HealthBadge } from '../components/HealthBadge';

export const ServicesPage: React.FC = () => {
  const [services, setServices] = useState<ServiceSummary[]>([]);
  const [selectedService, setSelectedService] = useState<ServiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [criticalityFilter, setCriticalityFilter] = useState('ALL');

  const fetchServices = () => {
    setLoading(true);
    setError(null);
    const params: any = {};
    if (statusFilter !== 'ALL') params.status = statusFilter;
    if (criticalityFilter !== 'ALL') params.criticality = criticalityFilter;

    api.getServices(params)
      .then((data) => {
        setServices(data);
        setLoading(false);
        if (data.length > 0 && !selectedService) {
          loadServiceDetail(data[0].id);
        }
      })
      .catch((err) => {
        setError(err.message || 'Failed to fetch services');
        setLoading(false);
      });
  };

  const loadServiceDetail = (serviceId: string) => {
    setLoadingDetail(true);
    api.getService(serviceId)
      .then((detail) => {
        setSelectedService(detail);
        setLoadingDetail(false);
      })
      .catch(() => {
        setLoadingDetail(false);
      });
  };

  useEffect(() => {
    fetchServices();
  }, [statusFilter, criticalityFilter]);

  const filteredServices = services.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return s.id.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || s.team.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-indigo-600" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Service Catalog & Mesh
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Service Explorer
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Browse microservices, understand upstream callers, downstream dependencies, and connected infrastructure.
          </p>
        </div>

        <button
          onClick={fetchServices}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-50 transition-colors shadow-2xs self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          <span>Refresh Services</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search service by name, ID (e.g. 'SVC-PAYMENT'), or team..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50/70 text-slate-800 text-sm rounded-xl pl-10 pr-4 py-2.5 border border-slate-200 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-500 font-medium mr-1">Health Status:</span>
            {['ALL', 'HEALTHY', 'DEGRADED', 'CRITICAL'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === st
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-500 font-medium mr-1">Criticality:</span>
            {['ALL', 'TIER_1', 'TIER_2', 'TIER_3', 'TIER_4'].map((crit) => (
              <button
                key={crit}
                onClick={() => setCriticalityFilter(crit)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  criticalityFilter === crit
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                }`}
              >
                {crit}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main 2-Column Layout: Service List + Service Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Service List (5 cols) */}
        <div className="lg:col-span-5 space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
              Loading services from FalkorDB...
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
              No services matched the filter criteria.
            </div>
          ) : (
            filteredServices.map((svc) => (
              <div
                key={svc.id}
                onClick={() => loadServiceDetail(svc.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedService?.id === svc.id
                    ? 'bg-indigo-50/70 border-indigo-400 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900">{svc.name}</span>
                  <HealthBadge status={svc.status} />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
                  <span className="font-mono text-indigo-600 font-semibold">{svc.id}</span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium text-slate-600">
                    {svc.criticality}
                  </span>
                  <span>{svc.team}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Service Inspector (7 cols) */}
        <div className="lg:col-span-7">
          {loadingDetail ? (
            <div className="p-12 rounded-2xl bg-white border border-slate-200 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin" />
              <p className="text-xs font-medium text-slate-500">Loading service architecture details...</p>
            </div>
          ) : selectedService ? (
            <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                      {selectedService.id}
                    </span>
                    <HealthBadge status={selectedService.status} />
                    <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      {selectedService.criticality}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">Team: {selectedService.team}</span>
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-900 mt-2">{selectedService.name}</h2>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{selectedService.description}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    to={`/graph?service=${selectedService.id}`}
                    title="View in Dependency Graph"
                    className="p-2 rounded-lg bg-white hover:bg-slate-50 text-indigo-600 border border-slate-200 shadow-2xs transition-colors"
                  >
                    <Network className="w-4 h-4" />
                  </Link>
                  <Link
                    to={`/chat?service=${selectedService.id}`}
                    title="Investigate Service with AI"
                    className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-2xs"
                  >
                    <BotMessageSquare className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Active Incidents on Service */}
              {selectedService.active_incidents.length > 0 && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
                  <div className="flex items-center gap-2 text-rose-800 text-xs font-bold">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Active Incident Affecting This Service</span>
                  </div>
                  {selectedService.active_incidents.map((a) => (
                    <div key={a.id} className="flex items-center justify-between text-xs">
                      <span className="text-slate-800 font-medium">
                        <strong>{a.id}</strong>: {a.title} ({a.severity.replace('P1_', '').replace('P2_', '')})
                      </span>
                      <Link
                        to={`/incidents/${a.id}`}
                        className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                      >
                        <span>Investigate</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  ))}
                </div>
              )}

              {/* Connected Infrastructure */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Database className="w-4 h-4 text-purple-600" />
                  <span>Connected Infrastructure ({selectedService.connected_infrastructure.length})</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {selectedService.connected_infrastructure.map((inf) => (
                    <div key={inf.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900 block">{inf.name}</span>
                        <span className="text-[11px] text-slate-500 font-mono">{inf.type} • {inf.environment}</span>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        inf.status === 'HEALTHY' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        {inf.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Downstream Dependencies */}
              <div className="space-y-3 border-t border-slate-100 pt-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
                  <span>Downstream Dependencies ({selectedService.name} calls / relies on):</span>
                </h4>
                {selectedService.downstream_dependencies.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No downstream service dependencies.</p>
                ) : (
                  <div className="space-y-2 text-xs">
                    {selectedService.downstream_dependencies.map((d) => (
                      <div key={d.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{d.name}</span>
                          <span className="font-mono text-[10px] text-slate-500">({d.id})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 text-[11px] font-medium">{d.criticality}</span>
                          <HealthBadge status={d.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Upstream Dependents */}
              <div className="space-y-3 border-t border-slate-100 pt-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Upstream Callers (Services that rely on {selectedService.name}):</span>
                </h4>
                {selectedService.upstream_dependencies.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No upstream services depend on this service directly.</p>
                ) : (
                  <div className="space-y-2 text-xs">
                    {selectedService.upstream_dependencies.map((u) => (
                      <div key={u.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{u.name}</span>
                          <span className="font-mono text-[10px] text-slate-500">({u.id})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 text-[11px] font-medium">{u.criticality}</span>
                          <HealthBadge status={u.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-2xl bg-white border border-slate-200 text-center text-xs text-slate-500">
              Select a service from the left list to inspect its dependency architecture.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
