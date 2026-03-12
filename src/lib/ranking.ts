/**
 * Heuristic Ranking Pipeline
 *
 * Stage 1: Candidate retrieval — filter tracks by activity-genre affinity
 * Stage 2: Scoring — weighted linear combination of computed features
 *
 * This is an explicit heuristic ranker. It is designed to be replaced by
 * a learned LightGBM model that consumes the same feature vector.
 *
 * The weights below are hand-tuned, NOT learned. The UI labels them honestly.
 */

import { Track, SessionContext, SessionPrediction, FeatureWeight } from "@/types/session";
import { computeTrackFeatures, TrackFeatures, explainFeatures } from "./features";
import { ALL_TRACKS } from "@/data/trackDatabase";

/** Hand-tuned feature weights for the heuristic ranker */
const HEURISTIC_WEIGHTS: Record<string, number> = {
  energyMatch: 0.30,
  tempoFit: 0.25,
  valenceFit: 0.20,
  danceability: 0.10,
  energy: 0.05,
  acousticFit: 0.10,
};

/** Genre affinity by activity — used for candidate retrieval (stage 1) */
const GENRE_AFFINITY: Record<string, string[]> = {
  workout: ["Hip-Hop", "Synth-Pop"],
  study: ["Classical", "Ambient", "Electronic", "Indie", "Indie Folk"],
  commute: ["Art Rock", "Electronic", "Soft Rock", "R&B", "Indie Pop", "Synth-Pop", "Psychedelic Rock"],
  relax: ["Indie Folk", "R&B", "Electronic", "Art Pop", "Funk", "Dream Pop"],
  work: ["Synthwave", "Jazz Fusion", "Indie Pop", "Disco", "Indie Rock", "Electronic R&B", "R&B", "Psychedelic Rock"],
  latenight: ["Synthwave", "Darkwave", "R&B", "Psychedelic Pop", "Indie Rock"],
};

/**
 * Score a single track against the session context.
 */
function scoreTrack(track: Track, ctx: SessionContext): { score: number; features: TrackFeatures } {
  const features = computeTrackFeatures(track, ctx);
  let score = 0;
  for (const [key, weight] of Object.entries(HEURISTIC_WEIGHTS)) {
    score += (features[key as keyof TrackFeatures] as number) * weight;
  }
  return { score, features };
}

/**
 * Stage 1: Candidate generation.
 * Retrieve tracks whose genre has affinity with the activity.
 * Falls back to all tracks if no genre match (ensures coverage).
 */
function retrieveCandidates(ctx: SessionContext, pool: Track[]): Track[] {
  const affinityGenres = GENRE_AFFINITY[ctx.activity] || [];
  const candidates = pool.filter((t) => affinityGenres.includes(t.genre));
  // If genre filter is too restrictive, include all tracks
  return candidates.length >= 5 ? candidates : pool;
}

/**
 * Stage 2: Rank candidates by heuristic score.
 */
function rankCandidates(
  candidates: Track[],
  ctx: SessionContext,
  topK: number
): { tracks: Track[]; featureImportance: FeatureWeight[]; avgScore: number } {
  const scored = candidates.map((track) => {
    const { score, features } = scoreTrack(track, ctx);
    return {
      track: { ...track, matchScore: parseFloat(score.toFixed(4)) },
      score,
      features,
    };
  });

  scored.sort((a, b) => b.score - a.score);
  const topResults = scored.slice(0, topK);

  // Compute aggregate feature importance across top-K results
  const featureKeys = Object.keys(HEURISTIC_WEIGHTS);
  const avgFeatures: Record<string, number> = {};
  for (const key of featureKeys) {
    const avgValue =
      topResults.reduce((sum, r) => sum + (r.features[key as keyof TrackFeatures] as number), 0) / topResults.length;
    avgFeatures[key] = avgValue;
  }

  const featureImportance: FeatureWeight[] = featureKeys
    .map((key) => ({
      label: formatFeatureLabel(key),
      weight: parseFloat((avgFeatures[key] * HEURISTIC_WEIGHTS[key]).toFixed(3)),
      direction: (avgFeatures[key] * HEURISTIC_WEIGHTS[key] >= 0 ? "positive" : "negative") as "positive" | "negative",
    }))
    .sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight));

  const avgScore = topResults.reduce((s, r) => s + r.score, 0) / topResults.length;

  // Attach SHAP-style per-track explanations
  const tracksWithExplanations = topResults.map((r) => ({
    ...r.track,
    shapValues: explainFeatures(r.features, HEURISTIC_WEIGHTS).slice(0, 4),
  }));

  return { tracks: tracksWithExplanations, featureImportance, avgScore };
}

function formatFeatureLabel(key: string): string {
  const labels: Record<string, string> = {
    energyMatch: "Energy Match",
    tempoFit: "Tempo Fit",
    valenceFit: "Valence Fit",
    danceability: "Danceability",
    energy: "Raw Energy",
    acousticFit: "Acoustic Fit",
  };
  return labels[key] || key;
}

/**
 * Main pipeline entry point.
 * Returns a SessionPrediction with honestly-labeled outputs.
 */
export function runPipeline(ctx: SessionContext, topK = 8): SessionPrediction {
  const candidates = retrieveCandidates(ctx, ALL_TRACKS);
  const { tracks, featureImportance, avgScore } = rankCandidates(candidates, ctx, topK);

  return {
    sessionType: `${capitalize(ctx.mood)} ${capitalize(ctx.activity)}`,
    description: `Heuristic ranker · ${candidates.length} candidates retrieved by genre affinity · top ${topK} by weighted score`,
    tracks,
    featureWeights: featureImportance,
    modelConfidence: avgScore, // honest: this is the average heuristic score, not a learned confidence
    candidatesGenerated: candidates.length,
    rankingModel: "heuristic-v1",
  };
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
