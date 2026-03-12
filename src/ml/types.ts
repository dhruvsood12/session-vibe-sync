/**
 * ML Module Types
 *
 * Core type definitions for the session-aware recommendation research layer.
 * These types are intentionally separate from the product types in src/types/
 * to maintain clean boundaries between product and research code.
 */

/** A track in the ML vocabulary — minimal representation for modeling */
export interface MLTrack {
  trackId: number;
  title: string;
  artist: string;
  genre: string;
  bpm: number;
  energy: number;
  danceability: number;
  valence: number;
}

/** A listening session — ordered sequence of track interactions */
export interface Session {
  sessionId: string;
  trackIds: number[];
  /** Unix timestamps or sequential positions */
  timestamps: number[];
  /** Optional context metadata */
  context?: {
    mood?: string;
    activity?: string;
    timeOfDay?: string;
  };
}

/** A single training example for sequence models */
export interface SequenceExample {
  /** Input track IDs (the history) */
  inputIds: number[];
  /** Target track ID (next track to predict) */
  targetId: number;
  /** Negative sample track IDs */
  negativeIds: number[];
  /** Padding mask: 1 = real token, 0 = padding */
  mask: number[];
}

/** Train/validation/test split */
export interface DataSplit {
  train: Session[];
  validation: Session[];
  test: Session[];
}

/** Recommendation output from any model */
export interface Recommendation {
  trackId: number;
  score: number;
  /** Which model produced this */
  source: string;
}

/** Evaluation result for a single model */
export interface EvaluationResult {
  modelName: string;
  metrics: {
    ndcg_at_10: number | null;
    recall_at_10: number | null;
    hitRate_at_10: number | null;
    map_at_10: number | null;
  };
  /** Number of test examples evaluated */
  numExamples: number;
  /** Whether these are real results or placeholders */
  status: "computed" | "pending" | "error";
  notes?: string;
}

/** Interface that all recommender models must implement */
export interface Recommender {
  readonly name: string;
  readonly description: string;
  /** Whether the model has been fitted/trained */
  readonly isFitted: boolean;
  /** Fit the model on training data */
  fit(sessions: Session[]): void;
  /** Generate recommendations given a session history */
  recommend(history: number[], k: number): Recommendation[];
}

/** Transformer model configuration */
export interface TransformerConfig {
  vocabSize: number;
  embeddingDim: number;
  numHeads: number;
  numLayers: number;
  maxSeqLen: number;
  dropoutRate: number;
  learningRate: number;
  negSamples: number;
}

/** Training loop state */
export interface TrainingState {
  epoch: number;
  totalEpochs: number;
  loss: number;
  validationMetrics: EvaluationResult["metrics"];
  status: "idle" | "training" | "completed" | "error";
}
