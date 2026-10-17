import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import cytoscape from 'cytoscape';
import type { Core, EventObject } from 'cytoscape';
import { Link } from 'react-router-dom';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Search,
  Filter,
  Layers,
  Info,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShieldAlert,
  Server,
  Activity,
  FileText,
  Sparkles,
  ArrowRight,
  ArrowDownRight,
  ArrowUpRight,
  X,
  Target,
  Eye,
  EyeOff,
  Check,
  Compass
} from 'lucide-react';
import { CytoNode, CytoEdge, CytoNodeData } from '../types';
import { SeverityBadge } from './SeverityBadge';
import { StatusBadge } from './StatusBadge';

export type GraphMode = 'simple' | 'advanced';

interface CytoscapeGraphProps {
  nodes: CytoNode[];
  edges: CytoEdge[];
  highlightIncidentId?: string | null;
  highlightServiceId?: string | null;
  onNodeSelect?: (nodeData: CytoNodeData | null) => void;
  height?: string;
  initialMode?: GraphMode;
  onModeChange?: (mode: GraphMode) => void;
  onStatsChange?: (stats: {
    visibleNodes: number;
    totalNodes: number;
    visibleEdges: number;
    totalEdges: number;
    mode: GraphMode;
  }) => void;
}

export const CytoscapeGraph: React.FC<CytoscapeGraphProps> = ({
  nodes,
  edges,
  highlightIncidentId,
  highlightServiceId,
  onNodeSelect,
  height = '640px',
  initialMode = 'simple',
  onModeChange,
  onStatsChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);

  // Modes: simple (Service Map) vs advanced (Full Topology)
  const [mode, setMode] = useState<GraphMode>(initialMode);

  // Selection & Focus
  const [selectedNode, setSelectedNode] = useState<CytoNodeData | null>(null);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const [selectedServiceFocus, setSelectedServiceFocus] = useState<string>('ALL');

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Advanced Filters
  const [presetFilter, setPresetFilter] = useState<'ALL' | 'SERVICES' | 'INCIDENTS' | 'EVIDENCE' | 'INFRA'>('ALL');
  const [activeCategories, setActiveCategories] = useState<{
    services: boolean;
    infrastructure: boolean;
    incidents: boolean;
    evidence: boolean;
  }>({
    services: true,
    infrastructure: true,
    incidents: true,
    evidence: false, // Default bounded evidence to prevent clutter
  });

  // Layout selection
  const [layoutName, setLayoutName] = useState<string>('breadthfirst');

  // Legend visibility
  const [isLegendExpanded, setIsLegendExpanded] = useState<boolean>(true);

  // Sync mode changes to parent if requested
  const handleModeSwitch = (newMode: GraphMode) => {
    setMode(newMode);
    setFocusedNodeId(null);
    if (newMode === 'simple') {
      setLayoutName('breadthfirst');
    } else {
      setLayoutName('cose');
    }
    if (onModeChange) onModeChange(newMode);
  };

  // Node Map for O(1) lookups
  const nodesMap = useMemo(() => {
    const map = new Map<string, CytoNodeData>();
    nodes.forEach((n) => map.set(n.data.id, n.data));
    return map;
  }, [nodes]);

  // Compute available services for Simple View service-focus dropdown
  const serviceOptions = useMemo(() => {
    return nodes
      .filter((n) => n.data.type === 'Service')
      .map((n) => ({ id: n.data.id, name: n.data.name, status: n.data.status }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [nodes]);

  // Compute 1st degree neighborhood for a node from full edge dataset
  const getNodeNeighbors = useCallback(
    (nodeId: string) => {
      const upstream: CytoNodeData[] = [];
      const downstream: CytoNodeData[] = [];
      const connectedIncidents: CytoNodeData[] = [];
      const connectedEvidence: CytoNodeData[] = [];
      const connectedInfra: CytoNodeData[] = [];

      edges.forEach((e) => {
        // Outgoing: nodeId -> target
        if (e.data.source === nodeId) {
          const tgt = nodesMap.get(e.data.target);
          if (tgt) {
            if (e.data.relationship === 'DEPENDS_ON') downstream.push(tgt);
            else if (e.data.relationship === 'CONNECTS_TO') connectedInfra.push(tgt);
            else if (e.data.relationship === 'AFFECTS') downstream.push(tgt);
            else if (e.data.relationship === 'SUPPORTED_BY') connectedEvidence.push(tgt);
          }
        }
        // Incoming: source -> nodeId
        if (e.data.target === nodeId) {
          const src = nodesMap.get(e.data.source);
          if (src) {
            if (e.data.relationship === 'DEPENDS_ON') upstream.push(src);
            else if (e.data.relationship === 'CONNECTS_TO') upstream.push(src);
            else if (e.data.relationship === 'AFFECTS') connectedIncidents.push(src);
            else if (e.data.relationship === 'SUPPORTED_BY') connectedIncidents.push(src);
          }
        }
      });

      return { upstream, downstream, connectedIncidents, connectedEvidence, connectedInfra };
    },
    [edges, nodesMap]
  );

  // Compute elements to render in Cytoscape
  const filteredElements = useMemo(() => {
    let visibleNodes: CytoNode[] = [];
    let visibleEdges: CytoEdge[] = [];

    // 1. SIMPLE VIEW: Service-focused dependency map
    if (mode === 'simple') {
      const allServices = nodes.filter((n) => n.data.type === 'Service');

      // If a specific service is focused in simple view
      if (selectedServiceFocus !== 'ALL') {
        const targetService = nodesMap.get(selectedServiceFocus);
        if (targetService) {
          const neighborIds = new Set<string>([selectedServiceFocus]);
          edges.forEach((e) => {
            if (e.data.relationship === 'DEPENDS_ON') {
              if (e.data.source === selectedServiceFocus) neighborIds.add(e.data.target);
              if (e.data.target === selectedServiceFocus) neighborIds.add(e.data.source);
            }
          });
          visibleNodes = allServices.filter((s) => neighborIds.has(s.data.id));
        } else {
          visibleNodes = allServices;
        }
      } else {
        visibleNodes = allServices;
      }

      const visibleIds = new Set(visibleNodes.map((n) => n.data.id));
      visibleEdges = edges.filter(
        (e) =>
          e.data.relationship === 'DEPENDS_ON' &&
          visibleIds.has(e.data.source) &&
          visibleIds.has(e.data.target)
      );
    }
    // 2. ADVANCED VIEW: Multi-category + contextual filtering (NO DISCONNECTED GRIDS)
    else {
      // If user has focused on a single node neighborhood
      if (focusedNodeId) {
        const focusIds = new Set<string>([focusedNodeId]);
        edges.forEach((e) => {
          if (e.data.source === focusedNodeId) focusIds.add(e.data.target);
          if (e.data.target === focusedNodeId) focusIds.add(e.data.source);
        });

        visibleNodes = nodes.filter((n) => focusIds.has(n.data.id));
        visibleEdges = edges.filter(
          (e) => focusIds.has(e.data.source) && focusIds.has(e.data.target)
        );
      }
      // Preset filters with meaningful contextual relationships
      else if (presetFilter === 'SERVICES') {
        // Services only + DEPENDS_ON relationships
        visibleNodes = nodes.filter((n) => n.data.type === 'Service');
        const sIds = new Set(visibleNodes.map((n) => n.data.id));
        visibleEdges = edges.filter(
          (e) =>
            e.data.relationship === 'DEPENDS_ON' &&
            sIds.has(e.data.source) &&
            sIds.has(e.data.target)
        );
      } else if (presetFilter === 'INCIDENTS') {
        // Incidents + Affected Services + AFFECTS edges (NO disconnected grids!)
        const incidents = nodes.filter((n) => n.data.type === 'Incident');
        const incIds = new Set(incidents.map((n) => n.data.id));
        const affectedServiceIds = new Set<string>();

        edges.forEach((e) => {
          if (e.data.relationship === 'AFFECTS' && incIds.has(e.data.source)) {
            affectedServiceIds.add(e.data.target);
          }
        });

        const affectedServices = nodes.filter(
          (n) => n.data.type === 'Service' && affectedServiceIds.has(n.data.id)
        );

        visibleNodes = [...incidents, ...affectedServices];
        const combinedIds = new Set(visibleNodes.map((n) => n.data.id));
        visibleEdges = edges.filter(
          (e) =>
            e.data.relationship === 'AFFECTS' &&
            combinedIds.has(e.data.source) &&
            combinedIds.has(e.data.target)
        );
      } else if (presetFilter === 'EVIDENCE') {
        // Evidence + Parent Incidents + Affected Services + SUPPORTED_BY & AFFECTS edges
        const evidenceNodes = nodes.filter((n) => n.data.type === 'Evidence');
        const evIds = new Set(evidenceNodes.map((n) => n.data.id));
        const parentIncidentIds = new Set<string>();

        edges.forEach((e) => {
          if (e.data.relationship === 'SUPPORTED_BY' && evIds.has(e.data.target)) {
            parentIncidentIds.add(e.data.source);
          }
        });

        const parentIncidents = nodes.filter(
          (n) => n.data.type === 'Incident' && parentIncidentIds.has(n.data.id)
        );

        visibleNodes = [...evidenceNodes, ...parentIncidents];
        const combinedIds = new Set(visibleNodes.map((n) => n.data.id));
        visibleEdges = edges.filter(
          (e) =>
            e.data.relationship === 'SUPPORTED_BY' &&
            combinedIds.has(e.data.source) &&
            combinedIds.has(e.data.target)
        );
      } else if (presetFilter === 'INFRA') {
        // Infrastructure + Connected Services + CONNECTS_TO edges
        const infraNodes = nodes.filter((n) => n.data.type === 'Infrastructure');
        const infraIds = new Set(infraNodes.map((n) => n.data.id));
        const connectedServiceIds = new Set<string>();

        edges.forEach((e) => {
          if (e.data.relationship === 'CONNECTS_TO' && infraIds.has(e.data.target)) {
            connectedServiceIds.add(e.data.source);
          }
        });

        const connectedServices = nodes.filter(
          (n) => n.data.type === 'Service' && connectedServiceIds.has(n.data.id)
        );

        visibleNodes = [...infraNodes, ...connectedServices];
        const combinedIds = new Set(visibleNodes.map((n) => n.data.id));
        visibleEdges = edges.filter(
          (e) =>
            e.data.relationship === 'CONNECTS_TO' &&
            combinedIds.has(e.data.source) &&
            combinedIds.has(e.data.target)
        );
      } else {
        // Multi-category customized selection
        visibleNodes = nodes.filter((n) => {
          if (n.data.type === 'Service' && activeCategories.services) return true;
          if (n.data.type === 'Infrastructure' && activeCategories.infrastructure) return true;
          if (n.data.type === 'Incident' && activeCategories.incidents) return true;
          if (n.data.type === 'Evidence' && activeCategories.evidence) return true;
          return false;
        });

        const visibleIds = new Set(visibleNodes.map((n) => n.data.id));
        visibleEdges = edges.filter(
          (e) => visibleIds.has(e.data.source) && visibleIds.has(e.data.target)
        );
      }
    }

    return [...visibleNodes, ...visibleEdges];
  }, [
    mode,
    nodes,
    edges,
    nodesMap,
    selectedServiceFocus,
    focusedNodeId,
    presetFilter,
    activeCategories,
  ]);

  // Notify parent of visible vs total counts
  useEffect(() => {
    if (onStatsChange) {
      const visibleNodesCount = filteredElements.filter((el) => !('source' in el.data)).length;
      const visibleEdgesCount = filteredElements.filter((el) => 'source' in el.data).length;
      onStatsChange({
        visibleNodes: visibleNodesCount,
        totalNodes: nodes.length,
        visibleEdges: visibleEdgesCount,
        totalEdges: edges.length,
        mode,
      });
    }
  }, [filteredElements, nodes.length, edges.length, mode, onStatsChange]);

  // Search Results filtering
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return nodes
      .filter((n) => {
        const d = n.data;
        return (
          d.id.toLowerCase().includes(q) ||
          d.name.toLowerCase().includes(q) ||
          (d.label && d.label.toLowerCase().includes(q)) ||
          (d.description && d.description.toLowerCase().includes(q)) ||
          (d.team && d.team.toLowerCase().includes(q)) ||
          (d.env && d.env.toLowerCase().includes(q)) ||
          (d.source_type && d.source_type.toLowerCase().includes(q))
        );
      })
      .slice(0, 10);
  }, [searchQuery, nodes]);

  // Cytoscape initialization and lifecycle
  useEffect(() => {
    if (!containerRef.current) return;

    // Pick appropriate layout config
    let layoutConfig: any;
    if (layoutName === 'breadthfirst') {
      layoutConfig = {
        name: 'breadthfirst',
        directed: true,
        padding: 40,
        spacingFactor: 1.5,
        animate: false,
        nodeDimensionsIncludeLabels: true,
        fit: true,
      };
    } else if (layoutName === 'cose') {
      layoutConfig = {
        name: 'cose',
        animate: false,
        padding: 40,
        nodeRepulsion: () => 12000,
        nodeOverlap: 25,
        idealEdgeLength: () => 90,
        edgeElasticity: () => 100,
        gravity: 60,
        numIter: 1000,
        fit: true,
      };
    } else if (layoutName === 'concentric') {
      layoutConfig = {
        name: 'concentric',
        animate: false,
        padding: 40,
        fit: true,
        minNodeSpacing: 60,
        concentric: (node: any) => {
          const type = node.data('type');
          if (type === 'Incident') return 4;
          if (type === 'Service') return 3;
          if (type === 'Infrastructure') return 2;
          return 1;
        },
        levelWidth: () => 1,
      };
    } else {
      layoutConfig = {
        name: 'circle',
        animate: false,
        padding: 40,
        fit: true,
      };
    }

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
            color: '#0f172a',
            'font-family': 'Inter, system-ui, -apple-system, sans-serif',
            'font-size': '11px',
            'font-weight': 600,
            'text-valign': 'bottom',
            'text-margin-y': 7,
            'text-wrap': 'ellipsis',
            'text-max-width': '105px',
            'background-color': '#e2e8f0',
            'border-width': 2,
            'border-color': '#94a3b8',
            width: 36,
            height: 36,
            'transition-property': 'background-color, border-color, border-width, opacity',
            'transition-duration': 0.18,
          },
        },
        // Service Nodes - Healthy Default
        {
          selector: 'node[type = "Service"]',
          style: {
            shape: 'round-rectangle',
            width: 42,
            height: 42,
            'background-color': '#4f46e5',
            'border-color': '#3730a3',
            'border-width': 2.5,
          },
        },
        // Degraded Service
        {
          selector: 'node[type = "Service"][status = "DEGRADED"]',
          style: {
            'background-color': '#f59e0b',
            'border-color': '#d97706',
            'border-width': 3,
          },
        },
        // Critical Service
        {
          selector: 'node[type = "Service"][status = "CRITICAL"]',
          style: {
            'background-color': '#ef4444',
            'border-color': '#b91c1c',
            'border-width': 3.5,
          },
        },
        // Infrastructure Nodes
        {
          selector: 'node[type = "Infrastructure"]',
          style: {
            shape: 'barrel',
            width: 38,
            height: 38,
            'background-color': '#8b5cf6',
            'border-color': '#6d28d9',
            'border-width': 2,
          },
        },
        // Incident Nodes
        {
          selector: 'node[type = "Incident"]',
          style: {
            shape: 'diamond',
            width: 46,
            height: 46,
            'background-color': '#dc2626',
            'border-color': '#991b1b',
            'border-width': 3,
          },
        },
        // Evidence Nodes
        {
          selector: 'node[type = "Evidence"]',
          style: {
            shape: 'ellipse',
            width: 24,
            height: 24,
            'background-color': '#0284c7',
            'border-color': '#0369a1',
            'border-width': 1.5,
            'font-size': '9px',
          },
        },
        // Base Edge Style
        {
          selector: 'edge',
          style: {
            width: 1.8,
            'line-color': '#94a3b8',
            'target-arrow-color': '#64748b',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'arrow-scale': 0.9,
            opacity: 0.85,
          },
        },
        // DEPENDS_ON (Service Calls)
        {
          selector: 'edge[relationship = "DEPENDS_ON"]',
          style: {
            'line-color': '#2563eb',
            'target-arrow-color': '#1d4ed8',
            width: 2.2,
          },
        },
        // CONNECTS_TO (Infrastructure)
        {
          selector: 'edge[relationship = "CONNECTS_TO"]',
          style: {
            'line-color': '#8b5cf6',
            'target-arrow-color': '#7c3aed',
            'line-style': 'dashed',
            width: 1.8,
          },
        },
        // AFFECTS (Incident Impact)
        {
          selector: 'edge[relationship = "AFFECTS"]',
          style: {
            'line-color': '#ef4444',
            'target-arrow-color': '#dc2626',
            width: 2.8,
            'z-index': 10,
          },
        },
        // SUPPORTED_BY (Telemetry Evidence)
        {
          selector: 'edge[relationship = "SUPPORTED_BY"]',
          style: {
            'line-color': '#f59e0b',
            'target-arrow-color': '#d97706',
            'line-style': 'dotted',
            width: 1.8,
          },
        },
        // Active Selected Node
        {
          selector: 'node:selected',
          style: {
            'border-color': '#0f172a',
            'border-width': 4,
            opacity: 1,
          },
        },
        // Neighborhood Highlight & Dimming
        {
          selector: '.highlighted',
          style: {
            'border-color': '#4f46e5',
            'border-width': 4,
            opacity: 1,
            'z-index': 99,
          },
        },
        {
          selector: '.faded',
          style: {
            opacity: 0.15,
          },
        },
      ],
      layout: layoutConfig,
      minZoom: 0.2,
      maxZoom: 2.0,
      wheelSensitivity: 0.15,
    });

    cyRef.current = cy;

    // Node click handler
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

    // Background click resets selection
    cy.on('tap', (evt: EventObject) => {
      if (evt.target === cy) {
        setSelectedNode(null);
        if (onNodeSelect) onNodeSelect(null);
        cy.elements().removeClass('highlighted faded');
      }
    });

    // Subgraph auto-focus on load if incident or service specified
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
    } else if (highlightServiceId) {
      const targetNode = cy.getElementById(highlightServiceId);
      if (targetNode.length) {
        targetNode.select();
        setSelectedNode(targetNode.data() as CytoNodeData);
        const neighborhood = targetNode.neighborhood().add(targetNode);
        cy.elements().not(neighborhood).addClass('faded');
        neighborhood.addClass('highlighted');
        cy.center(neighborhood);
      }
    }

    cy.ready(() => {
      cy.resize();
      if (!highlightIncidentId && !highlightServiceId) {
        cy.fit(undefined, 40);
      }
    });

    return () => {
      if (cy && !cy.destroyed()) {
        try {
          cy.stop();
          cy.destroy();
        } catch {
          // ignore
        }
      }
      cyRef.current = null;
    };
  }, [filteredElements, layoutName, highlightIncidentId, highlightServiceId, onNodeSelect]);

  // Center & focus on a chosen node ID
  const focusOnNode = useCallback(
    (nodeId: string) => {
      const cy = cyRef.current;
      const target = nodesMap.get(nodeId);
      if (target) {
        setSelectedNode(target);
        if (onNodeSelect) onNodeSelect(target);
      }

      if (cy) {
        const cyNode = cy.getElementById(nodeId);
        if (cyNode.length) {
          cy.elements().removeClass('highlighted faded');
          const neighborhood = cyNode.neighborhood().add(cyNode);
          cy.elements().not(neighborhood).addClass('faded');
          neighborhood.addClass('highlighted');
          cy.fit(neighborhood, 50);
        }
      }
    },
    [nodesMap, onNodeSelect]
  );

  // Search result click handler
  const handleSelectSearchResult = (node: CytoNode) => {
    setSearchQuery('');
    setIsSearchOpen(false);
    focusOnNode(node.data.id);
  };

  // Canvas Control Handlers
  const handleZoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() * 1.3);
  const handleZoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() * 0.7);
  const handleFit = () => cyRef.current?.fit(undefined, 40);
  const handleReset = () => {
    setSearchQuery('');
    setSelectedServiceFocus('ALL');
    setFocusedNodeId(null);
    setSelectedNode(null);
    if (onNodeSelect) onNodeSelect(null);
    cyRef.current?.elements().removeClass('highlighted faded');
    cyRef.current?.fit(undefined, 40);
  };

  // Selected Node Neighbors
  const selectedNodeNeighbors = useMemo(() => {
    if (!selectedNode) return null;
    return getNodeNeighbors(selectedNode.id);
  }, [selectedNode, getNodeNeighbors]);

  // Quick Preset Handlers
  const handleApplyPreset = (preset: 'ALL' | 'SERVICES' | 'INCIDENTS' | 'EVIDENCE' | 'INFRA') => {
    setPresetFilter(preset);
    setFocusedNodeId(null);
    if (preset === 'SERVICES') {
      setLayoutName('breadthfirst');
    } else {
      setLayoutName('cose');
    }
  };

  return (
    <div className="relative border border-slate-200 rounded-2xl overflow-hidden bg-white flex flex-col shadow-sm">
      {/* 1. Mode Header Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-white border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Exploration Mode:</span>
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100">
            <button
              onClick={() => handleModeSwitch('simple')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                mode === 'simple'
                  ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mode A — Simple View (Default)
            </button>
            <button
              onClick={() => handleModeSwitch('advanced')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                mode === 'advanced'
                  ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mode B — Advanced View
            </button>
          </div>
        </div>

        {/* Mode Explainer Pill */}
        <div className="text-xs text-slate-500 flex items-center gap-1.5">
          {mode === 'simple' ? (
            <span className="flex items-center gap-1 text-slate-600">
              <Compass className="w-3.5 h-3.5 text-indigo-600" />
              <span>Service dependency overview • Clean, uncluttered hierarchy</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-slate-600">
              <Layers className="w-3.5 h-3.5 text-purple-600" />
              <span>Technical SRE View • Multi-category filters, infrastructure & telemetry</span>
            </span>
          )}
        </div>
      </div>

      {/* 2. Interactive Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-50/80 border-b border-slate-200 z-10 text-xs">
        {/* Left: Search with Autocomplete Dropdown */}
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search service, incident, host, evidence..."
            value={searchQuery}
            onFocus={() => setIsSearchOpen(true)}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            className="w-full bg-white text-slate-800 text-xs rounded-lg pl-9 pr-8 py-2 border border-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400 font-sans shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Autocomplete Results Dropdown */}
          {isSearchOpen && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50 max-h-72 overflow-y-auto">
              <div className="p-2 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400 bg-slate-50 flex items-center justify-between">
                <span>Matching Graph Entities ({searchResults.length})</span>
                <button
                  onClick={() => setIsSearchOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              </div>
              <div className="divide-y divide-slate-100">
                {searchResults.map((n) => (
                  <button
                    key={n.data.id}
                    onClick={() => handleSelectSearchResult(n)}
                    className="w-full text-left p-2.5 hover:bg-indigo-50/50 flex items-center justify-between gap-2 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 truncate text-xs">{n.data.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono truncate">{n.data.id}</div>
                    </div>
                    <div className="shrink-0 flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          n.data.type === 'Service'
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : n.data.type === 'Incident'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : n.data.type === 'Infrastructure'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-sky-50 text-sky-700 border border-sky-200'
                        }`}
                      >
                        {n.data.type}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Center: Controls specific to Mode */}
        {mode === 'simple' ? (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-500 font-medium">Focus Service:</span>
            <select
              value={selectedServiceFocus}
              onChange={(e) => setSelectedServiceFocus(e.target.value)}
              className="bg-white text-slate-800 text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 font-medium focus:outline-none focus:border-indigo-500 shadow-2xs"
            >
              <option value="ALL">All Core Services ({serviceOptions.length})</option>
              {serviceOptions.map((svc) => (
                <option key={svc.id} value={svc.id}>
                  {svc.name} ({svc.status})
                </option>
              ))}
            </select>

            <button
              onClick={() => handleModeSwitch('advanced')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold hover:bg-indigo-100 transition-colors shadow-2xs"
            >
              <span>Expand Connections</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-wrap">
            {/* Contextual Presets (No Disconnected Grids) */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
              <button
                onClick={() => handleApplyPreset('ALL')}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  presetFilter === 'ALL'
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                All Components
              </button>
              <button
                onClick={() => handleApplyPreset('SERVICES')}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  presetFilter === 'SERVICES'
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Services Only
              </button>
              <button
                onClick={() => handleApplyPreset('INCIDENTS')}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  presetFilter === 'INCIDENTS'
                    ? 'bg-rose-600 text-white font-bold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Incidents & Impact
              </button>
              <button
                onClick={() => handleApplyPreset('EVIDENCE')}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  presetFilter === 'EVIDENCE'
                    ? 'bg-amber-600 text-white font-bold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Evidence Telemetry
              </button>
              <button
                onClick={() => handleApplyPreset('INFRA')}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  presetFilter === 'INFRA'
                    ? 'bg-purple-600 text-white font-bold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Infrastructure
              </button>
            </div>

            {/* Layout Switcher */}
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs shadow-2xs">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={layoutName}
                onChange={(e) => setLayoutName(e.target.value)}
                className="bg-transparent text-slate-700 text-xs focus:outline-none cursor-pointer font-medium"
              >
                <option value="breadthfirst">Hierarchical Flow</option>
                <option value="cose">Force-Directed</option>
                <option value="concentric">Concentric Rings</option>
                <option value="circle">Circular</option>
              </select>
            </div>
          </div>
        )}

        {/* Right: Zoom & Reset Canvas Buttons */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs shrink-0">
          <button
            onClick={handleZoomIn}
            title="Zoom In (+)"
            className="p-1 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            title="Zoom Out (-)"
            className="p-1 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleFit}
            title="Fit to Canvas"
            className="p-1 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleReset}
            title="Reset View"
            className="p-1 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. Contextual Relationship Banner (Requirement: Never hide relationships silently) */}
      <div className="px-4 py-2 bg-slate-100/90 border-b border-slate-200 text-xs text-slate-700 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          {mode === 'simple' ? (
            <span>
              <strong>Mode A (Simple View):</strong> Displaying{' '}
              <strong className="text-slate-900 font-bold">
                {filteredElements.filter((el) => !('source' in el.data)).length}
              </strong>{' '}
              core microservices connected by{' '}
              <strong className="text-slate-900 font-bold">
                {filteredElements.filter((el) => 'source' in el.data).length}
              </strong>{' '}
              active dependency calls.
            </span>
          ) : presetFilter === 'INCIDENTS' ? (
            <span>
              <strong>Contextual Incident View:</strong> Showing active incident nodes connected to their directly affected
              services via real <code className="text-red-700 font-bold">AFFECTS</code> relationships.
            </span>
          ) : presetFilter === 'EVIDENCE' ? (
            <span>
              <strong>Contextual Telemetry View:</strong> Showing evidence metrics clustered around parent incidents via real{' '}
              <code className="text-amber-700 font-bold">SUPPORTED_BY</code> relationships.
            </span>
          ) : presetFilter === 'INFRA' ? (
            <span>
              <strong>Infrastructure Architecture View:</strong> Showing database hosts and compute clusters connected to
              microservices via real <code className="text-purple-700 font-bold">CONNECTS_TO</code> relationships.
            </span>
          ) : presetFilter === 'SERVICES' ? (
            <span>
              <strong>Service Dependency Graph:</strong> Showing microservices interconnected by directed{' '}
              <code className="text-blue-700 font-bold">DEPENDS_ON</code> relationships.
            </span>
          ) : (
            <span>
              <strong>Mode B (Advanced Topology):</strong> Showing full multi-hop topology. Click any node to inspect its
              neighborhood.
            </span>
          )}
        </div>

        {focusedNodeId && (
          <div className="flex items-center gap-2 bg-indigo-50 text-indigo-800 px-2 py-0.5 rounded-md border border-indigo-200">
            <span>Focused on node {focusedNodeId}</span>
            <button
              onClick={() => setFocusedNodeId(null)}
              className="font-bold underline hover:text-indigo-950"
            >
              Clear Focus
            </button>
          </div>
        )}
      </div>

      {/* 4. Canvas Viewport */}
      <div className="relative w-full bg-slate-50/50" style={{ height }}>
        <div
          ref={containerRef}
          className="cytoscape-container"
          style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        />

        {/* Empty State if filters exclude all nodes */}
        {filteredElements.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-20 gap-3 p-6 text-center">
            <Filter className="w-10 h-10 text-slate-400" />
            <h3 className="text-base font-bold text-slate-800">No Nodes Match Current Filter</h3>
            <p className="text-xs text-slate-500 max-w-sm">
              The selected filter combination contains 0 active nodes or relationships. Reset filters to restore the graph.
            </p>
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 transition-colors shadow-sm"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* 5. Collapsible Graph Legend */}
        <div className="absolute bottom-4 left-4 z-20 max-w-xs transition-all">
          <div className="rounded-xl bg-white/95 border border-slate-200 shadow-md backdrop-blur overflow-hidden">
            <button
              onClick={() => setIsLegendExpanded(!isLegendExpanded)}
              className="w-full px-3 py-2 text-left flex items-center justify-between gap-2 text-xs font-bold text-slate-700 hover:bg-slate-50 border-b border-slate-100"
            >
              <div className="flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-indigo-600" />
                <span>Graph Legend</span>
              </div>
              {isLegendExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>

            {isLegendExpanded && (
              <div className="p-3 text-xs flex flex-col gap-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                  Node Types & Status
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-sm bg-indigo-600 border border-indigo-700 inline-block shrink-0" />
                  <span className="text-slate-800 font-medium">Application Service (Healthy)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-sm bg-amber-500 border border-amber-600 inline-block shrink-0" />
                  <span className="text-slate-800 font-medium">Service (Degraded Status)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-sm bg-rose-500 border border-rose-600 inline-block shrink-0" />
                  <span className="text-slate-800 font-medium">Service (Critical Status)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-sm bg-purple-600 border border-purple-700 inline-block shrink-0" />
                  <span className="text-slate-800 font-medium">Infrastructure Host / DB</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rotate-45 bg-red-600 border border-red-700 inline-block shrink-0" />
                  <span className="text-slate-800 font-medium">Active Incident</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-sky-600 border border-sky-700 inline-block shrink-0" />
                  <span className="text-slate-800 font-medium">Evidence Telemetry</span>
                </div>

                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pt-1.5 border-t border-slate-100">
                  Relationships & Directions
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-600">
                  <span className="w-5 h-0.5 bg-blue-600 inline-block" />
                  <span>
                    <strong className="text-blue-700">DEPENDS_ON:</strong> Outgoing call
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-600">
                  <span className="w-5 h-0.5 bg-rose-500 inline-block" />
                  <span>
                    <strong className="text-rose-700">AFFECTS:</strong> Incident impact
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-600">
                  <span className="w-5 h-0.5 border-t border-dashed border-purple-500 inline-block" />
                  <span>
                    <strong className="text-purple-700">CONNECTS_TO:</strong> Host DB
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-600">
                  <span className="w-5 h-0.5 border-t border-dotted border-amber-500 inline-block" />
                  <span>
                    <strong className="text-amber-700">SUPPORTED_BY:</strong> Metric evidence
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 6. Rich Node Details Side Panel (Requirement 6) */}
        {selectedNode && (
          <div className="absolute top-4 right-4 w-88 max-w-[90vw] max-h-[92%] overflow-y-auto p-4 rounded-2xl bg-white/95 border border-slate-200 shadow-2xl backdrop-blur flex flex-col gap-3.5 z-30">
            {/* Drawer Header */}
            <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      selectedNode.type === 'Service'
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        : selectedNode.type === 'Incident'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : selectedNode.type === 'Infrastructure'
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : 'bg-sky-50 text-sky-700 border border-sky-200'
                    }`}
                  >
                    {selectedNode.type}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">{selectedNode.id}</span>
                </div>
                <h4 className="text-sm font-extrabold text-slate-900 mt-1 leading-snug">
                  {selectedNode.name || selectedNode.id}
                </h4>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-slate-400 hover:text-slate-700 text-xs p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                title="Close Drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Plain English Description */}
            <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200 leading-relaxed">
              {selectedNode.description || (
                selectedNode.type === 'Service'
                  ? `Core microservice maintained by the ${selectedNode.team || 'Engineering'} team. Operating at ${selectedNode.criticality || 'TIER_1'} criticality tier with ${selectedNode.status || 'HEALTHY'} health status.`
                  : selectedNode.type === 'Incident'
                  ? `${selectedNode.severity || 'P2'} incident (${selectedNode.status || 'OPEN'}). Directly impacting downstream microservice availability and latency thresholds.`
                  : selectedNode.type === 'Infrastructure'
                  ? `${selectedNode.source_type || 'Host'} infrastructure provisioned in the ${selectedNode.env || 'production'} environment.`
                  : `Telemetry evidence observation recorded from observability collectors.`
              )}
            </div>

            {/* Core Status & Metadata */}
            <div className="space-y-2 text-xs">
              {selectedNode.status && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Health Status:</span>
                  <StatusBadge status={selectedNode.status} size="sm" />
                </div>
              )}
              {selectedNode.severity && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Incident Severity:</span>
                  <SeverityBadge severity={selectedNode.severity} size="sm" />
                </div>
              )}
              {selectedNode.criticality && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Criticality Tier:</span>
                  <span className="text-slate-900 font-semibold px-2 py-0.5 rounded bg-slate-100">
                    {selectedNode.criticality}
                  </span>
                </div>
              )}
              {selectedNode.team && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Owning Team:</span>
                  <span className="text-slate-800 font-medium">{selectedNode.team}</span>
                </div>
              )}
              {selectedNode.env && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Environment:</span>
                  <span className="text-slate-800 font-medium">{selectedNode.env}</span>
                </div>
              )}
              {selectedNode.source_type && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Source Type:</span>
                  <span className="text-indigo-700 font-mono font-medium">{selectedNode.source_type}</span>
                </div>
              )}
              {selectedNode.metric_value !== undefined && selectedNode.metric_value !== null && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Metric Reading:</span>
                  <span className="text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    {selectedNode.metric_value} {selectedNode.unit || ''}
                  </span>
                </div>
              )}
            </div>

            {/* Neighborhood Relationships List */}
            {selectedNodeNeighbors && (
              <div className="space-y-3 pt-2 border-t border-slate-100 text-xs">
                {/* 1. If Service: Show Upstream Callers & Downstream Dependencies */}
                {selectedNode.type === 'Service' && (
                  <>
                    <div>
                      <div className="flex items-center justify-between text-slate-500 font-semibold text-[11px] mb-1">
                        <span className="flex items-center gap-1">
                          <ArrowUpRight className="w-3.5 h-3.5 text-blue-600" />
                          <span>Upstream Callers ({selectedNodeNeighbors.upstream.length})</span>
                        </span>
                      </div>
                      {selectedNodeNeighbors.upstream.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {selectedNodeNeighbors.upstream.map((caller) => (
                            <button
                              key={caller.id}
                              onClick={() => focusOnNode(caller.id)}
                              className="px-2 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 rounded text-[11px] text-slate-700 transition-colors font-medium border border-slate-200"
                            >
                              {caller.name}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">No incoming dependency calls (edge gateway).</p>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-slate-500 font-semibold text-[11px] mb-1">
                        <span className="flex items-center gap-1">
                          <ArrowDownRight className="w-3.5 h-3.5 text-blue-600" />
                          <span>Downstream Dependencies ({selectedNodeNeighbors.downstream.length})</span>
                        </span>
                      </div>
                      {selectedNodeNeighbors.downstream.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {selectedNodeNeighbors.downstream.map((dep) => (
                            <button
                              key={dep.id}
                              onClick={() => focusOnNode(dep.id)}
                              className="px-2 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 rounded text-[11px] text-slate-700 transition-colors font-medium border border-slate-200"
                            >
                              {dep.name}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">No outgoing dependencies.</p>
                      )}
                    </div>

                    {/* Active Incidents Affecting Service */}
                    {selectedNodeNeighbors.connectedIncidents.length > 0 && (
                      <div>
                        <span className="text-[11px] font-semibold text-rose-600 block mb-1">
                          Active Affecting Incidents ({selectedNodeNeighbors.connectedIncidents.length})
                        </span>
                        <div className="space-y-1">
                          {selectedNodeNeighbors.connectedIncidents.map((inc) => (
                            <Link
                              key={inc.id}
                              to={`/incidents/${inc.id}`}
                              className="p-2 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-between gap-2 hover:bg-rose-100 transition-colors"
                            >
                              <span className="font-semibold text-rose-900 text-[11px] truncate">{inc.name}</span>
                              <ExternalLink className="w-3 h-3 text-rose-600 shrink-0" />
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* 2. If Incident: Show Affected Services & Telemetry Evidence */}
                {selectedNode.type === 'Incident' && (
                  <>
                    <div>
                      <span className="text-[11px] font-semibold text-slate-700 block mb-1">
                        Affected Services ({selectedNodeNeighbors.downstream.length})
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {selectedNodeNeighbors.downstream.map((svc) => (
                          <button
                            key={svc.id}
                            onClick={() => focusOnNode(svc.id)}
                            className="px-2 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded text-[11px] font-medium hover:bg-indigo-100"
                          >
                            {svc.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold text-slate-700 block mb-1">
                        Telemetry Evidence ({selectedNodeNeighbors.connectedEvidence.length})
                      </span>
                      <div className="space-y-1 max-h-36 overflow-y-auto">
                        {selectedNodeNeighbors.connectedEvidence.map((ev) => (
                          <div
                            key={ev.id}
                            className="p-1.5 bg-slate-50 rounded border border-slate-200 text-[11px] text-slate-700"
                          >
                            <span className="font-mono text-indigo-600 font-bold">[{ev.source_type || 'METRIC'}]</span>{' '}
                            {ev.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* 3. If Evidence: Show Parent Incident */}
                {selectedNode.type === 'Evidence' && (
                  <div>
                    <span className="text-[11px] font-semibold text-slate-700 block mb-1">Parent Incident:</span>
                    {selectedNodeNeighbors.connectedIncidents.map((inc) => (
                      <Link
                        key={inc.id}
                        to={`/incidents/${inc.id}`}
                        className="p-2 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-between gap-2 hover:bg-amber-100 transition-colors"
                      >
                        <span className="font-semibold text-amber-900 text-[11px] truncate">{inc.name}</span>
                        <ExternalLink className="w-3 h-3 text-amber-600 shrink-0" />
                      </Link>
                    ))}
                  </div>
                )}

                {/* 4. If Infrastructure: Show Connected Services */}
                {selectedNode.type === 'Infrastructure' && (
                  <div>
                    <span className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Connected Services ({selectedNodeNeighbors.upstream.length}):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {selectedNodeNeighbors.upstream.map((svc) => (
                        <button
                          key={svc.id}
                          onClick={() => focusOnNode(svc.id)}
                          className="px-2 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded text-[11px] font-medium hover:bg-purple-100"
                        >
                          {svc.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quick Actions Footer */}
            <div className="border-t border-slate-100 pt-3 flex flex-col gap-2">
              <button
                onClick={() => setFocusedNodeId(selectedNode.id)}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-indigo-600 transition-colors shadow-2xs"
              >
                <Target className="w-3.5 h-3.5" />
                <span>Focus Node Neighborhood</span>
              </button>

              {selectedNode.type === 'Incident' && (
                <Link
                  to={`/incidents/${selectedNode.id}`}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold hover:bg-rose-100 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Incident Investigation</span>
                </Link>
              )}

              {selectedNode.type === 'Service' && (
                <Link
                  to={`/chat?service=${selectedNode.id}`}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold hover:bg-indigo-100 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Investigate Service in AI Chat</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
