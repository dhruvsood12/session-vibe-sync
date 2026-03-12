/**
 * Feature Engineering
 *
 * Computes real numeric features from track audio attributes and session context.
 * These features are what a LightGBM ranker would consume.
 * Currently used by the heuristic scorer; designed to plug into a learned model.
 */

import { Track, SessionContext } from "@/types/session";

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

/**
 * Compute how well a value fits within a target range.
 * Returns 1.0 if inside the range, decays linearly outside.
 */
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
 * Compute features for a single track given a session context.
 */
export function computeTrackFeatures(track: Track, ctx: SessionContext): TrackFeatures {
  const energyTarget = ENERGY_TARGETS[ctx.activity] || [0.3, 0.7];
  const shift = ENERGY_LEVEL_SHIFT[ctx.energyLevel] || 0;
  const adjustedEnergyTarget: [number, number] = [
    Math.max(0, energyTarget[0] + shift),
    Math.min(1, energyTarget[1] + shift),
  ];

  const bpmTarget = BPM_TARGETS[ctx.activity] || [80, 130];
  const valenceTarget = VALENCE_TARGETS[ctx.mood] || [0.2, 0.6];

  return {
    energyMatch: rangeFit(track.energy, adjustedEnergyTarget),
    tempoFit: bpmRangeFit(track.bpm, bpmTarget),
    valenceFit: rangeFit(track.valence, valenceTarget),
    danceability: track.danceability,
    energy: track.energy,
    acousticFit: ctx.activity === "study" || ctx.activity === "relax"
      ? 1 - track.energy  // proxy: lower energy ≈ more acoustic character
      : 0.5,
  };
}

/**
 * Return human-readable labels for which features contributed most to a score.
 * Sorted by absolute contribution, descending.
 */
export function explainFeatures(features: TrackFeatures, weights: Record<string, number>): { feature: string; value: number; contribution: number }[] {
  const entries = Object.entries(features).map(([key, value]) => ({
    feature: key,
    value: value as number,
    contribution: (value as number) * (weights[key] || 0),
  }));
  return entries.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
}
