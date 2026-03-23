"""Model loading and database embedding cache management."""

import sys
from pathlib import Path

import numpy as np
import pandas as pd
import torch
from PIL import Image
from torch.utils.data import Dataset, DataLoader

BACKEND    = Path(__file__).parent.parent
TRAIN_DIR  = BACKEND / "trained_model" / "train"
CHECKPOINT = TRAIN_DIR / "checkpoints" / "best_model.pth"
DATA_DIR   = BACKEND / "data" / "gldv2_micro"
CACHE_FILE = BACKEND / "db_embeddings_cache.npz"

# Make trained_model/train importable
if str(TRAIN_DIR) not in sys.path:
    sys.path.insert(0, str(TRAIN_DIR))

from model import LandmarkRetrievalModel   # noqa: E402
from dataset import get_val_transform      # noqa: E402


class _ImageListDataset(Dataset):
    def __init__(self, filenames: list[str], image_dir: Path, transform):
        self.filenames = filenames
        self.image_dir = image_dir
        self.transform = transform

    def __len__(self):
        return len(self.filenames)

    def __getitem__(self, idx):
        img = Image.open(self.image_dir / self.filenames[idx]).convert("RGB")
        return self.transform(img), idx


def load_model(device: torch.device) -> LandmarkRetrievalModel:
    ckpt = torch.load(CHECKPOINT, map_location=device, weights_only=False)
    model = LandmarkRetrievalModel(
        num_classes=ckpt["num_classes"],
        embedding_dim=ckpt.get("embedding_dim", 512),
    )
    model.load_state_dict(ckpt["model_state_dict"])
    model.to(device).eval()
    print(f"Loaded checkpoint: epoch={ckpt.get('epoch')}, val_acc={ckpt.get('val_acc')}")
    return model


def load_csv_lists() -> tuple[list[str], list[int], list[str]]:
    """Returns (db_files, db_labels, val_files)."""
    train_df = pd.read_csv(DATA_DIR / "train.csv")
    val_df   = pd.read_csv(DATA_DIR / "val.csv")
    return (
        train_df["filename"].tolist(),
        train_df["landmark_id"].tolist(),
        val_df["filename"].tolist(),
    )


def _extract_embeddings(
    model: LandmarkRetrievalModel,
    device: torch.device,
    filenames: list[str],
    image_dir: Path,
    transform,
) -> np.ndarray:
    dataset = _ImageListDataset(filenames, image_dir, transform)
    loader  = DataLoader(dataset, batch_size=64, num_workers=0, shuffle=False)
    parts   = []
    model.eval()
    with torch.no_grad():
        for imgs, _ in loader:
            emb = model.extract_embedding(imgs.to(device))
            parts.append(emb.cpu().numpy())
    return np.concatenate(parts, axis=0)


def get_db_embeddings(
    model: LandmarkRetrievalModel,
    device: torch.device,
    db_files: list[str],
    transform,
) -> np.ndarray:
    """Return cached embeddings if valid, otherwise compute and cache them."""
    image_dir = DATA_DIR / "images"

    if CACHE_FILE.exists():
        cached = np.load(CACHE_FILE)
        if len(cached["embeddings"]) == len(db_files):
            print(f"Loaded cached embeddings ({len(db_files)} images).")
            return cached["embeddings"]
        print("Cache size mismatch — rebuilding embeddings…")

    print(f"Building embeddings for {len(db_files)} training images…")
    embeddings = _extract_embeddings(model, device, db_files, image_dir, transform)
    np.savez(CACHE_FILE, embeddings=embeddings)
    print("Embeddings cached.")
    return embeddings


def get_transform():
    return get_val_transform()


def get_image_dir() -> Path:
    return DATA_DIR / "images"
