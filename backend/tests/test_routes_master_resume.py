import pytest
from app.simulator import MOCK_IMPORT_YAML


@pytest.mark.anyio
async def test_get_master_resume_404_when_empty(client, tmp_path, monkeypatch):
    monkeypatch.setenv("DB_PATH", str(tmp_path / "test.db"))
    from app.config import get_settings
    get_settings.cache_clear()
    from app.database import init_db
    import asyncio
    await asyncio.to_thread(init_db, str(tmp_path / "test.db"))
    response = await client.get("/api/master-resume")
    assert response.status_code == 404


@pytest.mark.anyio
async def test_put_master_resume_creates(client, tmp_path, monkeypatch):
    monkeypatch.setenv("DB_PATH", str(tmp_path / "test.db"))
    from app.config import get_settings
    get_settings.cache_clear()
    from app.database import init_db
    import asyncio
    await asyncio.to_thread(init_db, str(tmp_path / "test.db"))
    response = await client.put(
        "/api/master-resume",
        json={"yaml_content": "cv:\n  name: Test"}
    )
    assert response.status_code == 200
    assert response.json()["yaml_content"] == "cv:\n  name: Test"


@pytest.mark.anyio
async def test_delete_master_resume(client, tmp_path, monkeypatch):
    monkeypatch.setenv("DB_PATH", str(tmp_path / "test.db"))
    from app.config import get_settings
    get_settings.cache_clear()
    from app.database import init_db
    import asyncio
    await asyncio.to_thread(init_db, str(tmp_path / "test.db"))
    await client.put("/api/master-resume", json={"yaml_content": "cv:\n  name: Test"})
    response = await client.delete("/api/master-resume")
    assert response.status_code == 204


@pytest.mark.anyio
async def test_import_pdf_returns_yaml(client, sim):
    sim.sim_pdf_extract.set_response("John Doe\nEngineer at Corp")
    sim.sim_llm.set_complete_response(
        '{"yaml_content": "cv:\\n  name: John Doe"}'
    )
    import io
    fake_pdf = b"%PDF-1.4 test"
    response = await client.post(
        "/api/master-resume/import",
        files={"file": ("resume.pdf", io.BytesIO(fake_pdf), "application/pdf")},
    )
    assert response.status_code == 200
    data = response.json()
    assert "yaml_content" in data
