from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

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
    return {"query": req.filename, "results": results}
