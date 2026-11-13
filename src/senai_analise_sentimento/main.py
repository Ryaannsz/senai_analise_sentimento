from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from senai_analise_sentimento.api.router import api_router

WEB_DIR = Path(__file__).parent / "web"

app = FastAPI(title="SENAI - Análise de Sentimento", version="0.1.0")
app.include_router(api_router)

# O frontend é montado por último para não encobrir as rotas da API.
app.mount("/", StaticFiles(directory=WEB_DIR, html=True), name="web")
