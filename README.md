# SessionSense

**Context-aware music recommendation with session-based sequence modeling.**

SessionSense is a recommender systems project that combines real-time session context (mood, activity, energy) with user taste profiles and experimental sequence models to generate personalized playlists.

## Architecture

The project has three layers:

### 1. Product Layer (`src/`)
- **Auth & Profiles**: User accounts with taste profile storage (genres, artists, audio preferences)
- **Session Recommender**: Two-stage heuristic pipeline — candidate retrieval by genre affinity, then weighted scoring across 9 features
- **Playlist Continuation**: Content-based similarity scoring from seed songs
- **Export**: CSV, JSON, clipboard export (Spotify API scaffolded)

### 2. ML Research Layer (`src/ml/`)
- **Baselines**: Popularity, Item-KNN (co-occurrence), Implicit ALS (matrix factorization)
- **Sequence Model**: SASRec-style transformer scaffold with self-attention over session history
- **Evaluation**: Standard ranking metrics (NDCG@10, Recall@10, HitRate@10, MAP@10)
- **Data Pipeline**: Session segmentation, sequence construction, negative sampling, train/val/test splits

### 3. Infrastructure
- **Database**: PostgreSQL via Lovable Cloud with RLS policies
- **Auth**: Supabase Auth with session persistence
- **Frontend**: React + TypeScript + Tailwind CSS + Framer Motion

## ML Problem Statement

> Standard collaborative filtering ignores session context. What a user listened to in the last 10 minutes often matters more than their full lifetime history when predicting the next track.

SessionSense addresses this by:
1. Modeling short-horizon listening behavior as ordered sequences
2. Comparing baselines (popularity, KNN, CF) against a sequence-aware model
3. Combining session context with long-term user profiles for hybrid ranking

## Models

| Model | Type | Status | Description |
|-------|------|--------|-------------|
| `heuristic-v1` | Product ranker | ✅ Active | Weighted linear combination of 9 features (energy, tempo, valence, profile match) |
| `content-similarity-v1` | Product ranker | ✅ Active | Audio feature similarity for playlist continuation |
| `popularity-baseline` | Baseline | ✅ Implemented | Global track frequency — ignores all context |
| `item-knn` | Baseline | ✅ Implemented | Co-occurrence cosine similarity |
| `implicit-als` | Baseline | ✅ Implemented | ALS matrix factorization on session-item interactions |
| `transformer-session-v1` | Sequence model | 🔧 Scaffold | SASRec self-attention — content-based initialization only |

## Evaluation

The evaluation pipeline uses a **leave-one-out protocol**: for each test session, the model predicts the last track from the preceding history.

**Current status**: All metrics are computed on synthetic sessions generated from a 48-track catalog. These validate the pipeline but do NOT represent real-world performance. Real evaluation requires the Spotify Million Playlist Dataset.

Metrics: NDCG@10, Recall@10, HitRate@10, MAP@10

To run experiments, visit `/experiments` in the app.

## Cold Start & Hybrid Design

The system explicitly addresses cold-start limitations:

- **New users**: The heuristic ranker works without any profile data, using only session context (activity, mood, energy). Profile features gracefully degrade to neutral values.
- **New tracks**: Content-based features (BPM, energy, danceability, valence, genre) provide immediate scoring without interaction history.
- **Hybrid approach**: The product ranker combines session context (real-time) + user profile (long-term) + content features (item metadata). This reduces dependence on any single signal source.
- **Sequence model limitation**: The transformer model requires interaction history to function. For cold-start users, the system falls back to context-based ranking.

## Data

**Primary dataset**: Spotify Million Playlist Dataset (1M playlists, ~66M track-playlist pairs)
- Used for: sequence construction, session segmentation, model training
- Current catalog: 48 tracks with real Spotify audio features (for development/demo)

**Session construction**:
- Playlists are interpreted as sequential listening signals
- Sessions are segmented into fixed-length windows with sliding stride
- Train/validation/test split: 80/10/10

## Project Structure

```
src/
├── ml/                          # ML research layer
│   ├── types.ts                 # Core ML type definitions
│   ├── index.ts                 # Public API
│   ├── baselines/
│   │   ├── popularity.ts        # Global frequency baseline
│   │   ├── itemKnn.ts           # Co-occurrence KNN
│   │   └── collaborativeFiltering.ts  # Implicit ALS
│   ├── sequence_models/
│   │   └── transformer.ts       # SASRec scaffold
│   ├── data/
│   │   ├── pipeline.ts          # Sequence construction & splits
│   │   ├── vocabulary.ts        # Track ID ↔ index mapping
│   │   ├── sampling.ts          # Negative sampling
│   │   └── syntheticSessions.ts # Synthetic data generation
│   └── evaluation/
│       ├── metrics.ts           # NDCG, Recall, HitRate, MAP
│       └── evaluator.ts         # Model comparison framework
├── lib/
│   ├── ranking.ts               # Product heuristic ranker
│   ├── features.ts              # Feature engineering (9 features)
│   └── continuation.ts          # Playlist continuation
├── components/                  # React UI components
├── hooks/                       # Auth, profile, sessions
├── pages/                       # Route pages
├── services/                    # API layer
├── data/                        # Track catalog
└── types/                       # Product type definitions
```

## What's Real vs. Planned

| Feature | Status |
|---------|--------|
| User authentication | ✅ Real |
| Taste profiles | ✅ Real |
| Session-based heuristic ranking | ✅ Real |
| Playlist continuation | ✅ Real |
| Saved sessions & history | ✅ Real |
| CSV/JSON export | ✅ Real |
| Evaluation pipeline | ✅ Real (on synthetic data) |
| Baseline models | ✅ Real |
| Transformer training | 🔧 Scaffold (needs PyTorch + real data) |
| Spotify API integration | 🔧 Scaffold |
| Real benchmark results | ⏳ Pending (requires full dataset) |

## Tech Stack

- React 18 + TypeScript + Vite
- Tailwind CSS + Framer Motion
- Supabase (Auth + PostgreSQL)
- shadcn/ui components

## Future Work

1. **Train transformer on real data**: Use PyTorch on the full Spotify Million Playlist Dataset, export weights for browser inference
2. **LightGBM ranking**: Replace heuristic weights with a learned ranker
3. **Collaborative filtering at scale**: ALS on the full interaction matrix
4. **Spotify API**: Real track search, audio features, playlist creation
5. **Evaluation on real data**: Report NDCG@10 improvements with confidence intervals
