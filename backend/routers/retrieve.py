from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from state import app_state
from services.search import embed_query, find_top_n

router = APIRouter(prefix="/api")


class RetrieveRequest(BaseModel):
    filename: str
    top_n: int = Field(default=5, ge=1, le=50)


@router.post("/retrieve")
def retrieve(req: RetrieveRequest):
    try:
        query_emb = embed_query(req.filename)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Image not found: {req.filename}")

    results = find_top_n(query_emb, req.top_n)

    query_label    = app_state.val_file_to_label.get(req.filename)
    db_class_total = app_state.db_label_counts.get(query_label, 0)
    matched_count  = sum(1 for r in results if r["label"] == query_label)
    match_rate     = matched_count / db_class_total if db_class_total > 0 else 0.0

    return {
        "query":          req.filename,
        "query_label":    query_label,
        "db_class_total": db_class_total,
        "matched_count":  matched_count,
        "match_rate":     round(match_rate, 4),
        "results":        results,
    }
