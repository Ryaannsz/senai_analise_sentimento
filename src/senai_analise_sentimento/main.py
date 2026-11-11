from fastapi import FastAPI

from senai_analise_sentimento.api.router import api_router

app = FastAPI(title="SENAI - Análise de Sentimento", version="0.1.0")
app.include_router(api_router)
