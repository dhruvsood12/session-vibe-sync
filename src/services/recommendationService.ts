/**
 * Recommendation Service
 *
 * Orchestrates predictions from either:
 * - Local heuristic pipeline (default, honest about being heuristic)
 * - Real FastAPI backend (when VITE_USE_MOCK=false)
 *
 * Components call this service — never the pipeline or API directly.
 */

import { SessionContext, SessionPrediction } from "@/types/session";
import { runPipeline } from "@/lib/ranking";
import { api, USE_MOCK, PredictRequest, PredictResponse } from "./api";

function mapApiResponseToPrediction(res: PredictResponse): SessionPrediction {
  return {
    sessionType: res.session_type,
    description: res.description,
    modelConfidence: res.model_confidence,
    candidatesGenerated: res.candidates_generated,
    rankingModel: res.ranking_model,
    tracks: res.tracks.map((t) => ({
      id: t.id,
      title: t.title,
      artist: t.artist,
      album: t.album,
      bpm: t.bpm,
      energy: t.energy,
      matchScore: t.match_score,
      duration: t.duration,
      genre: t.genre,
      danceability: t.danceability,
      valence: t.valence,
      shapValues: t.shap_values?.map((s) => ({
        feature: s.feature,
        value: s.value,
        contribution: s.contribution,
      })),
    })),
    featureWeights: res.feature_weights.map((fw) => ({
      label: fw.label,
      weight: fw.weight,
      direction: fw.direction,
    })),
  };
}

export async function getRecommendations(context: SessionContext): Promise<SessionPrediction> {
  if (USE_MOCK) {
    // Run the local heuristic pipeline — no fake latency
    return runPipeline(context);
  }

  const request: PredictRequest = {
    context: {
      mood: context.mood,
      activity: context.activity,
      time_of_day: context.timeOfDay,
      energy_level: context.energyLevel,
    },
    top_k: 8,
  };

  const response = await api.predict(request);
  return mapApiResponseToPrediction(response);
}

export async function checkHealth() {
  return api.health();
}
