from fastapi import APIRouter, HTTPException, status

from senai_analise_sentimento.schemas.sentiment import Entrada, Saida
from senai_analise_sentimento.services.inference import ModeloIndisponivel, prever

router = APIRouter(tags=["sentimento"])


@router.post("/sentimento", response_model=Saida, summary="Classifica o sentimento de um texto")
def analisar(entrada: Entrada) -> Saida:
    try:
        return prever(entrada.texto)
    except ModeloIndisponivel as erro:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(erro))
