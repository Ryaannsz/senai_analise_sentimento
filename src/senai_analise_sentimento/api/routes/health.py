from fastapi import APIRouter

from senai_analise_sentimento.schemas.health import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse, summary="Verifica a saúde da API")
def health() -> HealthResponse:
    return HealthResponse(status="ok", versao_modelo="0.1.0")
