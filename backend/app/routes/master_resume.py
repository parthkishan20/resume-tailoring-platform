# backend/app/routes/master_resume.py
from __future__ import annotations
import asyncio
import json
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from ..backend_api import BackendAPI
from ..config import get_settings
from ..database import get_master_resume, upsert_master_resume, delete_master_resume
from ..deps import get_backend

router = APIRouter()

_IMPORT_SYSTEM_PROMPT = (
    "You are a resume parser. Convert the following resume text to valid render-cv YAML format. "
    "Output ONLY valid YAML. No markdown fences. No explanations. First line must be: cv:"
)


def _db_path() -> str:
    return get_settings().DB_PATH


class MasterResumeBody(BaseModel):
    yaml_content: str


@router.get("/api/master-resume")
async def get_resume():
    row = await asyncio.to_thread(get_master_resume, _db_path())
    if row is None:
        raise HTTPException(status_code=404, detail="No master resume found")
    return row


@router.put("/api/master-resume")
async def save_resume(body: MasterResumeBody):
    row = await asyncio.to_thread(upsert_master_resume, _db_path(), body.yaml_content)
    return row


@router.delete("/api/master-resume", status_code=204)
async def remove_resume():
    deleted = await asyncio.to_thread(delete_master_resume, _db_path())
    if not deleted:
        raise HTTPException(status_code=404, detail="No master resume to delete")


@router.post("/api/master-resume/import")
async def import_pdf(
    file: UploadFile = File(...),
    api: BackendAPI = Depends(get_backend),
):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="File must be a PDF")
    pdf_bytes = await file.read()
    text = await api.extract(pdf_bytes)
    response_format = {
        "type": "json_schema",
        "json_schema": {
            "name": "imported_resume",
            "schema": {
                "type": "object",
                "properties": {"yaml_content": {"type": "string"}},
                "required": ["yaml_content"],
                "additionalProperties": False,
            },
            "strict": True,
        },
    }
    result_str = await api.complete(
        [
            {"role": "system", "content": _IMPORT_SYSTEM_PROMPT},
            {"role": "user", "content": f"Resume text:\n{text}"},
        ],
        response_format=response_format,
    )
    yaml_content = json.loads(result_str)["yaml_content"]
    row = await asyncio.to_thread(upsert_master_resume, _db_path(), yaml_content)
    return row
