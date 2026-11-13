import json

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect, status

from senai_analise_sentimento.schemas.sentiment import Entrada, Saida
from senai_analise_sentimento.services.inference import (
    ModeloIndisponivel,
    chance_positivo,
    prever,
)

router = APIRouter(tags=["sentimento"])

LIMITE_TEXTO = 1000


@router.post("/sentimento", response_model=Saida, summary="Classifica o sentimento de um texto")
def analisar(entrada: Entrada) -> Saida:
    try:
        return prever(entrada.texto)
    except ModeloIndisponivel as erro:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(erro))


@router.websocket("/ws/sentimento")
async def analisar_ao_vivo(websocket: WebSocket) -> None:
    """Análise a cada tecla.

    O cliente envia {"id": n, "texto": "..."} e recebe {"id": n, "positivo": 0.0..1.0}.
    O id deixa o cliente descartar respostas que chegarem fora de ordem.
    """
    await websocket.accept()
    try:
        while True:
            try:
                mensagem = json.loads(await websocket.receive_text())
            except json.JSONDecodeError:
                continue
            if not isinstance(mensagem, dict):
                continue
            texto = str(mensagem.get("texto", ""))[:LIMITE_TEXTO].strip()
            positivo = chance_positivo(texto) if texto else 0.5
            await websocket.send_json({"id": mensagem.get("id"), "positivo": positivo})
    except WebSocketDisconnect:
        return
    except ModeloIndisponivel as erro:
        await websocket.send_json({"erro": str(erro)})
        await websocket.close(code=status.WS_1011_INTERNAL_ERROR)
