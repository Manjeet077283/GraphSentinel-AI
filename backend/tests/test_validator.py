"""
Tests for Synthetic Dataset Validator.
"""

from pathlib import Path
from backend.validator import validate_dataset, load_dataset


def test_synthetic_dataset_is_valid():
    data_dir = Path(__file__).resolve().parent.parent / "data"
    is_valid, errors = validate_dataset(data_dir)
    assert is_valid, f"Dataset validation failed: {errors}"
    assert len(errors) == 0


def test_dataset_contains_target_counts():
    data_dir = Path(__file__).resolve().parent.parent / "data"
    data = load_dataset(data_dir)
    
    assert len(data["services"]) >= 15, "Target at least 15 services"
    assert len(data["infrastructure"]) >= 8, "Target at least 8 infrastructure components"
    assert len(data["incidents"]) >= 40, "Target approximately 40 incidents"
    assert len(data["evidence"]) >= 60, "Target at least 60 evidence records"
    assert len(data["resolutions"]) >= 15, "Target approximately 15 resolutions"

    deps = data["dependencies"]
    total_rels = len(deps.get("service_dependencies", [])) + len(deps.get("infrastructure_connections", []))
    assert total_rels >= 30, "Target 30-50 dependency relationships"
