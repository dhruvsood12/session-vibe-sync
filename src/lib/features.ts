/**
 * Feature Engineering
 *
 * Computes real numeric features from track audio attributes, session context,
 * and optionally a user taste profile.
 *
 * These features are what a LightGBM ranker would consume.
 * Currently used by the heuristic scorer; designed to plug into a learned model.
 */

import { Track, SessionContext } from "@/types/session";
import { UserTasteProfile } from "@/types/profile";

export interface TrackFeatures {
  /** How well the track's energy matches the session's desired energy (0–1) */
  energyMatch: number;
  /** How well the track's tempo fits the activity profile (0–1) */
  tempoFit: number;
  /** How well the track's valence fits the mood (0–1) */
  valenceFit: number;
  /** Danceability score, normalized (0–1) */
  danceability: number;
  /** Raw energy value from track metadata */
  energy: number;
  /** How acoustic the track is — useful for study/relax contexts */
  acousticFit: number;
  /** How well the track matches the user's long-term profile (0–1). 0.5 if no profile. */
  profileMatch: number;
  /** Genre affinity from the user's profile (0–1). 0.5 if no profile. */
  profileGenreMatch: number;
  /** Artist affinity from the user's profile (0–1). 0.5 if no profile. */
  profileArtistMatch: number;
}

/** Target energy ranges by activity */
const ENERGY_TARGETS: Record<string, [number, number]> = {
  workout: [0.75, 1.0],
  study: [0.05, 0.35],
  commute: [0.35, 0.70],
  relax: [0.10, 0.45],
  work: [0.30, 0.60],
  latenight: [0.25, 0.60],
};

/** Target BPM ranges by activity */
const BPM_TARGETS: Record<string, [number, number]> = {
  workout: [130, 175],
  study: [55, 100],
  commute: [90, 130],
  relax: [60, 95],
  work: [90, 120],
  latenight: [70, 120],
};

/** Target valence ranges by mood */
const VALENCE_TARGETS: Record<string, [number, number]> = {
  energetic: [0.50, 1.0],
  chill: [0.25, 0.60],
  focused: [0.15, 0.50],
  melancholic: [0.05, 0.35],
};

/** Energy level multipliers applied to the energy target */
const ENERGY_LEVEL_SHIFT: Record<string, number> = {
  low: -0.15,
  medium: 0.0,
  high: 0.15,
};

function rangeFit(value: number, [lo, hi]: [number, number]): number {
  if (value >= lo && value <= hi) return 1.0;
  const dist = value < lo ? lo - value : value - hi;
  return Math.max(0, 1 - dist / 0.5);
}

function bpmRangeFit(bpm: number, [lo, hi]: [number, number]): number {
  if (bpm >= lo && bpm <= hi) return 1.0;
  const dist = bpm < lo ? lo - bpm : bpm - hi;
  const range = hi - lo;
  return Math.max(0, 1 - dist / (range * 0.5));
}

/**
 * Compute profile-based features for a track.
 * Returns neutral 0.5 values if no profile is provided.
 */
function computeProfileFeatures(
  track: Track,
  profile?: UserTasteProfile
): { profileMatch: number; profileGenreMatch: number; profileArtistMatch: number } {
  if (!profile || (profile.favoriteGenres.length === 0 && profile.favoriteArtists.length === 0)) {
    return { profileMatch: 0.5, profileGenreMatch: 0.5, profileArtistMatch: 0.5 };
  }

  // Genre match: does the track's genre appear in user's favorites?
  const genreMatch = profile.favoriteGenres.length > 0
    ? (profile.favoriteGenres.some((g) => track.genre.toLowerCase().includes(g.toLowerCase())) ? 1.0 : 0.2)
    : 0.5;

  // Artist match
  const artistMatch = profile.favoriteArtists.length > 0
    ? (profile.favoriteArtists.some((a) => track.artist.toLowerCase().includes(a.toLowerCase())) ? 1.0 : 0.3)
    : 0.5;

  // Audio preference alignment
  const energyDiff = Math.abs(track.energy - profile.preferredEnergy);
  const danceDiff = Math.abs(track.danceability - profile.preferredDanceability);
  const valenceDiff = Math.abs(track.valence - profile.preferredValence);
  const tempoFit = bpmRangeFit(track.bpm, [profile.preferredTempoLow, profile.preferredTempoHigh]);

  const audioAlignment = 1 - (energyDiff + danceDiff + valenceDiff) / 3;
  const profileMatch = (audioAlignment * 0.4 + genreMatch * 0.3 + artistMatch * 0.15 + tempoFit * 0.15);

  return { profileMatch, profileGenreMatch: genreMatch, profileArtistMatch: artistMatch };
}

/**
 * Compute features for a single track given a session context and optional profile.
 */
export function computeTrackFeatures(track: Track, ctx: SessionContext, profile?: UserTasteProfile): TrackFeatures {
  const energyTarget = ENERGY_TARGETS[ctx.activity] || [0.3, 0.7];
  const shift = ENERGY_LEVEL_SHIFT[ctx.energyLevel] || 0;
  const adjustedEnergyTarget: [number, number] = [
    Math.max(0, energyTarget[0] + shift),
    Math.min(1, energyTarget[1] + shift),
  ];

  const bpmTarget = BPM_TARGETS[ctx.activity] || [80, 130];
  const valenceTarget = VALENCE_TARGETS[ctx.mood] || [0.2, 0.6];

  const { profileMatch, profileGenreMatch, profileArtistMatch } = computeProfileFeatures(track, profile);

  return {
    energyMatch: rangeFit(track.energy, adjustedEnergyTarget),
    tempoFit: bpmRangeFit(track.bpm, bpmTarget),
    valenceFit: rangeFit(track.valence, valenceTarget),
    danceability: track.danceability,
    energy: track.energy,
    acousticFit: ctx.activity === "study" || ctx.activity === "relax"
      ? 1 - track.energy
      : 0.5,
    profileMatch,
    profileGenreMatch,
    profileArtistMatch,
  };
}

/**
 * Return human-readable labels for which features contributed most to a score.
 */
export function explainFeatures(features: TrackFeatures, weights: Record<string, number>): { feature: string; value: number; contribution: number }[] {
  const entries = Object.entries(features).map(([key, value]) => ({
    feature: key,
    value: value as number,
    contribution: (value as number) * (weights[key] || 0),
  }));
  return entries.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
}
