# Landmark Image Retrieval

A full-stack landmark image retrieval system built on **Google Landmarks Dataset v2 (GLDv2, [Micro version](https://www.kaggle.com/datasets/confirm/google-landmark-dataset-v2-micro) )**. Given a query image from the validation set, the system retrieves the most visually similar landmark images from the training database using a fine-tuned ResNet50 + ArcFace model.

---

## How It Works

1. A **ResNet50** backbone (pretrained) extracts image features
2. A **512-d embedding head** + **ArcFace loss** fine-tunes the model to learn discriminative landmark representations
3. At inference, all training images are encoded into L2-normalised embeddings (cached on first run)
4. A query image is encoded and matched against the database via **cosine similarity**

---

## Project Structure

```
landmark/
├── backend/
│   ├── main.py                        # FastAPI app entry point
│   ├── state.py                       # Shared runtime state
│   ├── requirements.txt
│   ├── routers/
│   │   ├── images.py                  # GET /api/val-images
│   │   ├── retrieve.py                # POST /api/retrieve
│   │   └── status.py                  # GET /api/status
│   ├── services/
│   │   ├── loader.py                  # Model loading, embedding cache
│   │   └── search.py                  # Cosine similarity search
│   └── trained_model/
│       ├── data/gldv2_micro/
│       │   ├── train.csv                  # ~23K training images
│       │   ├── val.csv                    # ~3K validation images
│       │   └── images/                    # Flat directory of JPEGs
│       └── train/
│           ├── model.py               # ResNet50 + ArcFace architecture
│           ├── dataset.py             # LandmarkDataset loader
│           ├── train.py               # Training script
│           └── checkpoints/           # Saved model weights (git-ignored)
└── frontend/
    ├── vite.config.js
    ├── src/
    │   ├── api/retrieval.js           # Axios API calls
    │   ├── store/useRetrievalStore.js # Zustand global state
    │   ├── pages/HomePage.jsx
    │   └── components/
    │       ├── ImageBrowser.jsx       # Left panel: val image grid
    │       ├── ResultsPanel.jsx       # Right panel: query + results
    │       ├── ResultCard.jsx         # Single result card
    │       └── Pagination.jsx
```

---

## Setup

### Prerequisites

- [Miniconda](https://docs.conda.io/en/latest/miniconda.html) or Anaconda
- Node.js 18+
- A trained model checkpoint at `backend/trained_model/train/checkpoints/best_model.pth`

### 1. Backend

Create and activate the conda environment, then install dependencies:

```bash
conda create -n ai python=3.11
conda activate ai

# Install PyTorch (adjust the CUDA version to match your system)
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu130

pip install -r backend/requirements.txt
```

Start the server from `backend/`:

```bash
cd backend
uvicorn main:app --reload --port 8000
```

On **first launch** the backend will build embeddings for all ~23K training images and cache them to `backend/db_embeddings_cache.npz`. Subsequent starts load the cache instantly.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Training

```bash
cd backend/trained_model/train
python train.py --data_dir ../../data/gldv2_micro --epochs 10 --batch_size 32
```

Checkpoints are saved to `backend/trained_model/train/checkpoints/`.

## Retrieval Evaluation (CLI)

```bash
cd backend/trained_model/train
python retrieve.py --data_dir ../../data/gldv2_micro --checkpoint checkpoints/best_model.pth --top_k 5
```

Reports **mAP@k** and **Recall@k**, and saves per-query results to CSV.

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/status` | Backend startup status and progress |
| `GET` | `/api/val-images` | List of all validation image filenames |
| `POST` | `/api/retrieve` | Retrieve top-N similar images for a query |
| `GET` | `/images/{filename}` | Serve a dataset image |

### POST `/api/retrieve`

**Request**
```json
{ "filename": "abc123.jpg", "top_n": 5 }
```

**Response**
```json
{
  "query": "abc123.jpg",
  "results": [
    { "rank": 1, "filename": "xyz789.jpg", "label": 42, "similarity": 0.943 }
  ]
}
```

---

## Dataset

**GLDv2-micro** — a subset of Google Landmarks Dataset v2:

| Split | Images | Classes |
|-------|--------|---------|
| Train | ~23,300 | ~3,103 |
| Val   | ~3,100  | ~3,103 |

Images are shared in a flat `images/` directory. CSVs contain `filename` and `landmark_id` columns.
