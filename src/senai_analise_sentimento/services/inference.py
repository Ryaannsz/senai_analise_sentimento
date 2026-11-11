import joblib

from senai_analise_sentimento.core.paths import MODEL_PATH


def main() -> None:
    textos = ["Este é um ótimo produto!", "Não gostei do serviço."]

    modelo = joblib.load(MODEL_PATH)

    previsoes = modelo.predict(textos)

    for texto, previsao in zip(textos, previsoes):
        print(f"Texto: {texto} => Previsão: {previsao}")
        print("--" * 40)


if __name__ == "__main__":
    main()
