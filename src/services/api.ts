/**
 * SessionSense API Client
 * 
 * Abstracts communication with the ML backend.
 * Toggle USE_MOCK to switch between local mock data and a real FastAPI backend.
 * 
 * In production, the FastAPI backend serves:
 *   POST /predict       → ranked recommendations from the two-stage pipeline
 *   POST /continue      → playlist continuation given seed tracks
 *   GET  /health        → pipeline health check
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false"; // default: true

export interface PredictRequest {
  context: {
    mood: string;
    activity: string;
    time_of_day: string;
    energy_level: string;
  };
  top_k?: number;
}

export interface PredictResponse {
  session_type: string;
  description: string;
  model_confidence: number;
  tracks: ApiTrack[];
  feature_weights: ApiFeatureWeight[];
  candidates_generated: number;
  ranking_model: string;
}

export interface ApiTrack {
  id: number;
  title: string;
  artist: string;
  album: string;
  bpm: number;
  energy: number;
  match_score: number;
  duration: string;
  genre: string;
  danceability: number;
  valence: number;
  shap_values?: ShapValue[];
}

export interface ShapValue {
  feature: string;
  value: number;
  contribution: number;
}

export interface ApiFeatureWeight {
  label: string;
  weight: number;
  direction: "positive" | "negative";
}

export interface ContinueRequest {
  seed_track_ids: number[];
  context?: PredictRequest["context"];
  top_k?: number;
}

export interface ContinueResponse extends PredictResponse {
  seed_tracks: ApiTrack[];
}

export interface HealthResponse {
  status: string;
  model_version: string;
  dataset: string;
  candidate_model: string;
  ranking_model: string;
}

class SessionSenseAPI {
  private baseUrl: string;
  
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async predict(request: PredictRequest): Promise<PredictResponse> {
    const res = await fetch(`${this.baseUrl}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    if (!res.ok) {
      throw new Error(`Prediction failed [${res.status}]: ${await res.text()}`);
    }
    return res.json();
  }

  async continuePlaylist(request: ContinueRequest): Promise<ContinueResponse> {
    const res = await fetch(`${this.baseUrl}/continue`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    if (!res.ok) {
      throw new Error(`Continuation failed [${res.status}]: ${await res.text()}`);
    }
    return res.json();
  }

  async health(): Promise<HealthResponse> {
    const res = await fetch(`${this.baseUrl}/health`);
    if (!res.ok) {
      throw new Error(`Health check failed [${res.status}]`);
    }
    return res.json();
  }
}

export const api = new SessionSenseAPI(API_BASE_URL);
export { USE_MOCK, API_BASE_URL };
