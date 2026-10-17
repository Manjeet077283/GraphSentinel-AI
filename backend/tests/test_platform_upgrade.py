"""
GraphSentinel AI - Platform Upgrade Automated Test Suite
Tests:
- Data Workspace file parsing (CSV, JSON, JSONL, Logs) and column mapping
- Deduplication and idempotent records
- 14-Section SRE Investigation Report and Confidence Derivation
- Investigation Tools and Multilingual AI Translation
- User Authentication, Profile Updates, and Secure Password Change
- Conversation History CRUD
- Graph Diagnostics and Schema Metadata
"""

import os
import io
import json
import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.persistence import (
    create_user,
    authenticate_user,
    update_user_profile,
    change_user_password,
    get_user_by_id,
    create_conversation,
    save_conversation_message,
    list_conversations,
    get_conversation,
    delete_conversation,
    create_dataset,
    save_dataset_records,
    list_user_datasets,
    get_dataset_records,
    delete_dataset
)
from backend.app.data_ingestion import (
    parse_uploaded_file,
    infer_column_mapping,
    normalize_record,
    calculate_record_hash
)
from backend.app.investigation_tools import (
    search_graph,
    get_incident_info,
    trace_dependencies,
    find_similar_incidents,
    lookup_resolutions,
    analyze_uploaded_data
)
from backend.app.investigation_report import generate_investigation_report
from backend.app.ai_service import translate_text, synthesize_answer_with_gemini

client = TestClient(app)


# ==============================================================================
# 1. DATA WORKSPACE & MULTI-FORMAT INGESTION TESTS
# ==============================================================================

def test_data_ingestion_csv_parsing_and_mapping():
    csv_content = (
        "incident_code,timestamp,service_name,err_msg,sev,resolution_info\n"
        "INC-999,2026-10-17T10:00:00Z,PaymentService,Connection timeout to Redis,P1,Scaled pool size\n"
        "INC-998,2026-10-17T11:00:00Z,AuthService,JWT signature invalid,P2,Rotated secret\n"
    ).encode("utf-8")

    filename = "test_incidents.csv"
    parsed = parse_uploaded_file(csv_content, filename)

    assert parsed["detected_format"] == "csv"
    assert parsed["total_rows"] == 2
    assert "incident_code" in parsed["columns"]
    assert "service_name" in parsed["columns"]

    mapping = infer_column_mapping(parsed["columns"])
    assert mapping["incident_id"] == "incident_code"
    assert mapping["service"] == "service_name"
    assert mapping["error_message"] == "err_msg"
    assert mapping["severity"] == "sev"
    assert mapping["resolution"] == "resolution_info"


def test_data_ingestion_json_and_jsonl_parsing():
    # JSON array
    json_data = [
        {"id": "AL-101", "service": "Checkout", "message": "504 Gateway Timeout", "severity": "CRITICAL"},
        {"id": "AL-102", "service": "Cart", "message": "Memory threshold 95%", "severity": "HIGH"}
    ]
    parsed_json = parse_uploaded_file(json.dumps(json_data).encode("utf-8"), "alerts.json")
    assert parsed_json["detected_format"] == "json"
    assert parsed_json["total_rows"] == 2

    # JSONL
    jsonl_data = '{"log_id": "L1", "service": "Gateway", "msg": "Dropped connection"}\n{"log_id": "L2", "service": "Gateway", "msg": "Retry exceeded"}\n'
    parsed_jsonl = parse_uploaded_file(jsonl_data.encode("utf-8"), "gateway.jsonl")
    assert parsed_jsonl["detected_format"] == "jsonl"
    assert parsed_jsonl["total_rows"] == 2


def test_data_ingestion_log_parsing():
    raw_logs = (
        "2026-10-17 12:00:01 [ERROR] [svc-payment] DB Connection pool exhausted, active=50/50\n"
        "2026-10-17 12:00:02 [WARN] [svc-order] Upstream payment timeout after 5000ms\n"
        "2026-10-17 12:00:03 [INFO] [svc-gateway] Healthcheck returning 200 OK\n"
    ).encode("utf-8")

    parsed_logs = parse_uploaded_file(raw_logs, "application.log")
    assert parsed_logs["detected_format"] == "log"
    assert parsed_logs["total_rows"] >= 2
    assert "service" in parsed_logs["columns"]
    assert "level" in parsed_logs["columns"]


def test_record_normalization_and_deduplication():
    raw = {"incident_code": "INC-888", "service_name": "Auth", "sev": "P1", "err": "OOM killed"}
    mapping = {
        "incident_id": "incident_code",
        "service": "service_name",
        "severity": "sev",
        "error_message": "err"
    }

    normalized, is_valid, errors = normalize_record(raw, mapping)
    assert is_valid is True
    assert normalized["incident_id"] == "INC-888"
    assert normalized["service"] == "Auth"
    assert normalized["severity"] == "P1_CRITICAL"

    # Deduplication hash stability
    hash1 = calculate_record_hash(normalized)
    hash2 = calculate_record_hash(normalized)
    assert hash1 == hash2
    assert len(hash1) == 64


# ==============================================================================
# 2. 14-SECTION SRE INVESTIGATION REPORT & CONFIDENCE DERIVATION
# ==============================================================================

def test_14_section_investigation_report_structure():
    report = generate_investigation_report("INC-001")
    assert report is not None
    assert report.incident_id == "INC-001"
    assert len(report.problem_summary) > 20

    # 1. Problem summary
    assert report.problem_summary is not None
    # 2. Symptoms and affected services
    assert len(report.observed_symptoms) > 0
    assert len(report.affected_services) > 0
    # 3. Severity and business impact
    assert report.severity_and_impact.severity in ["P1_CRITICAL", "P2_HIGH", "P3_MEDIUM", "P4_LOW"]
    assert len(report.severity_and_impact.business_impact) > 10
    # 4. Confirmed facts
    assert len(report.confirmed_facts) >= 2
    # 5 & 6. Potential root causes (Hypotheses) & evidence pro/con
    assert len(report.potential_root_causes) >= 1
    hyp = report.potential_root_causes[0]
    assert hyp.title is not None
    assert len(hyp.supporting_evidence) > 0
    # 7. Confidence derivation
    assert 0 <= report.confidence.score_pct <= 100
    assert report.confidence.level in ["HIGH", "MEDIUM", "LOW"]
    assert len(report.confidence.factors) >= 4
    # 8. Related incidents
    assert isinstance(report.related_incidents, list)
    # 9. Recommended solution
    assert len(report.recommended_solution.steps) >= 2
    # 10. Command examples with safety review badges
    assert len(report.command_examples) >= 2
    for cmd in report.command_examples:
        assert cmd.safety_level in ["READ_ONLY", "PRIVILEGED", "DESTRUCTIVE"]
        assert len(cmd.command) > 0
    # 11. Validation steps
    assert len(report.validation_steps) >= 2
    # 12. Rollback & risk plan
    assert len(report.rollback_and_risk.rollback_steps) >= 1
    assert len(report.rollback_and_risk.fallback_plan) > 5
    # 13. Prevention measures and monitoring
    assert len(report.prevention_and_monitoring.prevention_measures) >= 1
    assert len(report.prevention_and_monitoring.monitoring_recommendations) >= 1
    # 14. Final resolution notes
    assert report.final_resolution_notes.status is not None


def test_investigation_report_endpoint():
    res = client.get("/api/incidents/INC-001/report")
    assert res.status_code == 200
    data = res.json()
    assert data["incident_id"] == "INC-001"
    assert "problem_summary" in data
    assert "command_examples" in data
    assert "confidence" in data
    assert "rollback_and_risk" in data


# ==============================================================================
# 3. BACKEND INVESTIGATION TOOLS & MULTILINGUAL AI TESTS
# ==============================================================================

def test_investigation_tools_execution():
    # 1. Search graph
    search_res = search_graph("payment")
    assert search_res["status"] == "success"

    # 2. Get incident info
    inc_res = get_incident_info("INC-001")
    assert inc_res["status"] == "success"
    assert inc_res["incident"]["id"] == "INC-001"

    # 3. Trace dependencies
    trace_res = trace_dependencies("SVC-PAYMENT", max_depth=2)
    assert trace_res["status"] == "success"

    # 4. Find similar incidents
    sim_res = find_similar_incidents("INC-001")
    assert sim_res["status"] == "success"

    # 5. Lookup resolutions
    res_res = lookup_resolutions("connection pool")
    assert res_res["status"] == "success"


def test_multilingual_translation_and_chat_endpoint():
    # Translation helper
    res_hi = translate_text("Database connection pool was exhausted.", "hi")
    assert len(res_hi["translated_text"]) > 0

    res_hinglish = translate_text("Check the latency metrics before restarting the service.", "hinglish")
    assert len(res_hinglish["translated_text"]) > 0

    # API translation endpoint
    res_api = client.post(
        "/api/chat/translate",
        json={"text": "Review connection pool parameters.", "target_language": "hi"}
    )
    assert res_api.status_code == 200
    assert "translated_text" in res_api.json()

    # Chat endpoint with multilingual parameter
    chat_res = client.post(
        "/api/chat",
        json={
            "message": "Why is the payment service slow?",
            "language": "hinglish"
        }
    )
    assert chat_res.status_code == 200
    chat_data = chat_res.json()
    assert "answer" in chat_data
    assert "referenced_service_ids" in chat_data


# ==============================================================================
# 4. AUTHENTICATION, PROFILE UPDATES & PASSWORD CHANGE
# ==============================================================================

def test_auth_profile_and_password_lifecycle():
    email = f"sre_test_{os.urandom(4).hex()}@sentinel.internal"
    password = "TestPassword123!"

    # 1. Register user
    reg_res = client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": password,
            "full_name": "Senior SRE Lead",
            "role": "Incident Commander"
        }
    )
    assert reg_res.status_code == 200
    token = reg_res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Get profile
    prof_res = client.get("/api/auth/profile", headers=headers)
    assert prof_res.status_code == 200
    profile = prof_res.json()
    assert profile["email"] == email
    assert profile["preferred_language"] == "en"

    # 3. Update profile
    upd_res = client.put(
        "/api/auth/profile",
        headers=headers,
        json={
            "display_name": "SRE Commander Lead",
            "job_title": "Principal SRE",
            "department": "Platform Reliability",
            "organization": "Cloud Infrastructure",
            "preferred_language": "hi",
            "time_zone": "Asia/Kolkata",
            "notification_preferences": {"critical_incident_alerts": True}
        }
    )
    assert upd_res.status_code == 200
    updated = upd_res.json()
    assert updated["display_name"] == "SRE Commander Lead"
    assert updated["preferred_language"] == "hi"
    assert updated["time_zone"] == "Asia/Kolkata"

    # 4. Change password securely
    new_password = "BrandNewPassword456!"
    pw_res = client.post(
        "/api/auth/change-password",
        headers=headers,
        json={
            "current_password": password,
            "new_password": new_password
        }
    )
    assert pw_res.status_code == 200
    assert pw_res.json()["status"] == "success"

    # Verify old password fails
    old_login = client.post("/api/auth/login", json={"email": email, "password": password})
    assert old_login.status_code == 401

    # Verify new password succeeds
    new_login = client.post("/api/auth/login", json={"email": email, "password": new_password})
    assert new_login.status_code == 200
    assert "token" in new_login.json()


# ==============================================================================
# 5. CONVERSATION HISTORY CRUD TESTS
# ==============================================================================

def test_conversation_history_lifecycle():
    email = f"hist_test_{os.urandom(4).hex()}@sentinel.internal"
    reg_res = client.post(
        "/api/auth/register",
        json={"email": email, "password": "Password123!", "full_name": "History Tester"}
    )
    token = reg_res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create conversation
    create_res = client.post(
        "/api/history",
        headers=headers,
        json={"title": "Investigating Payment Latency Spike"}
    )
    assert create_res.status_code == 200
    conv_id = create_res.json()["id"]

    # 2. Add chat message linked to conversation
    chat_res = client.post(
        "/api/chat",
        headers=headers,
        json={
            "message": "Which services depend on Payment?",
            "conversation_id": conv_id
        }
    )
    assert chat_res.status_code == 200

    # 3. List conversations
    list_res = client.get("/api/history", headers=headers)
    assert list_res.status_code == 200
    convs = list_res.json()
    assert len(convs) >= 1
    assert any(c["id"] == conv_id for c in convs)

    # 4. Get conversation detail transcript
    detail_res = client.get(f"/api/history/{conv_id}", headers=headers)
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert len(detail["messages"]) >= 2  # user + assistant

    # 5. Delete conversation
    del_res = client.delete(f"/api/history/{conv_id}", headers=headers)
    assert del_res.status_code == 200

    # Verify deleted
    detail_res_after = client.get(f"/api/history/{conv_id}", headers=headers)
    assert detail_res_after.status_code == 404


# ==============================================================================
# 6. GRAPH DIAGNOSTICS & PROVENANCE TESTS
# ==============================================================================

def test_graph_diagnostics_and_provenance_endpoints():
    # Diagnostics
    diag_res = client.get("/api/graph/diagnostics")
    assert diag_res.status_code == 200
    diag = diag_res.json()
    assert diag["total_nodes"] > 0
    assert diag["total_edges"] > 0
    assert "Service" in diag["labels"]
    assert "Incident" in diag["labels"]
    assert "DEPENDS_ON" in diag["relationship_types"]
    assert diag["is_healthy"] is True

    # Provenance
    prov_res = client.get("/api/data/provenance")
    assert prov_res.status_code == 200
    prov = prov_res.json()
    assert prov["synthetic_count"] >= 20
    assert prov["total_nodes"] >= 20
    assert len(prov["breakdown"]) == 3
