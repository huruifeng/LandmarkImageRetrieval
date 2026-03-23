"""
FastAPI application entry point.

Start (from landmark/backend/):
    uvicorn main:app --reload --port 8000
"""

from contextlib import asynccontextmanager

import torch
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from state import app_state
from services.loader import (
    get_db_embeddings,
    get_image_dir,
    get_transform,
    load_csv_lists,
    load_model,
)
from routers import images, retrieve


@asynccontextmanager
async def lifespan(app: FastAPI):
    device    = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    transform = get_transform()
    model     = load_model(device)

    db_files, db_labels, val_files = load_csv_lists()
    db_emb = get_db_embeddings(model, device, db_files, transform)

    app_state.model     = model
    app_state.device    = device
    app_state.transform = transform
    app_state.db_emb    = db_emb
    app_state.db_files  = db_files
    app_state.db_labels = db_labels
    app_state.val_files = val_files
    app_state.image_dir = get_image_dir()

    print(f"Ready — {len(val_files)} val images, {len(db_files)} db images.")
    yield
    # nothing to clean up


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/images", StaticFiles(directory=str(get_image_dir())), name="images")

app.include_router(images.router)
app.include_router(retrieve.router)
