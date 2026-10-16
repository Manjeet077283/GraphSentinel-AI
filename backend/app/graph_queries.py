"""
GraphSentinel AI - Parameterized FalkorDB Cypher Queries
All database interactions are parameterized and sanitized.
"""

from typing import List, Dict, Any, Optional
from falkordb.graph import Graph
from backend.app.schemas import (
    ServiceSummary,
    ServiceDetail,
    InfrastructureSummary,
    IncidentSummary,
    IncidentDetail,
    EvidenceItem,
    ResolutionItem,
    OverviewResponse,
    SeverityCounts,
    StatusCounts,
    ServiceHealthCounts,
    ImpactAnalysisResponse,
    ImpactedService,
    CytoNode,
    CytoNodeData,
    CytoEdge,
    CytoEdgeData,
    GraphResponse
)


def get_overview_metrics(graph: Graph) -> OverviewResponse:
    """Computes high-level KPI metrics across services and incidents."""
    # 1. Total services
    res = graph.query("MATCH (s:Service) RETURN count(s) AS total")
    total_services = int(res.result_set[0][0]) if res.result_set else 0

    # 2. Service health distribution
    health_counts = {"HEALTHY": 0, "DEGRADED": 0, "CRITICAL": 0}
    res = graph.query("MATCH (s:Service) RETURN s.status AS status, count(s) AS cnt")
    for row in res.result_set:
        st = str(row[0])
        if st in health_counts:
            health_counts[st] = int(row[1])

    # 3. Incident severity distribution
    sev_counts = {"P1_CRITICAL": 0, "P2_HIGH": 0, "P3_MEDIUM": 0, "P4_LOW": 0}
    res = graph.query("MATCH (i:Incident) RETURN i.severity AS sev, count(i) AS cnt")
    for row in res.result_set:
        sv = str(row[0])
        if sv in sev_counts:
            sev_counts[sv] = int(row[1])

    # 4. Incident status distribution
    stat_counts = {"OPEN": 0, "INVESTIGATING": 0, "MITIGATED": 0, "RESOLVED": 0}
    res = graph.query("MATCH (i:Incident) RETURN i.status AS status, count(i) AS cnt")
    for row in res.result_set:
        st = str(row[0])
        if st in stat_counts:
            stat_counts[st] = int(row[1])

    open_incidents = stat_counts.get("OPEN", 0) + stat_counts.get("INVESTIGATING", 0)
    critical_incidents = sev_counts.get("P1_CRITICAL", 0)

    # 5. Potentially affected services (services that depend directly or indirectly on currently open/critical incident root services)
    aff_q = (
        "MATCH (i:Incident)-[:AFFECTS]->(root:Service) "
        "WHERE i.status IN ['OPEN', 'INVESTIGATING'] "
        "OPTIONAL MATCH (dependent:Service)-[:DEPENDS_ON*1..3]->(root) "
        "RETURN count(DISTINCT dependent) AS affected_count"
    )
    aff_res = graph.query(aff_q)
    potentially_affected = int(aff_res.result_set[0][0]) if aff_res.result_set and aff_res.result_set[0][0] is not None else 0

    # 6. Recent incidents
    recent_q = (
        "MATCH (i:Incident)-[:AFFECTS]->(s:Service) "
        "RETURN i.id, i.title, i.description, i.severity, i.status, s.id, s.name, i.created_at, i.updated_at "
        "ORDER BY i.created_at DESC LIMIT 6"
    )
    recent_res = graph.query(recent_q)
    recent_list = []
    for r in recent_res.result_set:
        recent_list.append(IncidentSummary(
            id=str(r[0]),
            title=str(r[1]),
            description=str(r[2]),
            severity=str(r[3]),
            status=str(r[4]),
            affected_service_id=str(r[5]),
            affected_service_name=str(r[6]),
            created_at=str(r[7]),
            updated_at=str(r[8])
        ))

    return OverviewResponse(
        total_services=total_services,
        open_incidents=open_incidents,
        critical_incidents=critical_incidents,
        potentially_affected_services=potentially_affected,
        severity_distribution=SeverityCounts(**sev_counts),
        status_distribution=StatusCounts(**stat_counts),
        service_health_distribution=ServiceHealthCounts(**health_counts),
        recent_incidents=recent_list,
        database_connected=True
    )


def list_services(graph: Graph, status: Optional[str] = None, criticality: Optional[str] = None) -> List[ServiceSummary]:
    """Retrieves services with optional filters."""
    conditions = []
    params: Dict[str, Any] = {}
    if status:
        conditions.append("s.status = $status")
        params["status"] = status
    if criticality:
        conditions.append("s.criticality = $criticality")
        params["criticality"] = criticality

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
    q = f"MATCH (s:Service) {where_clause} RETURN s.id, s.name, s.description, s.criticality, s.status, s.team ORDER BY s.name ASC"
    res = graph.query(q, params)

    services = []
    for row in res.result_set:
        services.append(ServiceSummary(
            id=str(row[0]),
            name=str(row[1]),
            description=str(row[2]),
            criticality=str(row[3]),
            status=str(row[4]),
            team=str(row[5])
        ))
    return services


def get_service_detail(graph: Graph, service_id: str) -> Optional[ServiceDetail]:
    """Retrieves full service details, upstream/downstream dependencies, and connected infrastructure."""
    svc_q = "MATCH (s:Service {id: $id}) RETURN s.id, s.name, s.description, s.criticality, s.status, s.team"
    res = graph.query(svc_q, {"id": service_id})
    if not res.result_set:
        return None
    r = res.result_set[0]
    base = ServiceSummary(
        id=str(r[0]),
        name=str(r[1]),
        description=str(r[2]),
        criticality=str(r[3]),
        status=str(r[4]),
        team=str(r[5])
    )

    # Upstream (services that depend on this service)
    up_q = "MATCH (up:Service)-[:DEPENDS_ON]->(s:Service {id: $id}) RETURN up.id, up.name, up.criticality, up.status"
    up_res = graph.query(up_q, {"id": service_id})
    upstreams = [
        {"id": str(x[0]), "name": str(x[1]), "criticality": str(x[2]), "status": str(x[3])}
        for x in up_res.result_set
    ]

    # Downstream (services this service depends on)
    down_q = "MATCH (s:Service {id: $id})-[:DEPENDS_ON]->(down:Service) RETURN down.id, down.name, down.criticality, down.status"
    down_res = graph.query(down_q, {"id": service_id})
    downstreams = [
        {"id": str(x[0]), "name": str(x[1]), "criticality": str(x[2]), "status": str(x[3])}
        for x in down_res.result_set
    ]

    # Infrastructure
    inf_q = "MATCH (s:Service {id: $id})-[:CONNECTS_TO]->(inf:Infrastructure) RETURN inf.id, inf.name, inf.type, inf.environment, inf.status"
    inf_res = graph.query(inf_q, {"id": service_id})
    infras = [
        {"id": str(x[0]), "name": str(x[1]), "type": str(x[2]), "environment": str(x[3]), "status": str(x[4])}
        for x in inf_res.result_set
    ]

    # Active incidents affecting this service
    inc_q = "MATCH (inc:Incident)-[:AFFECTS]->(s:Service {id: $id}) WHERE inc.status IN ['OPEN', 'INVESTIGATING'] RETURN inc.id, inc.title, inc.severity, inc.status"
    inc_res = graph.query(inc_q, {"id": service_id})
    active_incs = [
        {"id": str(x[0]), "title": str(x[1]), "severity": str(x[2]), "status": str(x[3])}
        for x in inc_res.result_set
    ]

    return ServiceDetail(
        **base.model_dump(),
        upstream_dependencies=upstreams,
        downstream_dependencies=downstreams,
        connected_infrastructure=infras,
        active_incidents=active_incs
    )


def list_incidents(
    graph: Graph,
    status: Optional[str] = None,
    severity: Optional[str] = None,
    service_id: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 50
) -> List[IncidentSummary]:
    """Retrieves a list of incidents with filters and search."""
    conditions = []
    params: Dict[str, Any] = {"limit": limit}

    if status:
        conditions.append("i.status = $status")
        params["status"] = status
    if severity:
        conditions.append("i.severity = $severity")
        params["severity"] = severity
    if service_id:
        conditions.append("s.id = $service_id")
        params["service_id"] = service_id

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
    q = (
        f"MATCH (i:Incident)-[:AFFECTS]->(s:Service) "
        f"{where_clause} "
        f"RETURN i.id, i.title, i.description, i.severity, i.status, s.id, s.name, i.created_at, i.updated_at "
        f"ORDER BY i.created_at DESC LIMIT $limit"
    )
    res = graph.query(q, params)

    incidents = []
    for r in res.result_set:
        title = str(r[1])
        desc = str(r[2])
        if search:
            s_lower = search.lower()
            if s_lower not in title.lower() and s_lower not in desc.lower() and s_lower not in str(r[0]).lower():
                continue

        incidents.append(IncidentSummary(
            id=str(r[0]),
            title=title,
            description=desc,
            severity=str(r[3]),
            status=str(r[4]),
            affected_service_id=str(r[5]),
            affected_service_name=str(r[6]),
            created_at=str(r[7]),
            updated_at=str(r[8])
        ))
    return incidents


def get_incident_impact_analysis(graph: Graph, incident_id: str, max_depth: int = 3) -> Optional[ImpactAnalysisResponse]:
    """
    Performs graph traversal to discover services impacted by this incident.
    Traverses (dependent:Service)-[:DEPENDS_ON*1..max_depth]->(root:Service).
    Distinguishes confirmed failures from potential cascade risks.
    """
    max_depth = max(1, min(max_depth, 5))

    # Retrieve root service for incident
    root_q = "MATCH (i:Incident {id: $id})-[:AFFECTS]->(s:Service) RETURN s.id, s.name, s.status, s.criticality"
    root_res = graph.query(root_q, {"id": incident_id})
    if not root_res.result_set:
        return None
    root_id = str(root_res.result_set[0][0])
    root_name = str(root_res.result_set[0][1])

    # Traversal query: find all services that depend on root up to max_depth
    # Query paths step by step or with variable length path
    # In FalkorDB Cypher:
    path_q = (
        f"MATCH p = (dep:Service)-[:DEPENDS_ON*1..{max_depth}]->(root:Service {{id: $root_id}}) "
        f"RETURN dep.id, dep.name, dep.criticality, dep.status, length(p) AS hops, "
        f"[n in nodes(p) | n.id] AS path_nodes"
    )
    res = graph.query(path_q, {"root_id": root_id})

    impacted_map: Dict[str, ImpactedService] = {}
    all_paths: List[List[str]] = []

    for r in res.result_set:
        dep_id = str(r[0])
        dep_name = str(r[1])
        crit = str(r[2])
        status = str(r[3])
        hops = int(r[4])
        path_nodes = [str(x) for x in r[5]]
        all_paths.append(path_nodes)

        # Impact level distinction:
        # If status is CRITICAL or DEGRADED, it's a confirmed failure / degradation.
        # Otherwise, it's a POTENTIAL_RISK based on dependency topology.
        impact_level = "CONFIRMED_DEGRADATION" if status in ["CRITICAL", "DEGRADED"] else "POTENTIAL_CASCADE_RISK"

        # Keep shortest hops if visited via multiple paths
        if dep_id not in impacted_map or hops < impacted_map[dep_id].hops:
            impacted_map[dep_id] = ImpactedService(
                service_id=dep_id,
                service_name=dep_name,
                criticality=crit,
                current_status=status,
                hops=hops,
                dependency_path=path_nodes,
                impact_level=impact_level
            )

    impacted_services = sorted(impacted_map.values(), key=lambda x: (x.hops, x.criticality != "TIER_1"))
    total_impacted = len(impacted_services)

    summary_text = (
        f"Incident {incident_id} affects '{root_name}' ({root_id}). Graph traversal up to depth {max_depth} "
        f"identified {total_impacted} dependent service(s) at risk. "
        f"Confirmed degraded dependents: {sum(1 for s in impacted_services if s.impact_level == 'CONFIRMED_DEGRADATION')}; "
        f"Potential cascade risks: {sum(1 for s in impacted_services if s.impact_level == 'POTENTIAL_CASCADE_RISK')}."
    )

    return ImpactAnalysisResponse(
        incident_id=incident_id,
        root_service_id=root_id,
        root_service_name=root_name,
        max_depth=max_depth,
        total_impacted_services=total_impacted,
        impacted_services=impacted_services,
        impact_summary=summary_text,
        paths=all_paths
    )


def get_incident_detail(graph: Graph, incident_id: str) -> Optional[IncidentDetail]:
    """Retrieves full incident investigation payload including evidence, resolutions, and impact."""
    inc_q = (
        "MATCH (i:Incident {id: $id})-[:AFFECTS]->(s:Service) "
        "RETURN i.id, i.title, i.description, i.severity, i.status, s.id, s.name, s.description, s.criticality, s.status, s.team, i.created_at, i.updated_at"
    )
    inc_res = graph.query(inc_q, {"id": incident_id})
    if not inc_res.result_set:
        return None
    r = inc_res.result_set[0]

    affected_svc = ServiceSummary(
        id=str(r[5]),
        name=str(r[6]),
        description=str(r[7]),
        criticality=str(r[8]),
        status=str(r[9]),
        team=str(r[10])
    )

    # Evidence
    ev_q = (
        "MATCH (i:Incident {id: $id})-[:SUPPORTED_BY]->(e:Evidence) "
        "RETURN e.id, e.source_type, e.description, e.timestamp, e.metric_name, e.metric_value, e.unit "
        "ORDER BY e.timestamp ASC"
    )
    ev_res = graph.query(ev_q, {"id": incident_id})
    evidence_list = []
    for er in ev_res.result_set:
        m_val = float(er[5]) if er[5] is not None and float(er[5]) >= 0 else None
        evidence_list.append(EvidenceItem(
            id=str(er[0]),
            source_type=str(er[1]),
            description=str(er[2]),
            timestamp=str(er[3]),
            metric_name=str(er[4]) if er[4] else None,
            metric_value=m_val,
            unit=str(er[6]) if er[6] else None
        ))

    # Resolutions
    res_q = (
        "MATCH (i:Incident {id: $id})-[:RESOLVED_BY]->(r:Resolution) "
        "RETURN r.id, r.description, r.outcome, r.effectiveness, r.applied_at"
    )
    res_res = graph.query(res_q, {"id": incident_id})
    resolutions_list = [
        ResolutionItem(
            id=str(rr[0]),
            description=str(rr[1]),
            outcome=str(rr[2]),
            effectiveness=str(rr[3]),
            applied_at=str(rr[4]) if rr[4] else None
        )
        for rr in res_res.result_set
    ]

    # Connected Infrastructure
    inf_q = (
        "MATCH (s:Service {id: $svc_id})-[:CONNECTS_TO]->(inf:Infrastructure) "
        "RETURN inf.id, inf.name, inf.type, inf.environment, inf.status"
    )
    inf_res = graph.query(inf_q, {"svc_id": affected_svc.id})
    infras = [
        InfrastructureSummary(
            id=str(ir[0]),
            name=str(ir[1]),
            type=str(ir[2]),
            environment=str(ir[3]),
            status=str(ir[4])
        )
        for ir in inf_res.result_set
    ]

    # Related Historical Incidents (same service or adjacent services)
    hist_q = (
        "MATCH (h:Incident)-[:AFFECTS]->(target:Service) "
        "WHERE (target.id = $svc_id OR (target)-[:DEPENDS_ON]->(:Service {id: $svc_id})) "
        "  AND h.id <> $id AND h.status IN ['RESOLVED', 'MITIGATED'] "
        "OPTIONAL MATCH (h)-[:RESOLVED_BY]->(r:Resolution) "
        "RETURN h.id, h.title, h.severity, target.id, target.name, r.description, r.outcome, r.effectiveness "
        "LIMIT 4"
    )
    hist_res = graph.query(hist_q, {"svc_id": affected_svc.id, "id": incident_id})
    historical = []
    for hr in hist_res.result_set:
        historical.append({
            "incident_id": str(hr[0]),
            "title": str(hr[1]),
            "severity": str(hr[2]),
            "service_id": str(hr[3]),
            "service_name": str(hr[4]),
            "resolution_summary": str(hr[5]) if hr[5] else None,
            "outcome": str(hr[6]) if hr[6] else None,
            "effectiveness": str(hr[7]) if hr[7] else None,
            "relevance": f"Historical incident affecting {hr[4]} with recorded resolution outcome {hr[6]}"
        })

    # Impact analysis
    impact = get_incident_impact_analysis(graph, incident_id, max_depth=3)

    # Formulate diagnostic hypotheses and safe advisory actions based on evidence and graph topology
    hypotheses = []
    recommendations = []

    # Check evidence indicators
    has_db_evidence = any("pool" in e.description.lower() or "connection" in e.description.lower() or "postgres" in e.description.lower() for e in evidence_list)
    has_timeout_evidence = any("timeout" in e.description.lower() or "latency" in e.description.lower() for e in evidence_list)
    has_oom_evidence = any("oom" in e.description.lower() or "memory" in e.description.lower() for e in evidence_list)

    if has_db_evidence:
        hypotheses.append("Database connection pool exhaustion or query lock stall is starving request threads.")
        recommendations.append("Inspect pg_stat_activity on primary database for unclosed 'idle in transaction' connections.")
        recommendations.append("Verify HikariCP connection pool timeout and max pool size configurations.")
    if has_timeout_evidence:
        hypotheses.append("Upstream or external network latency breach causing blocking socket reads.")
        recommendations.append("Check circuit breaker state and verify outbound payment acquirer latency metrics.")
    if has_oom_evidence:
        hypotheses.append("Memory leak or untruncated heap buffers triggering container cgroup OOMKills.")
        recommendations.append("Inspect container memory limits and collect heap dump from restarting pod replicas.")

    if not hypotheses:
        hypotheses.append(f"Degradation on {affected_svc.name} triggered by resource contention or downstream dependency failure.")
        recommendations.append(f"Review real-time application logs and metrics for {affected_svc.name}.")

    recommendations.append("Check historical resolutions from similar incidents before applying production changes.")
    recommendations.append("Advisory: All remediation actions require human on-call engineer review and approval.")

    return IncidentDetail(
        id=str(r[0]),
        title=str(r[1]),
        description=str(r[2]),
        severity=str(r[3]),
        status=str(r[4]),
        affected_service_id=affected_svc.id,
        affected_service_name=affected_svc.name,
        created_at=str(r[11]),
        updated_at=str(r[12]),
        affected_service=affected_svc,
        evidence=evidence_list,
        resolutions=resolutions_list,
        impact_analysis=impact,
        related_historical_incidents=historical,
        connected_infrastructure=infras,
        diagnostic_hypotheses=hypotheses,
        recommended_actions=recommendations
    )


def get_cytoscape_graph(
    graph: Graph,
    include_evidence: bool = True,
    incident_id: Optional[str] = None,
    service_id: Optional[str] = None
) -> GraphResponse:
    """
    Constructs a Cytoscape.js compatible graph payload from FalkorDB.
    Supports filtering to sub-graphs focused around an incident or service.
    """
    nodes_map: Dict[str, CytoNode] = {}
    edges_map: Dict[str, CytoEdge] = {}

    # 1. Services
    svc_q = "MATCH (s:Service) RETURN s.id, s.name, s.criticality, s.status, s.team"
    svc_res = graph.query(svc_q)
    for r in svc_res.result_set:
        sid = str(r[0])
        nodes_map[sid] = CytoNode(data=CytoNodeData(
            id=sid,
            label=str(r[1]),
            type="Service",
            name=str(r[1]),
            criticality=str(r[2]),
            status=str(r[3]),
            team=str(r[4])
        ))

    # 2. Infrastructure
    inf_q = "MATCH (i:Infrastructure) RETURN i.id, i.name, i.type, i.environment, i.status"
    inf_res = graph.query(inf_q)
    for r in inf_res.result_set:
        iid = str(r[0])
        nodes_map[iid] = CytoNode(data=CytoNodeData(
            id=iid,
            label=str(r[1]),
            type="Infrastructure",
            name=str(r[1]),
            env=str(r[3]),
            status=str(r[4])
        ))

    # 3. Service Dependencies
    dep_q = "MATCH (a:Service)-[r:DEPENDS_ON]->(b:Service) RETURN a.id, b.id"
    dep_res = graph.query(dep_q)
    for r in dep_res.result_set:
        src, tgt = str(r[0]), str(r[1])
        edge_id = f"edge-{src}-depends-{tgt}"
        edges_map[edge_id] = CytoEdge(data=CytoEdgeData(
            id=edge_id,
            source=src,
            target=tgt,
            relationship="DEPENDS_ON",
            label="depends on"
        ))

    # 4. Infrastructure Connections
    conn_q = "MATCH (s:Service)-[r:CONNECTS_TO]->(i:Infrastructure) RETURN s.id, i.id"
    conn_res = graph.query(conn_q)
    for r in conn_res.result_set:
        src, tgt = str(r[0]), str(r[1])
        edge_id = f"edge-{src}-connects-{tgt}"
        edges_map[edge_id] = CytoEdge(data=CytoEdgeData(
            id=edge_id,
            source=src,
            target=tgt,
            relationship="CONNECTS_TO",
            label="connects to"
        ))

    # 5. Incidents
    inc_filter = "WHERE i.id = $inc_id" if incident_id else ""
    inc_params = {"inc_id": incident_id} if incident_id else {}
    inc_q = f"MATCH (i:Incident)-[r:AFFECTS]->(s:Service) {inc_filter} RETURN i.id, i.title, i.severity, i.status, s.id"
    inc_res = graph.query(inc_q, inc_params)
    for r in inc_res.result_set:
        iid = str(r[0])
        nodes_map[iid] = CytoNode(data=CytoNodeData(
            id=iid,
            label=str(r[1]),
            type="Incident",
            name=str(r[1]),
            severity=str(r[2]),
            status=str(r[3])
        ))
        edge_id = f"edge-{iid}-affects-{r[4]}"
        edges_map[edge_id] = CytoEdge(data=CytoEdgeData(
            id=edge_id,
            source=iid,
            target=str(r[4]),
            relationship="AFFECTS",
            label="affects"
        ))

    # 6. Evidence (if requested)
    if include_evidence:
        ev_where = "WHERE i.id = $inc_id" if incident_id else ""
        ev_q = (
            f"MATCH (i:Incident)-[r:SUPPORTED_BY]->(e:Evidence) {ev_where} "
            f"RETURN e.id, e.description, e.source_type, e.metric_value, e.unit, i.id "
            f"LIMIT 60"
        )
        ev_res = graph.query(ev_q, inc_params)
        for r in ev_res.result_set:
            eid = str(r[0])
            m_val = float(r[3]) if r[3] is not None and float(r[3]) >= 0 else None
            nodes_map[eid] = CytoNode(data=CytoNodeData(
                id=eid,
                label=f"[{r[2]}] {str(r[1])[:28]}...",
                type="Evidence",
                name=str(r[1]),
                metric_value=m_val,
                unit=str(r[4]) if r[4] else None
            ))
            edge_id = f"edge-{r[5]}-supported-{eid}"
            edges_map[edge_id] = CytoEdge(data=CytoEdgeData(
                id=edge_id,
                source=str(r[5]),
                target=eid,
                relationship="SUPPORTED_BY",
                label="supported by"
            ))

    # Filter by incident_id if specified (keep connected subgraph)
    if incident_id:
        # Keep incident node, affected service, its neighbors, evidence
        relevant_ids = set()
        relevant_ids.add(incident_id)
        for e in edges_map.values():
            if e.data.source == incident_id:
                relevant_ids.add(e.data.target)
            if e.data.target == incident_id:
                relevant_ids.add(e.data.source)
        # Add 1 hop from the affected service
        second_hop = set()
        for e in edges_map.values():
            if e.data.source in relevant_ids:
                second_hop.add(e.data.target)
            if e.data.target in relevant_ids:
                second_hop.add(e.data.source)
        relevant_ids.update(second_hop)

        filtered_nodes = [n for n in nodes_map.values() if n.data.id in relevant_ids]
        filtered_edges = [
            e for e in edges_map.values()
            if e.data.source in relevant_ids and e.data.target in relevant_ids
        ]
        return GraphResponse(
            nodes=filtered_nodes,
            edges=filtered_edges,
            stats={"nodes": len(filtered_nodes), "edges": len(filtered_edges)}
        )

    all_nodes = list(nodes_map.values())
    all_edges = list(edges_map.values())
    return GraphResponse(
        nodes=all_nodes,
        edges=all_edges,
        stats={"nodes": len(all_nodes), "edges": len(all_edges)}
    )
