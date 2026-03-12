## SessionSense backend (FastAPI)

This is a small HTTP API that matches the frontend client in `src/services/api.ts`.

### Endpoints
- `GET /health`
- `POST /predict`
- `POST /continue`

### Local run

From the repo root:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt

uvicorn backend.main:app --reload --port 8000
```

### Use it from the frontend

In another terminal:

```bash
VITE_USE_MOCK=false VITE_API_BASE_URL=http://localhost:8000 npm run dev
```

