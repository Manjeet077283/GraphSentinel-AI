"""
GraphSentinel AI - Overview Dashboard Route
Provides summary metrics, distributions, and recent incidents from FalkorDB.
"""

from fastapi import APIRouter, HTTPException, Query
from backend.app.database import get_graph
from backend.app.schemas import OverviewResponse, GlobalSearchResponse
from backend.app.graph_queries import get_overview_metrics

router = APIRouter(tags=["Overview"])


@router.get("/overview", response_model=OverviewResponse)
def get_overview():
    """Returns top-level KPI metrics, incident distributions, and service health counts."""
    try:
        graph = get_graph()
        return get_overview_metrics(graph)
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Unable to retrieve overview metrics from FalkorDB: {str(e)}"
        )


@router.get("/search", response_model=GlobalSearchResponse)
@router.get("/overview/search", response_model=GlobalSearchResponse)
def search_entities(q: str = Query(..., min_length=1, description="Search term for services or incidents")):
    """Global search across services and incidents backed by FalkorDB."""
    try:
        graph = get_graph()
        from backend.app.graph_queries import search_graph_entities
        results = search_graph_entities(graph, q)
        return {
            "query": q,
            "results": results
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Search failed: {str(e)}"
        )

