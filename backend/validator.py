"""
GraphSentinel AI - Dataset Seed Validator
Validates synthetic datasets for:
- Required fields and data types
- Duplicate identifiers
- Referential integrity across services, infrastructure, incidents, evidence, and resolutions
- Valid enum values
- Valid ISO timestamp formats
"""

import json
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Set, Any, Tuple

REQUIRED_SERVICE_FIELDS = {"id", "name", "description", "criticality", "status", "team"}
REQUIRED_INFRA_FIELDS = {"id", "name", "type", "environment", "status"}
REQUIRED_INCIDENT_FIELDS = {"id", "title", "description", "severity", "status", "affected_service_id", "created_at", "updated_at"}
REQUIRED_EVIDENCE_FIELDS = {"id", "incident_id", "source_type", "description", "timestamp"}
REQUIRED_RESOLUTION_FIELDS = {"id", "incident_id", "description", "outcome", "effectiveness"}

VALID_CRITICALITY = {"TIER_1", "TIER_2", "TIER_3", "TIER_4"}
VALID_SERVICE_STATUS = {"HEALTHY", "DEGRADED", "CRITICAL"}
VALID_INFRA_STATUS = {"HEALTHY", "DEGRADED", "CRITICAL"}
VALID_INCIDENT_SEVERITY = {"P1_CRITICAL", "P2_HIGH", "P3_MEDIUM", "P4_LOW"}
VALID_INCIDENT_STATUS = {"OPEN", "INVESTIGATING", "MITIGATED", "RESOLVED"}
VALID_SOURCE_TYPE = {"LOG", "METRIC", "ALERT", "TRACE", "OBSERVATION"}
VALID_OUTCOME = {"SUCCESS", "PARTIAL_SUCCESS", "FAILED"}
VALID_EFFECTIVENESS = {"HIGH", "MEDIUM", "LOW"}


class ValidationError(Exception):
    pass


def validate_iso_timestamp(ts: str, field_name: str, item_id: str) -> None:
    try:
        datetime.fromisoformat(ts.replace("Z", "+00:00"))
    except Exception as e:
        raise ValidationError(f"Invalid timestamp '{ts}' in {field_name} for item '{item_id}': {e}")


def load_dataset(data_dir: Path) -> Dict[str, Any]:
    files = {
        "services": data_dir / "services.json",
        "infrastructure": data_dir / "infrastructure.json",
        "dependencies": data_dir / "dependencies.json",
        "incidents": data_dir / "incidents.json",
        "evidence": data_dir / "evidence.json",
        "resolutions": data_dir / "resolutions.json",
    }
    
    dataset = {}
    for key, path in files.items():
        if not path.exists():
            raise FileNotFoundError(f"Missing required dataset file: {path}")
        with open(path, "r", encoding="utf-8") as f:
            try:
                dataset[key] = json.load(f)
            except json.JSONDecodeError as e:
                raise ValidationError(f"Corrupted JSON in {path}: {e}")
    return dataset


def validate_dataset(data_dir: Path) -> Tuple[bool, List[str]]:
    errors = []
    
    try:
        data = load_dataset(data_dir)
    except Exception as e:
        return False, [str(e)]

    # 1. Services
    service_ids: Set[str] = set()
    for svc in data["services"]:
        if not isinstance(svc, dict):
            errors.append("Service item is not a dictionary.")
            continue
        missing = REQUIRED_SERVICE_FIELDS - set(svc.keys())
        if missing:
            errors.append(f"Service {svc.get('id', 'UNKNOWN')} missing fields: {missing}")
        sid = svc.get("id")
        if not sid:
            errors.append("Service has empty ID.")
        elif sid in service_ids:
            errors.append(f"Duplicate service ID: {sid}")
        else:
            service_ids.add(sid)
        
        if svc.get("criticality") not in VALID_CRITICALITY:
            errors.append(f"Service {sid} invalid criticality: {svc.get('criticality')}")
        if svc.get("status") not in VALID_SERVICE_STATUS:
            errors.append(f"Service {sid} invalid status: {svc.get('status')}")

    # 2. Infrastructure
    infra_ids: Set[str] = set()
    for inf in data["infrastructure"]:
        if not isinstance(inf, dict):
            errors.append("Infrastructure item is not a dictionary.")
            continue
        missing = REQUIRED_INFRA_FIELDS - set(inf.keys())
        if missing:
            errors.append(f"Infrastructure {inf.get('id', 'UNKNOWN')} missing fields: {missing}")
        iid = inf.get("id")
        if not iid:
            errors.append("Infrastructure has empty ID.")
        elif iid in infra_ids:
            errors.append(f"Duplicate infrastructure ID: {iid}")
        else:
            infra_ids.add(iid)
        
        if inf.get("status") not in VALID_INFRA_STATUS:
            errors.append(f"Infrastructure {iid} invalid status: {inf.get('status')}")

    # Check for ID collisions across services and infra
    overlap = service_ids.intersection(infra_ids)
    if overlap:
        errors.append(f"ID collision between Service and Infrastructure: {overlap}")

    # 3. Dependencies
    deps = data["dependencies"]
    service_deps = deps.get("service_dependencies", [])
    infra_conns = deps.get("infrastructure_connections", [])

    for edge in service_deps:
        src = edge.get("source")
        tgt = edge.get("target")
        if src not in service_ids:
            errors.append(f"Service dependency source '{src}' not found in services.")
        if tgt not in service_ids:
            errors.append(f"Service dependency target '{tgt}' not found in services.")
        if src == tgt:
            errors.append(f"Self-referential service dependency detected on '{src}'.")

    for edge in infra_conns:
        src = edge.get("source")
        tgt = edge.get("target")
        if src not in service_ids:
            errors.append(f"Infrastructure connection source '{src}' not found in services.")
        if tgt not in infra_ids:
            errors.append(f"Infrastructure connection target '{tgt}' not found in infrastructure.")

    # 4. Incidents
    incident_ids: Set[str] = set()
    for inc in data["incidents"]:
        missing = REQUIRED_INCIDENT_FIELDS - set(inc.keys())
        if missing:
            errors.append(f"Incident {inc.get('id', 'UNKNOWN')} missing fields: {missing}")
        iid = inc.get("id")
        if not iid:
            errors.append("Incident has empty ID.")
        elif iid in incident_ids:
            errors.append(f"Duplicate incident ID: {iid}")
        else:
            incident_ids.add(iid)

        if inc.get("severity") not in VALID_INCIDENT_SEVERITY:
            errors.append(f"Incident {iid} invalid severity: {inc.get('severity')}")
        if inc.get("status") not in VALID_INCIDENT_STATUS:
            errors.append(f"Incident {iid} invalid status: {inc.get('status')}")

        aff_svc = inc.get("affected_service_id")
        if aff_svc not in service_ids:
            errors.append(f"Incident {iid} affected_service_id '{aff_svc}' not found in services.")

        try:
            validate_iso_timestamp(inc.get("created_at", ""), "created_at", iid)
            validate_iso_timestamp(inc.get("updated_at", ""), "updated_at", iid)
        except ValidationError as ve:
            errors.append(str(ve))

    # 5. Evidence
    evidence_ids: Set[str] = set()
    for ev in data["evidence"]:
        missing = REQUIRED_EVIDENCE_FIELDS - set(ev.keys())
        if missing:
            errors.append(f"Evidence {ev.get('id', 'UNKNOWN')} missing fields: {missing}")
        eid = ev.get("id")
        if not eid:
            errors.append("Evidence has empty ID.")
        elif eid in evidence_ids:
            errors.append(f"Duplicate evidence ID: {eid}")
        else:
            evidence_ids.add(eid)

        if ev.get("source_type") not in VALID_SOURCE_TYPE:
            errors.append(f"Evidence {eid} invalid source_type: {ev.get('source_type')}")

        inc_ref = ev.get("incident_id")
        if inc_ref not in incident_ids:
            errors.append(f"Evidence {eid} incident_id '{inc_ref}' not found in incidents.")

        try:
            validate_iso_timestamp(ev.get("timestamp", ""), "timestamp", eid)
        except ValidationError as ve:
            errors.append(str(ve))

    # 6. Resolutions
    resolution_ids: Set[str] = set()
    for res in data["resolutions"]:
        missing = REQUIRED_RESOLUTION_FIELDS - set(res.keys())
        if missing:
            errors.append(f"Resolution {res.get('id', 'UNKNOWN')} missing fields: {missing}")
        rid = res.get("id")
        if not rid:
            errors.append("Resolution has empty ID.")
        elif rid in resolution_ids:
            errors.append(f"Duplicate resolution ID: {rid}")
        else:
            resolution_ids.add(rid)

        if res.get("outcome") not in VALID_OUTCOME:
            errors.append(f"Resolution {rid} invalid outcome: {res.get('outcome')}")
        if res.get("effectiveness") not in VALID_EFFECTIVENESS:
            errors.append(f"Resolution {rid} invalid effectiveness: {res.get('effectiveness')}")

        inc_ref = res.get("incident_id")
        if inc_ref not in incident_ids:
            errors.append(f"Resolution {rid} incident_id '{inc_ref}' not found in incidents.")

        if res.get("applied_at"):
            try:
                validate_iso_timestamp(res.get("applied_at", ""), "applied_at", rid)
            except ValidationError as ve:
                errors.append(str(ve))

    is_valid = len(errors) == 0
    return is_valid, errors


if __name__ == "__main__":
    base_dir = Path(__file__).resolve().parent / "data"
    valid, errs = validate_dataset(base_dir)
    if valid:
        print("Dataset Validation PASSED: 0 errors detected. Full referential integrity verified.")
    else:
        print(f"Dataset Validation FAILED with {len(errs)} errors:")
        for e in errs:
            print(f"  - {e}")
        exit(1)
