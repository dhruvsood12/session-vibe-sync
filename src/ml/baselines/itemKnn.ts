/**
 * Item-KNN Baseline
 *
 * Nearest-neighbor recommendation based on track co-occurrence in sessions.
 * For a given session history, recommends tracks that frequently co-occur
 * with the tracks in the history.
 *
 * Similarity: Cosine similarity on co-occurrence vectors.
 *
 * This is a strong baseline for sequential recommendation because it
 * captures pairwise item relationships without parametric modeling.
 *
 * Complexity: O(|items|²) for building the similarity matrix,
 * O(|history| × k) for recommendation.
 */

import { Recommender, Recommendation, Session } from "../types";

export class ItemKNNBaseline implements Recommender {
  readonly name = "item-knn";
  readonly description = "Item co-occurrence KNN — recommends tracks that co-occur with session history";

  /** Co-occurrence matrix: itemA -> itemB -> count */
  private cooccurrence: Map<number, Map<number, number>> = new Map();
  /** Item norms for cosine similarity */
  private itemNorms: Map<number, number> = new Map();
  private allItems: Set<number> = new Set();
  private _isFitted = false;
  private readonly k: number;

  constructor(k = 20) {
    this.k = k;
  }

  get isFitted(): boolean {
    return this._isFitted;
  }

  fit(sessions: Session[]): void {
    this.cooccurrence.clear();
    this.itemNorms.clear();
    this.allItems.clear();

    // Build co-occurrence counts from sessions
    for (const session of sessions) {
      const uniqueItems = [...new Set(session.trackIds)];
      for (const item of uniqueItems) {
        this.allItems.add(item);
      }

      // Count pairwise co-occurrences within the session
      for (let i = 0; i < uniqueItems.length; i++) {
        for (let j = i + 1; j < uniqueItems.length; j++) {
          const a = uniqueItems[i];
          const b = uniqueItems[j];
          this.incrementCooccurrence(a, b);
          this.incrementCooccurrence(b, a);
        }
      }
    }

    // Compute norms for cosine similarity
    for (const [item, neighbors] of this.cooccurrence) {
      let norm = 0;
      for (const count of neighbors.values()) {
        norm += count * count;
      }
      this.itemNorms.set(item, Math.sqrt(norm));
    }

    this._isFitted = true;
  }

  recommend(history: number[], k: number): Recommendation[] {
    if (!this._isFitted) {
      throw new Error("Model not fitted. Call fit() first.");
    }

    const historySet = new Set(history);
    const candidateScores = new Map<number, number>();

    // For each item in history, find similar items
    for (const histItem of history) {
      const neighbors = this.cooccurrence.get(histItem);
      if (!neighbors) continue;

      const histNorm = this.itemNorms.get(histItem) || 1;

      for (const [candidate, coCount] of neighbors) {
        if (historySet.has(candidate)) continue;

        const candidateNorm = this.itemNorms.get(candidate) || 1;
        // Cosine similarity approximation
        const similarity = coCount / (histNorm * candidateNorm + 1e-8);

        candidateScores.set(
          candidate,
          (candidateScores.get(candidate) || 0) + similarity
        );
      }
    }

    return Array.from(candidateScores.entries())
      .map(([trackId, score]) => ({
        trackId,
        score,
        source: this.name,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
  }

  /** Get the top-K most similar items to a given item */
  getSimilarItems(trackId: number, topK = 10): { trackId: number; similarity: number }[] {
    const neighbors = this.cooccurrence.get(trackId);
    if (!neighbors) return [];

    const norm = this.itemNorms.get(trackId) || 1;
    return Array.from(neighbors.entries())
      .map(([id, count]) => ({
        trackId: id,
        similarity: count / (norm * (this.itemNorms.get(id) || 1) + 1e-8),
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  private incrementCooccurrence(a: number, b: number): void {
    if (!this.cooccurrence.has(a)) {
      this.cooccurrence.set(a, new Map());
    }
    const neighbors = this.cooccurrence.get(a)!;
    neighbors.set(b, (neighbors.get(b) || 0) + 1);
  }
}
