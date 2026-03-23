from fastapi import APIRouter

from state import app_state

router = APIRouter(prefix="/api")


@router.get("/val-images")
def get_val_images():
    return {"filenames": app_state.val_files}
