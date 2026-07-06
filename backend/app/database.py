import sqlite3
from pathlib import Path

DEFAULT_USER_ID = "default"
HISTORY_LIMIT = 10

DEFAULT_RULES: list[tuple[str, str, str]] = [
    ("experience",      "max_entries", "2"),
    ("projects",        "max_entries", "3"),
    ("education",       "max_entries", "5"),
    ("extracurricular", "max_entries", "1"),
    ("certifications",  "max_entries", "2"),
    ("skills",          "max_entries", "20"),
    ("experience",      "max_bullets", "4"),
    ("projects",        "max_bullets", "3"),
    ("extracurricular", "max_bullets", "3"),
    ("experience",      "max_chars",   "120"),
    ("projects",        "max_chars",   "120"),
    ("extracurricular", "max_chars",   "120"),
]

DEFAULT_SYSTEM_PROMPT = (
    "You are ResumeTailor, an AI assistant specialized in resume creation and optimization. "
    "You can help users create and edit their master resume, generate tailored resumes for "
    "specific job descriptions, and evaluate resumes against job postings. "
    "Be concise, professional, and action-oriented in your responses."
)


def _schema_sql() -> str:
    return (Path(__file__).parent.parent / "db" / "schema.sql").read_text()


def init_db(db_path: str) -> None:
    with sqlite3.connect(db_path) as conn:
        conn.executescript(_schema_sql())
        if conn.execute(
            "SELECT COUNT(*) FROM generation_rules WHERE user_id = ?", (DEFAULT_USER_ID,)
        ).fetchone()[0] == 0:
            conn.executemany(
                "INSERT INTO generation_rules (user_id, section, rule_key, rule_value) "
                "VALUES (?, ?, ?, ?)",
                [(DEFAULT_USER_ID, s, k, v) for s, k, v in DEFAULT_RULES],
            )
        if conn.execute(
            "SELECT COUNT(*) FROM system_prompt WHERE user_id = ?", (DEFAULT_USER_ID,)
        ).fetchone()[0] == 0:
            conn.execute(
                "INSERT INTO system_prompt (user_id, content) VALUES (?, ?)",
                (DEFAULT_USER_ID, DEFAULT_SYSTEM_PROMPT),
            )
        conn.commit()


# --- Master Resume CRUD ---

def get_master_resume(db_path: str, user_id: str = DEFAULT_USER_ID) -> dict | None:
    with sqlite3.connect(db_path) as conn:
        conn.row_factory = sqlite3.Row
        row = conn.execute(
            "SELECT id, user_id, yaml_content, updated_at FROM master_resume WHERE user_id = ?",
            (user_id,),
        ).fetchone()
        return dict(row) if row else None


def upsert_master_resume(
    db_path: str, yaml_content: str, user_id: str = DEFAULT_USER_ID
) -> dict:
    with sqlite3.connect(db_path) as conn:
        conn.row_factory = sqlite3.Row
        existing = conn.execute(
            "SELECT yaml_content FROM master_resume WHERE user_id = ?", (user_id,)
        ).fetchone()
        if existing:
            conn.execute(
                "INSERT INTO master_resume_history (user_id, yaml_content) VALUES (?, ?)",
                (user_id, existing["yaml_content"]),
            )
            conn.execute(
                """DELETE FROM master_resume_history WHERE user_id = ? AND id NOT IN (
                    SELECT id FROM master_resume_history WHERE user_id = ?
                    ORDER BY saved_at DESC LIMIT ?
                )""",
                (user_id, user_id, HISTORY_LIMIT),
            )
            conn.execute(
                "UPDATE master_resume SET yaml_content = ?, updated_at = datetime('now') "
                "WHERE user_id = ?",
                (yaml_content, user_id),
            )
        else:
            conn.execute(
                "INSERT INTO master_resume (user_id, yaml_content) VALUES (?, ?)",
                (user_id, yaml_content),
            )
        conn.commit()
        return dict(conn.execute(
            "SELECT id, user_id, yaml_content, updated_at FROM master_resume WHERE user_id = ?",
            (user_id,),
        ).fetchone())


def delete_master_resume(db_path: str, user_id: str = DEFAULT_USER_ID) -> bool:
    with sqlite3.connect(db_path) as conn:
        cursor = conn.execute(
            "DELETE FROM master_resume WHERE user_id = ?", (user_id,)
        )
        conn.commit()
        return cursor.rowcount > 0
