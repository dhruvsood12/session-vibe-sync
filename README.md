# SessionSense

**Session-aware music recommendation — product prototype + ML evaluation playground.**

SessionSense is a portfolio project that explores how **short-term session context** (mood, activity, time-of-day, energy) can be combined with a **lightweight user taste profile** to generate music recommendations. It includes a working web app and a research-oriented ML layer for baselines, data pipelines, and offline evaluation.

This repo includes both **production-style product code** and **experimental/educational ML scaffolding**. Some parts are intentionally minimal (e.g., small demo catalog + synthetic sessions) to keep iteration fast while the system design matures.

**Project origin (honest note):** the initial frontend prototype/UI was created with **Lovable**, and then extended through additional engineering work in this repo (backend integration, recommendation logic refinement, demo flow, and project cleanup).

## Features

### Product (App)
- **Session-based recommendations**: context inputs → candidate retrieval + heuristic ranking
- **Playlist continuation**: generate follow-ups from seed tracks via content similarity
- **Auth + profiles**: save a taste profile (e.g., genres/artists) and use it as a ranking signal
- **Session history**: save and revisit past sessions (when signed in)
- **Exports**: export recommendation results (CSV/JSON/clipboard, depending on the view)

### ML / Research
- **Baselines**: popularity, item–item KNN, implicit-ALS
- **Sequence-model scaffold**: SASRec-style transformer structure (not trained end-to-end in this repo)
- **Offline evaluation**: ranking metrics such as NDCG@10, Recall@10, HitRate@10, MAP@10
- **Data utilities**: session construction + synthetic data generation for fast sanity checks

## Architecture (high level)

The codebase is organized into three layers:

### 1) Product layer (`src/`)
- UI routes in `src/pages/`
- Reusable UI in `src/components/`
- App logic in `src/lib/` (ranking, feature computation, continuation)
- Data access in `src/services/`
- Auth/profile/session hooks in `src/hooks/`

### 2) ML research layer (`src/ml/`)
- Baseline recommenders (`src/ml/baselines/`)
- Dataset + session construction (`src/ml/data/`)
- Evaluation harness + metrics (`src/ml/evaluation/`)
- Sequence-model scaffold (`src/ml/sequence_models/`)

### 3) Infrastructure
- **Frontend**: React + TypeScript + Vite + Tailwind
- **Backend services**: Supabase (Auth + Postgres + RLS policies)

## Current development focus

The goal is to make the project **more honest, maintainable, and demo-ready**:
- tightening UI language (avoid “confidence”-style claims unless they are truly calibrated)
- improving developer ergonomics (setup, scripts, docs)
- strengthening evaluation clarity (what data is synthetic vs. real, and what results mean)
- expanding the catalog/data story beyond a small demo set

## Local setup

### Prerequisites
- Node.js 18+ recommended
- npm
- Python 3.10+ (only needed if you run the FastAPI backend)

## Quickstart (for reviewers)

This runs in **demo mode** by default — recommendations work without setting up Supabase. Auth/profile/history are only available if Supabase is configured.

```bash
git clone https://github.com/dhruvsood12/session-vibe-sync.git
cd session-vibe-sync
npm install
npm run dev
```

Open the URL printed by Vite (usually `http://localhost:5173`).

### Optional: run the backend too (FastAPI)

Terminal 1 (backend):

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload --port 8000
```

Terminal 2 (frontend, using backend API instead of local mock):

```bash
VITE_USE_MOCK=false VITE_API_BASE_URL=http://localhost:8000 npm run dev
```

### Optional: enable Supabase (auth/profile/history)

```bash
cp .env.example .env
```

Then set:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Restart `npm run dev`.

### Install dependencies

```bash
npm install
```

> Note: if `npm ci` fails, use `npm install` to sync `package-lock.json` with `package.json` first.

### Run the app (dev)

```bash
npm run dev
```

### Run tests (unit)

```bash
npm test
```

### Lint

```bash
npm run lint
```

## Environment variables

- **Demo mode (default)**: no `.env` needed. The app runs with local heuristic recommendations.
- **Backend mode**: set `VITE_USE_MOCK=false` and `VITE_API_BASE_URL=http://localhost:8000`.
- **Supabase mode**: set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env`.

## Project structure (quick map)

```
backend/              # FastAPI backend (optional)
src/
├── components/        # UI components
├── pages/             # Route pages
├── hooks/             # Auth/profile/session hooks
├── services/          # API/data access
├── lib/               # Ranking + feature logic
├── ml/                # ML baselines + evaluation + scaffolds
├── data/              # Demo catalog / data assets
├── test/              # Test setup utilities
└── types/             # Shared TS types
```

## What’s implemented vs. scaffolded (honest status)

- **Implemented**: heuristic session ranker, continuation by content similarity, baseline ML models, offline metrics on synthetic/demo data, app UI + auth/profile flows.
- **In progress / scaffolded**: transformer training on large-scale real data, Spotify API integration, and real benchmark reporting on standard datasets, Adding security tests, and proper architecture.
