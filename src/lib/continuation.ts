/**
 * Playlist Continuation
 *
 * Given seed songs, finds similar tracks by computing audio feature similarity.
 * This is a content-based approach — in production, you'd add collaborative filtering.
 *
 * Pipeline:
 * 1. Parse seed songs and match to catalog
 * 2. Compute average audio profile of seeds
 * 3. Score all non-seed tracks by similarity to seed profile
 * 4. Return top-K most similar tracks
 */

import { Track, SessionPrediction, FeatureWeight } from "@/types/session";
import { ALL_TRACKS } from "@/data/trackDatabase";

interface SeedProfile {
  avgBpm: number;
  avgEnergy: number;
  avgDanceability: number;
  avgValence: number;
  genres: Set<string>;
  artists: Set<string>;
}

function buildSeedProfile(seeds: Track[]): SeedProfile {
  const n = seeds.length;
  return {
    avgBpm: seeds.reduce((s, t) => s + t.bpm, 0) / n,
    avgEnergy: seeds.reduce((s, t) => s + t.energy, 0) / n,
    avgDanceability: seeds.reduce((s, t) => s + t.danceability, 0) / n,
    avgValence: seeds.reduce((s, t) => s + t.valence, 0) / n,
    genres: new Set(seeds.map((t) => t.genre)),
    artists: new Set(seeds.map((t) => t.artist)),
  };
}

function similarityScore(track: Track, profile: SeedProfile): number {
  // BPM similarity (normalized by range)
  const bpmSim = Math.max(0, 1 - Math.abs(track.bpm - profile.avgBpm) / 60);
  // Energy similarity
  const energySim = 1 - Math.abs(track.energy - profile.avgEnergy);
  // Danceability similarity
  const danceSim = 1 - Math.abs(track.danceability - profile.avgDanceability);
  // Valence similarity
  const valenceSim = 1 - Math.abs(track.valence - profile.avgValence);
  // Genre match
  const genreMatch = profile.genres.has(track.genre) ? 1.0 : 0.3;
  // Artist match (slight boost for same artist, not dominant)
  const artistMatch = profile.artists.has(track.artist) ? 0.8 : 0.5;

  // Weighted combination
  return (
    bpmSim * 0.15 +
    energySim * 0.20 +
    danceSim * 0.15 +
    valenceSim * 0.15 +
    genreMatch * 0.25 +
    artistMatch * 0.10
  );
}

/**
 * Match seed song strings to catalog tracks using fuzzy title/artist matching.
 */
function matchSeedsToTracks(seedStrings: string[]): Track[] {
  const matched: Track[] = [];
  for (const seed of seedStrings) {
    const lower = seed.toLowerCase();
    const track = ALL_TRACKS.find(
      (t) =>
        t.title.toLowerCase().includes(lower) ||
        lower.includes(t.title.toLowerCase()) ||
        `${t.title} ${t.artist}`.toLowerCase().includes(lower)
    );
    if (track) matched.push(track);
  }
  return matched;
}

export function continuePlaylists(seedStrings: string[], topK = 8): SessionPrediction {
  const seeds = matchSeedsToTracks(seedStrings);

  if (seeds.length === 0) {
    // Fallback: return random tracks if no seeds matched
    const shuffled = [...ALL_TRACKS].sort(() => Math.random() - 0.5);
    return {
      sessionType: "Playlist Continuation",
      description: `No seed matches found in catalog · returning random tracks`,
      tracks: shuffled.slice(0, topK).map((t) => ({ ...t, matchScore: 0 })),
      featureWeights: [],
      modelConfidence: 0,
      candidatesGenerated: ALL_TRACKS.length,
      rankingModel: "content-similarity-v1",
    };
  }

  const seedIds = new Set(seeds.map((s) => s.id));
  const profile = buildSeedProfile(seeds);
  const candidates = ALL_TRACKS.filter((t) => !seedIds.has(t.id));

  const scored = candidates.map((track) => {
    const score = similarityScore(track, profile);
    return {
      track: { ...track, matchScore: parseFloat(score.toFixed(4)) },
      score,
    };
  });

  scored.sort((a, b) => b.score - a.score);
  const topResults = scored.slice(0, topK);

  // Feature importance breakdown
  const featureWeights: FeatureWeight[] = [
    { label: "Genre Match", weight: 0.25, direction: "positive" },
    { label: "Energy Similarity", weight: 0.20, direction: "positive" },
    { label: "BPM Similarity", weight: 0.15, direction: "positive" },
    { label: "Danceability Sim", weight: 0.15, direction: "positive" },
    { label: "Valence Similarity", weight: 0.15, direction: "positive" },
    { label: "Artist Affinity", weight: 0.10, direction: "positive" },
  ];

  const avgScore = topResults.reduce((s, r) => s + r.score, 0) / topResults.length;
  const seedNames = seeds.map((s) => s.title).join(", ");

  return {
    sessionType: "Playlist Continuation",
    description: `Content-based similarity · seeds: ${seedNames} · ${candidates.length} candidates scored`,
    tracks: topResults.map((r) => r.track),
    featureWeights,
    modelConfidence: avgScore,
    candidatesGenerated: candidates.length,
    rankingModel: "content-similarity-v1",
  };
}
