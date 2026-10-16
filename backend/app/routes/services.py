"""
GraphSentinel AI - Services Routes
Endpoints for browsing and inspecting service dependency architectures.
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from backend.app.database import get_graph
from backend.app.schemas import ServiceSummary, ServiceDetail
from backend.app.graph_queries import list_services, get_service_detail

router = APIRouter(prefix="/services", tags=["Services"])


@router.get("", response_model=List[ServiceSummary])
def get_services(
    status: Optional[str] = Query(None, description="Filter by status: HEALTHY, DEGRADED, CRITICAL"),
    criticality: Optional[str] = Query(None, description="Filter by criticality: TIER_1, TIER_2, TIER_3, TIER_4")
):
    """Retrieves all registered services with optional status/criticality filters."""
    try:
        graph = get_graph()
        return list_services(graph, status=status, criticality=criticality)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to query services: {str(e)}")


@router.get("/{service_id}", response_model=ServiceDetail)
def get_service(service_id: str):
    """Retrieves complete architecture details for a service, including upstream and downstream dependencies."""
    try:
        graph = get_graph()
        svc = get_service_detail(graph, service_id)
        if not svc:
            raise HTTPException(status_code=404, detail=f"Service '{service_id}' not found in graph.")
        return svc
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to query service '{service_id}': {str(e)}")
