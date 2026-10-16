import React, { useEffect, useRef, useState, useMemo } from 'react';
import cytoscape from 'cytoscape';
import type { Core, EventObject } from 'cytoscape';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Search,
  Filter,
  Layers
} from 'lucide-react';
import { CytoNode, CytoEdge, CytoNodeData } from '../types';
import { SeverityBadge } from './SeverityBadge';
import { StatusBadge } from './StatusBadge';

interface CytoscapeGraphProps {
  nodes: CytoNode[];
  edges: CytoEdge[];
  highlightIncidentId?: string | null;
  onNodeSelect?: (nodeData: CytoNodeData | null) => void;
  height?: string;
}

export const CytoscapeGraph: React.FC<CytoscapeGraphProps> = ({
  nodes,
  edges,
  highlightIncidentId,
  onNodeSelect,
  height = '620px'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);

  const [selectedNode, setSelectedNode] = useState<CytoNodeData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [layoutName, setLayoutName] = useState<string>('cose');

  // Filter elements by node type
  const filteredElements = useMemo(() => {
    let visibleNodes = nodes;
    if (filterType !== 'ALL') {
      visibleNodes = nodes.filter((n) => n.data.type === filterType);
    }
    const nodeIds = new Set(visibleNodes.map((n) => n.data.id));
    const visibleEdges = edges.filter(
      (e) => nodeIds.has(e.data.source) && nodeIds.has(e.data.target)
    );
    return [...visibleNodes, ...visibleEdges];
  }, [nodes, edges, filterType]);

  // Initialize or re-render Cytoscape
  useEffect(() => {
    if (!containerRef.current) return;

    // Build Cytoscape instance
    const cy = cytoscape({
      container: containerRef.current,
      elements: filteredElements,
      boxSelectionEnabled: false,
      autounselectify: false,
      style: [
        // Base Node Style
        {
          selector: 'node',
          style: {
            label: 'data(label)',
            color: '#cbd5e1',
            'font-family': 'monospace',
            'font-size': '10px',
            'text-valign': 'bottom',
            'text-margin-y': 6,
            'text-wrap': 'ellipsis',
            'text-max-width': '90px',
            'background-color': '#334155',
            'border-width': 2,
            'border-color': '#475569',
            width: 32,
            height: 32,
            'transition-property': 'background-color, border-color, border-width, opacity',
            'transition-duration': 0.2,
          },
        },
        // Service Nodes
        {
          selector: 'node[type = "Service"]',
          style: {
            shape: 'round-rectangle',
            width: 38,
            height: 38,
            'background-color': '#0e7490',
            'border-color': '#06b6d4',
            'border-width': 2,
          },
        },
        // Degraded Service
        {
          selector: 'node[type = "Service"][status = "DEGRADED"]',
          style: {
            'background-color': '#854d0e',
            'border-color': '#eab308',
          },
        },
        // Critical Service
        {
          selector: 'node[type = "Service"][status = "CRITICAL"]',
          style: {
            'background-color': '#881337',
            'border-color': '#f43f5e',
          },
        },
        // Infrastructure Nodes
        {
          selector: 'node[type = "Infrastructure"]',
          style: {
            shape: 'barrel',
            width: 36,
            height: 36,
            'background-color': '#4338ca',
            'border-color': '#818cf8',
          },
        },
        // Incident Nodes
        {
          selector: 'node[type = "Incident"]',
          style: {
            shape: 'diamond',
            width: 44,
            height: 44,
            'background-color': '#991b1b',
            'border-color': '#f87171',
            'border-width': 3,
          },
        },
        // Evidence Nodes
        {
          selector: 'node[type = "Evidence"]',
          style: {
            shape: 'ellipse',
            width: 22,
            height: 22,
            'background-color': '#78350f',
            'border-color': '#f59e0b',
            'font-size': '8px',
          },
        },
        // Edge Base Style
        {
          selector: 'edge',
          style: {
            width: 1.5,
            'line-color': '#334155',
            'target-arrow-color': '#475569',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'arrow-scale': 0.8,
            opacity: 0.7,
          },
        },
        // Edge types
        {
          selector: 'edge[relationship = "DEPENDS_ON"]',
          style: {
            'line-color': '#0284c7',
            'target-arrow-color': '#0284c7',
            width: 2,
          },
        },
        {
          selector: 'edge[relationship = "CONNECTS_TO"]',
          style: {
            'line-color': '#6366f1',
            'target-arrow-color': '#6366f1',
            'line-style': 'dashed',
          },
        },
        {
          selector: 'edge[relationship = "AFFECTS"]',
          style: {
            'line-color': '#f43f5e',
            'target-arrow-color': '#f43f5e',
            width: 2.5,
          },
        },
        {
          selector: 'edge[relationship = "SUPPORTED_BY"]',
          style: {
            'line-color': '#d97706',
            'target-arrow-color': '#d97706',
            'line-style': 'dotted',
          },
        },
        // Selected Node Highlight
        {
          selector: 'node:selected',
          style: {
            'border-color': '#38bdf8',
            'border-width': 4,
            'background-color': '#0284c7',
            opacity: 1,
          },
        },
        // Search & Path Highlights
        {
          selector: '.highlighted',
          style: {
            'border-color': '#22d3ee',
            'border-width': 4,
            opacity: 1,
          },
        },
        {
          selector: '.faded',
          style: {
            opacity: 0.15,
          },
        },
      ],
      layout: {
        name: layoutName,
        animate: true,
        animationDuration: 500,
        padding: 40,
      } as any,
    });

    cyRef.current = cy;

    // Node selection events
    cy.on('tap', 'node', (evt: EventObject) => {
      const nodeData = evt.target.data() as CytoNodeData;
      setSelectedNode(nodeData);
      if (onNodeSelect) onNodeSelect(nodeData);

      // Highlight 1st degree neighborhood
      cy.elements().removeClass('highlighted faded');
      const neighborhood = evt.target.neighborhood().add(evt.target);
      cy.elements().not(neighborhood).addClass('faded');
      neighborhood.addClass('highlighted');
    });

    // Background tap resets selection
    cy.on('tap', (evt: EventObject) => {
      if (evt.target === cy) {
        setSelectedNode(null);
        if (onNodeSelect) onNodeSelect(null);
        cy.elements().removeClass('highlighted faded');
      }
    });

    // Auto-highlight if incident ID provided
    if (highlightIncidentId) {
      const targetNode = cy.getElementById(highlightIncidentId);
      if (targetNode.length) {
        targetNode.select();
        setSelectedNode(targetNode.data() as CytoNodeData);
        const neighborhood = targetNode.neighborhood().add(targetNode);
        cy.elements().not(neighborhood).addClass('faded');
        neighborhood.addClass('highlighted');
        cy.center(neighborhood);
      }
    }

    return () => {
      cy.destroy();
    };
  }, [filteredElements, layoutName, highlightIncidentId]);

  // Search filter
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    if (!searchQuery.trim()) {
      cy.elements().removeClass('highlighted faded');
      return;
    }

    const q = searchQuery.toLowerCase();
    const matches = cy.nodes().filter((n) => {
      const d = n.data();
      return (
        d.id.toLowerCase().includes(q) ||
        (d.name && d.name.toLowerCase().includes(q)) ||
        (d.label && d.label.toLowerCase().includes(q))
      );
    });

    if (matches.length > 0) {
      cy.elements().addClass('faded');
      matches.removeClass('faded').addClass('highlighted');
      cy.fit(matches, 50);
    } else {
      cy.elements().removeClass('highlighted faded');
    }
  }, [searchQuery]);

  // Controls Handlers
  const handleZoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() * 1.3);
  const handleZoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() * 0.7);
  const handleFit = () => cyRef.current?.fit(undefined, 40);
  const handleReset = () => {
    setSearchQuery('');
    cyRef.current?.elements().removeClass('highlighted faded');
    cyRef.current?.reset();
    cyRef.current?.fit(undefined, 40);
  };

  return (
    <div className="relative border border-slate-800 rounded-xl overflow-hidden bg-slate-950 flex flex-col shadow-2xl">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/90 border-b border-slate-800 backdrop-blur z-10">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search node by ID or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 text-slate-200 text-xs rounded-lg pl-9 pr-3 py-2 border border-slate-800 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>

        {/* Filters and Layout */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-transparent text-slate-300 text-xs focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Nodes ({nodes.length})</option>
              <option value="Service">Services Only</option>
              <option value="Infrastructure">Infrastructure Only</option>
              <option value="Incident">Incidents Only</option>
              <option value="Evidence">Evidence Only</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 text-xs">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={layoutName}
              onChange={(e) => setLayoutName(e.target.value)}
              className="bg-transparent text-slate-300 text-xs focus:outline-none cursor-pointer"
            >
              <option value="cose">Force-Directed (Cose)</option>
              <option value="concentric">Concentric Circles</option>
              <option value="breadthfirst">Breadth-First Tree</option>
              <option value="circle">Circular Ring</option>
            </select>
          </div>

          {/* Canvas Navigation Buttons */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={handleZoomIn}
              title="Zoom In"
              className="p-1 text-slate-400 hover:text-cyan-400 hover:bg-slate-850 rounded transition-colors"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              title="Zoom Out"
              className="p-1 text-slate-400 hover:text-cyan-400 hover:bg-slate-850 rounded transition-colors"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleFit}
              title="Fit to Canvas"
              className="p-1 text-slate-400 hover:text-cyan-400 hover:bg-slate-850 rounded transition-colors"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleReset}
              title="Reset View"
              className="p-1 text-slate-400 hover:text-cyan-400 hover:bg-slate-850 rounded transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Graph Viewport */}
      <div className="relative flex-1" style={{ height }}>
        <div ref={containerRef} className="cytoscape-container" />

        {/* Legend Overlay */}
        <div className="absolute bottom-4 left-4 p-2.5 rounded-lg bg-slate-950/85 border border-slate-800/80 backdrop-blur text-[11px] font-mono flex flex-col gap-1.5 shadow-xl pointer-events-none sm:pointer-events-auto">
          <span className="text-slate-400 font-semibold tracking-wider uppercase text-[10px] mb-0.5">
            Graph Legend
          </span>
          <div className="flex items-center gap-2 text-cyan-400">
            <span className="w-3 h-3 rounded-sm bg-cyan-600 border border-cyan-400 inline-block" />
            <span>Service Node</span>
          </div>
          <div className="flex items-center gap-2 text-indigo-400">
            <span className="w-3 h-3 rounded-sm bg-indigo-600 border border-indigo-400 inline-block" />
            <span>Infrastructure</span>
          </div>
          <div className="flex items-center gap-2 text-rose-400">
            <span className="w-3 h-3 rotate-45 bg-rose-600 border border-rose-400 inline-block scale-75" />
            <span>Incident (AFFECTS)</span>
          </div>
          <div className="flex items-center gap-2 text-amber-400">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600 border border-amber-400 inline-block" />
            <span>Evidence Telemetry</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400 border-t border-slate-800/80 pt-1 mt-1 text-[10px]">
            <span className="w-3 h-0.5 bg-sky-500 inline-block" />
            <span>DEPENDS_ON edge</span>
          </div>
        </div>

        {/* Selected Node Details Drawer */}
        {selectedNode && (
          <div className="absolute top-4 right-4 w-80 max-h-[90%] overflow-y-auto p-4 rounded-xl bg-slate-900/95 border border-slate-700/80 shadow-2xl backdrop-blur flex flex-col gap-3 z-20">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  {selectedNode.type}
                </span>
                <h4 className="text-sm font-bold text-white mt-1.5 font-mono">{selectedNode.id}</h4>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-slate-400 hover:text-white text-xs font-mono px-1.5 py-0.5 rounded hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-300 font-medium">{selectedNode.name}</div>

            <div className="space-y-2 border-t border-slate-800 pt-2 text-xs font-mono">
              {selectedNode.status && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Status:</span>
                  <StatusBadge status={selectedNode.status} size="sm" />
                </div>
              )}
              {selectedNode.severity && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Severity:</span>
                  <SeverityBadge severity={selectedNode.severity} size="sm" />
                </div>
              )}
              {selectedNode.criticality && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Criticality:</span>
                  <span className="text-slate-200">{selectedNode.criticality}</span>
                </div>
              )}
              {selectedNode.team && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Team:</span>
                  <span className="text-slate-200">{selectedNode.team}</span>
                </div>
              )}
              {selectedNode.env && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Environment:</span>
                  <span className="text-slate-200">{selectedNode.env}</span>
                </div>
              )}
              {selectedNode.metric_value !== undefined && selectedNode.metric_value !== null && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Metric Value:</span>
                  <span className="text-amber-400 font-bold">
                    {selectedNode.metric_value} {selectedNode.unit || ''}
                  </span>
                </div>
              )}
            </div>

            <div className="border-t border-slate-800 pt-2 flex flex-col gap-1.5">
              <span className="text-[11px] text-slate-400">Connected Neighbors:</span>
              <p className="text-[11px] text-slate-400">
                Clicking a node highlights its direct dependency path and dims external services.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
