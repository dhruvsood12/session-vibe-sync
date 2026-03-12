/**
 * ML Module — Public API
 *
 * Entry point for the SessionSense ML research layer.
 * Exposes baselines, the transformer scaffold, evaluation tools,
 * and the data pipeline.
 *
 * Usage:
 *   import { runExperiment, getExperimentalRecommendations } from "@/ml";
 */

import { Recommender, Session, EvaluationResult, Recommendation } from "./types";
import { PopularityBaseline } from "./baselines/popularity";
import { ItemKNNBaseline } from "./baselines/itemKnn";
import { CollaborativeFilteringBaseline } from "./baselines/collaborativeFiltering";
import { TransformerSessionModel } from "./sequence_models/transformer";
import { generateSyntheticSessions } from "./data/syntheticSessions";
import { getDefaultVocabulary } from "./data/vocabulary";
import { splitSessions } from "./data/pipeline";
import { compareModels, formatComparisonTable } from "./evaluation/evaluator";
import { ALL_TRACKS } from "@/data/trackDatabase";

export interface ExperimentResult {
  evaluations: EvaluationResult[];
  comparisonTable: string;
  dataStats: {
    totalSessions: number;
    trainSessions: number;
    testSessions: number;
    catalogSize: number;
  };
  warnings: string[];
}

/**
 * Run the full experimental evaluation pipeline.
 *
 * 1. Generate synthetic sessions from the catalog
 * 2. Split into train/test
 * 3. Fit all models on training data
 * 4. Evaluate all models on test data
 * 5. Return comparative results
 */
export function runExperiment(numSessions = 200): ExperimentResult {
  const warnings: string[] = [];

  // Data
  const sessions = generateSyntheticSessions({ numSessions, seed: 42 });
  const split = splitSessions(sessions);

  warnings.push(
    "Results are on SYNTHETIC data generated from a 48-track catalog. " +
    "These validate the pipeline but do not represent real-world model performance."
  );

  if (ALL_TRACKS.length < 100) {
    warnings.push(
      `Catalog has only ${ALL_TRACKS.length} tracks — too small for meaningful ` +
      `collaborative filtering or sequence learning. Expand to 1000+ for real experiments.`
    );
  }

  // Models
  const models: Recommender[] = [
    new PopularityBaseline(),
    new ItemKNNBaseline(),
    new CollaborativeFilteringBaseline(16, 10, 0.1),
    new TransformerSessionModel(),
  ];

  // Train
  for (const model of models) {
    try {
      model.fit(split.train);
    } catch (err) {
      warnings.push(`Failed to fit ${model.name}: ${err}`);
    }
  }

  // Evaluate
  const evaluations = compareModels(models, split.test);
  const comparisonTable = formatComparisonTable(evaluations);

  return {
    evaluations,
    comparisonTable,
    dataStats: {
      totalSessions: sessions.length,
      trainSessions: split.train.length,
      testSessions: split.test.length,
      catalogSize: ALL_TRACKS.length,
    },
    warnings,
  };
}

/**
 * Get recommendations from an experimental model for use in the product.
 *
 * This bridges the ML research layer and the product recommendation layer.
 * It runs the specified model on the given history and returns results
 * in the product format.
 */
export function getExperimentalRecommendations(
  modelName: "popularity" | "item-knn" | "implicit-als" | "transformer",
  history: number[],
  k = 8
): {
  recommendations: Recommendation[];
  modelDescription: string;
  isTrained: boolean;
  warning?: string;
} {
  // Generate training data and fit the requested model
  const sessions = generateSyntheticSessions({ numSessions: 200, seed: 42 });
  const split = splitSessions(sessions);

  let model: Recommender;
  switch (modelName) {
    case "popularity":
      model = new PopularityBaseline();
      break;
    case "item-knn":
      model = new ItemKNNBaseline();
      break;
    case "implicit-als":
      model = new CollaborativeFilteringBaseline();
      break;
    case "transformer":
      model = new TransformerSessionModel();
      break;
  }

  model.fit(split.train);
  const recommendations = model.recommend(history, k);

  return {
    recommendations,
    modelDescription: model.description,
    isTrained: model.isFitted,
    warning: modelName === "transformer"
      ? "Using content-based embeddings (not trained). Results reflect audio feature similarity, not learned sequential patterns."
      : "Trained on synthetic session data. Real performance requires the Spotify Million Playlist Dataset.",
  };
}

// Re-export types and utilities
export type { Recommender, Session, EvaluationResult, Recommendation } from "./types";
export { PopularityBaseline } from "./baselines/popularity";
export { ItemKNNBaseline } from "./baselines/itemKnn";
export { CollaborativeFilteringBaseline } from "./baselines/collaborativeFiltering";
export { TransformerSessionModel } from "./sequence_models/transformer";
export { generateSyntheticSessions } from "./data/syntheticSessions";
export { getDefaultVocabulary, TrackVocabulary } from "./data/vocabulary";
export { runDataPipeline } from "./data/pipeline";
export { compareModels, evaluateModel, formatComparisonTable } from "./evaluation/evaluator";
export { ndcgAtK, recallAtK, hitRateAtK, averagePrecisionAtK } from "./evaluation/metrics";
