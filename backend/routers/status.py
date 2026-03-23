from fastapi import APIRouter
from state import app_state

router = APIRouter(prefix="/api")


@router.get("/status")
def get_status():
    return {
        "status":   app_state.status,
        "progress": app_state.progress,
        "message":  app_state.message,
    }
