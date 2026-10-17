"""
GraphSentinel AI - Graph Visualization & Diagnostics Route
Provides Cytoscape.js compatible graph payload for frontend interactive visualization
and read-only graph topology diagnostics.
"""

from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query
from backend.app.database import get_graph
from backend.app.schemas import GraphResponse
from backend.app.graph_queries import get_cytoscape_graph, get_graph_diagnostics

router = APIRouter(prefix="/graph", tags=["Graph Visualization & Intelligence"])


@router.get("", response_model=GraphResponse)
def get_graph_data(
    include_evidence: bool = Query(True, description="Whether to include evidence nodes and edges"),
    incident_id: Optional[str] = Query(None, description="Focus on subgraph around an incident"),
    service_id: Optional[str] = Query(None, description="Focus on subgraph around a service"),
    relationship_types: Optional[str] = Query(None, description="Comma-separated relationship filter (e.g. DEPENDS_ON,AFFECTS)"),
    severity: Optional[str] = Query(None, description="Filter incidents by severity (e.g. P1_CRITICAL)")
):
    """
    Retrieves Cytoscape.js formatted nodes and edges from FalkorDB.
    Supports bounded graph exploration, relationship filtering, and focus subgraphs.
    """
    try:
        graph = get_graph()
        resp = get_cytoscape_graph(
            graph,
            include_evidence=include_evidence,
            incident_id=incident_id,
            service_id=service_id
        )

        nodes = resp.nodes
        edges = resp.edges

        # Optional relationship type filter
        if relationship_types:
            allowed_rels = {r.strip().upper() for r in relationship_types.split(",") if r.strip()}
            edges = [e for e in edges if e.data.relationship.upper() in allowed_rels]
            # Retain nodes connected to remaining edges or non-evidence nodes
            connected_ids = {e.data.source for e in edges} | {e.data.target for e in edges}
            nodes = [n for n in nodes if n.data.id in connected_ids or n.data.type in ("Service", "Incident")]

        # Optional severity filter on incidents
        if severity:
            sev_norm = severity.strip().upper()
            filtered_incident_ids = {n.data.id for n in nodes if n.data.type == "Incident" and n.data.severity != sev_norm}
            if filtered_incident_ids:
                nodes = [n for n in nodes if n.data.id not in filtered_incident_ids]
                edges = [e for e in edges if e.data.source not in filtered_incident_ids and e.data.target not in filtered_incident_ids]

        return GraphResponse(
            nodes=nodes,
            edges=edges,
            stats={"nodes": len(nodes), "edges": len(edges)}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve graph data: {str(e)}")


@router.get("/diagnostics")
def get_diagnostics():
    """
    Returns read-only FalkorDB graph diagnostics:
    Node counts by label, relationship counts by type, data-source distribution, and schema status.
    """
    try:
        graph = get_graph()
        return get_graph_diagnostics(graph)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve graph diagnostics: {str(e)}")
