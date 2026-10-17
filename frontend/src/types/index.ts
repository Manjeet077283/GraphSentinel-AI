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
  description?: string;
  source_type?: string;
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
  language?: 'en' | 'hi' | 'hinglish' | 'auto';
  conversation_id?: string | null;
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

// Authentication Types
export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  full_name: string;
  display_name?: string;
  role: string;
  phone?: string;
  job_title?: string;
  department?: string;
  organization?: string;
  bio?: string;
  location?: string;
  avatar_url?: string;
  preferred_language?: string;
  time_zone?: string;
  notification_preferences?: string;
  status?: string;
  created_at: string;
}

export interface UpdateProfileRequest {
  display_name?: string;
  phone?: string;
  job_title?: string;
  department?: string;
  organization?: string;
  bio?: string;
  location?: string;
  avatar_url?: string;
  preferred_language?: string;
  time_zone?: string;
  notification_preferences?: Record<string, any>;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
}

// Resolution Workflow Types
export interface ResolutionStepItem {
  id: string;
  step_number: number;
  title: string;
  action: string;
  reason: string;
  supporting_evidence: string;
  expected_result: string;
  risk: string;
  verification: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED' | 'SKIPPED';
  updated_at: string;
}

export interface InvestigationSummary {
  whats_happening: string;
  confirmed_facts: string[];
  likely_cause: string;
  recommended_solution: string;
}

export interface VerificationSignal {
  name: string;
  status: 'PASS' | 'WARN' | 'FAIL' | 'MANUAL';
  measured_value?: string | null;
  threshold?: string | null;
  detail: string;
}

export interface IncidentResolutionDetail {
  incident_id: string;
  status: string;
  root_cause_conclusion?: string | null;
  actions_taken?: string | null;
  verification_outcome?: string | null;
  resolution_notes?: string | null;
  resolved_by?: string | null;
  resolved_at?: string | null;
}

export interface IncidentActivityItem {
  id: string;
  activity_type: string;
  actor: string;
  summary: string;
  detail?: string | null;
  created_at: string;
}

export interface ResolutionWorkflowResponse {
  incident_id: string;
  incident_title: string;
  incident_status: string;
  affected_service_id: string;
  affected_service_name: string;
  summary: InvestigationSummary;
  steps: ResolutionStepItem[];
  resolution?: IncidentResolutionDetail | null;
  activities: IncidentActivityItem[];
}

export interface VerifyRecoveryResponse {
  incident_id: string;
  ready_for_resolution: boolean;
  signals: VerificationSignal[];
  summary: string;
}

// Global Search Types
export interface GlobalSearchResultItem {
  id: string;
  type: 'service' | 'incident';
  title: string;
  subtitle: string;
  status: string;
  severity?: string | null;
  url: string;
}

export interface GlobalSearchResponse {
  query: string;
  results: GlobalSearchResultItem[];
}

// 14-Section SRE Investigation Report Types
export interface InvestigationCommandExample {
  title: string;
  command: string;
  explanation: string;
  safety_level: 'READ_ONLY' | 'PRIVILEGED' | 'DESTRUCTIVE';
}

export interface RollbackRiskPlan {
  risk_level: string;
  risk_description: string;
  rollback_steps: string[];
  fallback_plan: string;
}

export interface ConfidenceFactor {
  factor: string;
  weight: string;
  impact: string;
}

export interface ConfidenceDerivation {
  score_pct: number;
  level: string;
  formula_explanation: string;
  factors: ConfidenceFactor[];
}

export interface HypothesisItem {
  title: string;
  explanation: string;
  probability: string;
  supporting_evidence: string[];
  contradicting_evidence: string[];
}

export interface RelatedIncidentItem {
  incident_id: string;
  title: string;
  similarity_score: number;
  shared_services: string[];
  resolution_notes: string;
  status: string;
}

export interface InvestigationReportResponse {
  problem_summary: string;
  observed_symptoms: string[];
  affected_services: string[];
  severity_and_impact: {
    severity: string;
    business_impact: string;
    estimated_downtime?: string;
  };
  confirmed_facts: string[];
  potential_root_causes: HypothesisItem[];
  confidence: ConfidenceDerivation;
  related_incidents: RelatedIncidentItem[];
  recommended_solution: {
    title: string;
    rationale: string;
    steps: string[];
  };
  command_examples: InvestigationCommandExample[];
  validation_steps: string[];
  rollback_and_risk: RollbackRiskPlan;
  prevention_and_monitoring: {
    prevention_measures: string[];
    monitoring_recommendations: string[];
  };
  final_resolution_notes: {
    status: string;
    notes: string;
    resolved_by?: string;
    resolved_at?: string;
  };
  generated_at: string;
  incident_id: string;
  incident_title: string;
}

// Data Workspace Types
export interface UploadPreviewResponse {
  session_id: string;
  filename: string;
  detected_format: string;
  total_rows: number;
  columns: string[];
  sample_rows: Record<string, any>[];
  suggested_mapping: Record<string, string>;
  is_valid: boolean;
  validation_errors: string[];
}

export interface ImportDatasetRequest {
  session_id: string;
  dataset_name: string;
  description?: string;
  column_mapping: Record<string, string>;
  deduplicate?: boolean;
}

export interface DatasetSummary {
  id: string;
  dataset_name: string;
  description?: string;
  source_filename: string;
  format: string;
  total_records: number;
  valid_records: number;
  rejected_records: number;
  status: string;
  created_at: string;
  imported_by_name?: string;
}

export interface DatasetRecordItem {
  id: string;
  row_index: number;
  raw_data: Record<string, any>;
  normalized_data: Record<string, any>;
  is_valid: boolean;
  validation_errors?: string[];
  dedup_hash?: string;
}

export interface ProvenanceCategory {
  category: string;
  count: number;
  description: string;
}

export interface ProvenanceSummaryResponse {
  synthetic_count: number;
  imported_count: number;
  external_count: number;
  total_nodes: number;
  breakdown: ProvenanceCategory[];
}

// Investigation Conversation & History Types
export interface ConversationSummary {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  preview: string;
}

export interface InvestigationMessageItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  confidence?: string;
  mode?: string;
  created_at: string;
}

export interface ConversationDetail {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: InvestigationMessageItem[];
}

export interface TranslateMessageRequest {
  text: string;
  target_language: 'en' | 'hi' | 'hinglish';
}

// Graph Diagnostics Types
export interface GraphDiagnosticsResponse {
  total_nodes: number;
  total_edges: number;
  labels: Record<string, number>;
  relationship_types: Record<string, number>;
  data_sources: Record<string, number>;
  is_healthy: boolean;
}

