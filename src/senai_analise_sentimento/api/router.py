from fastapi import APIRouter

from senai_analise_sentimento.api.routes.health import router as health_router

api_router = APIRouter()
api_router.include_router(health_router)
