from pathlib import Path

import joblib
import pandas as pd
from loguru import logger
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import FeatureUnion, Pipeline

from senai_analise_sentimento.core.paths import DATA_PATH, MODEL_PATH


def load_data(data_path: Path) -> tuple[list[str], list[str]]:
    """Load data from a CSV file."""
    df = pd.read_csv(data_path)
    return df["texto"].tolist(), df["sentimento"].tolist()


def main() -> None:
    X, y = load_data(DATA_PATH)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Palavras capturam o sentido; pedaços de 2 a 5 caracteres deixam o modelo
    # reagir a palavras incompletas, o que faz a análise ao vivo mudar a cada letra.
    pipeline = Pipeline(
        [
            (
                "tfidf",
                FeatureUnion(
                    [
                        ("palavras", TfidfVectorizer(strip_accents="unicode", ngram_range=(1, 2))),
                        (
                            "caracteres",
                            TfidfVectorizer(
                                strip_accents="unicode",
                                analyzer="char_wb",
                                ngram_range=(2, 5),
                                sublinear_tf=True,
                            ),
                        ),
                    ]
                ),
            ),
            ("clf", LogisticRegression(max_iter=1000)),
        ]
    )

    pipeline.fit(X_train, y_train)

    # Evaluate the model
    y_pred = pipeline.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred, average="macro")

    logger.info(f"Accuracy: {accuracy:.4f}")
    logger.info(f"F1 Score: {f1:.4f}")

    # Save the model
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, MODEL_PATH)

    logger.success(f"\nModel saved to {MODEL_PATH}")


if __name__ == "__main__":
    main()
