# Run retrieval evaluation (requires trained checkpoint)
cd src && python retrieve.py --data_dir ../data/gldv2_micro --checkpoint ../checkpoints/best_model.pth --top_k 5
