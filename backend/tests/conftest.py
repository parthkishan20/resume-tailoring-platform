"""
Shared pytest configuration and fixtures.

Sets up sys.modules stubs for litellm (not installed until Wave 2 adds
pyproject.toml) so that adapters.py compiles and adapter error-mapping
tests work without the real library present.

Also provides `sim` and `client` fixtures for Wave 2 route unit tests.
"""
from __future__ import annotations

import sys
from types import ModuleType
from unittest.mock import MagicMock

import pytest
from httpx import AsyncClient, ASGITransport


# ---------------------------------------------------------------------------
# Stub out litellm with real exception classes so adapters.py compiles and
# exception-mapping tests can raise/catch properly.
# ---------------------------------------------------------------------------

class _AuthenticationError(Exception):
    def __init__(self, message: str = "", *, llm_provider: str = "", model: str = "", **kw: object) -> None:
        super().__init__(message)


class _RateLimitError(Exception):
    def __init__(self, message: str = "", *, llm_provider: str = "", model: str = "", **kw: object) -> None:
        super().__init__(message)


class _ServiceUnavailableError(Exception):
    def __init__(self, message: str = "", **kw: object) -> None:
        super().__init__(message)


class _APIConnectionError(Exception):
    def __init__(self, message: str = "", **kw: object) -> None:
        super().__init__(message)


# Build the fake litellm.exceptions sub-module.
_exc_module = ModuleType("litellm.exceptions")
_exc_module.AuthenticationError = _AuthenticationError  # type: ignore[attr-defined]
_exc_module.RateLimitError = _RateLimitError  # type: ignore[attr-defined]
_exc_module.ServiceUnavailableError = _ServiceUnavailableError  # type: ignore[attr-defined]
_exc_module.APIConnectionError = _APIConnectionError  # type: ignore[attr-defined]

# Build the fake litellm top-level module.
_litellm_module = ModuleType("litellm")
_litellm_module.exceptions = _exc_module  # type: ignore[attr-defined]
_litellm_module.acompletion = MagicMock()  # replaced per-test via patch()

sys.modules.setdefault("litellm", _litellm_module)
sys.modules.setdefault("litellm.exceptions", _exc_module)


# ---------------------------------------------------------------------------
# Wave 2: Route unit test fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def sim():
    from tests.helpers.simulator import ConfigurableBackendAPI
    return ConfigurableBackendAPI()


@pytest.fixture
async def client(sim):
    from app.main import app, get_backend
    app.dependency_overrides[get_backend] = lambda: sim
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()
