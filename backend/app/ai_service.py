"""
GraphSentinel AI - AI Service & Deterministic Graph Fallback Engine
Provides dual-mode incident intelligence:
1. Google Gemini API (when configured and valid) grounded strictly on graph facts.
2. Deterministic Graph-Grounded Synthesizer (when key is absent, rate-limited, or offline).
"""

import logging
from typing import Dict, Any, List, Optional
from backend.app.config import settings
from backend.app.schemas import ChatResponse, ChatMessage

logger = logging.getLogger("graphsentinel.ai")


def deterministic_response_composer(query: str, facts: Dict[str, Any]) -> ChatResponse:
    """
    Composes a comprehensive, evidence-grounded investigation response
    directly from FalkorDB graph facts without external AI API dependencies.
    """
    intent = facts.get("intent", "GENERAL")
    incident = facts.get("incident")
    service = facts.get("service")
    impact = facts.get("impact")
    evidence_list = facts.get("evidence", [])
    resolutions = facts.get("resolutions", [])
    historical = facts.get("historical_incidents", [])
    open_critical = facts.get("open_critical_incidents", [])

    referenced_inc_ids: List[str] = []
    referenced_svc_ids: List[str] = []
    referenced_ev_ids: List[str] = []
    dep_paths: List[List[str]] = []
    res_refs: List[str] = []
    confirmed_obs: List[str] = []
    hypotheses: List[str] = []
    next_steps: List[str] = []

    if incident:
        referenced_inc_ids.append(incident["id"])
    if service:
        referenced_svc_ids.append(service["id"])

    # Build response sections based on available facts and intent
    sections = []

    # Scenario 1: Active Incident Investigation or Root Cause Inquiry
    if incident:
        inc_id = incident["id"]
        title = incident["title"]
        severity = incident["severity"]
        status = incident["status"]
        svc_name = incident.get("affected_service_name") or incident.get("affected_service_id")
        svc_id = incident.get("affected_service_id")

        sections.append(f"### Incident Investigation: **{inc_id}** — *{title}*")
        sections.append(f"- **Affected Service:** `{svc_name}` (`{svc_id}`)")
        sections.append(f"- **Severity & Status:** `{severity}` | `{status}`")
        sections.append(f"- **Summary:** {incident['description']}")

        # 1. Confirmed Observations from Evidence
        if evidence_list:
            sections.append("\n#### Confirmed Observations (Evidence Telemetry)")
            for ev in evidence_list[:5]:
                ev_id = ev["id"]
                referenced_ev_ids.append(ev_id)
                stype = ev["source_type"]
                desc = ev["description"]
                metric_part = f" (`{ev['metric_name']}` = {ev['metric_value']} {ev.get('unit') or ''})" if ev.get("metric_name") else ""
                obs_line = f"**[{stype}]** `{ev_id}`: {desc}{metric_part}"
                sections.append(f"- {obs_line}")
                confirmed_obs.append(f"{desc}{metric_part}")
        else:
            sections.append("\n*No supporting telemetry evidence is currently recorded for this incident in the graph.*")

        # 2. Downstream Impact Analysis
        if impact and impact.get("impacted_services"):
            imp_services = impact["impacted_services"]
            dep_paths = impact.get("paths", [])
            sections.append(f"\n#### Downstream Cascade Impact ({len(imp_services)} dependent services at risk)")
            sections.append(f"*{impact.get('impact_summary')}*")
            for imp in imp_services[:6]:
                imp_id = imp["service_id"]
                imp_name = imp["service_name"]
                referenced_svc_ids.append(imp_id)
                status_badge = "🔴 DEGRADED" if imp["impact_level"] == "CONFIRMED_DEGRADATION" else "⚠️ CASCADE RISK"
                path_str = " ➔ ".join(imp["dependency_path"])
                sections.append(f"- **{imp_name}** (`{imp_id}`) [{status_badge}] at {imp['hops']} hop(s) via path: `{path_str}`")

        # 3. Possible Root Cause Hypotheses
        if incident.get("diagnostic_hypotheses"):
            sections.append("\n#### Possible Root Cause Hypotheses")
            for h in incident["diagnostic_hypotheses"]:
                sections.append(f"- 🔍 {h}")
                hypotheses.append(h)
        else:
            hypotheses.append(f"Service degradation on {svc_name} due to resource contention or upstream network timeout.")
            sections.append(f"\n#### Possible Root Cause Hypotheses\n- 🔍 Service degradation on `{svc_name}` due to resource saturation.")

        # 4. Historical Resolutions & Remediations
        if resolutions:
            sections.append("\n#### Applied Resolutions for This Incident")
            for r in resolutions:
                res_refs.append(f"{r['id']}: {r['description']} ({r['outcome']})")
                sections.append(f"- ✅ **[{r['outcome']}]** `{r['id']}`: {r['description']} *(Effectiveness: {r['effectiveness']})*")
        elif historical:
            sections.append("\n#### Relevant Historical Resolutions from Similar Incidents")
            for h in historical[:3]:
                referenced_inc_ids.append(h["incident_id"])
                res_sum = h.get("resolution_summary") or "Resolution details not documented."
                outcome = h.get("outcome") or "RESOLVED"
                res_refs.append(f"{h['incident_id']}: {res_sum}")
                sections.append(f"- 💡 **{h['incident_id']}** (*{h['title']}* on `{h['service_name']}`):\n  **Remedy:** {res_sum} `[{outcome}]`")

        # 5. Recommended Next Diagnostic Actions
        if incident.get("recommended_actions"):
            sections.append("\n#### Recommended Next Diagnostic Steps")
            for act in incident["recommended_actions"]:
                sections.append(f"- 📋 {act}")
                next_steps.append(act)

    # Scenario 2: Service Dependency or Topology Inquiry
    elif service:
        svc_id = service["id"]
        svc_name = service["name"]
        sections.append(f"### Service Architecture: **{svc_name}** (`{svc_id}`)")
        sections.append(f"- **Criticality:** `{service['criticality']}` | **Current Health:** `{service['status']}`")
        sections.append(f"- **Owning Team:** {service['team']}")
        sections.append(f"- **Role:** {service['description']}")

        # Direct Downstream Dependencies
        down = service.get("downstream_dependencies", [])
        if down:
            sections.append(f"\n#### Downstream Dependencies ({svc_name} relies on {len(down)} services):")
            for d in down:
                referenced_svc_ids.append(d["id"])
                sections.append(f"- ➔ **{d['name']}** (`{d['id']}`) [{d['criticality']}] — Status: `{d['status']}`")

        # Direct Upstream Dependents
        up = service.get("upstream_dependencies", [])
        if up:
            sections.append(f"\n#### Upstream Dependents ({len(up)} services depend on {svc_name}):")
            for u in up:
                referenced_svc_ids.append(u["id"])
                sections.append(f"- ⬅️ **{u['name']}** (`{u['id']}`) [{u['criticality']}] — Status: `{u['status']}`")

        # Connected Infrastructure
        infra = service.get("connected_infrastructure", [])
        if infra:
            sections.append("\n#### Connected Infrastructure:")
            for inf in infra:
                sections.append(f"- 🗄️ **{inf['name']}** (`{inf['id']}`) [{inf['type']}] — Status: `{inf['status']}`")

        # Active Incidents
        active = service.get("active_incidents", [])
        if active:
            sections.append("\n#### Active Incidents on This Service:")
            for a in active:
                referenced_inc_ids.append(a["id"])
                sections.append(f"- 🚨 **{a['id']}**: {a['title']} (`{a['severity']}`) — Status: `{a['status']}`")
                next_steps.append(f"Investigate active incident {a['id']} using 'Why is {svc_name} failing?' or 'Show evidence for {a['id']}'.")

    # Scenario 3: Open Critical Incidents Summary
    elif open_critical:
        sections.append(f"### Current Open Critical Incidents ({len(open_critical)} active P1 issues)")
        sections.append("GraphSentinel AI retrieved the following active critical incidents requiring immediate response:\n")
        for inc in open_critical:
            inc_id = inc["id"]
            referenced_inc_ids.append(inc_id)
            referenced_svc_ids.append(inc["affected_service_id"])
            sections.append(f"1. **{inc_id}** — `{inc['severity']}` | Status: `{inc['status']}`")
            sections.append(f"   - **Service:** `{inc['affected_service_name']}` (`{inc['affected_service_id']}`)")
            sections.append(f"   - **Issue:** {inc['title']}")
            sections.append(f"   - **Detail:** {inc['description']}\n")
        next_steps.append("Select any critical incident above (e.g. 'Investigate INC-001') to perform multi-hop graph impact analysis.")

    # Scenario 4: General / Fallback Question
    else:
        sections.append("### GraphSentinel AI Incident Intelligence")
        sections.append(
            "I can investigate infrastructure incidents, trace downstream dependencies, "
            "inspect evidence telemetry, and retrieve historical incident resolutions.\n\n"
            "**Suggested questions to ask:**\n"
            "- *'Why is the Payment API failing?'*\n"
            "- *'Which services may be affected by incident INC-001?'*\n"
            "- *'Trace dependencies downstream from the authentication service.'*\n"
            "- *'Show evidence supporting incident INC-002.'*\n"
            "- *'Find similar historical incidents and what remediation worked previously.'*\n"
            "- *'Summarize critical open incidents.'*\n"
            "- *'What should the on-call engineer investigate next?'*"
        )
        next_steps.append("Provide a specific service name (e.g., Payment, Auth, Checkout) or incident ID (e.g., INC-001).")

    # Format final markdown answer
    final_text = "\n".join(sections)

    # Deduplicate references
    referenced_inc_ids = list(dict.fromkeys(referenced_inc_ids))
    referenced_svc_ids = list(dict.fromkeys(referenced_svc_ids))
    referenced_ev_ids = list(dict.fromkeys(referenced_ev_ids))

    return ChatResponse(
        answer=final_text,
        mode="deterministic_fallback",
        referenced_incident_ids=referenced_inc_ids,
        referenced_service_ids=referenced_svc_ids,
        referenced_evidence_ids=referenced_ev_ids,
        dependency_paths=dep_paths,
        historical_resolution_references=res_refs,
        confidence="HIGH" if incident or service else "MEDIUM",
        suggested_next_steps=next_steps or ["Verify infrastructure telemetry and check related service logs."],
        confirmed_observations=confirmed_obs,
        hypotheses=hypotheses
    )


def generate_chat_response(
    query: str,
    conversation_history: List[ChatMessage],
    facts: Dict[str, Any]
) -> ChatResponse:
    """
    Main entry point for chatbot.
    Attempts Google Gemini API if configured; otherwise uses deterministic fallback.
    """
    if not settings.GEMINI_API_KEY:
        logger.info("No GEMINI_API_KEY configured. Utilizing deterministic graph-grounded engine.")
        return deterministic_response_composer(query, facts)

    try:
        from google import genai
        client = genai.Client(api_key=settings.GEMINI_API_KEY)

        # Build grounded prompt containing exact graph facts
        import json
        facts_json = json.dumps(facts, indent=2)

        prompt = f"""You are GraphSentinel AI, an advanced AI-assisted DevOps/SRE incident intelligence agent.
You are helping an on-call engineer investigate an infrastructure incident.

STRICT GROUNDING RULES:
1. You must answer using ONLY the factual graph data provided below.
2. NEVER invent, hallucinate, or assume any services, incidents, metrics, edges, or resolutions that are not in the graph facts.
3. Clearly separate:
   - Confirmed observations from evidence logs and metrics
   - Graph-derived potential downstream cascade impact
   - Root-cause hypotheses
   - Safe advisory recommendations for the on-call engineer (NEVER execute or advise destructive changes automatically).
4. Explicitly cite incident IDs (e.g., INC-001), service IDs (e.g., SVC-PAYMENT), and evidence IDs (e.g., EVD-001).

GRAPH FACTS:
{facts_json}

USER QUESTION:
{query}
"""
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=prompt
        )

        answer_text = response.text or ""

        # Extract structured references from the deterministic composer to accompany the AI text
        base_resp = deterministic_response_composer(query, facts)
        return ChatResponse(
            answer=answer_text,
            mode="gemini_ai",
            referenced_incident_ids=base_resp.referenced_incident_ids,
            referenced_service_ids=base_resp.referenced_service_ids,
            referenced_evidence_ids=base_resp.referenced_evidence_ids,
            dependency_paths=base_resp.dependency_paths,
            historical_resolution_references=base_resp.historical_resolution_references,
            confidence="HIGH",
            suggested_next_steps=base_resp.suggested_next_steps,
            confirmed_observations=base_resp.confirmed_observations,
            hypotheses=base_resp.hypotheses
        )

    except Exception as e:
        logger.warning(f"Gemini API invocation failed or unavailable: {e}. Falling back to deterministic engine.")
        return deterministic_response_composer(query, facts)
