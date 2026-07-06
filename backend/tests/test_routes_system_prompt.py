import pytest


@pytest.mark.anyio
async def test_get_system_prompt(client, tmp_path, monkeypatch):
    monkeypatch.setenv("DB_PATH", str(tmp_path / "test.db"))
    from app.config import get_settings; get_settings.cache_clear()
    from app.database import init_db; import asyncio; await asyncio.to_thread(init_db, str(tmp_path / "test.db"))
    response = await client.get("/api/system-prompt")
    assert response.status_code == 200
    assert "content" in response.json()


@pytest.mark.anyio
async def test_put_system_prompt(client, tmp_path, monkeypatch):
    monkeypatch.setenv("DB_PATH", str(tmp_path / "test.db"))
    from app.config import get_settings; get_settings.cache_clear()
    from app.database import init_db; import asyncio; await asyncio.to_thread(init_db, str(tmp_path / "test.db"))
    response = await client.put("/api/system-prompt", json={"content": "Custom prompt"})
    assert response.status_code == 200
    assert response.json()["content"] == "Custom prompt"
