import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  RefreshCw,
  Info,
  Layers,
  ArrowRight,
  Compass,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Activity,
  Filter,
  BarChart2,
  X,
  Database,
  ShieldAlert
} from 'lucide-react';
import { api } from '../services/api';
import { GraphResponse, GraphDiagnosticsResponse } from '../types';
import { CytoscapeGraph, GraphMode } from '../components/CytoscapeGraph';

export const GraphPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const incidentParam = searchParams.get('incident');
  const serviceParam = searchParams.get('service');

  const [graphData, setGraphData] = useState<GraphResponse | null>(null);
  const [includeEvidence, setIncludeEvidence] = useState(false); // Default hide evidence nodes
  const [selectedRelType, setSelectedRelType] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [maxHops, setMaxHops] = useState<number>(2); // 1-3 bounded hops

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Diagnostics modal
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [diagnostics, setDiagnostics] = useState<GraphDiagnosticsResponse | null>(null);
  const [loadingDiagnostics, setLoadingDiagnostics] = useState(false);

  // Exploration Mode: Simple (Default) vs Advanced
  const [mode, setMode] = useState<GraphMode>(incidentParam ? 'advanced' : 'simple');

  // Stats reported from Cytoscape based on active filters
  const [stats, setStats] = useState<{
    visibleNodes: number;
    totalNodes: number;
    visibleEdges: number;
    totalEdges: number;
    mode: GraphMode;
  }>({
    visibleNodes: 16,
    totalNodes: 126,
    visibleEdges: 24,
    totalEdges: 154,
    mode: 'simple',
  });

  const fetchGraph = () => {
    setLoading(true);
    setError(null);
    api.getGraphData({
      include_evidence: includeEvidence,
      incident_id: incidentParam || undefined,
      service_id: serviceParam || undefined,
      relationship_type: selectedRelType !== 'ALL' ? selectedRelType : undefined,
      severity: selectedSeverity !== 'ALL' ? selectedSeverity : undefined,
      max_depth: maxHops,
    })
      .then((data) => {
        setGraphData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load graph data');
        setLoading(false);
      });
  };

  const handleOpenDiagnostics = async () => {
    setShowDiagnostics(true);
    setLoadingDiagnostics(true);
    try {
      const diag = await api.getGraphDiagnostics();
      setDiagnostics(diag);
    } catch (err) {
      console.error('Failed to load graph diagnostics:', err);
    } finally {
      setLoadingDiagnostics(false);
    }
  };

  useEffect(() => {
    fetchGraph();
  }, [includeEvidence, incidentParam, serviceParam, selectedRelType, selectedSeverity, maxHops]);

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              FalkorDB Visual Topology
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Graph Explorer
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Explore microservices, dependency calls, host infrastructure, active incidents, and telemetry evidence.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleOpenDiagnostics}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <BarChart2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>Graph Diagnostics</span>
          </button>

          <button
            onClick={fetchGraph}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
            <span>Refresh FalkorDB</span>
          </button>
        </div>
      </div>

      {/* Subgraph Focus Notice if Filtered by Query Param */}
      {(incidentParam || serviceParam) && (
        <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200 text-xs text-indigo-950 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2.5">
            <Info className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              Focusing on subgraph neighborhood for{' '}
              <strong>{incidentParam ? `Incident ${incidentParam}` : `Service ${serviceParam}`}</strong>.
            </span>
          </div>
          <Link to="/graph" className="font-bold underline hover:text-indigo-800">
            Reset to Full Graph
          </Link>
        </div>
      )}

      {/* Filter Toolbar (Hop Expansion, Relationship Type, Severity, Evidence Toggle) */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs text-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Max Hops Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
            <span className="font-semibold text-slate-700 text-[11px]">Expansion Depth:</span>
            <select
              value={maxHops}
              onChange={(e) => setMaxHops(Number(e.target.value))}
              className="bg-transparent border-none text-indigo-700 font-bold focus:outline-hidden cursor-pointer"
            >
              <option value={1}>1 Hop (Direct Neighbours)</option>
              <option value={2}>2 Hops (Dependencies)</option>
              <option value={3}>3 Hops (Cascades)</option>
            </select>
          </div>

          {/* Relationship Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
            <Filter className="w-3 h-3 text-slate-500" />
            <span className="font-semibold text-slate-700 text-[11px]">Relationship:</span>
            <select
              value={selectedRelType}
              onChange={(e) => setSelectedRelType(e.target.value)}
              className="bg-transparent border-none text-slate-800 font-medium focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">All Relationships</option>
              <option value="DEPENDS_ON">DEPENDS_ON</option>
              <option value="CONNECTS_TO">CONNECTS_TO</option>
              <option value="AFFECTS">AFFECTS</option>
              <option value="SUPPORTED_BY">SUPPORTED_BY</option>
              <option value="RESOLVED_BY">RESOLVED_BY</option>
              <option value="DERIVED_FROM">DERIVED_FROM</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
            <span className="font-semibold text-slate-700 text-[11px]">Severity:</span>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="bg-transparent border-none text-slate-800 font-medium focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">P1 / CRITICAL</option>
              <option value="HIGH">P2 / HIGH</option>
              <option value="MEDIUM">P3 / MEDIUM</option>
              <option value="LOW">P4 / LOW</option>
            </select>
          </div>

          {/* Include Evidence Checkbox (Hidden by default) */}
          <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer select-none px-2 py-1.5 rounded-lg hover:bg-slate-50">
            <input
              type="checkbox"
              checked={includeEvidence}
              onChange={(e) => setIncludeEvidence(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-[11px] font-medium">Show Telemetry Evidence Nodes</span>
          </label>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          {mode === 'simple' ? (
            <button
              onClick={() => setMode('advanced')}
              className="flex items-center gap-1 text-indigo-600 font-bold hover:underline"
            >
              <span>Switch to Advanced View</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={() => setMode('simple')}
              className="text-slate-600 hover:text-slate-900 font-semibold underline"
            >
              Switch to Simple View
            </button>
          )}
        </div>
      </div>

      {/* Progressive Disclosure Summary Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-2 bg-slate-100 rounded-xl text-xs text-slate-600">
        <div className="flex items-center gap-3">
          <span>
            Visible: <strong className="text-slate-900">{stats.visibleNodes}</strong> / {stats.totalNodes} nodes
          </span>
          <span>•</span>
          <span>
            Active Edges: <strong className="text-slate-900">{stats.visibleEdges}</strong> / {stats.totalEdges}
          </span>
        </div>

        <span className="text-[11px] text-slate-500 italic">
          Labels bounded and deduplicated to prevent overlap
        </span>
      </div>

      {/* Graph Canvas */}
      {loading ? (
        <div className="h-[640px] rounded-2xl border border-slate-200 bg-white flex flex-col items-center justify-center gap-3 shadow-sm">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-xs font-semibold text-slate-600">Querying live topology from FalkorDB...</p>
        </div>
      ) : error ? (
        <div className="p-8 rounded-2xl border border-rose-200 bg-white text-rose-700 text-sm">
          Failed to load graph: {error}
        </div>
      ) : graphData ? (
        <div className="space-y-4">
          <CytoscapeGraph
            nodes={graphData.nodes}
            edges={graphData.edges}
            highlightIncidentId={incidentParam}
            highlightServiceId={serviceParam}
            initialMode={mode}
            onModeChange={setMode}
            onStatsChange={setStats}
            height="640px"
          />

          {/* Bottom Guidance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs mb-1">
                <Compass className="w-4 h-4 text-indigo-600" />
                <span>Bounded Hop Traversal</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Graph expansion is strictly constrained between 1 to 3 hops from the focal incident to avoid runaway unbounded traversals.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs mb-1">
                <Layers className="w-4 h-4 text-purple-600" />
                <span>Evidence Clustering</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Telemetry nodes remain hidden by default to keep the canvas clear, and expand cleanly only when requested by SREs.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs mb-1">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Provenance-Aware Lineage</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                User-imported datasets generate DataSource nodes with DERIVED_FROM edges, visually separating custom files from demo baselines.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Graph Diagnostics Modal */}
      {showDiagnostics && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  FalkorDB Graph Diagnostics & Schema Distribution
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDiagnostics(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingDiagnostics ? (
              <div className="py-12 text-center text-xs text-slate-400">
                <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin mx-auto mb-2" />
                Reading graph schema statistics...
              </div>
            ) : diagnostics ? (
              <div className="space-y-4 text-xs">
                {/* Summary Metrics */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                    <span className="text-[10px] text-indigo-600 uppercase font-bold block">Total Nodes</span>
                    <span className="text-xl font-bold text-indigo-950">{diagnostics.total_nodes}</span>
                  </div>
                  <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                    <span className="text-[10px] text-blue-600 uppercase font-bold block">Total Edges</span>
                    <span className="text-xl font-bold text-blue-950">{diagnostics.total_edges}</span>
                  </div>
                  <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                    <span className="text-[10px] text-emerald-600 uppercase font-bold block">Graph Health</span>
                    <span className="text-xl font-bold text-emerald-950">
                      {diagnostics.is_healthy ? 'Nominal' : 'Degraded'}
                    </span>
                  </div>
                </div>

                {/* Node Label Breakdown */}
                <div>
                  <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-indigo-600" />
                    Node Labels Distribution
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Object.entries(diagnostics.labels).map(([label, count]) => (
                      <div key={label} className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex justify-between">
                        <span className="font-medium text-slate-700">{label}:</span>
                        <span className="font-bold text-indigo-600">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Relationship Types Breakdown */}
                <div>
                  <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    Relationship Types Distribution
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Object.entries(diagnostics.relationship_types).map(([rel, count]) => (
                      <div key={rel} className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex justify-between">
                        <span className="font-medium text-slate-700 font-mono text-[11px]">{rel}:</span>
                        <span className="font-bold text-blue-600">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Data Source Provenance Breakdown */}
                <div>
                  <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    Data Source Provenance
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(diagnostics.data_sources).map(([src, count]) => (
                      <div key={src} className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex justify-between">
                        <span className="font-medium text-slate-700 capitalize">{src}:</span>
                        <span className="font-bold text-amber-700">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-500">
                Unable to retrieve diagnostics.
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDiagnostics(false)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                Close Diagnostics
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
