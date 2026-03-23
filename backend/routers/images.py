from fastapi import APIRouter

from state import app_state

router = APIRouter(prefix="/api")


@router.get("/val-images")
def get_val_images():
    images = [
        {
            "filename":       fn,
            "label":          lbl,
            "db_class_total": app_state.db_label_counts.get(lbl, 0),
        }
        for fn, lbl in zip(app_state.val_files, app_state.val_labels)
    ]
    return {"images": images}
