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
