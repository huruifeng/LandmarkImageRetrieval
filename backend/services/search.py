"""Cosine similarity nearest-neighbour search over L2-normalised embeddings."""

import numpy as np
import torch
from PIL import Image

from state import app_state


def embed_query(filename: str) -> np.ndarray:
    """Load an image and return its L2-normalised embedding (1, D)."""
    img_path = app_state.image_dir / filename
    if not img_path.exists():
        raise FileNotFoundError(filename)

    img    = Image.open(img_path).convert("RGB")
    tensor = app_state.transform(img).unsqueeze(0).to(app_state.device)

    with torch.no_grad():
        emb = app_state.model.extract_embedding(tensor)
    return emb.cpu().numpy()          # (1, D)


def find_top_n(query_emb: np.ndarray, top_n: int) -> list[dict]:
    """
    Cosine similarity search (dot product on L2-normalised vectors).
    Returns a list of dicts sorted by descending similarity.
    """
    sims    = (app_state.db_emb @ query_emb.T).squeeze()   # (N,)
    top_n   = min(top_n, len(app_state.db_files))
    indices = np.argsort(sims)[::-1][:top_n]

    return [
        {
            "rank":       rank + 1,
            "filename":   app_state.db_files[int(i)],
            "label":      int(app_state.db_labels[int(i)]),
            "similarity": float(sims[i]),
        }
        for rank, i in enumerate(indices)
    ]
