"""
GraphSentinel AI - Real Investigation Tools for Agent & Graph Execution
Implements real callable backend tools for querying FalkorDB and SQLite persistence.
The AI agent grounds every response in the actual outputs of these tools.
"""

import re
from typing import Dict, Any, List, Optional
from backend.app.database import get_graph
from backend.app.graph_queries import (
    get_incident_detail,
    get_service_detail,
    get_incident_impact_analysis,
    list_incidents,
    list_services
)
from backend.app.persistence import get_db


def search_graph(query: str, label: Optional[str] = None) -> Dict[str, Any]:
    """
    Executes real parameterized Cypher pattern match against FalkorDB.
    Returns matched nodes across Services, Incidents, or Infrastructure.
    """
    graph = get_graph()
    clean_q = re.sub(r"[^a-zA-Z0-9_\-\s]", "", query).strip()
    if not clean_q:
        return {"status": "success", "results": [], "count": 0}

    results = []
    cypher_label = f":{label}" if label in ("Service", "Incident", "Infrastructure") else ""

    q = (
        f"MATCH (n{cypher_label}) "
        f"WHERE toLower(n.name) CONTAINS toLower($q) "
        f"   OR toLower(n.id) CONTAINS toLower($q) "
        f"   OR (exists(n.title) AND toLower(n.title) CONTAINS toLower($q)) "
        f"RETURN labels(n)[0] AS lbl, n.id AS id, coalesce(n.name, n.title, n.id) AS name, "
        f"       coalesce(n.status, 'UNKNOWN') AS status, coalesce(n.severity, '') AS severity "
        f"LIMIT 10"
    )
    try:
        res = graph.query(q, {"q": clean_q})
        for r in res.result_set:
            results.append({
                "label": str(r[0]),
                "id": str(r[1]),
                "name": str(r[2]),
                "status": str(r[3]),
                "severity": str(r[4])
            })
    except Exception:
        pass

    return {
        "status": "success",
        "results": results,
        "count": len(results)
    }


def get_incident_info(incident_id: str) -> Dict[str, Any]:
    """Retrieves verified incident facts, evidence nodes, and resolutions from FalkorDB."""
    graph = get_graph()
    clean_id = incident_id.upper()
    inc = get_incident_detail(graph, clean_id)
    if not inc:
        return {
            "status": "error",
            "message": f"Incident {incident_id} not found",
            "incident": None
        }
    inc_data = inc.model_dump() if hasattr(inc, "model_dump") else inc.dict()
    return {
        "status": "success",
        "incident_id": clean_id,
        "incident": inc_data
    }


def trace_dependencies(service_id: str, direction: str = "downstream", max_depth: int = 3) -> Dict[str, Any]:
    """
    Performs bounded graph traversal from service_id to trace upstream or downstream calls.
    Max depth bounded to 1-3 hops to prevent unbounded graph traversal.
    """
    graph = get_graph()
    depth = max(1, min(max_depth, 3))
    clean_svc = service_id.upper()

    if direction == "upstream":
        # Services that depend on this service
        q = (
            f"MATCH path = (caller:Service)-[:DEPENDS_ON*1..{depth}]->(target:Service {{id: $svc_id}}) "
            f"RETURN caller.id, caller.name, caller.criticality, caller.status, length(path) AS hops, "
            f"       [node in nodes(path) | node.name] AS pnames "
            f"ORDER BY hops ASC LIMIT 25"
        )
    else:
        # Services this service depends on
        q = (
            f"MATCH path = (source:Service {{id: $svc_id}})-[:DEPENDS_ON*1..{depth}]->(dep:Service) "
            f"RETURN dep.id, dep.name, dep.criticality, dep.status, length(path) AS hops, "
            f"       [node in nodes(path) | node.name] AS pnames "
            f"ORDER BY hops ASC LIMIT 25"
        )

    results = []
    try:
        res = graph.query(q, {"svc_id": clean_svc})
        for r in res.result_set:
            results.append({
                "service_id": str(r[0]),
                "service_name": str(r[1]),
                "criticality": str(r[2]),
                "status": str(r[3]),
                "hops": int(r[4]),
                "path": r[5]
            })
    except Exception:
        pass

    return {
        "status": "success",
        "root_service_id": clean_svc,
        "direction": direction,
        "hops_limit": depth,
        "total_nodes_found": len(results),
        "traversed_dependencies": results
    }


def find_similar_incidents(service_id: Optional[str] = None, keyword: Optional[str] = None) -> Dict[str, Any]:
    """Retrieves historical resolved incidents and successful remediation playbooks."""
    graph = get_graph()
    q = (
        "MATCH (i:Incident)-[:AFFECTS]->(s:Service), "
        "      (i)-[:RESOLVED_BY]->(r:Resolution) "
        "WHERE i.status = 'RESOLVED' "
    )
    params: Dict[str, Any] = {}
    if service_id:
        if service_id.upper().startswith("INC-"):
            q += "AND (i.id = $inc_id OR toLower(i.title) CONTAINS toLower($inc_id)) "
            params["inc_id"] = service_id.upper()
        else:
            q += "AND (s.id = $svc_id OR toLower(s.name) CONTAINS toLower($svc_id)) "
            params["svc_id"] = service_id
    if keyword:
        q += "AND (toLower(i.title) CONTAINS toLower($kw) OR toLower(i.description) CONTAINS toLower($kw)) "
        params["kw"] = keyword

    q += "RETURN i.id, i.title, s.id, s.name, r.id, r.description, r.outcome, r.effectiveness LIMIT 5"

    matches = []
    try:
        res = graph.query(q, params)
        for r in res.result_set:
            matches.append({
                "incident_id": str(r[0]),
                "title": str(r[1]),
                "service_id": str(r[2]),
                "service_name": str(r[3]),
                "resolution_id": str(r[4]),
                "remedy": str(r[5]),
                "outcome": str(r[6]),
                "effectiveness": str(r[7])
            })
    except Exception:
        pass

    return {
        "status": "success",
        "matches": matches,
        "count": len(matches)
    }


def lookup_resolutions(incident_id_or_keyword: str) -> Dict[str, Any]:
    """Retrieves confirmed resolution records attached to an incident or matching keyword in FalkorDB."""
    graph = get_graph()
    clean_val = incident_id_or_keyword.strip()
    results = []

    if clean_val.upper().startswith("INC-"):
        q = (
            "MATCH (i:Incident {id: $val})-[:RESOLVED_BY]->(r:Resolution) "
            "RETURN r.id, r.description, r.outcome, r.effectiveness"
        )
        params = {"val": clean_val.upper()}
    else:
        q = (
            "MATCH (r:Resolution) "
            "WHERE toLower(r.description) CONTAINS toLower($val) "
            "   OR toLower(r.outcome) CONTAINS toLower($val) "
            "RETURN r.id, r.description, r.outcome, r.effectiveness LIMIT 10"
        )
        params = {"val": clean_val}

    try:
        res = graph.query(q, params)
        for r in res.result_set:
            results.append({
                "resolution_id": str(r[0]),
                "description": str(r[1]),
                "outcome": str(r[2]),
                "effectiveness": str(r[3])
            })
    except Exception:
        pass

    return {
        "status": "success",
        "resolutions": results,
        "count": len(results)
    }


def analyze_uploaded_data(user_id: str, dataset_id: Optional[str] = None) -> Dict[str, Any]:
    """Inspects user-uploaded datasets and records to surface errors or anomalies."""
    conn = get_db()
    cursor = conn.cursor()

    if dataset_id:
        cursor.execute(
            """
            SELECT filename, file_type, record_count, valid_count, rejected_count, created_at
            FROM datasets WHERE id = ? AND user_id = ?
            """,
            (dataset_id, user_id)
        )
        ds = cursor.fetchone()
        if not ds:
            conn.close()
            return {"found": False, "message": "Dataset not found."}

        cursor.execute(
            """
            SELECT severity, count(*) AS cnt
            FROM dataset_records WHERE dataset_id = ? AND user_id = ?
            GROUP BY severity
            """,
            (dataset_id, user_id)
        )
        sev_counts = {r["severity"]: r["cnt"] for r in cursor.fetchall()}

        cursor.execute(
            """
            SELECT row_index, title, description, severity, status
            FROM dataset_records WHERE dataset_id = ? AND user_id = ? AND severity IN ('P1_CRITICAL', 'P2_HIGH')
            LIMIT 5
            """,
            (dataset_id, user_id)
        )
        critical_records = [dict(r) for r in cursor.fetchall()]
        conn.close()

        return {
            "found": True,
            "dataset_id": dataset_id,
            "filename": ds["filename"],
            "total_records": ds["record_count"],
            "severity_distribution": sev_counts,
            "critical_anomalies_detected": critical_records
        }

    # If no specific dataset, summarize all user datasets
    cursor.execute("SELECT count(*) AS total_datasets FROM datasets WHERE user_id = ?", (user_id,))
    total_ds = cursor.fetchone()["total_datasets"]
    conn.close()
    return {"total_user_datasets": total_ds}
