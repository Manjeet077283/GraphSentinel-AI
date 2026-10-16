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
  BotMessageSquare
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
        setError(err.message);
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
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Server className="w-5 h-5 text-cyan-400" />
            <span className="text-xs font-mono font-medium text-cyan-400 uppercase tracking-wider">
              Service Mesh & Catalog
            </span>
          </div>
          <h1 className="text-2xl font-black text-white font-mono">Service Explorer</h1>
          <p className="text-xs text-slate-400">
            Browse service architectures, upstream dependents, downstream dependencies, and connected infrastructure.
          </p>
        </div>

        <button
          onClick={fetchServices}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white transition-colors font-mono self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search service by name, ID (e.g. 'SVC-PAYMENT'), or team..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 text-slate-200 text-xs rounded-lg pl-9 pr-3 py-2 border border-slate-800 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-xs font-mono">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-slate-400 mr-1.5">Health:</span>
            {['ALL', 'HEALTHY', 'DEGRADED', 'CRITICAL'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  statusFilter === st
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-slate-400 mr-1.5">Criticality:</span>
            {['ALL', 'TIER_1', 'TIER_2', 'TIER_3', 'TIER_4'].map((crit) => (
              <button
                key={crit}
                onClick={() => setCriticalityFilter(crit)}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  criticalityFilter === crit
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
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
        <div className="lg:col-span-5 space-y-2.5 max-h-[720px] overflow-y-auto pr-1">
          {loading ? (
            <div className="p-8 text-center font-mono text-xs text-slate-400">Loading services...</div>
          ) : filteredServices.length === 0 ? (
            <div className="p-8 text-center font-mono text-xs text-slate-400">No services found.</div>
          ) : (
            filteredServices.map((svc) => (
              <div
                key={svc.id}
                onClick={() => loadServiceDetail(svc.id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedService?.id === svc.id
                    ? 'bg-slate-850 border-cyan-500 shadow-md shadow-cyan-950/40'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-white">{svc.name}</span>
                  <HealthBadge status={svc.status} />
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-1.5">
                  <span className="text-cyan-400 font-semibold">{svc.id}</span>
                  <span>{svc.criticality}</span>
                  <span>{svc.team}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Service Inspector (7 cols) */}
        <div className="lg:col-span-7">
          {loadingDetail ? (
            <div className="p-12 rounded-xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
              <p className="text-xs font-mono text-slate-400">Loading architecture topology...</p>
            </div>
          ) : selectedService ? (
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                      {selectedService.id}
                    </span>
                    <HealthBadge status={selectedService.status} />
                    <span className="font-mono text-xs text-slate-400">{selectedService.criticality}</span>
                  </div>
                  <h2 className="text-xl font-bold text-white mt-1.5">{selectedService.name}</h2>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">{selectedService.description}</p>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/graph?service=${selectedService.id}`}
                    title="View in Dependency Graph"
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 transition-colors"
                  >
                    <Network className="w-4 h-4" />
                  </Link>
                  <Link
                    to={`/chat?service=${selectedService.id}`}
                    title="Investigate with AI"
                    className="p-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
                  >
                    <BotMessageSquare className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Active Incidents on Service */}
              {selectedService.active_incidents.length > 0 && (
                <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/60 space-y-2">
                  <div className="flex items-center gap-2 text-rose-400 text-xs font-mono font-bold">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Active Incident Affecting This Service</span>
                  </div>
                  {selectedService.active_incidents.map((a) => (
                    <div key={a.id} className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-200">{a.id}: {a.title} ({a.severity})</span>
                      <Link to={`/incidents/${a.id}`} className="text-cyan-400 hover:underline flex items-center gap-1">
                        <span>Investigate</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  ))}
                </div>
              )}

              {/* Connected Infrastructure */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                  <Database className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Connected Infrastructure ({selectedService.connected_infrastructure.length})</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-mono text-xs">
                  {selectedService.connected_infrastructure.map((inf) => (
                    <div key={inf.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-850 flex items-center justify-between">
                      <div>
                        <span className="text-slate-200 font-semibold block">{inf.name}</span>
                        <span className="text-[10px] text-slate-400">{inf.type} • {inf.environment}</span>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${inf.status === 'HEALTHY' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {inf.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Downstream Dependencies */}
              <div className="space-y-3 border-t border-slate-800 pt-4">
                <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                  Downstream Dependencies ({selectedService.name} depends on):
                </h4>
                {selectedService.downstream_dependencies.length === 0 ? (
                  <p className="text-xs text-slate-400 font-mono italic">No downstream service dependencies.</p>
                ) : (
                  <div className="space-y-2 font-mono text-xs">
                    {selectedService.downstream_dependencies.map((d) => (
                      <div key={d.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-850 flex items-center justify-between">
                        <span className="text-slate-200">{d.name} ({d.id})</span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 text-[10px]">{d.criticality}</span>
                          <HealthBadge status={d.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Upstream Dependents */}
              <div className="space-y-3 border-t border-slate-800 pt-4">
                <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                  Upstream Dependents (Services relying on {selectedService.name}):
                </h4>
                {selectedService.upstream_dependencies.length === 0 ? (
                  <p className="text-xs text-slate-400 font-mono italic">No upstream services depend on this service.</p>
                ) : (
                  <div className="space-y-2 font-mono text-xs">
                    {selectedService.upstream_dependencies.map((u) => (
                      <div key={u.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-850 flex items-center justify-between">
                        <span className="text-slate-200">{u.name} ({u.id})</span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 text-[10px]">{u.criticality}</span>
                          <HealthBadge status={u.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-xl bg-slate-900 border border-slate-800 text-center font-mono text-xs text-slate-400">
              Select a service from the list to inspect its dependency architecture.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
