import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Share2,
  RefreshCw,
  SlidersHorizontal,
  Layers,
  Database,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import { GraphResponse, CytoNodeData } from '../types';
import { CytoscapeGraph } from '../components/CytoscapeGraph';

export const GraphPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const incidentParam = searchParams.get('incident');
  const serviceParam = searchParams.get('service');

  const [graphData, setGraphData] = useState<GraphResponse | null>(null);
  const [includeEvidence, setIncludeEvidence] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGraph = () => {
    setLoading(true);
    setError(null);
    api.getGraphData({
      include_evidence: includeEvidence,
      incident_id: incidentParam || undefined,
      service_id: serviceParam || undefined,
    })
      .then((data) => {
        setGraphData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchGraph();
  }, [includeEvidence, incidentParam, serviceParam]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Share2 className="w-5 h-5 text-cyan-400" />
            <span className="text-xs font-mono font-medium text-cyan-400 uppercase tracking-wider">
              FalkorDB Visual Topology
            </span>
          </div>
          <h1 className="text-2xl font-black text-white font-mono">
            Interactive Dependency Graph
          </h1>
          <p className="text-xs text-slate-400">
            Interactive multi-hop visualization of services, infrastructure, incidents, and supporting evidence.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-mono text-slate-300 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 cursor-pointer select-none hover:border-slate-700">
            <input
              type="checkbox"
              checked={includeEvidence}
              onChange={(e) => setIncludeEvidence(e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-0"
            />
            <span>Include Evidence Nodes</span>
          </label>

          <button
            onClick={fetchGraph}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white transition-colors font-mono"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Subgraph Focus Notice if Filtered */}
      {(incidentParam || serviceParam) && (
        <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-800/60 text-xs font-mono text-cyan-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400" />
            <span>
              Focusing on subgraph around {incidentParam ? `Incident ${incidentParam}` : `Service ${serviceParam}`}.
            </span>
          </div>
          <a href="/graph" className="underline hover:text-white">
            Reset to Full Graph
          </a>
        </div>
      )}

      {/* Graph Canvas */}
      {loading ? (
        <div className="h-[640px] rounded-xl border border-slate-800 bg-slate-950 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className="text-xs font-mono text-slate-400">Rendering FalkorDB Cypher nodes & edges...</p>
        </div>
      ) : error ? (
        <div className="p-8 rounded-xl border border-rose-800 bg-rose-950/30 text-rose-300 font-mono text-xs">
          Failed to load graph: {error}
        </div>
      ) : graphData ? (
        <div className="space-y-4">
          <CytoscapeGraph
            nodes={graphData.nodes}
            edges={graphData.edges}
            highlightIncidentId={incidentParam}
            height="640px"
          />

          {/* Quick Metrics Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-4">
              <span>Nodes: <strong className="text-white">{graphData.stats.nodes}</strong></span>
              <span>Edges: <strong className="text-white">{graphData.stats.edges}</strong></span>
            </div>
            <div className="text-[11px] text-slate-400">
              Tip: Click any node to open inspector and isolate connected neighbors. Drag or pinch to zoom.
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
