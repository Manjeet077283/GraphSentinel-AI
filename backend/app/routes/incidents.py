"""
GraphSentinel AI - Incidents Routes
Endpoints for browsing incidents, deep investigation payloads, and graph impact analysis.
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from backend.app.database import get_graph
from backend.app.schemas import IncidentSummary, IncidentDetail, ImpactAnalysisResponse
from backend.app.graph_queries import (
    list_incidents,
    get_incident_detail,
    get_incident_impact_analysis
)

router = APIRouter(prefix="/incidents", tags=["Incidents"])


@router.get("", response_model=List[IncidentSummary])
def get_incidents(
    status: Optional[str] = Query(None, description="Filter: OPEN, INVESTIGATING, MITIGATED, RESOLVED"),
    severity: Optional[str] = Query(None, description="Filter: P1_CRITICAL, P2_HIGH, P3_MEDIUM, P4_LOW"),
    service_id: Optional[str] = Query(None, description="Filter by affected service ID"),
    search: Optional[str] = Query(None, description="Search keyword in incident title or description"),
    limit: int = Query(50, ge=1, le=200)
):
    """Retrieves synthetic incidents matching query criteria."""
    try:
        graph = get_graph()
        return list_incidents(
            graph,
            status=status,
            severity=severity,
            service_id=service_id,
            search=search,
            limit=limit
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to query incidents: {str(e)}")


@router.get("/{incident_id}", response_model=IncidentDetail)
def get_incident(incident_id: str):
    """Retrieves complete investigation details for an incident including evidence, resolutions, and hypotheses."""
    try:
        graph = get_graph()
        inc = get_incident_detail(graph, incident_id)
        if not inc:
            raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found in graph.")
        return inc
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to query incident '{incident_id}': {str(e)}")


@router.get("/{incident_id}/impact", response_model=ImpactAnalysisResponse)
def get_incident_impact(
    incident_id: str,
    max_depth: int = Query(3, ge=1, le=5, description="Maximum traversal hops for downstream impact")
):
    """
    Performs graph traversal to trace downstream dependent services affected by the incident.
    Distinguishes confirmed failures from cascade risks.
    """
    try:
        graph = get_graph()
        impact = get_incident_impact_analysis(graph, incident_id, max_depth=max_depth)
        if not impact:
            raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' or its affected service not found.")
        return impact
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to compute impact analysis for '{incident_id}': {str(e)}")
