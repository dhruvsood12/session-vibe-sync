/**
 * Negative Sampling
 *
 * Implements negative sampling strategies for implicit feedback training.
 * The model learns to rank positive (observed) interactions above negative
 * (unobserved) ones.
 *
 * Strategies:
 * - Uniform random: sample uniformly from all non-positive items
 * - Popularity-weighted: sample proportional to item frequency (harder negatives)
 */

import { TrackVocabulary, SPECIAL_TOKENS } from "./vocabulary";

/** Sample negative item indices, excluding the given positive set */
export function sampleNegatives(
  positiveIds: Set<number>,
  vocabSize: number,
  count: number,
  popularityWeights?: Map<number, number>
): number[] {
  const negatives: number[] = [];
  const maxAttempts = count * 10;
  let attempts = 0;

  if (popularityWeights && popularityWeights.size > 0) {
    // Popularity-weighted negative sampling
    const candidates = Array.from(popularityWeights.entries())
      .filter(([id]) => !positiveIds.has(id));
    const totalWeight = candidates.reduce((s, [, w]) => s + w, 0);

    while (negatives.length < count && attempts < maxAttempts) {
      let r = Math.random() * totalWeight;
      for (const [id, weight] of candidates) {
        r -= weight;
        if (r <= 0) {
          if (!negatives.includes(id)) {
            negatives.push(id);
          }
          break;
        }
      }
      attempts++;
    }
  } else {
    // Uniform random sampling
    while (negatives.length < count && attempts < maxAttempts) {
      const candidate = SPECIAL_TOKENS + Math.floor(Math.random() * (vocabSize - SPECIAL_TOKENS));
      if (!positiveIds.has(candidate) && !negatives.includes(candidate)) {
        negatives.push(candidate);
      }
      attempts++;
    }
  }

  return negatives;
}

/**
 * Build popularity weights from session data.
 * Tracks that appear more frequently get higher sampling probability.
 */
export function buildPopularityWeights(
  sessions: { trackIds: number[] }[],
  vocab: TrackVocabulary
): Map<number, number> {
  const counts = new Map<number, number>();
  for (const session of sessions) {
    for (const trackId of session.trackIds) {
      const idx = vocab.encode(trackId);
      counts.set(idx, (counts.get(idx) || 0) + 1);
    }
  }

  // Apply smoothing: freq^0.75 (standard from Word2Vec)
  const smoothed = new Map<number, number>();
  for (const [id, count] of counts) {
    smoothed.set(id, Math.pow(count, 0.75));
  }

  return smoothed;
}
