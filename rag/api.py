"""Живой режим: POST /api/ask с потоком SSE — тот же контракт, что у демо-обработчика в браузере.

Запуск: uvicorn rag.api:app --port 8787
Сборка сайта с живым режимом: ASK_API_URL=http://localhost:8787 npm run build
"""

from __future__ import annotations

import json
from typing import Iterator

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from .common import CHAT_MODEL, chat_stream, connect, search

app = FastAPI(title="Ask my resume")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["POST"], allow_headers=["*"])


class AskRequest(BaseModel):
    question: str = Field(min_length=1, max_length=200)
    presetId: str | None = None


def sse(event: str, data: object) -> str:
    payload = data if isinstance(data, str) else json.dumps(data, ensure_ascii=False)
    return f"event: {event}\n" + "".join(f"data: {line}\n" for line in payload.split("\n")) + "\n"


@app.post("/api/ask")
def ask(req: AskRequest) -> StreamingResponse:
    question = req.question.strip()
    if not question:
        raise HTTPException(400, "Пустой вопрос")
    with connect() as conn:
        hits = search(conn, question)

    def stream() -> Iterator[str]:
        yield sse("meta", {"mode": "generated", "model": CHAT_MODEL})
        for piece in chat_stream(question, hits):
            yield sse("token", json.dumps(piece, ensure_ascii=False))
        sources = [
            {"id": h["id"], "anchor": h["anchor"], "title": h["title"], "quote": h["text"][:160]} for h in hits
        ]
        yield sse("sources", sources)
        yield sse("done", "{}")

    return StreamingResponse(stream(), media_type="text/event-stream")
