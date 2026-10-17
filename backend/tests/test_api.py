"""
GraphSentinel AI - End-to-End API Test Suite
Tests FastAPI routes against FalkorDB.
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.config import settings

client = TestClient(app)


def test_root_endpoint():
    res = client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert data["app"] == "GraphSentinel AI"
    assert data["synthetic_dataset"] is True


def test_health_endpoint():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["api_available"] is True
    assert "database" in data
    assert data["database"]["connected"] is True
    assert "ai_provider" in data


def test_overview_endpoint():
    res = client.get("/api/overview")
    assert res.status_code == 200
    data = res.json()
    assert data["total_services"] >= 15
    assert data["open_incidents"] > 0
    assert data["critical_incidents"] > 0
    assert data["database_connected"] is True
    assert "severity_distribution" in data
    assert "status_distribution" in data
    assert "recent_incidents" in data
    assert len(data["recent_incidents"]) > 0


def test_services_endpoints():
    # List services
    res = client.get("/api/services")
    assert res.status_code == 200
    services = res.json()
    assert len(services) >= 15
    svc_ids = [s["id"] for s in services]
    assert "SVC-PAYMENT" in svc_ids
    assert "SVC-AUTH" in svc_ids

    # Detail service
    res_detail = client.get("/api/services/SVC-PAYMENT")
    assert res_detail.status_code == 200
    detail = res_detail.json()
    assert detail["id"] == "SVC-PAYMENT"
    assert len(detail["upstream_dependencies"]) > 0
    assert len(detail["connected_infrastructure"]) > 0


def test_incidents_endpoints():
    # List incidents
    res = client.get("/api/incidents")
    assert res.status_code == 200
    incidents = res.json()
    assert len(incidents) >= 40

    # Filter incidents
    res_p1 = client.get("/api/incidents?severity=P1_CRITICAL")
    assert res_p1.status_code == 200
    p1s = res_p1.json()
    assert all(i["severity"] == "P1_CRITICAL" for i in p1s)

    # Incident detail
    res_inc = client.get("/api/incidents/INC-001")
    assert res_inc.status_code == 200
    inc = res_inc.json()
    assert inc["id"] == "INC-001"
    assert inc["affected_service_id"] == "SVC-PAYMENT"
    assert len(inc["evidence"]) >= 3
    assert len(inc["diagnostic_hypotheses"]) > 0
    assert len(inc["recommended_actions"]) > 0


def test_impact_analysis_endpoint():
    res = client.get("/api/incidents/INC-001/impact?max_depth=3")
    assert res.status_code == 200
    data = res.json()
    assert data["incident_id"] == "INC-001"
    assert data["root_service_id"] == "SVC-PAYMENT"
    assert data["total_impacted_services"] > 0
    assert len(data["impacted_services"]) > 0
    # Checkout and Order depend on Payment directly or indirectly
    impacted_ids = [s["service_id"] for s in data["impacted_services"]]
    assert "SVC-CHECKOUT" in impacted_ids or "SVC-ORDER" in impacted_ids


def test_graph_visualization_endpoint():
    res = client.get("/api/graph?include_evidence=true")
    assert res.status_code == 200
    data = res.json()
    assert "nodes" in data
    assert "edges" in data
    assert len(data["nodes"]) > 50
    assert len(data["edges"]) > 50

    # Subgraph by incident
    sub_res = client.get("/api/graph?incident_id=INC-001")
    assert sub_res.status_code == 200
    sub_data = sub_res.json()
    assert len(sub_data["nodes"]) < len(data["nodes"])
    node_ids = [n["data"]["id"] for n in sub_data["nodes"]]
    assert "INC-001" in node_ids
    assert "SVC-PAYMENT" in node_ids


def test_chat_investigation_flow():
    # 1. Why is Payment API failing?
    req1 = {"message": "Why is the Payment API failing?"}
    res1 = client.post("/api/chat", json=req1)
    assert res1.status_code == 200
    d1 = res1.json()
    assert "SVC-PAYMENT" in d1["referenced_service_ids"]
    assert len(d1["confirmed_observations"]) > 0 or len(d1["hypotheses"]) > 0
    assert d1["mode"] in ["gemini_ai", "deterministic_fallback"]

    # 2. Downstream impact inquiry
    req2 = {"message": "Which services may be affected by incident INC-001?"}
    res2 = client.post("/api/chat", json=req2)
    assert res2.status_code == 200
    d2 = res2.json()
    assert "INC-001" in d2["referenced_incident_ids"]
    assert len(d2["referenced_service_ids"]) > 0

    # 3. Evidence question
    req3 = {"message": "Show evidence supporting incident INC-001."}
    res3 = client.post("/api/chat", json=req3)
    assert res3.status_code == 200
    d3 = res3.json()
    assert len(d3["referenced_evidence_ids"]) > 0

    # 4. Critical open incidents summary
    req4 = {"message": "Summarize critical open incidents."}
    res4 = client.post("/api/chat", json=req4)
    assert res4.status_code == 200
    d4 = res4.json()
    assert len(d4["referenced_incident_ids"]) > 0

    # 5. Dependency trace
    req5 = {"message": "Trace dependencies downstream from the authentication service."}
    res5 = client.post("/api/chat", json=req5)
    assert res5.status_code == 200
    d5 = res5.json()
    assert "SVC-AUTH" in d5["referenced_service_ids"]


def test_admin_seed_authorization():
    # Unauthorized request
    res_bad = client.post("/api/admin/seed")
    assert res_bad.status_code == 401

    # Authorized request
    headers = {"X-Admin-Secret": settings.ADMIN_SECRET}
    res_ok = client.post("/api/admin/seed", headers=headers)
    assert res_ok.status_code == 200
    data = res_ok.json()
    assert data["message"] == "FalkorDB graph seeded successfully."
    assert data["summary"]["status"] == "success"


def test_auth_lifecycle():
    # 1. Invalid login
    res_bad = client.post("/api/auth/login", json={"email": "wrong@example.com", "password": "bad"})
    assert res_bad.status_code == 401

    # 2. Valid login with pre-seeded SRE account
    res_login = client.post("/api/auth/login", json={"email": "sre@graphsentinel.ai", "password": "SREAdmin2026!"})
    assert res_login.status_code == 200
    auth_data = res_login.json()
    assert "token" in auth_data
    token = auth_data["token"]
    assert auth_data["user"]["email"] == "sre@graphsentinel.ai"

    # 3. Get profile /api/auth/me
    res_me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res_me.status_code == 200
    assert res_me.json()["email"] == "sre@graphsentinel.ai"

    # 4. Logout
    res_logout = client.post("/api/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert res_logout.status_code == 200

    # 5. Token is now invalidated
    res_revoked = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res_revoked.status_code == 401


def test_incident_resolution_workflow():
    # 1. Fetch resolution workflow for INC-001
    res = client.get("/api/incidents/INC-001/resolution")
    assert res.status_code == 200
    data = res.json()
    assert data["incident_id"] == "INC-001"
    assert "summary" in data
    assert "whats_happening" in data["summary"]
    assert len(data["summary"]["confirmed_facts"]) > 0
    assert "likely_cause" in data["summary"]
    assert "recommended_solution" in data["summary"]
    assert len(data["steps"]) >= 3

    step_1 = data["steps"][0]
    step_id = step_1["id"]

    # 2. Update step status to IN_PROGRESS
    res_update = client.patch(
        f"/api/incidents/INC-001/resolution/steps/{step_id}",
        json={"status": "IN_PROGRESS", "actor": "Test SRE"}
    )
    assert res_update.status_code == 200
    assert res_update.json()["status"] == "IN_PROGRESS"

    # 3. Update step status to COMPLETED
    res_comp = client.patch(
        f"/api/incidents/INC-001/resolution/steps/{step_id}",
        json={"status": "COMPLETED", "actor": "Test SRE"}
    )
    assert res_comp.status_code == 200
    assert res_comp.json()["status"] == "COMPLETED"

    # 4. Verify recovery signals
    res_verify = client.post(
        "/api/incidents/INC-001/resolution/verify",
        json={"checklist_overrides": {"canary_signoff": True}}
    )
    assert res_verify.status_code == 200
    v_data = res_verify.json()
    assert "signals" in v_data
    assert len(v_data["signals"]) >= 4

    # 5. Resolve incident
    res_resolve = client.post(
        "/api/incidents/INC-001/resolve",
        json={
            "root_cause_conclusion": "Postgres connection pool exhausted by unindexed batch query.",
            "actions_taken": "Tuned pool limit and cancelled blocked transactions.",
            "verification_outcome": "P99 latency stabilized below 120ms with 0 timeouts.",
            "resolution_notes": "Added missing index on payments.created_at.",
            "resolved_by": "Test SRE"
        }
    )
    assert res_resolve.status_code == 200
    assert res_resolve.json()["status"] == "success"

    # Verify incident status updated to RESOLVED in FalkorDB
    inc_detail = client.get("/api/incidents/INC-001").json()
    assert inc_detail["status"] == "RESOLVED"

    # 6. Reopen incident
    res_reopen = client.post(
        "/api/incidents/INC-001/reopen",
        json={"reason": "Testing reopen workflow", "reopened_by": "Test SRE"}
    )
    assert res_reopen.status_code == 200
    assert res_reopen.json()["status"] == "success"

    # Verify incident status returned to INVESTIGATING
    inc_reopened = client.get("/api/incidents/INC-001").json()
    assert inc_reopened["status"] == "INVESTIGATING"


def test_global_search():
    # 1. Search for service
    res_svc = client.get("/api/search?q=payment")
    assert res_svc.status_code == 200
    svc_data = res_svc.json()
    assert len(svc_data["results"]) > 0
    assert any(r["type"] == "service" for r in svc_data["results"])

    # 2. Search for incident
    res_inc = client.get("/api/overview/search?q=INC-001")
    assert res_inc.status_code == 200
    inc_data = res_inc.json()
    assert len(inc_data["results"]) > 0
    assert any(r["type"] == "incident" for r in inc_data["results"])

