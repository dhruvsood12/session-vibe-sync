"""Health and model info schemas."""

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """Health check response."""

    status: str = "ok"
    service: str = "AttentionLens API"


class ModelInfoResponse(BaseModel):
    """Info about loaded models (for GET /model/info)."""

    text_model_loaded: bool = False
    image_model_loaded: bool = False
    multimodal_model_loaded: bool = False
    mode: str = Field(..., description="mock | real")
    version: str = "0.1.0"
