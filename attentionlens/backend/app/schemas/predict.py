"""Request and response schemas for prediction endpoints."""

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class Platform(str, Enum):
    """Supported content platforms."""

    YOUTUBE = "youtube"
    TWITTER = "twitter"
    REDDIT = "reddit"
    ARTICLE = "article"
    GENERIC = "generic"


class ContentType(str, Enum):
    """Content type for context."""

    TITLE = "title"
    CAPTION = "caption"
    HEADLINE = "headline"
    THUMBNAIL = "thumbnail"
    MULTIMODAL = "multimodal"


# --- Request schemas ---


class TextPredictRequest(BaseModel):
    """Request for text-only prediction (headline, caption, title)."""

    text: str = Field(..., min_length=1, max_length=2000, description="Headline, title, or caption")
    platform: Platform = Field(default=Platform.GENERIC, description="Target platform")
    content_type: ContentType = Field(default=ContentType.TITLE, description="Type of content")


class ImagePredictRequest(BaseModel):
    """Request for image-only prediction (thumbnail). Uses multipart/form in practice."""

    # In real implementation, image comes as file upload; here we allow base64 or URL for API clarity
    image_url: Optional[str] = Field(None, description="URL of thumbnail (optional)")
    platform: Platform = Field(default=Platform.YOUTUBE, description="Target platform")


class MultimodalPredictRequest(BaseModel):
    """Request for combined text + image prediction."""

    text: str = Field(..., min_length=1, max_length=2000, description="Title or caption")
    image_url: Optional[str] = None
    platform: Platform = Field(default=Platform.GENERIC)
    content_type: ContentType = Field(default=ContentType.MULTIMODAL)


class CompareCandidate(BaseModel):
    """Single candidate for comparison (e.g. title A vs B vs C)."""

    id: str = Field(..., min_length=1, max_length=64)
    text: str = Field(..., min_length=1, max_length=2000)
    image_url: Optional[str] = None


class CompareRequest(BaseModel):
    """Request to compare multiple candidates (e.g. 3 YouTube titles)."""

    candidates: list[CompareCandidate] = Field(..., min_length=2, max_length=10)
    platform: Platform = Field(default=Platform.GENERIC)


# --- Response schemas ---


class Driver(BaseModel):
    """A single factor that drives attention (positive or negative)."""

    name: str
    description: str
    impact: str = Field(..., description="positive | negative | neutral")
    magnitude: float = Field(..., ge=0, le=1, description="Strength 0-1")


class Suggestion(BaseModel):
    """Improvement suggestion for the user."""

    title: str
    description: str
    priority: str = Field(..., description="high | medium | low")


class PredictionResult(BaseModel):
    """Unified prediction response for text, image, or multimodal."""

    score: float = Field(..., ge=0, le=100, description="Predicted attention score 0-100")
    bucket: str = Field(..., description="low | medium | high")
    confidence: float = Field(..., ge=0, le=1, description="Model confidence 0-1")
    drivers: list[Driver] = Field(default_factory=list, description="Key factors affecting score")
    suggestions: list[Suggestion] = Field(default_factory=list, description="Improvement ideas")
    model_used: str = Field(..., description="Identifier of model used (e.g. mock, text_v1)")


class CompareCandidateResult(BaseModel):
    """Result for one candidate in a comparison."""

    id: str
    text: str
    score: float
    bucket: str
    rank: int
    confidence: float
    drivers: list[Driver] = Field(default_factory=list)


class CompareResponse(BaseModel):
    """Response for compare endpoint: ranked candidates and summary."""

    candidates: list[CompareCandidateResult]
    model_used: str
    winner_id: str = Field(..., description="Id of top-ranked candidate")
