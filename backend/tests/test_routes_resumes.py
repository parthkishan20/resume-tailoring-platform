import json
import pytest
from app.simulator import MOCK_GENERATION_RESULT_YAML, MOCK_GENERATION_PROGRESS


@pytest.mark.anyio
async def test_list_resumes_empty(client, tmp_path, monkeypatch):
    monkeypatch.setenv("DB_PATH", str(tmp_path / "test.db"))
    from app.config import get_settings; get_settings.cache_clear()
    from app.database import init_db; import asyncio; await asyncio.to_thread(init_db, str(tmp_path / "test.db"))
    response = await client.get("/api/resumes")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 0
    assert data["items"] == []


@pytest.mark.anyio
async def test_generate_resume_sse_stream(client, sim, tmp_path, monkeypatch):
    monkeypatch.setenv("DB_PATH", str(tmp_path / "test.db"))
    monkeypatch.setenv("PDFS_DIR", str(tmp_path / "pdfs"))
    from app.config import get_settings; get_settings.cache_clear()
    from app.database import init_db, upsert_master_resume
    import asyncio
    db = str(tmp_path / "test.db")
    await asyncio.to_thread(init_db, db)
    await asyncio.to_thread(upsert_master_resume, db, MOCK_GENERATION_RESULT_YAML)

    sim.sim_llm.set_complete_response(json.dumps({"yaml_content": MOCK_GENERATION_RESULT_YAML}))
    sim.sim_pdf_render.set_response(b"%PDF-1.4 test")

    response = await client.post(
        "/api/resumes/stream",
        json={"job_description": "Software Engineer at Mock Corp"},
    )
    assert response.status_code == 200
    assert "text/event-stream" in response.headers["content-type"]
    lines = response.text.split("\n")
    event_types = [l.replace("event: ", "").strip() for l in lines if l.startswith("event:")]
    assert "done" in event_types


@pytest.mark.anyio
async def test_get_resume_404(client, tmp_path, monkeypatch):
    monkeypatch.setenv("DB_PATH", str(tmp_path / "test.db"))
    from app.config import get_settings; get_settings.cache_clear()
    from app.database import init_db; import asyncio; await asyncio.to_thread(init_db, str(tmp_path / "test.db"))
    response = await client.get("/api/resumes/9999")
    assert response.status_code == 404


@pytest.mark.anyio
async def test_delete_resume(client, sim, tmp_path, monkeypatch):
    monkeypatch.setenv("DB_PATH", str(tmp_path / "test.db"))
    from app.config import get_settings; get_settings.cache_clear()
    from app.database import init_db, create_resume
    import asyncio
    db = str(tmp_path / "test.db")
    await asyncio.to_thread(init_db, db)
    r = await asyncio.to_thread(create_resume, db, "Test", "JD", "cv:\n  name: X")
    response = await client.delete(f"/api/resumes/{r['id']}")
    assert response.status_code == 204
