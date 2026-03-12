/**
 * Heuristic Ranking Pipeline
 *
 * Stage 1: Candidate retrieval — filter tracks by activity-genre affinity + profile genres
 * Stage 2: Scoring — weighted linear combination of computed features
 *
 * When a user taste profile is provided, profile-based features get weight in scoring
 * and profile genres expand the candidate pool.
 *
 * The weights below are hand-tuned, NOT learned. The UI labels them honestly.
 */

import { Track, SessionContext, SessionPrediction, FeatureWeight } from "@/types/session";
import { UserTasteProfile } from "@/types/profile";
import { computeTrackFeatures, TrackFeatures, explainFeatures } from "./features";
import { ALL_TRACKS } from "@/data/trackDatabase";

/** Hand-tuned feature weights — profile features activate when profile is present */
function getWeights(hasProfile: boolean): Record<string, number> {
  if (hasProfile) {
    return {
      energyMatch: 0.20,
      tempoFit: 0.15,
      valenceFit: 0.12,
      danceability: 0.05,
      energy: 0.03,
      acousticFit: 0.05,
      profileMatch: 0.20,
      profileGenreMatch: 0.12,
      profileArtistMatch: 0.08,
    };
  }
  return {
    energyMatch: 0.30,
    tempoFit: 0.25,
    valenceFit: 0.20,
    danceability: 0.10,
    energy: 0.05,
    acousticFit: 0.10,
    profileMatch: 0,
    profileGenreMatch: 0,
    profileArtistMatch: 0,
  };
}

/** Genre affinity by activity — used for candidate retrieval (stage 1) */
const GENRE_AFFINITY: Record<string, string[]> = {
  workout: ["Hip-Hop", "Synth-Pop"],
  study: ["Classical", "Ambient", "Electronic", "Indie", "Indie Folk"],
  commute: ["Art Rock", "Electronic", "Soft Rock", "R&B", "Indie Pop", "Synth-Pop", "Psychedelic Rock"],
  relax: ["Indie Folk", "R&B", "Electronic", "Art Pop", "Funk", "Dream Pop"],
  work: ["Synthwave", "Jazz Fusion", "Indie Pop", "Disco", "Indie Rock", "Electronic R&B", "R&B", "Psychedelic Rock"],
  latenight: ["Synthwave", "Darkwave", "R&B", "Psychedelic Pop", "Indie Rock"],
};

function scoreTrack(track: Track, ctx: SessionContext, weights: Record<string, number>, profile?: UserTasteProfile): { score: number; features: TrackFeatures } {
  const features = computeTrackFeatures(track, ctx, profile);
  let score = 0;
  for (const [key, weight] of Object.entries(weights)) {
    score += (features[key as keyof TrackFeatures] as number) * weight;
  }
  return { score, features };
}

function retrieveCandidates(ctx: SessionContext, pool: Track[], profile?: UserTasteProfile): Track[] {
  const affinityGenres = new Set(GENRE_AFFINITY[ctx.activity] || []);

  // Expand candidate pool with profile's favorite genres
  if (profile?.favoriteGenres) {
    for (const g of profile.favoriteGenres) {
      affinityGenres.add(g);
    }
  }

  const candidates = pool.filter((t) => affinityGenres.has(t.genre));
  return candidates.length >= 5 ? candidates : pool;
}

function rankCandidates(
  candidates: Track[],
  ctx: SessionContext,
  topK: number,
  profile?: UserTasteProfile
): { tracks: Track[]; featureImportance: FeatureWeight[]; avgScore: number } {
  const weights = getWeights(!!profile && (profile.favoriteGenres.length > 0 || profile.favoriteArtists.length > 0));

  const scored = candidates.map((track) => {
    const { score, features } = scoreTrack(track, ctx, weights, profile);
    return {
      track: { ...track, matchScore: parseFloat(score.toFixed(4)) },
      score,
      features,
    };
  });

  scored.sort((a, b) => b.score - a.score);

  // Apply diversity penalty if profile prefers variety
  if (profile?.artistRepetition === "diverse") {
    const seen = new Set<string>();
    scored.sort((a, b) => {
      const aNew = seen.has(a.track.artist) ? 0 : 0.05;
      const bNew = seen.has(b.track.artist) ? 0 : 0.05;
      seen.add(a.track.artist);
      seen.add(b.track.artist);
      return (b.score + bNew) - (a.score + aNew);
    });
  }

  const topResults = scored.slice(0, topK);

  const activeWeights = Object.entries(weights).filter(([, w]) => w > 0);
  const featureKeys = activeWeights.map(([k]) => k);
  const avgFeatures: Record<string, number> = {};
  for (const key of featureKeys) {
    avgFeatures[key] =
      topResults.reduce((sum, r) => sum + (r.features[key as keyof TrackFeatures] as number), 0) / topResults.length;
  }

  const featureImportance: FeatureWeight[] = featureKeys
    .map((key) => ({
      label: formatFeatureLabel(key),
      weight: parseFloat((avgFeatures[key] * weights[key]).toFixed(3)),
      direction: (avgFeatures[key] * weights[key] >= 0 ? "positive" : "negative") as "positive" | "negative",
    }))
    .sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight));

  const avgScore = topResults.reduce((s, r) => s + r.score, 0) / topResults.length;

  const tracksWithExplanations = topResults.map((r) => ({
    ...r.track,
    shapValues: explainFeatures(r.features, weights).slice(0, 4),
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
    profileMatch: "Profile Match",
    profileGenreMatch: "Profile Genre",
    profileArtistMatch: "Profile Artist",
  };
  return labels[key] || key;
}

/**
 * Main pipeline entry point.
 * Accepts optional user profile for personalized ranking.
 */
export function runPipeline(ctx: SessionContext, topK = 8, profile?: UserTasteProfile): SessionPrediction {
  const candidates = retrieveCandidates(ctx, ALL_TRACKS, profile);
  const { tracks, featureImportance, avgScore } = rankCandidates(candidates, ctx, topK, profile);

  const mode = profile && (profile.favoriteGenres.length > 0 || profile.favoriteArtists.length > 0)
    ? "personalized"
    : "session-only";

  return {
    sessionType: `${capitalize(ctx.mood)} ${capitalize(ctx.activity)}`,
    description: `Heuristic ranker · ${mode} · ${candidates.length} candidates · top ${topK} by weighted score`,
    tracks,
    featureWeights: featureImportance,
    modelConfidence: avgScore,
    candidatesGenerated: candidates.length,
    rankingModel: "heuristic-v1",
  };
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
