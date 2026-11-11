from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
DATA_PATH = ROOT / "data" / "comentarios.csv"
MODEL_PATH = ROOT / "models" / "sentiment_model.joblib"
