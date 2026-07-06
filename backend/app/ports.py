from __future__ import annotations
from typing import AsyncIterator, Protocol, runtime_checkable


class BackendError(Exception):
    """Base for all backend port errors."""


class LLMAuthError(BackendError):
    """Invalid or missing API key."""


class LLMUnavailableError(BackendError):
    """Rate limit, service down, or network failure."""


class RenderError(BackendError):
    """render-cv PDF generation failed."""


class PDFExtractError(BackendError):
    """PyMuPDF could not open or read the PDF."""


@runtime_checkable
class LLMPort(Protocol):
    async def complete(
        self,
        messages: list[dict],
        response_format: dict | None = None,
    ) -> str: ...

    async def stream(
        self,
        messages: list[dict],
    ) -> AsyncIterator[str]: ...


@runtime_checkable
class PDFRenderPort(Protocol):
    async def render(self, yaml_content: str) -> bytes: ...


@runtime_checkable
class PDFExtractPort(Protocol):
    async def extract(self, pdf_bytes: bytes) -> str: ...
