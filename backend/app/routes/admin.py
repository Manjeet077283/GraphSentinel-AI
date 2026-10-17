"""
GraphSentinel AI - Admin Route
Protected endpoint for reseeding or wiping synthetic graph datasets.
"""

from pathlib import Path
from typing import Optional
from fastapi import APIRouter, HTTPException, Header, Query
from backend.app.config import settings
from backend.seed import seed_database

router = APIRouter(prefix="/admin", tags=["Admin & Database Seeding"])


@router.post("/seed")
def trigger_seed(
    wipe: bool = Query(False, description="Wipe existing graph data before seeding"),
    x_admin_secret: Optional[str] = Header(None, description="Admin secret key for authorization")
):
    """
    Protected database seeding endpoint.
    Requires X-Admin-Secret header matching configured ADMIN_SECRET.
    """
    if not settings.ADMIN_SECRET or x_admin_secret != settings.ADMIN_SECRET:
        raise HTTPException(
            status_code=401,
            detail="Unauthorized: invalid or missing X-Admin-Secret header."
        )

    try:
        data_dir = Path(__file__).resolve().parent.parent.parent / "data"
        summary = seed_database(data_dir, wipe_first=wipe)
        return {
            "message": "FalkorDB graph seeded successfully.",
            "wipe_performed": wipe,
            "summary": summary
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Seeding failed: {str(e)}"
        )
