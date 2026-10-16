"""
GraphSentinel AI - FalkorDB Idempotent Database Seeder
Seeds synthetic services, infrastructure, incidents, evidence, and resolutions
into FalkorDB using parameterized Cypher queries. Rerunning is safe and idempotent.
"""

import sys
import time
import logging
from pathlib import Path
from typing import Dict, Any

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.app.config import settings
from backend.app.database import get_graph
from backend.validator import validate_dataset, load_dataset

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("graphsentinel.seed")


def create_indices(graph):
    """Create indices for fast ID lookups if supported."""
    index_queries = [
        "CREATE INDEX FOR (s:Service) ON (s.id)",
        "CREATE INDEX FOR (i:Infrastructure) ON (i.id)",
        "CREATE INDEX FOR (inc:Incident) ON (inc.id)",
        "CREATE INDEX FOR (e:Evidence) ON (e.id)",
        "CREATE INDEX FOR (r:Resolution) ON (r.id)"
    ]
    for q in index_queries:
        try:
            graph.query(q)
        except Exception as e:
            # FalkorDB may already have the index or use slightly different syntax depending on version
            logger.debug(f"Index notice on query '{q}': {e}")


def seed_database(data_dir: Path, wipe_first: bool = False) -> Dict[str, Any]:
    """
    Seeds the FalkorDB database with synthetic records.
    - Validates dataset integrity first.
    - Uses MERGE to ensure idempotency.
    - Returns summary statistics of nodes and edges created/present.
    """
    logger.info("Starting dataset validation...")
    is_valid, errors = validate_dataset(data_dir)
    if not is_valid:
        error_msg = f"Cannot seed database: dataset validation failed with {len(errors)} errors: {errors[:3]}"
        logger.error(error_msg)
        raise ValueError(error_msg)

    dataset = load_dataset(data_dir)
    graph = get_graph()
    
    start_time = time.time()

    if wipe_first:
        logger.warning(f"Wiping existing graph data in '{settings.FALKORDB_GRAPH}' as requested...")
        try:
            graph.query("MATCH (n) DETACH DELETE n")
        except Exception as e:
            logger.warning(f"Could not wipe graph: {e}")

    create_indices(graph)

    # 1. Seed Services
    logger.info("Seeding Services...")
    services_count = 0
    for s in dataset["services"]:
        q = (
            "MERGE (s:Service {id: $id}) "
            "SET s.name = $name, "
            "    s.description = $desc, "
            "    s.criticality = $crit, "
            "    s.status = $status, "
            "    s.team = $team"
        )
        params = {
            "id": s["id"],
            "name": s["name"],
            "desc": s["description"],
            "crit": s["criticality"],
            "status": s["status"],
            "team": s["team"]
        }
        graph.query(q, params)
        services_count += 1

    # 2. Seed Infrastructure
    logger.info("Seeding Infrastructure...")
    infra_count = 0
    for i in dataset["infrastructure"]:
        q = (
            "MERGE (inf:Infrastructure {id: $id}) "
            "SET inf.name = $name, "
            "    inf.type = $type, "
            "    inf.environment = $env, "
            "    inf.status = $status"
        )
        params = {
            "id": i["id"],
            "name": i["name"],
            "type": i["type"],
            "env": i["environment"],
            "status": i["status"]
        }
        graph.query(q, params)
        infra_count += 1

    # 3. Seed Dependencies
    logger.info("Seeding Dependencies (Service-to-Service and Service-to-Infra)...")
    service_deps_count = 0
    for dep in dataset["dependencies"].get("service_dependencies", []):
        q = (
            "MATCH (a:Service {id: $src}), (b:Service {id: $tgt}) "
            "MERGE (a)-[r:DEPENDS_ON]->(b)"
        )
        graph.query(q, {"src": dep["source"], "tgt": dep["target"]})
        service_deps_count += 1

    infra_conns_count = 0
    for conn in dataset["dependencies"].get("infrastructure_connections", []):
        q = (
            "MATCH (s:Service {id: $src}), (inf:Infrastructure {id: $tgt}) "
            "MERGE (s)-[r:CONNECTS_TO]->(inf)"
        )
        graph.query(q, {"src": conn["source"], "tgt": conn["target"]})
        infra_conns_count += 1

    # 4. Seed Incidents and AFFECTS relationships
    logger.info("Seeding Incidents...")
    incidents_count = 0
    for inc in dataset["incidents"]:
        q = (
            "MERGE (i:Incident {id: $id}) "
            "SET i.title = $title, "
            "    i.description = $desc, "
            "    i.severity = $sev, "
            "    i.status = $status, "
            "    i.affected_service_id = $aff_svc, "
            "    i.created_at = $created_at, "
            "    i.updated_at = $updated_at"
        )
        params = {
            "id": inc["id"],
            "title": inc["title"],
            "desc": inc["description"],
            "sev": inc["severity"],
            "status": inc["status"],
            "aff_svc": inc["affected_service_id"],
            "created_at": inc["created_at"],
            "updated_at": inc["updated_at"]
        }
        graph.query(q, params)

        # Connect Incident -[:AFFECTS]-> Service
        aff_q = (
            "MATCH (i:Incident {id: $inc_id}), (s:Service {id: $svc_id}) "
            "MERGE (i)-[:AFFECTS]->(s)"
        )
        graph.query(aff_q, {"inc_id": inc["id"], "svc_id": inc["affected_service_id"]})
        incidents_count += 1

    # 5. Seed Evidence and SUPPORTED_BY relationships
    logger.info("Seeding Evidence...")
    evidence_count = 0
    for ev in dataset["evidence"]:
        q = (
            "MERGE (e:Evidence {id: $id}) "
            "SET e.source_type = $source_type, "
            "    e.description = $desc, "
            "    e.timestamp = $ts, "
            "    e.metric_name = $m_name, "
            "    e.metric_value = $m_val, "
            "    e.unit = $unit"
        )
        params = {
            "id": ev["id"],
            "source_type": ev["source_type"],
            "desc": ev["description"],
            "ts": ev["timestamp"],
            "m_name": ev.get("metric_name") or "",
            "m_val": float(ev["metric_value"]) if ev.get("metric_value") is not None else -1.0,
            "unit": ev.get("unit") or ""
        }
        graph.query(q, params)

        # Connect Incident -[:SUPPORTED_BY]-> Evidence
        sup_q = (
            "MATCH (i:Incident {id: $inc_id}), (e:Evidence {id: $ev_id}) "
            "MERGE (i)-[:SUPPORTED_BY]->(e)"
        )
        graph.query(sup_q, {"inc_id": ev["incident_id"], "ev_id": ev["id"]})
        evidence_count += 1

    # 6. Seed Resolutions and RESOLVED_BY relationships
    logger.info("Seeding Resolutions...")
    resolutions_count = 0
    for res in dataset["resolutions"]:
        q = (
            "MERGE (r:Resolution {id: $id}) "
            "SET r.description = $desc, "
            "    r.outcome = $outcome, "
            "    r.effectiveness = $eff, "
            "    r.applied_at = $applied_at"
        )
        params = {
            "id": res["id"],
            "desc": res["description"],
            "outcome": res["outcome"],
            "eff": res["effectiveness"],
            "applied_at": res.get("applied_at") or ""
        }
        graph.query(q, params)

        # Connect Incident -[:RESOLVED_BY]-> Resolution
        res_q = (
            "MATCH (i:Incident {id: $inc_id}), (r:Resolution {id: $res_id}) "
            "MERGE (i)-[:RESOLVED_BY]->(r)"
        )
        graph.query(res_q, {"inc_id": res["incident_id"], "res_id": res["id"]})
        resolutions_count += 1

    elapsed = round(time.time() - start_time, 2)

    # Verification query
    node_stats = graph.query("MATCH (n) RETURN labels(n)[0] AS lbl, count(n) AS cnt").result_set
    rel_stats = graph.query("MATCH ()-[r]->() RETURN type(r) AS t, count(r) AS cnt").result_set

    summary = {
        "status": "success",
        "duration_seconds": elapsed,
        "nodes_seeded": {
            "services": services_count,
            "infrastructure": infra_count,
            "incidents": incidents_count,
            "evidence": evidence_count,
            "resolutions": resolutions_count,
            "total": services_count + infra_count + incidents_count + evidence_count + resolutions_count
        },
        "relationships_seeded": {
            "service_dependencies": service_deps_count,
            "infrastructure_connections": infra_conns_count,
            "affects": incidents_count,
            "supported_by": evidence_count,
            "resolved_by": resolutions_count,
            "total": service_deps_count + infra_conns_count + incidents_count + evidence_count + resolutions_count
        },
        "graph_node_counts": {str(row[0]): int(row[1]) for row in node_stats},
        "graph_relationship_counts": {str(row[0]): int(row[1]) for row in rel_stats}
    }

    logger.info(f"Seeding completed successfully in {elapsed}s. Total nodes: {summary['nodes_seeded']['total']}, relationships: {summary['relationships_seeded']['total']}")
    return summary


if __name__ == "__main__":
    wipe = "--wipe" in sys.argv
    data_path = Path(__file__).resolve().parent / "data"
    result = seed_database(data_path, wipe_first=wipe)
    print("Seed summary:")
    import pprint
    pprint.pprint(result)
