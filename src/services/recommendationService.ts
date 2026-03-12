/**
 * Recommendation Service
 * 
 * Orchestrates predictions from either the mock engine or the real API.
 * Components call this service — never the mock data or API directly.
 */

import { SessionContext, SessionPrediction } from "@/types/session";
import { generatePrediction } from "@/data/mockData";
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
    // Simulate network latency for realistic demo feel
    await new Promise((r) => setTimeout(r, 200));
    return generatePrediction(context);
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

export async function continuePlaylist(
  seedTrackIds: number[],
  context?: SessionContext
): Promise<SessionPrediction> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 200));
    // In mock mode, just generate based on context or default
    return generatePrediction(context || { mood: "chill", activity: "relax", timeOfDay: "evening", energyLevel: "medium" });
  }

  const response = await api.continuePlaylist({
    seed_track_ids: seedTrackIds,
    context: context
      ? {
          mood: context.mood,
          activity: context.activity,
          time_of_day: context.timeOfDay,
          energy_level: context.energyLevel,
        }
      : undefined,
    top_k: 8,
  });

  return mapApiResponseToPrediction(response);
}

export async function checkHealth() {
  return api.health();
}
