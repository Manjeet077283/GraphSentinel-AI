"""
GraphSentinel AI - FastAPI Main Application
Central entrypoint configuring CORS, routes, lifecycle hooks, and error handling.
"""

import sys
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.app.config import settings
from backend.app.routes import health, overview, services, incidents, graph, chat, admin, auth, data_workspace, history
from backend.app.persistence import init_db

# Initialize operational persistence store (SQLite)
init_db()

app = FastAPI(
    title="GraphSentinel AI API",
    description="Graph-Powered Incident Intelligence Agent backed by FalkorDB",
    version="1.0.0",
    docs_url="/docs" if settings.ENABLE_DOCS else None,
    redoc_url="/redoc" if settings.ENABLE_DOCS else None
)

# CORS Middleware (Safely handle wildcards vs explicit origins with credentials)
allow_all_origins = "*" in settings.cors_origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if allow_all_origins else settings.cors_origins,
    allow_origin_regex=None if (allow_all_origins or settings.IS_PRODUCTION) else r"^https?://(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$",
    allow_credentials=not allow_all_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers under /api
app.include_router(auth.router, prefix="/api")
app.include_router(health.router, prefix="/api")
app.include_router(overview.router, prefix="/api")
app.include_router(services.router, prefix="/api")
app.include_router(incidents.router, prefix="/api")
app.include_router(graph.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(data_workspace.router, prefix="/api")
app.include_router(history.router, prefix="/api")
app.include_router(admin.router, prefix="/api")


@app.get("/")
def root_status():
    return {
        "app": "GraphSentinel AI",
        "tagline": "See the Impact. Find the Cause.",
        "version": "1.0.0",
        "status": "online",
        "docs": "/docs",
        "health": "/api/health",
        "overview": "/api/overview",
        "synthetic_dataset": True
    }


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "error": "InternalServerError",
            "message": str(exc),
            "path": str(request.url.path)
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host=settings.API_HOST, port=settings.API_PORT, reload=not settings.IS_PRODUCTION)
