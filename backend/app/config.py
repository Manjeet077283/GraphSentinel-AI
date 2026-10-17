"""
GraphSentinel AI - Configuration Module
Reads configuration from environment variables and provides sanitized settings.
"""

import os
import re
from pathlib import Path
from typing import List, Optional
from dotenv import load_dotenv

# Load .env from root or backend directory
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(ROOT_DIR / ".env")
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

class Settings:
    # Environment & Deployment Mode
    ENVIRONMENT: str = (os.getenv("ENVIRONMENT") or os.getenv("ENV") or os.getenv("NODE_ENV") or "development").strip().lower()
    IS_PRODUCTION: bool = ENVIRONMENT in ("production", "prod")
    ENABLE_DOCS: bool = os.getenv("ENABLE_DOCS", "true" if not IS_PRODUCTION else "false").strip().lower() in ("true", "1", "yes")

    # FalkorDB settings (Supports local containers and FalkorDB Cloud)
    FALKORDB_HOST: str = (os.getenv("FALKORDB_HOST") or "localhost").strip()
    FALKORDB_PORT: int = int(os.getenv("FALKORDB_PORT") or "6379")
    FALKORDB_USERNAME: Optional[str] = (os.getenv("FALKORDB_USERNAME") or "").strip() or None
    FALKORDB_PASSWORD: Optional[str] = (os.getenv("FALKORDB_PASSWORD") or "").strip() or None
    FALKORDB_GRAPH: str = (os.getenv("FALKORDB_GRAPH") or "graphsentinel-ai").strip()
    FALKORDB_SSL: bool = (os.getenv("FALKORDB_SSL", "false")).strip().lower() in ("true", "1", "yes")
    FALKORDB_URL: Optional[str] = (os.getenv("FALKORDB_URL") or "").strip() or None

    # API settings (supports standard cloud PORT injection, e.g. Cloud Run, Render)
    API_PORT: int = int(os.getenv("PORT") or os.getenv("API_PORT") or "8000")
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
    
    # CORS settings
    @property
    def cors_origins(self) -> List[str]:
        raw = os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174,"
            "http://localhost:3000,http://127.0.0.1:3000,http://localhost:4173,http://127.0.0.1:4173,"
            "http://localhost:8000,http://127.0.0.1:8000,http://[::1]:5173,http://[::1]:3000,http://[::1]:4173"
        )
        return [origin.strip() for origin in raw.split(",") if origin.strip()]


    # AI settings
    GEMINI_API_KEY: Optional[str] = (os.getenv("GEMINI_API_KEY") or "").strip() or None
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

    # Security & Admin secrets
    # In production, require explicit ADMIN_SECRET to prevent unauthorized database seeding
    ADMIN_SECRET: Optional[str] = (
        (os.getenv("ADMIN_SECRET") or "").strip()
        or ("graphsentinel-admin-dev" if not IS_PRODUCTION else None)
    )

    # Initial admin password for bootstrap (optional in dev, configurable in prod)
    INITIAL_ADMIN_PASSWORD: Optional[str] = (os.getenv("INITIAL_ADMIN_PASSWORD") or "").strip() or None

    # Safe display info (never expose real credentials)
    @property
    def sanitized_falkordb_url(self) -> str:
        if self.FALKORDB_URL:
            return re.sub(r"://([^:]+):([^@]+)@", r"://\1:***@", self.FALKORDB_URL)
        auth_part = "***@" if self.FALKORDB_PASSWORD else ""
        scheme = "falkordbs" if self.FALKORDB_SSL else "falkordb"
        return f"{scheme}://{auth_part}{self.FALKORDB_HOST}:{self.FALKORDB_PORT}/{self.FALKORDB_GRAPH}"

settings = Settings()
