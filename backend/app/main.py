# backend/app/main.py
from __future__ import annotations
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from .backend_api import BackendAPI
from .config import get_settings
from .deps import get_backend  # re-exported so tests can import from app.main
from .ports import LLMAuthError, LLMUnavailableError, RenderError, PDFExtractError
from .routes import health, master_resume, resumes, chat, rules, system_prompt, evaluate

app = FastAPI(title="ResumeTailor API")


# ── Exception handlers ───────────────────────────────────────────────────────

@app.exception_handler(LLMAuthError)
async def llm_auth_handler(request, exc):
    return JSONResponse(status_code=500, content={"error": str(exc), "code": "LLM_AUTH_ERROR"})


@app.exception_handler(LLMUnavailableError)
async def llm_unavailable_handler(request, exc):
    return JSONResponse(status_code=503, content={"error": str(exc), "code": "LLM_UNAVAILABLE"})


@app.exception_handler(RenderError)
async def render_error_handler(request, exc):
    return JSONResponse(status_code=500, content={"error": str(exc), "code": "RENDER_FAILED"})


@app.exception_handler(PDFExtractError)
async def pdf_extract_error_handler(request, exc):
    return JSONResponse(status_code=422, content={"error": str(exc), "code": "PDF_EXTRACT_FAILED"})


# ── Startup: ensure DB and PDF dirs exist ───────────────────────────────────

@app.on_event("startup")
async def startup():
    import asyncio
    settings = get_settings()
    Path(settings.PDFS_DIR).mkdir(parents=True, exist_ok=True)
    db_path = settings.DB_PATH
    Path(db_path).parent.mkdir(parents=True, exist_ok=True)
    from .database import init_db
    await asyncio.to_thread(init_db, db_path)


# ── Routers ──────────────────────────────────────────────────────────────────

app.include_router(health.router)
app.include_router(master_resume.router)
app.include_router(resumes.router)
app.include_router(chat.router)
app.include_router(rules.router)
app.include_router(system_prompt.router)
app.include_router(evaluate.router)


# ── Static files (frontend) ──────────────────────────────────────────────────

_static_dir = Path(__file__).parent.parent / "static"
if _static_dir.exists():
    app.mount("/", StaticFiles(directory=str(_static_dir), html=True), name="static")
