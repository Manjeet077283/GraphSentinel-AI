import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  AlertOctagon,
  ArrowLeft,
  Server,
  Network,
  Database,
  BotMessageSquare,
  Activity,
  CheckCircle,
  Clock,
  Layers,
  HelpCircle,
  Lightbulb,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { IncidentDetail } from '../types';
import { SeverityBadge } from '../components/SeverityBadge';
import { StatusBadge } from '../components/StatusBadge';
import { HealthBadge } from '../components/HealthBadge';

export const IncidentDetailPage: React.FC = () => {
  const { incidentId } = useParams<{ incidentId: string }>();
  const [incident, setIncident] = useState<IncidentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = () => {
    if (!incidentId) return;
    setLoading(true);
    setError(null);
    api.getIncident(incidentId)
      .then((data) => {
        setIncident(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDetail();
  }, [incidentId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
        <p className="text-xs font-mono text-slate-400">Loading incident investigation graph facts...</p>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="max-w-3xl mx-auto my-12 p-6 rounded-xl border border-rose-800 bg-rose-950/30 text-rose-200">
        <h3 className="text-lg font-bold">Incident Not Found</h3>
        <p className="text-xs font-mono text-rose-300 mt-2 mb-4">{error || 'Unknown incident ID'}</p>
        <Link
          to="/incidents"
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-mono rounded-lg transition-colors inline-block"
        >
          Back to Incidents
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/incidents"
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-cyan-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Incidents</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            to={`/chat?incident=${incident.id}`}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-medium shadow-md shadow-cyan-950/50 transition-all"
          >
            <BotMessageSquare className="w-4 h-4" />
            <span>Investigate in AI Chat</span>
          </Link>
          <Link
            to={`/graph?incident=${incident.id}`}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-medium border border-slate-700 transition-colors"
          >
            <Network className="w-4 h-4 text-cyan-400" />
            <span>View in Graph</span>
          </Link>
        </div>
      </div>

      {/* Incident Header Card */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-sm font-black text-white bg-slate-800 px-3 py-1 rounded border border-slate-700">
            {incident.id}
          </span>
          <SeverityBadge severity={incident.severity} />
          <StatusBadge status={incident.status} />
          <span className="text-xs font-mono text-slate-400 ml-auto flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {new Date(incident.created_at).toLocaleString()}
          </span>
        </div>

        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{incident.title}</h1>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">{incident.description}</p>
        </div>

        {/* Affected Service Summary Strip */}
        {incident.affected_service && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-950 flex items-center justify-center text-cyan-400 border border-cyan-800">
                <Server className="w-4 h-4" />
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase">Affected Root Service</span>
                <div className="text-white font-bold">{incident.affected_service.name} ({incident.affected_service.id})</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <span className="text-slate-400 text-[10px] uppercase block">Criticality</span>
                <span className="text-cyan-300 font-semibold">{incident.affected_service.criticality}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase block">Health</span>
                <HealthBadge status={incident.affected_service.status} />
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase block">Team</span>
                <span className="text-slate-300">{incident.affected_service.team}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Grid: Evidence Telemetry & Impact Cascade */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Supporting Evidence Timeline */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                  Supporting Evidence ({incident.evidence.length})
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                SUPPORTED_BY edges
              </span>
            </div>

            {incident.evidence.length === 0 ? (
              <p className="text-xs text-slate-400 font-mono py-6 text-center">
                No telemetry evidence nodes connected to this incident in the graph.
              </p>
            ) : (
              <div className="space-y-3 font-mono">
                {incident.evidence.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-850 hover:border-slate-700 transition-colors space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800 text-[10px] font-bold">
                        {ev.source_type}
                      </span>
                      <span className="text-[11px] text-slate-400">{ev.id}</span>
                    </div>
                    <p className="text-xs text-slate-200 leading-normal">{ev.description}</p>
                    {ev.metric_name && (
                      <div className="flex items-center gap-2 text-[11px] pt-1 text-slate-400 border-t border-slate-900">
                        <span>Metric:</span>
                        <code className="text-amber-300">{ev.metric_name}</code>
                        {ev.metric_value !== null && ev.metric_value !== undefined && (
                          <span className="text-amber-400 font-bold ml-auto">
                            {ev.metric_value} {ev.unit || ''}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Downstream Impact Analysis (Graph Traversal) */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Network className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                  Downstream Impact Cascade
                </h3>
              </div>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                Graph Traversal (Depth: 3)
              </span>
            </div>

            {incident.impact_analysis ? (
              <div className="space-y-4">
                <p className="text-xs text-slate-300 font-mono leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-850">
                  {incident.impact_analysis.impact_summary}
                </p>

                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {incident.impact_analysis.impacted_services.map((imp) => (
                    <div
                      key={imp.service_id}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-between gap-3 text-xs font-mono"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold">{imp.service_name}</span>
                          <span className="text-slate-400 text-[10px]">({imp.service_id})</span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Path: <code className="text-cyan-300">{imp.dependency_path.join(' ➔ ')}</code>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                            imp.impact_level === 'CONFIRMED_DEGRADATION'
                              ? 'bg-rose-950 text-rose-400 border border-rose-800'
                              : 'bg-amber-950 text-amber-400 border border-amber-800'
                          }`}
                        >
                          {imp.hops} Hop(s) • {imp.impact_level === 'CONFIRMED_DEGRADATION' ? 'DEGRADED' : 'AT RISK'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 font-mono py-6 text-center">
                No dependent services identified along downstream dependency paths.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Diagnostic Hypotheses & Safe Advisory Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Hypotheses */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-2 mb-4">
            <HelpCircle className="w-4 h-4 text-yellow-400" />
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Diagnostic Hypotheses
            </h3>
          </div>
          <ul className="space-y-2.5 text-xs text-slate-300 font-mono">
            {incident.diagnostic_hypotheses.map((h, i) => (
              <li key={i} className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-950 border border-slate-850">
                <span className="text-yellow-400 shrink-0 mt-0.5">🔍</span>
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Recommended Actions */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Safe Advisory Recommendations
            </h3>
          </div>
          <ul className="space-y-2.5 text-xs text-slate-300 font-mono">
            {incident.recommended_actions.map((act, i) => (
              <li key={i} className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-950 border border-slate-850">
                <span className="text-emerald-400 shrink-0 mt-0.5">📋</span>
                <span>{act}</span>
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-slate-400 font-mono mt-3 text-right italic">
            *Advisory only: Requires on-call engineer authorization before applying.
          </p>
        </div>
      </div>

      {/* Historical Incidents & Resolutions */}
      {incident.related_historical_incidents.length > 0 && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Similar Historical Incidents & Past Resolutions
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {incident.related_historical_incidents.map((hist) => (
              <div
                key={hist.incident_id}
                className="p-4 rounded-xl bg-slate-950 border border-slate-850 space-y-2 font-mono text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-white font-bold">{hist.incident_id}: {hist.title}</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px]">
                    {hist.outcome || 'RESOLVED'}
                  </span>
                </div>
                <div className="text-slate-400 text-[11px]">
                  Service: <strong className="text-slate-200">{hist.service_name}</strong>
                </div>
                <p className="text-slate-300 leading-normal text-xs bg-slate-900 p-2.5 rounded border border-slate-800">
                  💡 <strong>Applied Remedy:</strong> {hist.resolution_summary || 'Manual service restart and config adjustment.'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
