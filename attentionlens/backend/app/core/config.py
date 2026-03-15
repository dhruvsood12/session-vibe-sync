"""Application configuration via environment variables."""

import os
from functools import lru_cache


@lru_cache
def get_settings() -> "Settings":
    return Settings()


class Settings:
    """Backend settings loaded from env."""

    app_name: str = "AttentionLens API"
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000
    use_real_model: bool = False  # When True, load trained models from ml/saved_models

    def __init__(self) -> None:
        self.app_name = os.getenv("APP_NAME", "AttentionLens API")
        self.backend_host = os.getenv("BACKEND_HOST", "0.0.0.0")
        port = os.getenv("BACKEND_PORT", "8000")
        self.backend_port = int(port) if port.isdigit() else 8000
        self.use_real_model = os.getenv("USE_REAL_MODEL", "false").lower() in ("true", "1", "yes")
