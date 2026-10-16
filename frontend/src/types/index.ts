// GraphSentinel AI - Frontend TypeScript Definitions

export interface ServiceSummary {
  id: string;
  name: string;
  description: string;
  criticality: 'TIER_1' | 'TIER_2' | 'TIER_3' | 'TIER_4';
  status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  team: string;
}

export interface ServiceDetail extends ServiceSummary {
  upstream_dependencies: Array<{
    id: string;
    name: string;
    criticality: string;
    status: string;
  }>;
  downstream_dependencies: Array<{
    id: string;
    name: string;
    criticality: string;
    status: string;
  }>;
  connected_infrastructure: Array<{
    id: string;
    name: string;
    type: string;
    environment: string;
    status: string;
  }>;
  active_incidents: Array<{
    id: string;
    title: string;
    severity: string;
    status: string;
  }>;
}

export interface InfrastructureSummary {
  id: string;
  name: string;
  type: string;
  environment: string;
  status: string;
}

export interface EvidenceItem {
  id: string;
  source_type: 'LOG' | 'METRIC' | 'ALERT' | 'TRACE' | 'OBSERVATION';
  description: string;
  timestamp: string;
  metric_name?: string | null;
  metric_value?: number | null;
  unit?: string | null;
}

export interface ResolutionItem {
  id: string;
  description: string;
  outcome: 'SUCCESS' | 'PARTIAL_SUCCESS' | 'FAILED';
  effectiveness: 'HIGH' | 'MEDIUM' | 'LOW';
  applied_at?: string | null;
}

export interface IncidentSummary {
  id: string;
  title: string;
  description: string;
  severity: 'P1_CRITICAL' | 'P2_HIGH' | 'P3_MEDIUM' | 'P4_LOW';
  status: 'OPEN' | 'INVESTIGATING' | 'MITIGATED' | 'RESOLVED';
  affected_service_id: string;
  affected_service_name?: string;
  created_at: string;
  updated_at: string;
}

export interface ImpactedService {
  service_id: string;
  service_name: string;
  criticality: string;
  current_status: string;
  hops: number;
  dependency_path: string[];
  impact_level: 'CONFIRMED_DEGRADATION' | 'POTENTIAL_CASCADE_RISK';
}

export interface ImpactAnalysisResponse {
  incident_id: string;
  root_service_id: string;
  root_service_name: string;
  max_depth: number;
  total_impacted_services: number;
  impacted_services: ImpactedService[];
  impact_summary: string;
  paths: string[][];
}

export interface IncidentDetail extends IncidentSummary {
  affected_service?: ServiceSummary;
  evidence: EvidenceItem[];
  resolutions: ResolutionItem[];
  impact_analysis?: ImpactAnalysisResponse | null;
  related_historical_incidents: Array<{
    incident_id: string;
    title: string;
    severity: string;
    service_id: string;
    service_name: string;
    resolution_summary?: string | null;
    outcome?: string | null;
    effectiveness?: string | null;
    relevance?: string;
  }>;
  connected_infrastructure: InfrastructureSummary[];
  diagnostic_hypotheses: string[];
  recommended_actions: string[];
}

export interface SeverityCounts {
  P1_CRITICAL: number;
  P2_HIGH: number;
  P3_MEDIUM: number;
  P4_LOW: number;
}

export interface StatusCounts {
  OPEN: number;
  INVESTIGATING: number;
  MITIGATED: number;
  RESOLVED: number;
}

export interface ServiceHealthCounts {
  HEALTHY: number;
  DEGRADED: number;
  CRITICAL: number;
}

export interface OverviewResponse {
  total_services: number;
  open_incidents: number;
  critical_incidents: number;
  potentially_affected_services: number;
  severity_distribution: SeverityCounts;
  status_distribution: StatusCounts;
  service_health_distribution: ServiceHealthCounts;
  recent_incidents: IncidentSummary[];
  database_connected: boolean;
  synthetic_label: string;
}

export interface CytoNodeData {
  id: string;
  label: string;
  type: 'Service' | 'Infrastructure' | 'Incident' | 'Evidence' | 'Resolution';
  name: string;
  status?: string;
  severity?: string;
  criticality?: string;
  team?: string;
  env?: string;
  metric_value?: number;
  unit?: string;
}

export interface CytoEdgeData {
  id: string;
  source: string;
  target: string;
  relationship: string;
  label: string;
}

export interface CytoNode {
  data: CytoNodeData;
}

export interface CytoEdge {
  data: CytoEdgeData;
}

export interface GraphResponse {
  nodes: CytoNode[];
  edges: CytoEdge[];
  stats: Record<string, number>;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  message: string;
  conversation_history?: ChatMessage[];
  focused_incident_id?: string | null;
  focused_service_id?: string | null;
}

export interface ChatResponse {
  answer: string;
  mode: 'gemini_ai' | 'deterministic_fallback';
  referenced_incident_ids: string[];
  referenced_service_ids: string[];
  referenced_evidence_ids: string[];
  dependency_paths: string[][];
  historical_resolution_references: string[];
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  suggested_next_steps: string[];
  confirmed_observations: string[];
  hypotheses: string[];
}

export interface HealthResponse {
  status: string;
  app_name: string;
  tagline: string;
  api_available: boolean;
  database: {
    connected: boolean;
    latency_ms: number;
    graph_name: string;
    target: string;
    error?: string | null;
  };
  ai_provider: {
    gemini_configured: boolean;
    model: string;
    active_mode: string;
    description: string;
  };
  synthetic_data: boolean;
}
