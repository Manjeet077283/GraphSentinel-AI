"""
GraphSentinel AI - Configuration Module
Reads configuration from environment variables and provides sanitized settings.
"""

import os
from pathlib import Path
from typing import List, Optional
from dotenv import load_dotenv

# Load .env from root or backend directory
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(ROOT_DIR / ".env")
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

class Settings:
    # FalkorDB settings
    FALKORDB_HOST: str = os.getenv("FALKORDB_HOST", "localhost")
    FALKORDB_PORT: int = int(os.getenv("FALKORDB_PORT", "6379"))
    FALKORDB_USERNAME: Optional[str] = os.getenv("FALKORDB_USERNAME") or None
    FALKORDB_PASSWORD: Optional[str] = os.getenv("FALKORDB_PASSWORD") or None
    FALKORDB_GRAPH: str = os.getenv("FALKORDB_GRAPH", "graphsentinel")

    # API settings
    API_PORT: int = int(os.getenv("API_PORT", "8000"))
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
    
    # CORS settings
    @property
    def cors_origins(self) -> List[str]:
        raw = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000")
        return [origin.strip() for origin in raw.split(",") if origin.strip()]

    # AI settings
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY") or None
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

    # Admin secret
    ADMIN_SECRET: str = os.getenv("ADMIN_SECRET", "graphsentinel-admin-dev")

    # Safe display info (never expose real credentials)
    @property
    def sanitized_falkordb_url(self) -> str:
        auth_part = "***@" if self.FALKORDB_PASSWORD else ""
        return f"falkordb://{auth_part}{self.FALKORDB_HOST}:{self.FALKORDB_PORT}/{self.FALKORDB_GRAPH}"

settings = Settings()
