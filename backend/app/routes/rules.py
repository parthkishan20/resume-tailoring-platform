# backend/app/routes/rules.py
import asyncio
from fastapi import APIRouter
from pydantic import BaseModel
from ..config import get_settings
from ..database import get_rules, upsert_rules, reset_rules

router = APIRouter()


def _db_path():
    return get_settings().DB_PATH


class RulesBody(BaseModel):
    rules: list[dict]


@router.get("/api/rules")
async def get():
    return await asyncio.to_thread(get_rules, _db_path())


@router.put("/api/rules")
async def update(body: RulesBody):
    return await asyncio.to_thread(upsert_rules, _db_path(), body.rules)


@router.delete("/api/rules")
async def reset():
    return await asyncio.to_thread(reset_rules, _db_path())
