"""Shared runtime state populated during app lifespan startup."""

from dataclasses import dataclass, field
from pathlib import Path

import numpy as np
import torch
from torchvision import transforms


@dataclass
class AppState:
    model: object = None
    device: torch.device = None
    transform: transforms.Compose = None
    db_emb: np.ndarray = None
    db_files: list[str] = field(default_factory=list)
    db_labels: list[int] = field(default_factory=list)
    val_files: list[str] = field(default_factory=list)
    image_dir: Path = None


# Single instance shared across the application
app_state = AppState()
