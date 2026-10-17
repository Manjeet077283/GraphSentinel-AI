"""
GraphSentinel AI - Pydantic Data Schemas
Defines request and response schemas for all API endpoints.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


# Service Schemas
class ServiceSummary(BaseModel):
    id: str
    name: str
    description: str
    criticality: str
    status: str
    team: str


class ServiceDetail(ServiceSummary):
    upstream_dependencies: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Services that depend on this service"
    )
    downstream_dependencies: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Services this service depends on"
    )
    connected_infrastructure: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Infrastructure nodes connected to this service"
    )
    active_incidents: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Active incidents currently affecting this service"
    )


# Infrastructure Schemas
class InfrastructureSummary(BaseModel):
    id: str
    name: str
    type: str
    environment: str
    status: str


# Evidence Schemas
class EvidenceItem(BaseModel):
    id: str
    source_type: str
    description: str
    timestamp: str
    metric_name: Optional[str] = None
    metric_value: Optional[float] = None
    unit: Optional[str] = None


# Resolution Schemas
class ResolutionItem(BaseModel):
    id: str
    description: str
    outcome: str
    effectiveness: str
    applied_at: Optional[str] = None


# Incident Schemas
class IncidentSummary(BaseModel):
    id: str
    title: str
    description: str
    severity: str
    status: str
    affected_service_id: str
    affected_service_name: Optional[str] = None
    created_at: str
    updated_at: str


class ImpactedService(BaseModel):
    service_id: str
    service_name: str
    criticality: str
    current_status: str
    hops: int
    dependency_path: List[str]
    impact_level: str  # CONFIRMED_FAILURE vs POTENTIAL_RISK


class ImpactAnalysisResponse(BaseModel):
    incident_id: str
    root_service_id: str
    root_service_name: str
    max_depth: int
    total_impacted_services: int
    impacted_services: List[ImpactedService]
    impact_summary: str
    paths: List[List[str]]


class IncidentDetail(IncidentSummary):
    affected_service: Optional[ServiceSummary] = None
    evidence: List[EvidenceItem] = Field(default_factory=list)
    resolutions: List[ResolutionItem] = Field(default_factory=list)
    impact_analysis: Optional[ImpactAnalysisResponse] = None
    related_historical_incidents: List[Dict[str, Any]] = Field(default_factory=list)
    connected_infrastructure: List[InfrastructureSummary] = Field(default_factory=list)
    diagnostic_hypotheses: List[str] = Field(default_factory=list)
    recommended_actions: List[str] = Field(default_factory=list)


# Overview / Dashboard Schemas
class SeverityCounts(BaseModel):
    P1_CRITICAL: int = 0
    P2_HIGH: int = 0
    P3_MEDIUM: int = 0
    P4_LOW: int = 0


class StatusCounts(BaseModel):
    OPEN: int = 0
    INVESTIGATING: int = 0
    MITIGATED: int = 0
    RESOLVED: int = 0


class ServiceHealthCounts(BaseModel):
    HEALTHY: int = 0
    DEGRADED: int = 0
    CRITICAL: int = 0


class OverviewResponse(BaseModel):
    total_services: int
    open_incidents: int
    critical_incidents: int
    potentially_affected_services: int
    severity_distribution: SeverityCounts
    status_distribution: StatusCounts
    service_health_distribution: ServiceHealthCounts
    recent_incidents: List[IncidentSummary]
    database_connected: bool
    synthetic_label: str = "ALL RECORDS ARE SYNTHETIC DEMONSTRATION DATA"


# Graph Visualization Schemas (Cytoscape.js format)
class CytoNodeData(BaseModel):
    id: str
    label: str
    type: str  # Service, Infrastructure, Incident, Evidence, Resolution
    name: str
    status: Optional[str] = None
    severity: Optional[str] = None
    criticality: Optional[str] = None
    team: Optional[str] = None
    env: Optional[str] = None
    metric_value: Optional[float] = None
    unit: Optional[str] = None
    description: Optional[str] = None
    source_type: Optional[str] = None


class CytoNode(BaseModel):
    data: CytoNodeData


class CytoEdgeData(BaseModel):
    id: str
    source: str
    target: str
    relationship: str
    label: str


class CytoEdge(BaseModel):
    data: CytoEdgeData


class GraphResponse(BaseModel):
    nodes: List[CytoNode]
    edges: List[CytoEdge]
    stats: Dict[str, int]


# Chat Schemas
class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    conversation_history: List[ChatMessage] = Field(default_factory=list)
    focused_incident_id: Optional[str] = None
    focused_service_id: Optional[str] = None
    language: Optional[str] = "en"
    conversation_id: Optional[str] = None


class ChatResponse(BaseModel):
    answer: str
    mode: str  # "gemini_ai" or "deterministic_fallback"
    referenced_incident_ids: List[str] = Field(default_factory=list)
    referenced_service_ids: List[str] = Field(default_factory=list)
    referenced_evidence_ids: List[str] = Field(default_factory=list)
    dependency_paths: List[List[str]] = Field(default_factory=list)
    historical_resolution_references: List[str] = Field(default_factory=list)
    confidence: str  # HIGH, MEDIUM, LOW
    suggested_next_steps: List[str] = Field(default_factory=list)
    confirmed_observations: List[str] = Field(default_factory=list)
    hypotheses: List[str] = Field(default_factory=list)


# Authentication Schemas
class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    role: Optional[str] = "Site Reliability Engineer"


class UserProfile(BaseModel):
    id: str
    email: str
    name: Optional[str] = None
    full_name: str
    display_name: Optional[str] = None
    role: str
    phone: Optional[str] = ""
    job_title: Optional[str] = ""
    department: Optional[str] = ""
    organization: Optional[str] = ""
    bio: Optional[str] = ""
    location: Optional[str] = ""
    avatar_url: Optional[str] = ""
    preferred_language: Optional[str] = "en"
    time_zone: Optional[str] = "UTC"
    notification_preferences: Optional[str] = '{"email": true, "slack": true, "severity_threshold": "P2_HIGH"}'
    status: Optional[str] = "ACTIVE"
    created_at: str


class UpdateProfileRequest(BaseModel):
    display_name: Optional[str] = None
    phone: Optional[str] = None
    job_title: Optional[str] = None
    department: Optional[str] = None
    organization: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    avatar_url: Optional[str] = None
    preferred_language: Optional[str] = None
    time_zone: Optional[str] = None
    notification_preferences: Optional[Dict[str, Any]] = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class AuthResponse(BaseModel):
    token: str
    user: UserProfile


# Resolution Workflow Schemas
class ResolutionStepItem(BaseModel):
    id: str
    step_number: int
    title: str
    action: str
    reason: str
    supporting_evidence: str
    expected_result: str
    risk: str
    verification: str
    status: str  # PENDING, IN_PROGRESS, COMPLETED, BLOCKED, SKIPPED
    updated_at: str


class InvestigationSummary(BaseModel):
    whats_happening: str
    confirmed_facts: List[str]
    likely_cause: str
    recommended_solution: str


class VerificationSignal(BaseModel):
    name: str
    status: str  # PASS, WARN, FAIL, MANUAL
    measured_value: Optional[str] = None
    threshold: Optional[str] = None
    detail: str


class IncidentResolutionDetail(BaseModel):
    incident_id: str
    status: str
    root_cause_conclusion: Optional[str] = None
    actions_taken: Optional[str] = None
    verification_outcome: Optional[str] = None
    resolution_notes: Optional[str] = None
    resolved_by: Optional[str] = None
    resolved_at: Optional[str] = None


class IncidentActivityItem(BaseModel):
    id: str
    activity_type: str
    actor: str
    summary: str
    detail: Optional[str] = None
    created_at: str


class ResolutionWorkflowResponse(BaseModel):
    incident_id: str
    incident_title: str
    incident_status: str
    affected_service_id: str
    affected_service_name: str
    summary: InvestigationSummary
    steps: List[ResolutionStepItem]
    resolution: Optional[IncidentResolutionDetail] = None
    activities: List[IncidentActivityItem] = Field(default_factory=list)


class UpdateStepStatusRequest(BaseModel):
    status: str  # PENDING, IN_PROGRESS, COMPLETED, BLOCKED, SKIPPED
    actor: Optional[str] = "SRE Engineer"


class VerifyRecoveryRequest(BaseModel):
    checklist_overrides: Optional[Dict[str, bool]] = None


class VerifyRecoveryResponse(BaseModel):
    incident_id: str
    ready_for_resolution: bool
    signals: List[VerificationSignal]
    summary: str


class ResolveIncidentRequest(BaseModel):
    root_cause_conclusion: str
    actions_taken: str
    verification_outcome: str
    resolution_notes: str
    resolved_by: Optional[str] = "SRE Engineer"


class ReopenIncidentRequest(BaseModel):
    reason: str
    reopened_by: Optional[str] = "SRE Engineer"


# Global Search Schemas
class GlobalSearchResultItem(BaseModel):
    id: str
    type: str  # service, incident
    title: str
    subtitle: str
    status: str
    severity: Optional[str] = None
    url: str


class GlobalSearchResponse(BaseModel):
    query: str
    results: List[GlobalSearchResultItem]


# =========================================================================
# 14-Section Structured Investigation Report Schemas
# =========================================================================

class ConfidenceFactor(BaseModel):
    factor: str
    weight: str
    impact: str


class ConfidenceDerivation(BaseModel):
    score_pct: int
    level: str  # HIGH, MEDIUM, LOW
    formula_explanation: str
    factors: List[ConfidenceFactor] = Field(default_factory=list)


class HypothesisItem(BaseModel):
    title: str
    explanation: str
    probability: str
    supporting_evidence: List[str] = Field(default_factory=list)
    contradicting_evidence: List[str] = Field(default_factory=list)


class RelatedIncidentItem(BaseModel):
    incident_id: str
    title: str
    similarity_score: float
    shared_services: List[str] = Field(default_factory=list)
    resolution_notes: str
    status: str


class SeverityAndImpact(BaseModel):
    severity: str
    business_impact: str
    estimated_downtime: Optional[str] = None


class RecommendedSolution(BaseModel):
    title: str
    rationale: str
    steps: List[str] = Field(default_factory=list)


class InvestigationCommandExample(BaseModel):
    step_number: int
    title: str
    command: str
    purpose: str
    safety_level: str  # READ_ONLY, PRIVILEGED, DESTRUCTIVE
    explanation: Optional[str] = None
    warning: Optional[str] = None


class PreventionMeasureItem(BaseModel):
    category: str  # MONITORING, ARCHITECTURE, RESILIENCE, RUNBOOK
    recommendation: str
    rationale: str


class RollbackRiskPlan(BaseModel):
    risk_level: str  # LOW, MEDIUM, HIGH
    risk_description: str
    rollback_steps: List[str] = Field(default_factory=list)
    fallback_plan: str
    rollback_commands: List[str] = Field(default_factory=list)
    blast_radius: Optional[str] = None
    rollback_trigger: Optional[str] = None
    rollback_procedure: Optional[str] = None


class PreventionAndMonitoring(BaseModel):
    prevention_measures: List[str] = Field(default_factory=list)
    monitoring_recommendations: List[str] = Field(default_factory=list)


class FinalResolutionNotes(BaseModel):
    status: str
    notes: str = ""
    conclusion: Optional[str] = None
    actions_taken: Optional[str] = None
    preventive_actions: Optional[str] = None
    resolved_by: Optional[str] = None
    resolved_at: Optional[str] = None


class EvidenceHypothesisLink(BaseModel):
    hypothesis: str
    supporting_evidence: List[str]
    contradicting_evidence: List[str] = Field(default_factory=list)


class InvestigationReportResponse(BaseModel):
    incident_id: str
    incident_title: str
    generated_at: str
    provenance_source: str = "SYNTHETIC_DEMO"
    problem_summary: str
    observed_symptoms: List[str] = Field(default_factory=list)
    affected_services: List[str] = Field(default_factory=list)
    severity_and_impact: SeverityAndImpact
    confirmed_facts: List[str] = Field(default_factory=list)
    potential_root_causes: List[HypothesisItem] = Field(default_factory=list)
    confidence: ConfidenceDerivation
    related_incidents: List[RelatedIncidentItem] = Field(default_factory=list)
    recommended_solution: RecommendedSolution
    command_examples: List[InvestigationCommandExample] = Field(default_factory=list)
    validation_steps: List[str] = Field(default_factory=list)
    rollback_and_risk: RollbackRiskPlan
    prevention_and_monitoring: PreventionAndMonitoring
    final_resolution_notes: FinalResolutionNotes

    # Backward compatibility / extra aliases:
    observed_symptoms_and_services: Optional[Dict[str, Any]] = None
    severity_and_business_impact: Optional[Dict[str, Any]] = None
    confidence_assessment: Optional[Any] = None
    prevention_measures: Optional[Any] = None
    recommended_solution_steps: Optional[Any] = None
    resolution_status_and_notes: Optional[Dict[str, Any]] = None



# =========================================================================
# Data Workspace Schemas
# =========================================================================

class UploadPreviewResponse(BaseModel):
    filename: str
    file_type: str
    file_size_bytes: int
    total_rows_detected: int
    columns_detected: List[str]
    sample_records: List[Dict[str, Any]]
    suggested_mapping: Dict[str, str]


class ImportDatasetRequest(BaseModel):
    filename: str
    file_type: str
    column_mapping: Dict[str, str]
    records: List[Dict[str, Any]]
    integrate_to_graph: bool = True


class DatasetSummary(BaseModel):
    id: str
    user_id: str
    filename: str
    file_type: str
    provenance_type: str
    record_count: int
    valid_count: int
    rejected_count: int
    status: str
    column_mapping: Dict[str, Any]
    summary: Dict[str, Any]
    created_at: str
    updated_at: str


class DatasetRecordItem(BaseModel):
    id: str
    dataset_id: str
    row_index: int
    incident_id: Optional[str] = None
    service_id: Optional[str] = None
    severity: Optional[str] = None
    status: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    raw_data: Dict[str, Any]
    validation_errors: List[str] = Field(default_factory=list)
    is_valid: bool
    created_at: str


class ProvenanceSummaryResponse(BaseModel):
    synthetic_count: int = 32
    total_nodes: int = 38
    user_imported_count: int = 0
    breakdown: List[Dict[str, Any]] = Field(default_factory=lambda: [
        {"source": "SYNTHETIC_DEMO", "count": 32, "percentage": 84.2, "status": "ACTIVE_BASELINE"},
        {"source": "USER_IMPORTED", "count": 0, "percentage": 0.0, "status": "INTEGRATED_GRAPH"},
        {"source": "VERIFIED_EXTERNAL", "count": 6, "percentage": 15.8, "status": "TELEMETRY_PIPELINE"}
    ])
    user_imported_datasets: int = 0
    user_imported_records: int = 0
    user_valid_records: int = 0
    user_rejected_records: int = 0
    synthetic_baseline_records: Dict[str, Any] = Field(default_factory=dict)
    verified_external_sources: List[Dict[str, Any]] = Field(default_factory=list)


# =========================================================================
# Investigation History & Multilingual Chat Schemas
# =========================================================================

class CreateConversationRequest(BaseModel):
    title: Optional[str] = None
    focused_incident_id: Optional[str] = None
    focused_service_id: Optional[str] = None
    language: Optional[str] = "en"


class InvestigationMessageItem(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str
    mode: str
    structured_data: Dict[str, Any] = Field(default_factory=dict)
    created_at: str


class ConversationSummary(BaseModel):
    id: str
    title: str
    focused_incident_id: Optional[str] = None
    focused_service_id: Optional[str] = None
    language: str
    message_count: int
    created_at: str
    updated_at: str


class ConversationDetail(ConversationSummary):
    messages: List[InvestigationMessageItem] = Field(default_factory=list)


class TranslateMessageRequest(BaseModel):
    text: str
    target_language: str  # "en", "hi", "hinglish"


