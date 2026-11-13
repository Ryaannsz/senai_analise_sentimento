from functools import lru_cache

import joblib
from sklearn.pipeline import Pipeline

from senai_analise_sentimento.core.paths import MODEL_PATH
from senai_analise_sentimento.schemas.sentiment import Saida

VERSAO_MODELO = "0.1.0"


class ModeloIndisponivel(RuntimeError):
    """O arquivo do modelo ainda não foi gerado pelo treino."""


@lru_cache(maxsize=1)
def carregar_modelo() -> Pipeline:
    if not MODEL_PATH.exists():
        raise ModeloIndisponivel(
            "Modelo não encontrado. Rode: uv run python -m senai_analise_sentimento.training.train"
        )
    return joblib.load(MODEL_PATH)


def prever(texto: str) -> Saida:
    modelo = carregar_modelo()
    probabilidades = modelo.predict_proba([texto])[0]
    indice = int(probabilidades.argmax())
    return Saida(
        sentimento=str(modelo.classes_[indice]),
        confianca=round(float(probabilidades[indice]), 4),
        versao_modelo=VERSAO_MODELO,
    )


def main() -> None:
    textos = ["Este é um ótimo produto!", "Não gostei do serviço."]

    for texto in textos:
        saida = prever(texto)
        print(f"Texto: {texto} => Previsão: {saida.sentimento} ({saida.confianca:.0%})")
        print("--" * 40)


if __name__ == "__main__":
    main()
