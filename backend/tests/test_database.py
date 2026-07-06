import sqlite3
import tempfile
import os
import pytest
from app.database import (
    init_db, DEFAULT_RULES, DEFAULT_SYSTEM_PROMPT,
    get_master_resume, upsert_master_resume, delete_master_resume,
)


@pytest.fixture
def temp_db():
    """Fixture that provides a temporary database path."""
    fd, db_path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    yield db_path
    if os.path.exists(db_path):
        os.unlink(db_path)


def test_init_db_creates_all_tables(temp_db):
    init_db(temp_db)
    with sqlite3.connect(temp_db) as conn:
        tables = {row[0] for row in conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table'"
        ).fetchall()}
    expected = {
        "master_resume", "master_resume_history", "generated_resumes",
        "chat_messages", "generation_rules", "system_prompt",
    }
    # Exclude sqlite_sequence (internal SQLite table)
    tables = {t for t in tables if t != "sqlite_sequence"}
    assert expected == tables


def test_init_db_seeds_default_rules(temp_db):
    init_db(temp_db)
    with sqlite3.connect(temp_db) as conn:
        count = conn.execute(
            "SELECT COUNT(*) FROM generation_rules WHERE user_id = 'default'"
        ).fetchone()[0]
    assert count == len(DEFAULT_RULES)


def test_init_db_seeds_default_system_prompt(temp_db):
    init_db(temp_db)
    with sqlite3.connect(temp_db) as conn:
        row = conn.execute(
            "SELECT content FROM system_prompt WHERE user_id = 'default'"
        ).fetchone()
    assert row is not None
    assert row[0] == DEFAULT_SYSTEM_PROMPT


def test_init_db_is_idempotent(temp_db):
    init_db(temp_db)
    init_db(temp_db)  # second call must not raise or duplicate data
    with sqlite3.connect(temp_db) as conn:
        count = conn.execute("SELECT COUNT(*) FROM system_prompt").fetchone()[0]
    assert count == 1


# --- Master Resume Tests ---

def test_get_master_resume_returns_none_when_empty(temp_db):
    init_db(temp_db)
    assert get_master_resume(temp_db) is None


def test_upsert_master_resume_creates_and_returns(temp_db):
    init_db(temp_db)
    result = upsert_master_resume(temp_db, "cv:\n  name: Test")
    assert result["yaml_content"] == "cv:\n  name: Test"
    assert result["user_id"] == "default"
    assert "id" in result
    assert "updated_at" in result


def test_upsert_master_resume_updates_existing(temp_db):
    init_db(temp_db)
    upsert_master_resume(temp_db, "cv:\n  name: First")
    result = upsert_master_resume(temp_db, "cv:\n  name: Second")
    assert result["yaml_content"] == "cv:\n  name: Second"
    # Only one row should exist
    with sqlite3.connect(temp_db) as conn:
        count = conn.execute("SELECT COUNT(*) FROM master_resume").fetchone()[0]
    assert count == 1


def test_upsert_saves_to_history(temp_db):
    init_db(temp_db)
    upsert_master_resume(temp_db, "cv:\n  name: First")
    upsert_master_resume(temp_db, "cv:\n  name: Second")
    with sqlite3.connect(temp_db) as conn:
        history = conn.execute(
            "SELECT yaml_content FROM master_resume_history ORDER BY saved_at ASC"
        ).fetchall()
    assert len(history) == 1
    assert history[0][0] == "cv:\n  name: First"


def test_history_pruned_to_10(temp_db):
    init_db(temp_db)
    for i in range(12):
        upsert_master_resume(temp_db, f"cv:\n  name: Version{i}")
    with sqlite3.connect(temp_db) as conn:
        count = conn.execute("SELECT COUNT(*) FROM master_resume_history").fetchone()[0]
    assert count == 10


def test_delete_master_resume(temp_db):
    init_db(temp_db)
    upsert_master_resume(temp_db, "cv:\n  name: Test")
    assert delete_master_resume(temp_db) is True
    assert get_master_resume(temp_db) is None


def test_delete_master_resume_returns_false_when_not_exist(temp_db):
    init_db(temp_db)
    assert delete_master_resume(temp_db) is False
