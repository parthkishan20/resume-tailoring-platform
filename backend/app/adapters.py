from __future__ import annotations
import asyncio
import os
import tempfile
from pathlib import Path
from typing import AsyncIterator

from .ports import LLMAuthError, LLMUnavailableError, PDFExtractError, RenderError


class LiteLLMAdapter:
    def __init__(self, model: str, api_key: str) -> None:
        self._model = model
        os.environ["OPENAI_API_KEY"] = api_key

    async def complete(
        self, messages: list[dict], response_format: dict | None = None
    ) -> str:
        import litellm  # noqa: PLC0415 — lazy import (not installed until Wave 2)
        import litellm.exceptions as llm_exc  # noqa: PLC0415
        _llm_unavailable = (
            llm_exc.RateLimitError,
            llm_exc.ServiceUnavailableError,
            llm_exc.APIConnectionError,
        )
        kwargs: dict = {"model": self._model, "messages": messages}
        if response_format is not None:
            kwargs["response_format"] = response_format
        try:
            response = await litellm.acompletion(**kwargs)
            return response.choices[0].message.content
        except llm_exc.AuthenticationError as exc:
            raise LLMAuthError("Invalid OpenRouter API key") from exc
        except _llm_unavailable as exc:
            raise LLMUnavailableError(str(exc)) from exc

    async def stream(self, messages: list[dict]) -> AsyncIterator[str]:
        import litellm  # noqa: PLC0415 — lazy import (not installed until Wave 2)
        import litellm.exceptions as llm_exc  # noqa: PLC0415
        _llm_unavailable = (
            llm_exc.RateLimitError,
            llm_exc.ServiceUnavailableError,
            llm_exc.APIConnectionError,
        )
        model = self._model

        async def _gen() -> AsyncIterator[str]:
            try:
                response = await litellm.acompletion(
                    model=model, messages=messages, stream=True
                )
            except llm_exc.AuthenticationError as exc:
                raise LLMAuthError("Invalid OpenRouter API key") from exc
            except _llm_unavailable as exc:
                raise LLMUnavailableError(str(exc)) from exc
            async for chunk in response:
                delta = chunk.choices[0].delta.content
                if delta:
                    yield delta

        return _gen()


class RenderCVAdapter:
    async def render(self, yaml_content: str) -> bytes:
        with tempfile.TemporaryDirectory() as tmpdir:
            tmpdir_path = Path(tmpdir)
            yaml_path = tmpdir_path / "resume.yaml"
            pdf_path = tmpdir_path / "resume.pdf"
            yaml_path.write_text(yaml_content, encoding="utf-8")
            proc = await asyncio.create_subprocess_exec(
                "rendercv", "render", str(yaml_path),
                "--pdf-path", str(pdf_path),
                "--dont-generate-markdown",
                "--dont-generate-html",
                "--dont-generate-png",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, stderr = await proc.communicate()
            if proc.returncode != 0:
                output = (
                    stdout.decode("utf-8", errors="replace")
                    + stderr.decode("utf-8", errors="replace")
                ).strip()
                raise RenderError(
                    f"rendercv failed (exit {proc.returncode}): {output}"
                )
            return pdf_path.read_bytes()


class PyMuPDFAdapter:
    _MAX_BYTES = 10 * 1024 * 1024
    _MAX_PAGES = 50

    async def extract(self, pdf_bytes: bytes) -> str:
        if len(pdf_bytes) > self._MAX_BYTES:
            raise ValueError(
                f"PDF exceeds 10 MB limit ({len(pdf_bytes) / 1_048_576:.1f} MB)"
            )
        try:
            import pymupdf  # noqa: PLC0415 — lazy import (not installed until Wave 2)
            doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")
        except Exception as exc:
            raise PDFExtractError(f"Cannot open PDF: {exc}") from exc
        if doc.page_count > self._MAX_PAGES:
            doc.close()
            raise ValueError(f"PDF has {doc.page_count} pages (max {self._MAX_PAGES})")
        pages = [page.get_text() for page in doc]
        doc.close()
        return "\n\n".join(pages)
