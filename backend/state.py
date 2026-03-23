"""Shared runtime state populated during app lifespan startup."""

from dataclasses import dataclass, field
from pathlib import Path
from typing import Literal

import numpy as np
import torch
from torchvision import transforms

Status = Literal["starting", "loading_model", "building_embeddings", "ready", "error"]


@dataclass
class AppState:
    # Retrieval state
    model: object = None
    device: torch.device = None
    transform: transforms.Compose = None
    db_emb: np.ndarray = None
    db_files: list[str] = field(default_factory=list)
    db_labels: list[int] = field(default_factory=list)
    val_files: list[str] = field(default_factory=list)
    val_labels: list[int] = field(default_factory=list)
    val_file_to_label: dict = field(default_factory=dict)  # filename → landmark_id
    db_label_counts: dict = field(default_factory=dict)    # landmark_id → count in train
    image_dir: Path = None

    # Startup progress
    status: Status = "starting"
    progress: int = 0        # 0–100
    message: str = "Starting…"


# Single instance shared across the application
app_state = AppState()
