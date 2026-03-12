/**
 * Transformer-Based Session Recommender
 *
 * STATUS: SCAFFOLD — NOT TRAINED
 *
 * Architecture: SASRec-style self-attentive sequential recommendation.
 * Reference: Kang & McAuley, "Self-Attentive Sequential Recommendation" (ICDM 2018)
 *
 * Design:
 * - Input: sequence of track IDs from a listening session
 * - Embedding layer: track embeddings + learned positional encodings
 * - Self-attention: multi-head causal attention (left-to-right only)
 * - Output: predicted distribution over next track
 * - Loss: BPR (Bayesian Personalized Ranking) with negative sampling
 *
 * Why this architecture:
 * - Self-attention captures both short and long-range dependencies in sessions
 * - Causal masking ensures the model only attends to past tracks
 * - BPR loss is standard for implicit feedback ranking
 * - Positional encoding preserves track ordering within sessions
 *
 * Why NOT trained yet:
 * - The local catalog has only 48 tracks — too small for meaningful sequence learning
 * - Real training requires the Spotify Million Playlist Dataset (~66M interactions)
 * - TypeScript is not the right language for training (PyTorch/JAX would be used)
 * - This scaffold validates the architecture and data pipeline integration
 *
 * Integration plan:
 * - Train in Python with PyTorch on the full dataset
 * - Export weights as JSON
 * - Load weights here for inference-only mode
 * - Or serve via a FastAPI endpoint (the existing API scaffolding supports this)
 */

import { Recommender, Recommendation, Session, TransformerConfig } from "../types";
import { TrackVocabulary, getDefaultVocabulary, PAD_TOKEN } from "../data/vocabulary";

const DEFAULT_CONFIG: TransformerConfig = {
  vocabSize: 50,        // Grows with catalog
  embeddingDim: 64,     // Small for the current catalog
  numHeads: 4,
  numLayers: 2,
  maxSeqLen: 10,
  dropoutRate: 0.1,
  learningRate: 0.001,
  negSamples: 5,
};

/**
 * Simulated embedding lookup.
 * In a trained model, these would be learned parameters.
 * Here we initialize from track audio features as a content-based fallback.
 */
function initializeEmbeddings(vocab: TrackVocabulary, dim: number): Map<number, number[]> {
  const embeddings = new Map<number, number[]>();

  for (const trackId of vocab.getAllTrackIds()) {
    const track = vocab.getTrack(trackId);
    if (!track) continue;

    const idx = vocab.encode(trackId);
    // Initialize embedding from normalized audio features
    // This is a content-based initialization — a trained model would learn these
    const baseFeatures = [
      track.energy,
      track.danceability,
      track.valence,
      track.bpm / 200,    // normalize BPM
    ];

    // Extend to full embedding dim with deterministic pseudo-random values
    const embedding = new Array(dim);
    for (let i = 0; i < dim; i++) {
      if (i < baseFeatures.length) {
        embedding[i] = baseFeatures[i];
      } else {
        // Deterministic initialization based on track ID and position
        const seed = (trackId * 31 + i * 17) % 1000;
        embedding[i] = (seed / 1000 - 0.5) * 0.1;
      }
    }
    embeddings.set(idx, embedding);
  }

  return embeddings;
}

/**
 * Positional encoding (sinusoidal, following Vaswani et al.)
 */
function positionalEncoding(position: number, dim: number): number[] {
  const pe = new Array(dim);
  for (let i = 0; i < dim; i++) {
    if (i % 2 === 0) {
      pe[i] = Math.sin(position / Math.pow(10000, i / dim));
    } else {
      pe[i] = Math.cos(position / Math.pow(10000, (i - 1) / dim));
    }
  }
  return pe;
}

/**
 * Simplified dot-product attention score.
 * In a real implementation, this would be multi-head with Q/K/V projections.
 */
function attentionScore(query: number[], key: number[]): number {
  const dim = query.length;
  let score = 0;
  for (let i = 0; i < dim; i++) {
    score += query[i] * key[i];
  }
  return score / Math.sqrt(dim);
}

export class TransformerSessionModel implements Recommender {
  readonly name = "transformer-session-v1";
  readonly description =
    "SASRec-style self-attentive sequence model — SCAFFOLD, using content-based embeddings (not trained)";

  private config: TransformerConfig;
  private vocab: TrackVocabulary;
  private embeddings: Map<number, number[]> = new Map();
  private _isFitted = false;
  private _trainedOnRealData = false;

  constructor(config?: Partial<TransformerConfig>) {
    this.vocab = getDefaultVocabulary();
    this.config = {
      ...DEFAULT_CONFIG,
      vocabSize: this.vocab.size,
      ...config,
    };
  }

  get isFitted(): boolean {
    return this._isFitted;
  }

  get isTrainedOnRealData(): boolean {
    return this._trainedOnRealData;
  }

  /**
   * Fit the model.
   *
   * Current implementation: Initialize embeddings from audio features.
   * This is NOT training — it's a content-based initialization that allows
   * the model to produce reasonable (but not learned) recommendations.
   *
   * Real training would:
   * 1. Construct sequence examples with the data pipeline
   * 2. Forward pass through multi-head attention layers
   * 3. Compute BPR loss against negative samples
   * 4. Backpropagate and update all parameters
   * 5. Evaluate on validation set each epoch
   */
  fit(_sessions: Session[]): void {
    this.embeddings = initializeEmbeddings(this.vocab, this.config.embeddingDim);
    this._isFitted = true;
    this._trainedOnRealData = false;

    // Log honest status
    console.info(
      `[${this.name}] Initialized with content-based embeddings (${this.embeddings.size} tracks, dim=${this.config.embeddingDim}). ` +
      `NOT trained — using audio feature similarity as fallback.`
    );
  }

  /**
   * Generate recommendations from a session history.
   *
   * Current implementation: Attention-weighted embedding aggregation.
   * Uses the self-attention mechanism to weight recent tracks,
   * then finds nearest neighbors in embedding space.
   *
   * This produces reasonable results because embeddings are initialized
   * from audio features, but it is NOT learned sequence modeling.
   */
  recommend(history: number[], k: number): Recommendation[] {
    if (!this._isFitted) {
      throw new Error("Model not fitted. Call fit() first.");
    }

    if (history.length === 0) return [];

    // Encode history and add positional encoding
    const contextVectors: number[][] = [];
    for (let i = 0; i < Math.min(history.length, this.config.maxSeqLen); i++) {
      const trackId = history[history.length - 1 - i]; // Most recent first
      const idx = this.vocab.encode(trackId);
      const emb = this.embeddings.get(idx);
      if (!emb) continue;

      const posEnc = positionalEncoding(i, this.config.embeddingDim);
      const combined = emb.map((v, j) => v + posEnc[j] * 0.1);
      contextVectors.push(combined);
    }

    if (contextVectors.length === 0) return [];

    // Self-attention aggregation (simplified single-head)
    // Use the most recent track as the query
    const query = contextVectors[0];
    const attentionWeights: number[] = [];
    let weightSum = 0;

    for (const key of contextVectors) {
      const score = Math.exp(attentionScore(query, key));
      attentionWeights.push(score);
      weightSum += score;
    }

    // Weighted combination of context vectors
    const dim = this.config.embeddingDim;
    const sessionRepresentation = new Array(dim).fill(0);
    for (let i = 0; i < contextVectors.length; i++) {
      const weight = attentionWeights[i] / (weightSum + 1e-8);
      for (let j = 0; j < dim; j++) {
        sessionRepresentation[j] += contextVectors[i][j] * weight;
      }
    }

    // Score all candidate tracks by dot product with session representation
    const historySet = new Set(history);
    const candidates: Recommendation[] = [];

    for (const trackId of this.vocab.getAllTrackIds()) {
      if (historySet.has(trackId)) continue;

      const idx = this.vocab.encode(trackId);
      const emb = this.embeddings.get(idx);
      if (!emb) continue;

      let score = 0;
      for (let j = 0; j < dim; j++) {
        score += sessionRepresentation[j] * emb[j];
      }

      candidates.push({
        trackId,
        score,
        source: this.name,
      });
    }

    return candidates
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
  }

  /** Get model configuration */
  getConfig(): TransformerConfig {
    return { ...this.config };
  }

  /**
   * Describe the model architecture for documentation.
   */
  describeArchitecture(): string {
    return [
      `Architecture: SASRec (Self-Attentive Sequential Recommendation)`,
      `Embedding dim: ${this.config.embeddingDim}`,
      `Attention heads: ${this.config.numHeads}`,
      `Transformer layers: ${this.config.numLayers}`,
      `Max sequence length: ${this.config.maxSeqLen}`,
      `Vocab size: ${this.config.vocabSize}`,
      `Training loss: BPR (planned)`,
      `Negative samples: ${this.config.negSamples}`,
      `Status: ${this._trainedOnRealData ? "TRAINED" : "SCAFFOLD — content-based initialization only"}`,
    ].join("\n");
  }
}
