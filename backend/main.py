from __future__ import annotations

from typing import Dict, List, Literal, Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .catalog import ALL_TRACKS, Track, get_track


app = FastAPI(title="SessionSense API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev
        "http://127.0.0.1:5173",
        "http://localhost:4173",  # Vite preview
        "http://127.0.0.1:4173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


Mood = Literal["energetic", "chill", "focused", "melancholic"]
Activity = Literal["workout", "study", "commute", "relax", "work", "latenight"]
TimeOfDay = Literal["morning", "afternoon", "evening", "night"]
EnergyLevel = Literal["low", "medium", "high"]


class PredictContext(BaseModel):
    mood: Mood
    activity: Activity
    time_of_day: TimeOfDay
    energy_level: EnergyLevel


class PredictRequest(BaseModel):
    context: PredictContext
    top_k: int = Field(default=8, ge=1, le=50)


class ContinueRequest(BaseModel):
    seed_track_ids: List[int] = Field(default_factory=list, min_length=0, max_length=20)
    top_k: int = Field(default=8, ge=1, le=50)
    context: Optional[PredictContext] = None


class ApiShapValue(BaseModel):
    feature: str
    value: float
    contribution: float


class ApiTrack(BaseModel):
    id: int
    title: str
    artist: str
    album: str
    bpm: int
    energy: float
    match_score: float
    duration: str
    genre: str
    danceability: float
    valence: float
    shap_values: Optional[List[ApiShapValue]] = None


class ApiFeatureWeight(BaseModel):
    label: str
    weight: float
    direction: Literal["positive", "negative"]


class PredictResponse(BaseModel):
    session_type: str
    description: str
    model_confidence: float
    tracks: List[ApiTrack]
    feature_weights: List[ApiFeatureWeight]
    candidates_generated: int
    ranking_model: str


class ContinueResponse(PredictResponse):
    seed_tracks: List[ApiTrack]


class HealthResponse(BaseModel):
    status: str
    model_version: str
    dataset: str
    candidate_model: str
    ranking_model: str


GENRE_AFFINITY: Dict[str, List[str]] = {
    "workout": ["Hip-Hop", "Synth-Pop"],
    "study": ["Classical", "Ambient", "Electronic", "Indie", "Indie Folk"],
    "commute": ["Art Rock", "Electronic", "Soft Rock", "R&B", "Indie Pop", "Synth-Pop", "Psychedelic Rock"],
    "relax": ["Indie Folk", "R&B", "Electronic", "Art Pop", "Funk", "Dream Pop"],
    "work": ["Synthwave", "Jazz Fusion", "Indie Pop", "Disco", "Indie Rock", "Electronic R&B", "R&B", "Psychedelic Rock"],
    "latenight": ["Synthwave", "Darkwave", "R&B", "Psychedelic Pop", "Indie Rock"],
}


def energy_target(level: EnergyLevel) -> float:
    return {"low": 0.25, "medium": 0.55, "high": 0.85}[level]


def valence_target(mood: Mood) -> float:
    return {"energetic": 0.65, "chill": 0.50, "focused": 0.45, "melancholic": 0.25}[mood]


def tempo_target(activity: Activity) -> float:
    return {"workout": 150, "study": 85, "commute": 115, "relax": 90, "work": 110, "latenight": 95}[activity]


def score_track(track: Track, ctx: PredictContext) -> float:
    # Simple heuristic score (honest: not calibrated, not learned)
    energy_sim = 1.0 - abs(track.energy - energy_target(ctx.energy_level))
    valence_sim = 1.0 - abs(track.valence - valence_target(ctx.mood))
    bpm_sim = max(0.0, 1.0 - abs(track.bpm - tempo_target(ctx.activity)) / 60.0)
    danceability = track.danceability

    return (
        energy_sim * 0.35
        + bpm_sim * 0.25
        + valence_sim * 0.25
        + danceability * 0.15
    )


def retrieve_candidates(ctx: PredictContext) -> List[Track]:
    genres = set(GENRE_AFFINITY.get(ctx.activity, []))
    candidates = [t for t in ALL_TRACKS if t.genre in genres]
    return candidates if len(candidates) >= 5 else list(ALL_TRACKS)


def to_api_track(track: Track, match_score: float) -> ApiTrack:
    return ApiTrack(
        id=track.id,
        title=track.title,
        artist=track.artist,
        album=track.album,
        bpm=track.bpm,
        energy=track.energy,
        match_score=round(match_score, 4),
        duration=track.duration,
        genre=track.genre,
        danceability=track.danceability,
        valence=track.valence,
        shap_values=None,
    )


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        model_version="0.1.0",
        dataset="demo_catalog_48",
        candidate_model="genre_affinity",
        ranking_model="heuristic-v1",
    )


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest) -> PredictResponse:
    candidates = retrieve_candidates(req.context)
    scored = [(t, score_track(t, req.context)) for t in candidates]
    scored.sort(key=lambda x: x[1], reverse=True)

    top = scored[: req.top_k]
    avg_score = sum(s for _, s in top) / len(top) if top else 0.0

    return PredictResponse(
        session_type=f"{req.context.mood.title()} {req.context.activity.title()}",
        description=f"Heuristic ranker · {len(candidates)} candidates · top {req.top_k} by weighted score",
        model_confidence=round(avg_score, 4),
        tracks=[to_api_track(t, s) for t, s in top],
        feature_weights=[
            ApiFeatureWeight(label="Energy similarity", weight=0.35, direction="positive"),
            ApiFeatureWeight(label="Tempo similarity", weight=0.25, direction="positive"),
            ApiFeatureWeight(label="Valence similarity", weight=0.25, direction="positive"),
            ApiFeatureWeight(label="Danceability", weight=0.15, direction="positive"),
        ],
        candidates_generated=len(candidates),
        ranking_model="heuristic-v1",
    )


def continuation_similarity(track: Track, seed_profile: Dict[str, float], seed_genres: set[str], seed_artists: set[str]) -> float:
    bpm_sim = max(0.0, 1.0 - abs(track.bpm - seed_profile["bpm"]) / 60.0)
    energy_sim = 1.0 - abs(track.energy - seed_profile["energy"])
    dance_sim = 1.0 - abs(track.danceability - seed_profile["danceability"])
    valence_sim = 1.0 - abs(track.valence - seed_profile["valence"])
    genre_match = 1.0 if track.genre in seed_genres else 0.3
    artist_match = 0.8 if track.artist in seed_artists else 0.5

    return (
        bpm_sim * 0.15
        + energy_sim * 0.20
        + dance_sim * 0.15
        + valence_sim * 0.15
        + genre_match * 0.25
        + artist_match * 0.10
    )


@app.post("/continue", response_model=ContinueResponse)
def continue_playlist(req: ContinueRequest) -> ContinueResponse:
    seeds: List[Track] = [t for tid in req.seed_track_ids if (t := get_track(tid)) is not None]

    if not seeds:
        # Fallback: reuse /predict behavior if no valid seeds
        ctx = req.context or PredictContext(mood="chill", activity="work", time_of_day="evening", energy_level="medium")
        pred = predict(PredictRequest(context=ctx, top_k=req.top_k))
        return ContinueResponse(**pred.model_dump(), seed_tracks=[])

    n = len(seeds)
    seed_profile = {
        "bpm": sum(t.bpm for t in seeds) / n,
        "energy": sum(t.energy for t in seeds) / n,
        "danceability": sum(t.danceability for t in seeds) / n,
        "valence": sum(t.valence for t in seeds) / n,
    }
    seed_genres = {t.genre for t in seeds}
    seed_artists = {t.artist for t in seeds}

    seed_ids = {t.id for t in seeds}
    candidates = [t for t in ALL_TRACKS if t.id not in seed_ids]
    scored = [(t, continuation_similarity(t, seed_profile, seed_genres, seed_artists)) for t in candidates]
    scored.sort(key=lambda x: x[1], reverse=True)
    top = scored[: req.top_k]
    avg_score = sum(s for _, s in top) / len(top) if top else 0.0

    seed_names = ", ".join(t.title for t in seeds)

    return ContinueResponse(
        session_type="Playlist Continuation",
        description=f"Content-based similarity · seeds: {seed_names} · {len(candidates)} candidates scored",
        model_confidence=round(avg_score, 4),
        tracks=[to_api_track(t, s) for t, s in top],
        feature_weights=[
            ApiFeatureWeight(label="Genre match", weight=0.25, direction="positive"),
            ApiFeatureWeight(label="Energy similarity", weight=0.20, direction="positive"),
            ApiFeatureWeight(label="BPM similarity", weight=0.15, direction="positive"),
            ApiFeatureWeight(label="Danceability similarity", weight=0.15, direction="positive"),
            ApiFeatureWeight(label="Valence similarity", weight=0.15, direction="positive"),
            ApiFeatureWeight(label="Artist affinity", weight=0.10, direction="positive"),
        ],
        candidates_generated=len(candidates),
        ranking_model="content-similarity-v1",
        seed_tracks=[to_api_track(t, 0.0) for t in seeds],
    )

