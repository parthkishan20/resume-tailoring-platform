# backend/app/backend_api.py
from __future__ import annotations
from typing import AsyncIterator
from .ports import LLMPort, PDFExtractPort, PDFRenderPort


class BackendAPI:
    def __init__(self, llm: LLMPort, pdf_render: PDFRenderPort, pdf_extract: PDFExtractPort) -> None:
        self._llm = llm
        self._pdf_render = pdf_render
        self._pdf_extract = pdf_extract

    async def complete(self, messages: list[dict], response_format: dict | None = None) -> str:
        return await self._llm.complete(messages, response_format)

    async def stream(self, messages: list[dict]) -> AsyncIterator[str]:
        return await self._llm.stream(messages)

    async def render(self, yaml_content: str) -> bytes:
        return await self._pdf_render.render(yaml_content)

    async def extract(self, pdf_bytes: bytes) -> str:
        return await self._pdf_extract.extract(pdf_bytes)


def create_real_backend() -> BackendAPI:
    from .adapters import LiteLLMAdapter, PyMuPDFAdapter, RenderCVAdapter
    from .config import get_settings
    settings = get_settings()
    return BackendAPI(
        llm=LiteLLMAdapter(model=settings.LLM_MODEL, api_key=settings.OPENAI_API_KEY),
        pdf_render=RenderCVAdapter(),
        pdf_extract=PyMuPDFAdapter(),
    )
