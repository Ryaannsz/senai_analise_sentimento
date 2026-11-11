from pydantic import BaseModel, Field


class Entrada(BaseModel):
    texto: str = Field(min_length=3, max_length=1000, examples=["Adorei o produto!"])


class Saida(BaseModel):
    sentimento: str
    confianca: float
    versao_modelo: str
