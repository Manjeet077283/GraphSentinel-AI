"""
GraphSentinel AI - Data Ingestion & Normalization Engine
Parses CSV, Excel, JSON, JSONL, logs, and plain-text incident reports.
Provides schema inference, column mapping, normalization, deduplication,
and safe idempotent FalkorDB graph integration with provenance tracking.
"""

import io
import re
import csv
import json
import logging
import hashlib
from typing import Dict, Any, List, Tuple, Optional
from datetime import datetime, timezone
import openpyxl

from backend.app.database import get_graph

logger = logging.getLogger("graphsentinel.ingestion")

# Standard canonical fields for incident intelligence
CANONICAL_FIELDS = {
    "incident_id": ["incident_id", "incident_code", "id", "ticket_id", "issue_id", "inc_id", "alert_id", "incident"],
    "timestamp": ["timestamp", "time", "date", "created_at", "logged_at", "datetime", "occurred_at"],
    "severity": ["severity", "priority", "urgency", "level", "sev", "crit"],
    "service": ["service", "service_name", "service_id", "component", "app", "application", "system"],
    "service_id": ["service_id", "service", "service_name", "component", "app", "application", "system"],
    "title": ["title", "summary", "subject", "headline", "short_description", "name"],
    "error_message": ["error_message", "err_msg", "err", "description", "details", "message", "body", "log_entry", "symptom"],
    "description": ["description", "details", "error_message", "err_msg", "err", "message", "body", "log_entry", "symptom"],
    "status": ["status", "state", "resolution_status", "lifecycle"],
    "dependencies": ["dependencies", "depends_on", "downstream", "upstream", "impacted_services"],
    "evidence": ["evidence", "telemetry", "metric", "root_cause_evidence", "log_snippet", "stacktrace"],
    "resolution": ["resolution", "resolution_info", "fix", "solution", "remediation", "action_taken"]
}

SEVERITY_MAP = {
    "p1": "P1_CRITICAL",
    "critical": "P1_CRITICAL",
    "crit": "P1_CRITICAL",
    "fatal": "P1_CRITICAL",
    "sev1": "P1_CRITICAL",
    "p2": "P2_HIGH",
    "high": "P2_HIGH",
    "sev2": "P2_HIGH",
    "major": "P2_HIGH",
    "p3": "P3_MEDIUM",
    "medium": "P3_MEDIUM",
    "med": "P3_MEDIUM",
    "sev3": "P3_MEDIUM",
    "moderate": "P3_MEDIUM",
    "p4": "P4_LOW",
    "low": "P4_LOW",
    "minor": "P4_LOW",
    "sev4": "P4_LOW",
    "info": "P4_LOW"
}

STATUS_MAP = {
    "open": "OPEN",
    "new": "OPEN",
    "active": "OPEN",
    "unresolved": "OPEN",
    "investigating": "INVESTIGATING",
    "in_progress": "INVESTIGATING",
    "triaging": "INVESTIGATING",
    "mitigated": "MITIGATED",
    "remediated": "MITIGATED",
    "contained": "MITIGATED",
    "resolved": "RESOLVED",
    "closed": "RESOLVED",
    "fixed": "RESOLVED"
}


def detect_file_type(filename: str, content: bytes) -> str:
    """Detects supported format from filename extension or content inspection."""
    fname = filename.lower()
    if fname.endswith(".csv"):
        return "CSV"
    if fname.endswith(".xlsx") or fname.endswith(".xls"):
        return "EXCEL"
    if fname.endswith(".jsonl"):
        return "JSONL"
    if fname.endswith(".json"):
        return "JSON"
    if fname.endswith(".log"):
        return "LOG"
    if fname.endswith(".txt") or fname.endswith(".md"):
        return "TEXT"

    # Inspect bytes content
    stripped = content.strip()
    if stripped.startswith(b"{") or stripped.startswith(b"["):
        return "JSON"
    if b"," in stripped[:500] and b"\n" in stripped[:500]:
        return "CSV"
    return "TEXT"


def parse_raw_file(filename: str, content: bytes) -> Tuple[str, List[Dict[str, Any]], List[str]]:
    """
    Parses file bytes into uniform list of row dictionaries and column headers.
    Supports CSV, Excel (.xlsx/.xls), JSON, JSONL, logs, and plain-text reports.
    """
    file_type = detect_file_type(filename, content)
    rows: List[Dict[str, Any]] = []
    columns: List[str] = []

    if file_type == "CSV":
        text = content.decode("utf-8", errors="replace")
        reader = csv.DictReader(io.StringIO(text))
        if reader.fieldnames:
            columns = [str(col).strip() for col in reader.fieldnames if col]
            for r in reader:
                clean_row = {k.strip(): (v.strip() if isinstance(v, str) else v) for k, v in r.items() if k}
                if any(clean_row.values()):
                    rows.append(clean_row)

    elif file_type == "EXCEL":
        wb = openpyxl.load_workbook(io.BytesIO(content), data_only=True)
        sheet = wb.active
        all_rows = list(sheet.iter_rows(values_only=True))
        if all_rows:
            header_row = all_rows[0]
            columns = [str(c).strip() if c is not None else f"col_{idx}" for idx, c in enumerate(header_row)]
            for r in all_rows[1:]:
                if not any(r):
                    continue
                row_dict = {}
                for idx, val in enumerate(r):
                    if idx < len(columns):
                        row_dict[columns[idx]] = str(val).strip() if val is not None else ""
                rows.append(row_dict)

    elif file_type == "JSON":
        text = content.decode("utf-8", errors="replace")
        data = json.loads(text)
        if isinstance(data, list):
            rows = [d for d in data if isinstance(d, dict)]
        elif isinstance(data, dict):
            # Check if nested array exists (e.g. {"incidents": [...]})
            for k, v in data.items():
                if isinstance(v, list) and v and isinstance(v[0], dict):
                    rows = v
                    break
            if not rows:
                rows = [data]
        if rows:
            cols_set = set()
            for r in rows:
                cols_set.update(r.keys())
            columns = sorted(list(cols_set))

    elif file_type == "JSONL":
        text = content.decode("utf-8", errors="replace")
        for line in text.splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                item = json.loads(line)
                if isinstance(item, dict):
                    rows.append(item)
            except Exception:
                continue
        if rows:
            cols_set = set()
            for r in rows:
                cols_set.update(r.keys())
            columns = sorted(list(cols_set))

    elif file_type in ("LOG", "TEXT"):
        text = content.decode("utf-8", errors="replace")
        lines = [l.strip() for l in text.splitlines() if l.strip()]
        columns = ["timestamp", "level", "severity", "service", "service_id", "message", "raw_line"]

        # Parse standard log patterns:
        # e.g.: 2026-10-17 12:00:01 [ERROR] [svc-payment] DB Connection pool exhausted...
        # or: [2026-10-17 12:00:01] [ERROR] [svc-payment] ...
        log_regex = re.compile(
            r"^(?:\[?(?P<timestamp>\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)\]?\s*)?"
            r"(?:\[(?P<severity>ERROR|WARN|WARNING|INFO|CRITICAL|FATAL|DEBUG|P1|P2|P3|P4)\]\s*)?"
            r"(?:\[(?P<service>[a-zA-Z0-9_\-]+)\]\s*)?"
            r"(?P<message>.*)$",
            re.IGNORECASE
        )

        for idx, line in enumerate(lines):
            m = log_regex.match(line)
            if m:
                gd = m.groupdict()
                lvl = (gd.get("severity") or "INFO").upper()
                svc = gd.get("service") or "svc-application"
                row = {
                    "timestamp": gd.get("timestamp") or datetime.now(timezone.utc).isoformat(),
                    "level": lvl,
                    "severity": lvl,
                    "service": svc,
                    "service_id": svc.upper() if svc.upper().startswith("SVC-") else f"SVC-{svc.upper()}",
                    "title": gd.get("message")[:100] if gd.get("message") else f"Log Event #{idx+1}",
                    "description": gd.get("message") or line,
                    "message": gd.get("message") or line,
                    "raw_line": line
                }
                rows.append(row)
            else:
                rows.append({
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "level": "INFO",
                    "severity": "P3_MEDIUM",
                    "service": "application",
                    "service_id": "SVC-APPLICATION",
                    "title": line[:100],
                    "description": line,
                    "message": line,
                    "raw_line": line
                })

    return file_type, rows, columns


def infer_column_mapping(columns: List[str]) -> Dict[str, str]:
    """Infers optimal mapping from detected file columns to canonical incident fields."""
    mapping: Dict[str, str] = {}
    cols_lower = {col.lower(): col for col in columns}

    for canonical, variations in CANONICAL_FIELDS.items():
        matched = None
        for v in variations:
            if v in cols_lower:
                matched = cols_lower[v]
                break
        if not matched:
            # Substring match fallback
            for col_lower, original_col in cols_lower.items():
                if any(v in col_lower for v in variations):
                    matched = original_col
                    break
        if matched:
            mapping[canonical] = matched

    return mapping


def normalize_record(
    raw_row: Dict[str, Any],
    mapping: Dict[str, str],
    row_index: int = 1,
    seen_ids: Optional[set] = None
) -> Tuple[Dict[str, Any], bool, List[str]]:
    """
    Normalizes a single record against canonical incident intelligence fields.
    Validates required fields, normalizes severity/status, and collects rejection errors.
    Returns (normalized_dict, is_valid, validation_errors_list).
    """
    if seen_ids is None:
        seen_ids = set()

    errors: List[str] = []

    def get_val(canonical_key: str) -> str:
        mapped_col = mapping.get(canonical_key)
        if mapped_col and mapped_col in raw_row:
            v = raw_row[mapped_col]
            return str(v).strip() if v is not None else ""
        if canonical_key in raw_row:
            v = raw_row[canonical_key]
            return str(v).strip() if v is not None else ""
        return ""

    raw_id = get_val("incident_id")
    raw_title = get_val("title")
    raw_desc = get_val("description") or get_val("error_message")
    raw_sev = get_val("severity").lower()
    raw_status = get_val("status").lower()
    raw_svc = get_val("service") or get_val("service_id")
    raw_ts = get_val("timestamp")

    # Generate or validate incident ID
    if not raw_id:
        incident_id = f"INC-IMP-{row_index:04d}"
    else:
        # Sanitize ID format
        sanitized = re.sub(r"[^A-Za-z0-9\-]", "", raw_id).upper()
        incident_id = sanitized if sanitized.startswith("INC-") else f"INC-{sanitized}"

    # Deduplication check
    if incident_id in seen_ids:
        errors.append(f"Duplicate incident ID '{incident_id}' detected at row {row_index}.")
    seen_ids.add(incident_id)

    # Title & Description validation
    title = raw_title or (raw_desc[:80] + "..." if len(raw_desc) > 80 else raw_desc)
    if not title:
        title = f"Imported Incident #{row_index}"
        errors.append(f"Row {row_index}: Missing title and description.")

    description = raw_desc or raw_title or "No detailed description provided in source record."

    # Severity normalization
    severity = SEVERITY_MAP.get(raw_sev)
    if not severity:
        if "crit" in raw_sev or "1" in raw_sev:
            severity = "P1_CRITICAL"
        elif "high" in raw_sev or "2" in raw_sev:
            severity = "P2_HIGH"
        elif "low" in raw_sev or "4" in raw_sev:
            severity = "P4_LOW"
        else:
            severity = "P3_MEDIUM"

    # Status normalization
    status = STATUS_MAP.get(raw_status)
    if not status:
        status = "OPEN"

    # Service normalization
    svc_raw = raw_svc.strip() if raw_svc else ""
    if not svc_raw:
        service_id = "SVC-UNKNOWN"
        service_name = "Unknown"
    else:
        service_name = svc_raw
        service_id = svc_raw.upper() if svc_raw.upper().startswith("SVC-") else f"SVC-{svc_raw.upper()}"

    # Timestamp normalization
    if not raw_ts:
        timestamp = datetime.now(timezone.utc).isoformat()
    else:
        timestamp = raw_ts

    is_valid = len(errors) == 0

    normalized = {
        "incident_id": incident_id,
        "service": service_name,
        "service_id": service_id,
        "title": title,
        "description": description,
        "error_message": raw_desc or description,
        "severity": severity,
        "status": status,
        "timestamp": timestamp,
        "evidence": get_val("evidence"),
        "resolution": get_val("resolution"),
        "dependencies": get_val("dependencies"),
        "raw_data": raw_row,
        "is_valid": is_valid,
        "validation_errors": errors
    }

    return normalized, is_valid, errors


def calculate_record_hash(normalized: Dict[str, Any]) -> str:
    """Computes a deterministic SHA-256 fingerprint for deduplication."""
    inc_id = str(normalized.get("incident_id") or "")
    svc = str(normalized.get("service") or normalized.get("service_id") or "")
    title = str(normalized.get("title") or "")
    ts = str(normalized.get("timestamp") or "")
    sev = str(normalized.get("severity") or "")
    raw_key = f"{inc_id}::{svc}::{title}::{ts}::{sev}"
    return hashlib.sha256(raw_key.encode("utf-8")).hexdigest()


def parse_uploaded_file(content_or_filename: Any, filename_or_content: Any = None) -> Dict[str, Any]:
    """
    Unified entry point for testing and data workspace parsing.
    Accepts (content, filename) or (filename, content).
    Returns a dictionary with keys:
    - detected_format: str (e.g. 'csv', 'json', 'jsonl', 'log', 'text')
    - total_rows: int
    - columns: List[str]
    - rows: List[Dict[str, Any]]
    - sample_records: List[Dict[str, Any]]
    """
    if isinstance(content_or_filename, (bytes, bytearray)):
        content = bytes(content_or_filename)
        filename = str(filename_or_content or "dataset.dat")
    elif isinstance(filename_or_content, (bytes, bytearray)):
        content = bytes(filename_or_content)
        filename = str(content_or_filename or "dataset.dat")
    elif isinstance(content_or_filename, str) and filename_or_content is None:
        filename = content_or_filename
        content = b""
    else:
        filename = str(filename_or_content or "dataset.dat")
        content = str(content_or_filename).encode("utf-8")

    file_type, rows, columns = parse_raw_file(filename, content)
    return {
        "detected_format": file_type.lower(),
        "total_rows": len(rows),
        "columns": columns,
        "rows": rows,
        "sample_records": rows[:10]
    }


def sync_imported_records_to_graph(
    dataset_id: str,
    filename: str,
    user_id: str,
    valid_records: List[Dict[str, Any]]
) -> int:
    """
    Safely and idempotently merges imported incidents and data sources into FalkorDB.
    Preserves all existing data, never wipes, and tags nodes with provenance: 'USER_IMPORTED'.
    """
    if not valid_records:
        return 0

    try:
        graph = get_graph()
        now_str = datetime.now(timezone.utc).isoformat()

        # 1. Create or Merge DataSource node
        ds_query = (
            "MERGE (ds:DataSource {id: $ds_id}) "
            "SET ds.name = $name, "
            "    ds.provenance = 'USER_IMPORTED', "
            "    ds.user_id = $user_id, "
            "    ds.imported_at = $imported_at"
        )
        graph.query(ds_query, {
            "ds_id": dataset_id,
            "name": filename,
            "user_id": user_id,
            "imported_at": now_str
        })

        merged_count = 0
        for r in valid_records:
            inc_id = r["incident_id"]
            svc_id = r["service_id"]
            title = r["title"]
            desc = r["description"]
            sev = r["severity"]
            status = r["status"]

            # Merge service if not existing
            svc_query = (
                "MERGE (s:Service {id: $svc_id}) "
                "ON CREATE SET s.name = $svc_id, "
                "              s.description = 'Imported external service', "
                "              s.criticality = 'TIER_3', "
                "              s.status = 'HEALTHY', "
                "              s.team = 'Platform Infrastructure', "
                "              s.provenance = 'USER_IMPORTED'"
            )
            graph.query(svc_query, {"svc_id": svc_id})

            # Merge Incident and link to DataSource and Service
            inc_query = (
                "MERGE (i:Incident {id: $inc_id}) "
                "SET i.title = $title, "
                "    i.description = $desc, "
                "    i.severity = $sev, "
                "    i.status = $status, "
                "    i.created_at = $created_at, "
                "    i.updated_at = $updated_at, "
                "    i.provenance = 'USER_IMPORTED', "
                "    i.dataset_id = $dataset_id "
                "WITH i "
                "MATCH (ds:DataSource {id: $dataset_id}) "
                "MERGE (i)-[:DERIVED_FROM]->(ds) "
                "WITH i "
                "MATCH (s:Service {id: $svc_id}) "
                "MERGE (i)-[:AFFECTS]->(s)"
            )
            graph.query(inc_query, {
                "inc_id": inc_id,
                "title": title,
                "desc": desc,
                "sev": sev,
                "status": status,
                "created_at": r["timestamp"],
                "updated_at": now_str,
                "dataset_id": dataset_id,
                "svc_id": svc_id
            })

            # If evidence is provided, attach Evidence node
            ev_text = r.get("evidence")
            if ev_text:
                ev_id = f"EVD-{inc_id}-01"
                ev_query = (
                    "MERGE (e:Evidence {id: $ev_id}) "
                    "SET e.description = $desc, "
                    "    e.source_type = 'OBSERVATION', "
                    "    e.timestamp = $ts, "
                    "    e.provenance = 'USER_IMPORTED' "
                    "WITH e "
                    "MATCH (i:Incident {id: $inc_id}) "
                    "MERGE (i)-[:SUPPORTED_BY]->(e)"
                )
                graph.query(ev_query, {
                    "ev_id": ev_id,
                    "desc": ev_text,
                    "ts": r["timestamp"],
                    "inc_id": inc_id
                })

            # If resolution is provided, attach Resolution node
            res_text = r.get("resolution")
            if res_text:
                res_id = f"RES-{inc_id}-01"
                res_query = (
                    "MERGE (r:Resolution {id: $res_id}) "
                    "SET r.description = $desc, "
                    "    r.outcome = 'SUCCESS', "
                    "    r.effectiveness = 'HIGH', "
                    "    r.provenance = 'USER_IMPORTED' "
                    "WITH r "
                    "MATCH (i:Incident {id: $inc_id}) "
                    "MERGE (i)-[:RESOLVED_BY]->(r)"
                )
                graph.query(res_query, {
                    "res_id": res_id,
                    "desc": res_text,
                    "inc_id": inc_id
                })

            merged_count += 1

        logger.info(f"Successfully integrated {merged_count} user-imported records into FalkorDB graph for dataset {dataset_id}")
        return merged_count

    except Exception as e:
        logger.error(f"Failed to sync dataset {dataset_id} to FalkorDB: {e}")
        return 0
