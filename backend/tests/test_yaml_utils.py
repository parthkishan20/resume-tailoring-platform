import yaml
from app.yaml_utils import normalize_to_rendercv


def test_no_design_injected_when_absent():
    """normalize must NOT add a design: block — design comes from --design CLI flag."""
    raw = "cv:\n  name: Jane Doe\n  sections:\n    skills:\n    - label: Skills\n      details: Python\n"
    result = yaml.safe_load(normalize_to_rendercv(raw))
    assert "design" not in result


def test_design_stripped_from_cv_block():
    """LLM sometimes nests design: inside cv: — it must be removed, not hoisted."""
    raw = (
        "cv:\n"
        "  name: Jane Doe\n"
        "  design:\n"
        "    theme: classic\n"
        "  sections:\n"
        "    skills:\n"
        "    - label: Skills\n"
        "      details: Python\n"
    )
    result = yaml.safe_load(normalize_to_rendercv(raw))
    assert "design" not in result
    assert "design" not in result.get("cv", {})


def test_top_level_design_stripped():
    """If design: already sits at top level (e.g. from master resume), it must be removed."""
    raw = (
        "cv:\n"
        "  name: Jane Doe\n"
        "  sections:\n"
        "    skills:\n"
        "    - label: Skills\n"
        "      details: Python\n"
        "design:\n"
        "  theme: engineeringresumes\n"
    )
    result = yaml.safe_load(normalize_to_rendercv(raw))
    assert "design" not in result
