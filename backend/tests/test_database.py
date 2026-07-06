import sqlite3
import tempfile
import os
import pytest
from app.database import init_db, DEFAULT_RULES, DEFAULT_SYSTEM_PROMPT


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
