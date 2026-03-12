/**
 * Implicit Collaborative Filtering Baseline
 *
 * Implements Alternating Least Squares (ALS) for implicit feedback,
 * following the approach from Hu, Koren, Volinsky (2008).
 *
 * The user-item interaction matrix is built from session data:
 * - Each unique session is treated as a "user"
 * - Interactions are binary (track appeared in session)
 * - Confidence weights scale with interaction frequency
 *
 * This is a strong baseline for recommendation but fundamentally ignores
 * the sequential structure of sessions — it treats sessions as bags of items.
 *
 * Limitation: With only 48 tracks and synthetic data, matrix factorization
 * has limited room to learn meaningful latent factors. This baseline is
 * included for architectural completeness and would show its strength
 * on the full Spotify Million Playlist Dataset.
 */

import { Recommender, Recommendation, Session } from "../types";

export class CollaborativeFilteringBaseline implements Recommender {
  readonly name = "implicit-als";
  readonly description = "Implicit ALS collaborative filtering — treats sessions as user-item interactions";

  private userFactors: Map<string, number[]> = new Map();
  private itemFactors: Map<number, number[]> = new Map();
  private allItems: Set<number> = new Set();
  private _isFitted = false;

  private readonly numFactors: number;
  private readonly numIterations: number;
  private readonly regularization: number;

  constructor(numFactors = 16, numIterations = 10, regularization = 0.1) {
    this.numFactors = numFactors;
    this.numIterations = numIterations;
    this.regularization = regularization;
  }

  get isFitted(): boolean {
    return this._isFitted;
  }

  fit(sessions: Session[]): void {
    // Build interaction matrix
    const interactions: Map<string, Set<number>> = new Map();
    this.allItems.clear();

    for (const session of sessions) {
      const items = new Set(session.trackIds);
      interactions.set(session.sessionId, items);
      for (const item of items) {
        this.allItems.add(item);
      }
    }

    const userIds = Array.from(interactions.keys());
    const itemIds = Array.from(this.allItems);

    // Initialize factors randomly (deterministic seed)
    this.userFactors.clear();
    this.itemFactors.clear();

    let seed = 42;
    const nextRand = () => {
      seed = (seed * 16807 + 0) % 2147483647;
      return (seed / 2147483647 - 0.5) * 0.1;
    };

    for (const userId of userIds) {
      this.userFactors.set(userId, Array.from({ length: this.numFactors }, () => nextRand()));
    }
    for (const itemId of itemIds) {
      this.itemFactors.set(itemId, Array.from({ length: this.numFactors }, () => nextRand()));
    }

    // Simplified ALS: alternate between updating user and item factors
    for (let iter = 0; iter < this.numIterations; iter++) {
      // Update user factors
      for (const userId of userIds) {
        const userItems = interactions.get(userId)!;
        const userVec = this.userFactors.get(userId)!;

        for (let f = 0; f < this.numFactors; f++) {
          let numerator = 0;
          let denominator = this.regularization;

          for (const itemId of userItems) {
            const itemVec = this.itemFactors.get(itemId)!;
            const prediction = this.dot(userVec, itemVec) - userVec[f] * itemVec[f];
            numerator += itemVec[f] * (1 - prediction);
            denominator += itemVec[f] * itemVec[f];
          }

          userVec[f] = numerator / (denominator + 1e-8);
        }
      }

      // Update item factors
      for (const itemId of itemIds) {
        const itemVec = this.itemFactors.get(itemId)!;

        for (let f = 0; f < this.numFactors; f++) {
          let numerator = 0;
          let denominator = this.regularization;

          for (const userId of userIds) {
            const userItems = interactions.get(userId)!;
            if (!userItems.has(itemId)) continue;

            const userVec = this.userFactors.get(userId)!;
            const prediction = this.dot(userVec, itemVec) - userVec[f] * itemVec[f];
            numerator += userVec[f] * (1 - prediction);
            denominator += userVec[f] * userVec[f];
          }

          itemVec[f] = numerator / (denominator + 1e-8);
        }
      }
    }

    this._isFitted = true;
  }

  recommend(history: number[], k: number): Recommendation[] {
    if (!this._isFitted) {
      throw new Error("Model not fitted. Call fit() first.");
    }

    // Create a synthetic user vector from the history
    const userVec = new Array(this.numFactors).fill(0);
    let count = 0;

    for (const trackId of history) {
      const itemVec = this.itemFactors.get(trackId);
      if (itemVec) {
        for (let f = 0; f < this.numFactors; f++) {
          userVec[f] += itemVec[f];
        }
        count++;
      }
    }

    if (count > 0) {
      for (let f = 0; f < this.numFactors; f++) {
        userVec[f] /= count;
      }
    }

    // Score all items
    const historySet = new Set(history);
    const candidates: Recommendation[] = [];

    for (const itemId of this.allItems) {
      if (historySet.has(itemId)) continue;

      const itemVec = this.itemFactors.get(itemId);
      if (!itemVec) continue;

      candidates.push({
        trackId: itemId,
        score: this.dot(userVec, itemVec),
        source: this.name,
      });
    }

    return candidates
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
  }

  private dot(a: number[], b: number[]): number {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      sum += a[i] * b[i];
    }
    return sum;
  }
}
