"""
GraphSentinel AI - Health Route
Distinguishes API availability from database connectivity and AI provider status.
"""

from fastapi import APIRouter
from backend.app.config import settings
from backend.app.database import check_database_health

router = APIRouter(tags=["Health"])


@router.get("/health")
def get_health():
    """Returns application health, database connectivity, and AI provider status."""
    db_health = check_database_health()
    
    ai_status = {
        "gemini_configured": bool(settings.GEMINI_API_KEY),
        "model": settings.GEMINI_MODEL,
        "active_mode": "gemini_ai" if settings.GEMINI_API_KEY else "deterministic_fallback",
        "description": "Google Gemini with strict graph-fact grounding" if settings.GEMINI_API_KEY else "Deterministic Graph-Grounded Intelligence Engine"
    }

    is_healthy = db_health["connected"]
    status_str = "healthy" if is_healthy else "degraded"

    return {
        "status": status_str,
        "app_name": "GraphSentinel AI",
        "tagline": "See the Impact. Find the Cause.",
        "api_available": True,
        "database": db_health,
        "ai_provider": ai_status,
        "synthetic_data": True
    }
