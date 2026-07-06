import json
import pytest


@pytest.mark.anyio
async def test_get_chat_history_empty(client, tmp_path, monkeypatch):
    monkeypatch.setenv("DB_PATH", str(tmp_path / "test.db"))
    from app.config import get_settings; get_settings.cache_clear()
    from app.database import init_db; import asyncio; await asyncio.to_thread(init_db, str(tmp_path / "test.db"))
    response = await client.get("/api/chat")
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.anyio
async def test_chat_stream_returns_token_events(client, sim, tmp_path, monkeypatch):
    monkeypatch.setenv("DB_PATH", str(tmp_path / "test.db"))
    from app.config import get_settings; get_settings.cache_clear()
    from app.database import init_db; import asyncio; await asyncio.to_thread(init_db, str(tmp_path / "test.db"))
    sim.sim_llm.set_stream_chunks(["Hello ", "world!"])

    response = await client.post("/api/chat/stream", json={"message": "Hi"})
    assert response.status_code == 200
    lines = response.text.split("\n")
    event_types = [l.replace("event: ", "").strip() for l in lines if l.startswith("event:")]
    assert "token" in event_types
    assert "done" in event_types


@pytest.mark.anyio
async def test_clear_chat(client, tmp_path, monkeypatch):
    monkeypatch.setenv("DB_PATH", str(tmp_path / "test.db"))
    from app.config import get_settings; get_settings.cache_clear()
    from app.database import init_db; import asyncio; await asyncio.to_thread(init_db, str(tmp_path / "test.db"))
    response = await client.delete("/api/chat")
    assert response.status_code == 204
