"""
GraphSentinel AI - FalkorDB Database Connection Manager
Provides database connection, graph selection, and connectivity health probes.
"""

import time
import logging
from typing import Optional, Dict, Any
from falkordb import FalkorDB
from falkordb.graph import Graph
from backend.app.config import settings

logger = logging.getLogger("graphsentinel.database")

_client_instance: Optional[FalkorDB] = None

def get_falkordb_client() -> FalkorDB:
    """Return a FalkorDB client configured from application settings."""
    global _client_instance
    if _client_instance is None:
        kwargs: Dict[str, Any] = {
            "host": settings.FALKORDB_HOST,
            "port": settings.FALKORDB_PORT,
        }
        if settings.FALKORDB_USERNAME:
            kwargs["username"] = settings.FALKORDB_USERNAME
        if settings.FALKORDB_PASSWORD:
            kwargs["password"] = settings.FALKORDB_PASSWORD
        
        _client_instance = FalkorDB(**kwargs)
    return _client_instance

def get_graph(graph_name: Optional[str] = None) -> Graph:
    """Select and return a FalkorDB graph instance."""
    client = get_falkordb_client()
    target_graph = graph_name or settings.FALKORDB_GRAPH
    return client.select_graph(target_graph)

def check_database_health() -> Dict[str, Any]:
    """Perform a live health probe against FalkorDB and return connectivity status."""
    start_time = time.time()
    try:
        client = get_falkordb_client()
        # Test basic command
        client.connection.ping()
        graph = get_graph()
        # Run lightweight probe query
        res = graph.query("RETURN 1 AS ping")
        latency_ms = round((time.time() - start_time) * 1000, 2)
        return {
            "connected": True,
            "latency_ms": latency_ms,
            "graph_name": settings.FALKORDB_GRAPH,
            "target": f"{settings.FALKORDB_HOST}:{settings.FALKORDB_PORT}",
            "error": None
        }
    except Exception as e:
        latency_ms = round((time.time() - start_time) * 1000, 2)
        logger.warning(f"FalkorDB health check failed: {e}")
        return {
            "connected": False,
            "latency_ms": latency_ms,
            "graph_name": settings.FALKORDB_GRAPH,
            "target": f"{settings.FALKORDB_HOST}:{settings.FALKORDB_PORT}",
            "error": str(e)
        }
