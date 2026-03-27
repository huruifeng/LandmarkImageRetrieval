"""
Training script for the landmark retrieval model.

Usage:
    python src/train.py --data_dir data/gldv2_micro --epochs 10 --batch_size 32
"""

import os
os.environ['KMP_DUPLICATE_LIB_OK'] = 'TRUE'  # Quick fix for potential OpenMP issues on some platforms

import argparse
import torch
import torch.nn as nn
from torch.optim import AdamW
from torch.optim.lr_scheduler import CosineAnnealingLR

from dataset import create_data_loaders
from model import LandmarkRetrievalModel


def main():
    parser = argparse.ArgumentParser(description="Train landmark retrieval model")
    parser.add_argument("--data_dir", type=str, default="data/gldv2_micro")
    parser.add_argument("--epochs", type=int, default=10)
    parser.add_argument("--batch_size", type=int, default=32)
    parser.add_argument("--lr", type=float, default=1e-4)
    parser.add_argument("--embedding_dim", type=int, default=512)
    parser.add_argument("--image_size", type=int, default=224)
    parser.add_argument("--num_workers", type=int, default=4)
    parser.add_argument("--save_dir", type=str, default="checkpoints")
    parser.add_argument("--patience", type=int, default=5,
                        help="Early-stopping patience (epochs without val improvement)")
    parser.add_argument("--plot", action="store_true",
                        help="Plot loss/accuracy history after training")
    args = parser.parse_args()

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")

    # Data
    train_loader, val_loader, num_classes = create_data_loaders(
        args.data_dir, args.batch_size, args.num_workers, args.image_size
    )
    print(f"Classes: {num_classes}, Train: {len(train_loader.dataset)}, Val: {len(val_loader.dataset)}")

    # Model — device is passed in and managed internally
    model = LandmarkRetrievalModel(num_classes, args.embedding_dim, device=device)

    # Optimizer: lower lr for pretrained backbone, higher for new layers
    backbone_params = list(model.backbone.parameters())
    new_params = list(model.embedding.parameters()) + list(model.arcface.parameters())
    optimizer = AdamW([
        {"params": backbone_params, "lr": args.lr * 0.1},
        {"params": new_params, "lr": args.lr},
    ], weight_decay=1e-4)

    scheduler = CosineAnnealingLR(optimizer, T_max=args.epochs)
    criterion = nn.CrossEntropyLoss()

    # Train — returns history DataFrame
    history = model.fit(
        train_loader=train_loader,
        optimizer=optimizer,
        scheduler=scheduler,
        criterion=criterion,
        epochs=args.epochs,
        save_dir=args.save_dir,
        val_loader=val_loader,
        patience=args.patience,
        plot=args.plot,
    )

    history_csv = os.path.join(args.save_dir, "train_history.csv")
    history.to_csv(history_csv, index=False)
    print(f"History saved to {history_csv}")


if __name__ == "__main__":
    main()
