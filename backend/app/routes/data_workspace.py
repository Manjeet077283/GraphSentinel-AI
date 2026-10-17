"""
GraphSentinel AI - Data Workspace & Ingestion Routes
Endpoints for uploading, previewing, validating, mapping, importing,
and tracking provenance for user-supplied incident datasets.
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, Query, Header
from backend.app.schemas import (
    UploadPreviewResponse,
    ImportDatasetRequest,
    DatasetSummary,
    DatasetRecordItem,
    ProvenanceSummaryResponse
)
from backend.app.routes.auth import get_current_user
from backend.app.data_ingestion import (
    parse_raw_file,
    infer_column_mapping,
    normalize_record,
    sync_imported_records_to_graph
)
from backend.app.persistence import (
    create_dataset,
    save_dataset_records,
    list_user_datasets,
    get_dataset_by_id,
    get_dataset_records,
    delete_dataset,
    get_provenance_summary
)

router = APIRouter(prefix="/data", tags=["Data Workspace & Ingestion"])

MAX_UPLOAD_BYTES = 25 * 1024 * 1024  # 25 MB limit


@router.post("/upload", response_model=UploadPreviewResponse)
@router.post("/preview", response_model=UploadPreviewResponse)
async def upload_file_for_preview(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Accepts CSV, Excel, JSON, JSONL, LOG, or TXT incident reports.
    Parses content, infers schema, returns preview rows and suggested mapping.
    """
    filename = file.filename or "unknown_dataset"
    content = await file.read()

    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=400, detail="File exceeds maximum allowed size (25 MB).")

    if not content.strip():
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        file_type, rows, columns = parse_raw_file(filename, content)
        if not rows:
            raise HTTPException(
                status_code=400,
                detail=f"Could not parse any valid incident records from '{filename}'. Please check format."
            )

        suggested_mapping = infer_column_mapping(columns)

        return UploadPreviewResponse(
            filename=filename,
            file_type=file_type,
            file_size_bytes=len(content),
            total_rows_detected=len(rows),
            columns_detected=columns,
            sample_records=rows[:10],
            suggested_mapping=suggested_mapping
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to inspect uploaded file: {str(e)}")


@router.post("/import", response_model=DatasetSummary)
def import_dataset(
    req: ImportDatasetRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Validates, normalizes, deduplicates, and stores user-supplied records.
    Optionally syncs valid incident records into FalkorDB with full provenance tagging.
    """
    if not req.records:
        raise HTTPException(status_code=400, detail="No records provided for import.")

    user_id = current_user["id"]
    seen_ids = set()
    normalized_list = []
    valid_count = 0
    rejected_count = 0

    for idx, raw_row in enumerate(req.records):
        norm, is_valid, errors = normalize_record(raw_row, req.column_mapping, idx + 1, seen_ids)
        normalized_list.append(norm)
        if norm["is_valid"]:
            valid_count += 1
        else:
            rejected_count += 1

    summary_info = {
        "total_submitted": len(req.records),
        "valid": valid_count,
        "rejected": rejected_count,
        "integrated_to_graph": req.integrate_to_graph,
        "uploader_name": current_user.get("name") or current_user.get("email")
    }

    # 1. Create dataset entry in SQLite
    dataset = create_dataset(
        user_id=user_id,
        filename=req.filename,
        file_type=req.file_type,
        provenance_type="USER_IMPORTED",
        record_count=len(normalized_list),
        valid_count=valid_count,
        rejected_count=rejected_count,
        status="IMPORTED" if valid_count > 0 else "FAILED",
        column_mapping=req.column_mapping,
        summary=summary_info
    )

    # 2. Persist individual records in SQLite
    save_dataset_records(dataset["id"], user_id, normalized_list)

    # 3. If requested, sync valid records into FalkorDB with DataSource link
    if req.integrate_to_graph and valid_count > 0:
        valid_only = [r for r in normalized_list if r["is_valid"]]
        sync_imported_records_to_graph(dataset["id"], req.filename, user_id, valid_only)

    return dataset


@router.get("/datasets", response_model=List[DatasetSummary])
def get_user_datasets(current_user: dict = Depends(get_current_user)):
    """Lists all datasets uploaded by the current authenticated user."""
    return list_user_datasets(current_user["id"])


@router.get("/datasets/{dataset_id}", response_model=DatasetSummary)
def get_dataset(
    dataset_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Retrieves dataset details and status."""
    ds = get_dataset_by_id(dataset_id, current_user["id"])
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found or access denied.")
    return ds


@router.get("/datasets/{dataset_id}/records", response_model=List[DatasetRecordItem])
def get_dataset_record_items(
    dataset_id: str,
    limit: int = Query(100, ge=1, le=500),
    valid_only: Optional[bool] = Query(None, description="Filter: true for valid, false for rejected"),
    current_user: dict = Depends(get_current_user)
):
    """Retrieves records from an imported dataset, with optional valid/rejected filtering."""
    # Ensure dataset belongs to user
    ds = get_dataset_by_id(dataset_id, current_user["id"])
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found or access denied.")

    return get_dataset_records(dataset_id, current_user["id"], limit=limit, valid_only=valid_only)


@router.delete("/datasets/{dataset_id}")
def remove_dataset(
    dataset_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Deletes a user dataset and associated records."""
    success = delete_dataset(dataset_id, current_user["id"])
    if not success:
        raise HTTPException(status_code=404, detail="Dataset not found or could not be deleted.")
    return {"status": "success", "message": f"Dataset {dataset_id} deleted successfully."}


@router.get("/provenance", response_model=ProvenanceSummaryResponse)
def get_provenance(
    authorization: Optional[str] = Header(None),
    x_session_token: Optional[str] = Header(None)
):
    """
    Returns system-wide data transparency and provenance metrics,
    distinguishing Synthetic Demo Data, User-Imported Data, and Verified External Telemetry.
    """
    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:].strip()
    elif x_session_token:
        token = x_session_token.strip()

    user_id = None
    if token:
        from backend.app.persistence import get_user_by_token
        user = get_user_by_token(token)
        if user:
            user_id = user["id"]

    return get_provenance_summary(user_id)
