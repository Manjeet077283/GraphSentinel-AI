"""
GraphSentinel AI - Investigation & Graph Fact Retrieval Engine
Extracts entities and intent from user queries and retrieves grounded facts from FalkorDB.
"""

import re
from typing import Dict, Any, List, Optional
from falkordb.graph import Graph
from backend.app.graph_queries import (
    get_incident_detail,
    get_service_detail,
    get_incident_impact_analysis,
    list_incidents,
    list_services,
)

SERVICE_ALIASES = {
    "payment": "SVC-PAYMENT",
    "payments": "SVC-PAYMENT",
    "payment api": "SVC-PAYMENT",
    "auth": "SVC-AUTH",
    "authentication": "SVC-AUTH",
    "identity": "SVC-AUTH",
    "checkout": "SVC-CHECKOUT",
    "order": "SVC-ORDER",
    "orders": "SVC-ORDER",
    "inventory": "SVC-INVENTORY",
    "gateway": "SVC-API-GW",
    "api gateway": "SVC-API-GW",
    "billing": "SVC-BILLING",
    "invoice": "SVC-BILLING",
    "fraud": "SVC-FRAUD",
    "search": "SVC-SEARCH",
    "catalog": "SVC-CATALOG",
    "notification": "SVC-NOTIF",
    "notifications": "SVC-NOTIF",
    "shipping": "SVC-SHIPPING",
    "discount": "SVC-DISCOUNTS",
    "discounts": "SVC-DISCOUNTS",
    "user": "SVC-USER",
    "analytics": "SVC-ANALYTICS"
}


def extract_entities(query: str, focused_incident_id: Optional[str] = None, focused_service_id: Optional[str] = None) -> Dict[str, Any]:
    """Extracts incident IDs, service references, and intent from user question."""
    q_lower = query.lower()

    # 1. Detect Incident ID (e.g. INC-001)
    inc_matches = re.findall(r"\bINC-\d{3}\b", query, re.IGNORECASE)
    matched_inc_id = inc_matches[0].upper() if inc_matches else focused_incident_id

    # 2. Detect Service ID or Alias
    matched_svc_id = None
    svc_id_matches = re.findall(r"\bSVC-[A-Z0-9\-]+\b", query, re.IGNORECASE)
    if svc_id_matches:
        matched_svc_id = svc_id_matches[0].upper()
    else:
        for alias, svc_id in SERVICE_ALIASES.items():
            if re.search(r"\b" + re.escape(alias) + r"\b", q_lower):
                matched_svc_id = svc_id
                break
    if not matched_svc_id and focused_service_id:
        matched_svc_id = focused_service_id

    # 3. Detect Intent
    intent = "GENERAL"
    if any(w in q_lower for w in ["impact", "affected", "cascade", "who is affected", "which services"]):
        intent = "IMPACT"
    elif any(w in q_lower for w in ["remediation", "resolve", "resolution", "remedy", "fix", "worked previously", "how to solve"]):
        intent = "REMEDIATION"
    elif any(w in q_lower for w in ["evidence", "logs", "metrics", "alerts", "trace", "supporting"]):
        intent = "EVIDENCE"
    elif any(w in q_lower for w in ["dependency", "dependencies", "trace", "upstream", "downstream"]):
        intent = "DEPENDENCIES"
    elif any(w in q_lower for w in ["critical", "open incidents", "summarize open", "active incidents"]):
        intent = "CRITICAL_SUMMARY"
    elif any(w in q_lower for w in ["why", "cause", "failing", "root cause", "investigate", "reason"]):
        intent = "ROOT_CAUSE"
    elif any(w in q_lower for w in ["next", "what should", "on-call", "step"]):
        intent = "NEXT_STEPS"

    return {
        "incident_id": matched_inc_id,
        "service_id": matched_svc_id,
        "intent": intent,
        "query": query
    }


def gather_graph_facts(graph: Graph, entities: Dict[str, Any]) -> Dict[str, Any]:
    """Retrieves all relevant factual nodes and relationships from FalkorDB."""
    incident_id = entities.get("incident_id")
    service_id = entities.get("service_id")
    intent = entities.get("intent", "GENERAL")

    facts: Dict[str, Any] = {
        "intent": intent,
        "incident": None,
        "service": None,
        "impact": None,
        "evidence": [],
        "resolutions": [],
        "historical_incidents": [],
        "open_critical_incidents": [],
        "all_services": []
    }

    # If an incident is identified, fetch full incident detail and impact
    if incident_id:
        inc_detail = get_incident_detail(graph, incident_id)
        if inc_detail:
            facts["incident"] = inc_detail.model_dump()
            facts["evidence"] = [e.model_dump() for e in inc_detail.evidence]
            facts["resolutions"] = [r.model_dump() for r in inc_detail.resolutions]
            facts["historical_incidents"] = inc_detail.related_historical_incidents
            if not service_id:
                service_id = inc_detail.affected_service_id

        impact_data = get_incident_impact_analysis(graph, incident_id, max_depth=3)
        if impact_data:
            facts["impact"] = impact_data.model_dump()

    # If service is identified, fetch service details
    if service_id:
        svc_detail = get_service_detail(graph, service_id)
        if svc_detail:
            facts["service"] = svc_detail.model_dump()

        # If no incident was explicitly specified, find active incidents affecting this service
        if not facts["incident"] and svc_detail and svc_detail.active_incidents:
            active_inc_id = svc_detail.active_incidents[0]["id"]
            inc_detail = get_incident_detail(graph, active_inc_id)
            if inc_detail:
                facts["incident"] = inc_detail.model_dump()
                facts["evidence"] = [e.model_dump() for e in inc_detail.evidence]
                facts["resolutions"] = [r.model_dump() for r in inc_detail.resolutions]
                facts["historical_incidents"] = inc_detail.related_historical_incidents
                impact_data = get_incident_impact_analysis(graph, active_inc_id, max_depth=3)
                if impact_data:
                    facts["impact"] = impact_data.model_dump()

    # If asking for summary or general, fetch open critical incidents
    if intent in ["CRITICAL_SUMMARY", "GENERAL"] or not incident_id:
        crit_incs = list_incidents(graph, severity="P1_CRITICAL", status="OPEN", limit=6)
        facts["open_critical_incidents"] = [i.model_dump() for i in crit_incs]

    return facts
