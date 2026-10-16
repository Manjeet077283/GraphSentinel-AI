"""
GraphSentinel AI - Overview Dashboard Route
Provides summary metrics, distributions, and recent incidents from FalkorDB.
"""

from fastapi import APIRouter, HTTPException
from backend.app.database import get_graph
from backend.app.schemas import OverviewResponse
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
