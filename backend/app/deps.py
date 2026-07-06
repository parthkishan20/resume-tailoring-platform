# backend/app/deps.py
from functools import lru_cache
from .backend_api import BackendAPI, create_real_backend
from .config import get_settings


@lru_cache(maxsize=1)
def _backend() -> BackendAPI:
    settings = get_settings()
    if settings.LLM_MOCK:
        from .simulator import SimulatedBackendAPI
        return SimulatedBackendAPI()
    return create_real_backend()


def get_backend() -> BackendAPI:
    return _backend()
