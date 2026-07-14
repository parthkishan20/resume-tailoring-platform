import pytest


@pytest.mark.anyio
async def test_get_rules_returns_defaults(client, tmp_path, monkeypatch):
    monkeypatch.setenv("DB_PATH", str(tmp_path / "test.db"))
    from app.config import get_settings; get_settings.cache_clear()
    from app.database import init_db; import asyncio; await asyncio.to_thread(init_db, str(tmp_path / "test.db"))
    response = await client.get("/api/rules")
    assert response.status_code == 200
    rules = response.json()
    assert len(rules) > 0
    assert any(r["section"] == "experience" and r["rule_key"] == "max_entries" for r in rules)


@pytest.mark.anyio
async def test_put_rules_updates(client, tmp_path, monkeypatch):
    monkeypatch.setenv("DB_PATH", str(tmp_path / "test.db"))
    from app.config import get_settings; get_settings.cache_clear()
    from app.database import init_db; import asyncio; await asyncio.to_thread(init_db, str(tmp_path / "test.db"))
    response = await client.put("/api/rules", json={
        "rules": [{"section": "experience", "rule_key": "max_entries", "rule_value": "3"}]
    })
    assert response.status_code == 200
    rules = response.json()
    exp = next(r for r in rules if r["section"] == "experience" and r["rule_key"] == "max_entries")
    assert exp["rule_value"] == "3"


@pytest.mark.anyio
async def test_put_rules_rejects_malformed_payload(client, tmp_path, monkeypatch):
    monkeypatch.setenv("DB_PATH", str(tmp_path / "test.db"))
    from app.config import get_settings; get_settings.cache_clear()
    from app.database import init_db; import asyncio; await asyncio.to_thread(init_db, str(tmp_path / "test.db"))
    response = await client.put("/api/rules", json={
        "rules": [{"section": "experience"}]  # missing rule_key / rule_value
    })
    assert response.status_code == 422


@pytest.mark.anyio
async def test_delete_rules_resets(client, tmp_path, monkeypatch):
    monkeypatch.setenv("DB_PATH", str(tmp_path / "test.db"))
    from app.config import get_settings; get_settings.cache_clear()
    from app.database import init_db; import asyncio; await asyncio.to_thread(init_db, str(tmp_path / "test.db"))
    await client.put("/api/rules", json={"rules": [{"section": "experience", "rule_key": "max_entries", "rule_value": "99"}]})
    response = await client.delete("/api/rules")
    assert response.status_code == 200
    rules = response.json()
    exp = next(r for r in rules if r["section"] == "experience" and r["rule_key"] == "max_entries")
    assert exp["rule_value"] == "2"
