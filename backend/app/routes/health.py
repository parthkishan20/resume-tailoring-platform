# backend/app/routes/health.py
from fastapi import APIRouter

router = APIRouter()


@router.get("/api/health")
async def health():
    return {"status": "ok"}
