/**
 * Ranking Evaluation Metrics
 *
 * Standard information retrieval metrics for evaluating recommender systems.
 * All metrics operate on ranked lists and ground-truth relevant items.
 *
 * References:
 * - NDCG: Järvelin & Kekäläinen (2002)
 * - MAP: Manning, Raghavan, Schütze — Introduction to Information Retrieval
 */

/**
 * Discounted Cumulative Gain at K.
 * Measures ranking quality, giving higher weight to top positions.
 */
export function dcg(relevantSet: Set<number>, rankedList: number[], k: number): number {
  let dcgValue = 0;
  for (let i = 0; i < Math.min(k, rankedList.length); i++) {
    if (relevantSet.has(rankedList[i])) {
      dcgValue += 1 / Math.log2(i + 2); // log2(rank + 1), rank is 1-indexed
    }
  }
  return dcgValue;
}

/**
 * Ideal DCG at K — best possible DCG given the number of relevant items.
 */
export function idcg(numRelevant: number, k: number): number {
  let idcgValue = 0;
  for (let i = 0; i < Math.min(k, numRelevant); i++) {
    idcgValue += 1 / Math.log2(i + 2);
  }
  return idcgValue;
}

/**
 * Normalized Discounted Cumulative Gain at K.
 * NDCG@K ∈ [0, 1], where 1 means perfect ranking.
 */
export function ndcgAtK(relevantSet: Set<number>, rankedList: number[], k: number): number {
  const idealDcg = idcg(relevantSet.size, k);
  if (idealDcg === 0) return 0;
  return dcg(relevantSet, rankedList, k) / idealDcg;
}

/**
 * Recall at K.
 * Fraction of relevant items that appear in the top-K.
 */
export function recallAtK(relevantSet: Set<number>, rankedList: number[], k: number): number {
  if (relevantSet.size === 0) return 0;
  const topK = rankedList.slice(0, k);
  const hits = topK.filter((item) => relevantSet.has(item)).length;
  return hits / relevantSet.size;
}

/**
 * Hit Rate at K.
 * Binary: 1 if any relevant item appears in top-K, 0 otherwise.
 */
export function hitRateAtK(relevantSet: Set<number>, rankedList: number[], k: number): number {
  const topK = rankedList.slice(0, k);
  return topK.some((item) => relevantSet.has(item)) ? 1 : 0;
}

/**
 * Average Precision at K.
 * Mean of precision values at each relevant item position.
 */
export function averagePrecisionAtK(relevantSet: Set<number>, rankedList: number[], k: number): number {
  if (relevantSet.size === 0) return 0;
  let sumPrecision = 0;
  let relevantCount = 0;

  for (let i = 0; i < Math.min(k, rankedList.length); i++) {
    if (relevantSet.has(rankedList[i])) {
      relevantCount++;
      sumPrecision += relevantCount / (i + 1);
    }
  }

  return relevantCount > 0 ? sumPrecision / Math.min(relevantSet.size, k) : 0;
}

/**
 * Mean Average Precision at K.
 * MAP@K across multiple queries.
 */
export function mapAtK(
  queries: { relevant: Set<number>; ranked: number[] }[],
  k: number
): number {
  if (queries.length === 0) return 0;
  const total = queries.reduce(
    (sum, q) => sum + averagePrecisionAtK(q.relevant, q.ranked, k),
    0
  );
  return total / queries.length;
}
