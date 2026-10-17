"""
GraphSentinel AI - Incidents Routes
Endpoints for browsing incidents, deep investigation payloads, and graph impact analysis.
"""

from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from backend.app.database import get_graph
from backend.app.schemas import (
    IncidentSummary,
    IncidentDetail,
    ImpactAnalysisResponse,
    ResolutionWorkflowResponse,
    ResolutionStepItem,
    UpdateStepStatusRequest,
    VerifyRecoveryRequest,
    VerifyRecoveryResponse,
    ResolveIncidentRequest,
    ReopenIncidentRequest,
    InvestigationReportResponse
)
from backend.app.investigation_report import generate_structured_investigation_report
from backend.app.graph_queries import (
    list_incidents,
    get_incident_detail,
    get_incident_impact_analysis
)
from backend.app.persistence import (
    get_or_create_resolution_steps,
    update_resolution_step_status,
    get_incident_resolution_state,
    record_incident_resolution,
    reopen_incident_state,
    get_incident_activities,
    evaluate_recovery_verification
)

router = APIRouter(prefix="/incidents", tags=["Incidents"])


@router.get("", response_model=List[IncidentSummary])
def get_incidents(
    status: Optional[str] = Query(None, description="Filter: OPEN, INVESTIGATING, MITIGATED, RESOLVED"),
    severity: Optional[str] = Query(None, description="Filter: P1_CRITICAL, P2_HIGH, P3_MEDIUM, P4_LOW"),
    service_id: Optional[str] = Query(None, description="Filter by affected service ID"),
    search: Optional[str] = Query(None, description="Search keyword in incident title or description"),
    limit: int = Query(50, ge=1, le=200)
):
    """Retrieves synthetic incidents matching query criteria."""
    try:
        graph = get_graph()
        return list_incidents(
            graph,
            status=status,
            severity=severity,
            service_id=service_id,
            search=search,
            limit=limit
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to query incidents: {str(e)}")


@router.get("/{incident_id}", response_model=IncidentDetail)
def get_incident(incident_id: str):
    """Retrieves complete investigation details for an incident including evidence, resolutions, and hypotheses."""
    try:
        graph = get_graph()
        inc = get_incident_detail(graph, incident_id)
        if not inc:
            raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found in graph.")
        return inc
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to query incident '{incident_id}': {str(e)}")


@router.get("/{incident_id}/impact", response_model=ImpactAnalysisResponse)
def get_incident_impact(
    incident_id: str,
    max_depth: int = Query(3, ge=1, le=5, description="Maximum traversal hops for downstream impact")
):
    """
    Performs graph traversal to trace downstream dependent services affected by the incident.
    Distinguishes confirmed failures from cascade risks.
    """
    try:
        graph = get_graph()
        impact = get_incident_impact_analysis(graph, incident_id, max_depth=max_depth)
        if not impact:
            raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' or its affected service not found.")
        return impact
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to compute impact analysis for '{incident_id}': {str(e)}")


@router.get("/{incident_id}/report", response_model=InvestigationReportResponse)
@router.get("/{incident_id}/investigation-report", response_model=InvestigationReportResponse)
def get_incident_investigation_report(incident_id: str):
    """
    Generates the comprehensive 14-section structured engineering investigation report.
    Adheres strictly to SRE protocols with actionable recommendations and safe command review.
    """
    try:
        graph = get_graph()
        report = generate_structured_investigation_report(graph, incident_id)
        if not report:
            raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found.")
        return report
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate structured report for '{incident_id}': {str(e)}")


@router.get("/{incident_id}/resolution", response_model=ResolutionWorkflowResponse)
def get_incident_resolution_workflow(incident_id: str):
    """
    Retrieves full actionable resolution workflow for an incident:
    - AI investigation 4-part summary (What's Happening, Confirmed Facts, Likely Cause, Recommended Solution)
    - Actionable resolution steps tailored to the incident evidence
    - Persistent step status and execution history
    - Resolution details if already resolved
    - Activity audit log
    """
    try:
        graph = get_graph()
        inc = get_incident_detail(graph, incident_id)
        if not inc:
            raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found.")

        inc_dict = inc.model_dump() if hasattr(inc, "model_dump") else inc.dict()
        steps = get_or_create_resolution_steps(incident_id, inc_dict)
        res_state = get_incident_resolution_state(incident_id)
        activities = get_incident_activities(incident_id)

        # Build 4-part summary
        svc_name = inc.affected_service.name if inc.affected_service else inc.affected_service_id
        confirmed_facts = [
            f"Observed on service '{svc_name}' with severity {inc.severity}.",
            f"Current incident status is '{inc.status}'.",
        ]
        for ev in inc.evidence[:3]:
            fact_str = f"Evidence ({ev.source_type}): {ev.description}"
            if ev.metric_name and ev.metric_value is not None:
                fact_str += f" [Observed: {ev.metric_value} {ev.unit or ''}]"
            confirmed_facts.append(fact_str)

        likely_cause = inc.diagnostic_hypotheses[0] if inc.diagnostic_hypotheses else "Service degradation under investigation."
        recommended_solution = inc.recommended_actions[0] if inc.recommended_actions else "Inspect active connections, system telemetry, and recent deploy logs."

        summary = {
            "whats_happening": inc.description,
            "confirmed_facts": confirmed_facts,
            "likely_cause": likely_cause,
            "recommended_solution": recommended_solution
        }

        return {
            "incident_id": inc.id,
            "incident_title": inc.title,
            "incident_status": inc.status,
            "affected_service_id": inc.affected_service_id,
            "affected_service_name": svc_name,
            "summary": summary,
            "steps": steps,
            "resolution": res_state,
            "activities": activities
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch resolution workflow: {str(e)}")


@router.patch("/{incident_id}/resolution/steps/{step_id}", response_model=ResolutionStepItem)
def update_step_status_endpoint(incident_id: str, step_id: str, payload: UpdateStepStatusRequest):
    """Updates the status of an actionable resolution step with persistent audit logging."""
    updated = update_resolution_step_status(step_id, payload.status, actor=payload.actor or "SRE Engineer")
    if not updated:
        raise HTTPException(status_code=404, detail=f"Step '{step_id}' not found.")
    return updated


@router.post("/{incident_id}/resolution/verify", response_model=VerifyRecoveryResponse)
def verify_recovery_endpoint(incident_id: str, payload: VerifyRecoveryRequest):
    """
    Evaluates recovery verification signals against real FalkorDB metrics and service telemetry.
    Checks latency, error rates, resource usage, downstream cascade health, and manual operational checks.
    """
    try:
        graph = get_graph()
        inc = get_incident_detail(graph, incident_id)
        if not inc:
            raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found.")

        inc_dict = inc.model_dump() if hasattr(inc, "model_dump") else inc.dict()
        verification = evaluate_recovery_verification(
            incident_id,
            inc_dict,
            overrides=payload.checklist_overrides
        )
        return verification
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to evaluate recovery: {str(e)}")


@router.post("/{incident_id}/resolve")
def resolve_incident_endpoint(incident_id: str, payload: ResolveIncidentRequest):
    """
    Marks an incident as RESOLVED.
    - Saves root-cause conclusion, verification outcome, and notes to persistent SQLite store
    - Updates FalkorDB Incident node status to 'RESOLVED' and attaches resolution notes
    - Appends audit activity entry
    """
    try:
        now_iso = datetime.now(timezone.utc).isoformat()
        graph = get_graph()

        # 1. Update FalkorDB
        cypher = """
        MATCH (i:Incident {id: $id})
        SET i.status = 'RESOLVED',
            i.resolution_notes = $notes,
            i.resolved_at = $now,
            i.updated_at = $now
        RETURN i.id AS id
        """
        res = graph.query(cypher, {
            "id": incident_id,
            "notes": payload.resolution_notes,
            "now": now_iso
        })
        if not res.result_set:
            raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found in graph.")

        # 2. Record in persistent store
        resolution = record_incident_resolution(
            incident_id=incident_id,
            root_cause_conclusion=payload.root_cause_conclusion,
            actions_taken=payload.actions_taken,
            verification_outcome=payload.verification_outcome,
            resolution_notes=payload.resolution_notes,
            resolved_by=payload.resolved_by or "SRE Engineer"
        )

        return {
            "status": "success",
            "message": f"Incident '{incident_id}' successfully marked as RESOLVED.",
            "resolution": resolution
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to resolve incident: {str(e)}")


@router.post("/{incident_id}/reopen")
def reopen_incident_endpoint(incident_id: str, payload: ReopenIncidentRequest):
    """
    Reopens a resolved incident back to INVESTIGATING status.
    - Updates persistent store and logs reason
    - Updates FalkorDB Incident node status back to 'INVESTIGATING'
    """
    try:
        now_iso = datetime.now(timezone.utc).isoformat()
        graph = get_graph()

        cypher = """
        MATCH (i:Incident {id: $id})
        SET i.status = 'INVESTIGATING',
            i.updated_at = $now
        RETURN i.id AS id
        """
        res = graph.query(cypher, {
            "id": incident_id,
            "now": now_iso
        })
        if not res.result_set:
            raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found in graph.")

        reopened = reopen_incident_state(
            incident_id=incident_id,
            reason=payload.reason,
            actor=payload.reopened_by or "SRE Engineer"
        )

        return {
            "status": "success",
            "message": f"Incident '{incident_id}' reopened to INVESTIGATING status.",
            "detail": reopened
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to reopen incident: {str(e)}")

