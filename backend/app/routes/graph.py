"""
GraphSentinel AI - Graph Visualization Route
Provides Cytoscape.js compatible graph payload for frontend interactive visualization.
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from backend.app.database import get_graph
from backend.app.schemas import GraphResponse
from backend.app.graph_queries import get_cytoscape_graph

router = APIRouter(prefix="/graph", tags=["Graph Visualization"])


@router.get("", response_model=GraphResponse)
def get_graph_data(
    include_evidence: bool = Query(True, description="Whether to include evidence nodes and edges"),
    incident_id: Optional[str] = Query(None, description="Focus on subgraph around an incident"),
    service_id: Optional[str] = Query(None, description="Focus on subgraph around a service")
):
    """Retrieves Cytoscape.js formatted nodes and edges from FalkorDB."""
    try:
        graph = get_graph()
        return get_cytoscape_graph(
            graph,
            include_evidence=include_evidence,
            incident_id=incident_id,
            service_id=service_id
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve graph data: {str(e)}")
