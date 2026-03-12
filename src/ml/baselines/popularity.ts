/**
 * Popularity Baseline
 *
 * Recommends tracks based on global frequency in the training data.
 * This is the simplest baseline — it ignores session context entirely.
 *
 * Expected behavior:
 * - Strong when the catalog is small and popular items dominate
 * - Weak on personalization, diversity, and cold-start for items
 * - Serves as a lower bound for more sophisticated models
 *
 * Any model that can't beat popularity is not learning useful patterns.
 */

import { Recommender, Recommendation, Session } from "../types";

export class PopularityBaseline implements Recommender {
  readonly name = "popularity-baseline";
  readonly description = "Global track frequency baseline — ignores session context";

  private trackCounts: Map<number, number> = new Map();
  private rankedTracks: { trackId: number; count: number }[] = [];
  private _isFitted = false;

  get isFitted(): boolean {
    return this._isFitted;
  }

  fit(sessions: Session[]): void {
    this.trackCounts.clear();

    for (const session of sessions) {
      for (const trackId of session.trackIds) {
        this.trackCounts.set(trackId, (this.trackCounts.get(trackId) || 0) + 1);
      }
    }

    this.rankedTracks = Array.from(this.trackCounts.entries())
      .map(([trackId, count]) => ({ trackId, count }))
      .sort((a, b) => b.count - a.count);

    this._isFitted = true;
  }

  recommend(history: number[], k: number): Recommendation[] {
    if (!this._isFitted) {
      throw new Error("Model not fitted. Call fit() first.");
    }

    const historySet = new Set(history);
    const totalPlays = this.rankedTracks.reduce((s, t) => s + t.count, 0);

    return this.rankedTracks
      .filter((t) => !historySet.has(t.trackId))
      .slice(0, k)
      .map((t) => ({
        trackId: t.trackId,
        score: t.count / totalPlays,
        source: this.name,
      }));
  }

  /** Get the raw popularity count for a track */
  getPopularity(trackId: number): number {
    return this.trackCounts.get(trackId) || 0;
  }
}
