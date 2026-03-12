/**
 * Model Evaluator
 *
 * Runs standardized offline evaluation across all recommender models.
 *
 * Protocol:
 * - For each test session, use all tracks except the last as history
 * - The last track is the ground-truth "next track"
 * - Each model recommends K tracks from the remaining catalog
 * - Compute NDCG@K, Recall@K, HitRate@K, MAP@K
 *
 * This is a standard leave-one-out evaluation protocol for sequential
 * recommendation, following Kang & McAuley (2018).
 */

import { Recommender, Session, EvaluationResult } from "../types";
import { ndcgAtK, recallAtK, hitRateAtK, averagePrecisionAtK } from "./metrics";

interface EvaluatorConfig {
  k: number;
  /** Minimum history length required for evaluation */
  minHistoryLen: number;
}

const DEFAULT_CONFIG: EvaluatorConfig = {
  k: 10,
  minHistoryLen: 2,
};

/**
 * Evaluate a single model on test sessions.
 */
export function evaluateModel(
  model: Recommender,
  testSessions: Session[],
  config: Partial<EvaluatorConfig> = {}
): EvaluationResult {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  if (!model.isFitted) {
    return {
      modelName: model.name,
      metrics: { ndcg_at_10: null, recall_at_10: null, hitRate_at_10: null, map_at_10: null },
      numExamples: 0,
      status: "error",
      notes: "Model not fitted",
    };
  }

  const validSessions = testSessions.filter((s) => s.trackIds.length >= cfg.minHistoryLen + 1);

  if (validSessions.length === 0) {
    return {
      modelName: model.name,
      metrics: { ndcg_at_10: null, recall_at_10: null, hitRate_at_10: null, map_at_10: null },
      numExamples: 0,
      status: "error",
      notes: "No valid test sessions (all too short)",
    };
  }

  let totalNdcg = 0;
  let totalRecall = 0;
  let totalHitRate = 0;
  let totalAP = 0;
  let evaluated = 0;

  for (const session of validSessions) {
    const history = session.trackIds.slice(0, -1);
    const groundTruth = session.trackIds[session.trackIds.length - 1];
    const relevantSet = new Set([groundTruth]);

    try {
      const recommendations = model.recommend(history, cfg.k);
      const rankedList = recommendations.map((r) => r.trackId);

      totalNdcg += ndcgAtK(relevantSet, rankedList, cfg.k);
      totalRecall += recallAtK(relevantSet, rankedList, cfg.k);
      totalHitRate += hitRateAtK(relevantSet, rankedList, cfg.k);
      totalAP += averagePrecisionAtK(relevantSet, rankedList, cfg.k);
      evaluated++;
    } catch {
      // Skip failed recommendations
    }
  }

  if (evaluated === 0) {
    return {
      modelName: model.name,
      metrics: { ndcg_at_10: null, recall_at_10: null, hitRate_at_10: null, map_at_10: null },
      numExamples: 0,
      status: "error",
      notes: "All recommendations failed",
    };
  }

  return {
    modelName: model.name,
    metrics: {
      ndcg_at_10: totalNdcg / evaluated,
      recall_at_10: totalRecall / evaluated,
      hitRate_at_10: totalHitRate / evaluated,
      map_at_10: totalAP / evaluated,
    },
    numExamples: evaluated,
    status: "computed",
    notes: `Evaluated on ${evaluated}/${validSessions.length} valid test sessions (synthetic data — not representative of real-world performance)`,
  };
}

/**
 * Run comparative evaluation across all models.
 * Returns results sorted by NDCG@10 (descending).
 */
export function compareModels(
  models: Recommender[],
  testSessions: Session[],
  config: Partial<EvaluatorConfig> = {}
): EvaluationResult[] {
  const results = models.map((model) => evaluateModel(model, testSessions, config));

  // Sort by NDCG@10, putting null values last
  results.sort((a, b) => {
    const aNdcg = a.metrics.ndcg_at_10 ?? -1;
    const bNdcg = b.metrics.ndcg_at_10 ?? -1;
    return bNdcg - aNdcg;
  });

  return results;
}

/**
 * Format evaluation results as a human-readable comparison table.
 */
export function formatComparisonTable(results: EvaluationResult[]): string {
  const header = "Model                  | NDCG@10  | Recall@10 | HitRate@10 | MAP@10   | Status";
  const separator = "-".repeat(header.length);

  const rows = results.map((r) => {
    const name = r.modelName.padEnd(22);
    const ndcg = r.metrics.ndcg_at_10 !== null ? r.metrics.ndcg_at_10.toFixed(4).padStart(8) : "pending ".padStart(8);
    const recall = r.metrics.recall_at_10 !== null ? r.metrics.recall_at_10.toFixed(4).padStart(9) : " pending ".padStart(9);
    const hitRate = r.metrics.hitRate_at_10 !== null ? r.metrics.hitRate_at_10.toFixed(4).padStart(10) : "  pending ".padStart(10);
    const map = r.metrics.map_at_10 !== null ? r.metrics.map_at_10.toFixed(4).padStart(8) : "pending ".padStart(8);
    return `${name} | ${ndcg} | ${recall} | ${hitRate} | ${map} | ${r.status}`;
  });

  return [header, separator, ...rows].join("\n");
}
