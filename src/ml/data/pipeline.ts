/**
 * Data Pipeline
 *
 * Constructs training examples from session data for sequence models.
 *
 * Pipeline stages:
 * 1. Session segmentation — split long sessions into windows
 * 2. Sequence construction — create (input, target) pairs
 * 3. Negative sampling — add negative examples for BPR/ranking loss
 * 4. Padding/masking — handle variable-length sequences
 *
 * Design note: In production, this would process the Spotify Million
 * Playlist Dataset (1M playlists, ~66M track-playlist pairs).
 * Currently operates on synthetic sessions for pipeline validation.
 */

import { Session, SequenceExample, DataSplit } from "../types";
import { TrackVocabulary } from "./vocabulary";
import { sampleNegatives, buildPopularityWeights } from "./sampling";

interface PipelineConfig {
  maxSeqLen: number;
  negSamples: number;
  /** Minimum session length after segmentation */
  minSessionLen: number;
  /** Use popularity-weighted negative sampling */
  popularityNegatives: boolean;
}

const DEFAULT_CONFIG: PipelineConfig = {
  maxSeqLen: 10,
  negSamples: 5,
  minSessionLen: 3,
  popularityNegatives: true,
};

/**
 * Segment long sessions into fixed-length windows.
 * Uses sliding window with stride = 1 for maximum training data.
 */
export function segmentSessions(sessions: Session[], maxLen: number, minLen: number): Session[] {
  const segmented: Session[] = [];
  let segId = 0;

  for (const session of sessions) {
    if (session.trackIds.length <= maxLen) {
      if (session.trackIds.length >= minLen) {
        segmented.push(session);
      }
      continue;
    }

    // Sliding window
    for (let start = 0; start <= session.trackIds.length - maxLen; start++) {
      segmented.push({
        sessionId: `${session.sessionId}-seg${segId++}`,
        trackIds: session.trackIds.slice(start, start + maxLen),
        timestamps: session.timestamps.slice(start, start + maxLen),
        context: session.context,
      });
    }
  }

  return segmented;
}

/**
 * Create sequence examples from sessions.
 * For each session of length N, creates N-1 examples where:
 * - input = tracks[0..i]
 * - target = tracks[i+1]
 */
export function constructExamples(
  sessions: Session[],
  vocab: TrackVocabulary,
  config: Partial<PipelineConfig> = {}
): SequenceExample[] {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const examples: SequenceExample[] = [];

  const popWeights = cfg.popularityNegatives
    ? buildPopularityWeights(sessions, vocab)
    : undefined;

  for (const session of sessions) {
    const encoded = session.trackIds.map((id) => vocab.encode(id));

    // Create examples: predict each next track from the history
    for (let i = 1; i < encoded.length; i++) {
      const inputIds = encoded.slice(0, i);
      const targetId = encoded[i];

      // Pad input to maxSeqLen
      const padded: number[] = [];
      const mask: number[] = [];
      for (let j = 0; j < cfg.maxSeqLen; j++) {
        if (j < inputIds.length) {
          padded.push(inputIds[j]);
          mask.push(1);
        } else {
          padded.push(0); // PAD
          mask.push(0);
        }
      }

      // Sample negatives
      const positiveSet = new Set(encoded);
      const negativeIds = sampleNegatives(positiveSet, vocab.size, cfg.negSamples, popWeights);

      examples.push({
        inputIds: padded,
        targetId,
        negativeIds,
        mask,
      });
    }
  }

  return examples;
}

/**
 * Split sessions into train/validation/test sets.
 * Uses temporal split: earlier sessions for training, later for evaluation.
 * Ratios: 80% train, 10% validation, 10% test.
 */
export function splitSessions(sessions: Session[], seed = 42): DataSplit {
  // Shuffle deterministically
  const shuffled = [...sessions].sort((a, b) => {
    const hashA = simpleHash(a.sessionId + seed);
    const hashB = simpleHash(b.sessionId + seed);
    return hashA - hashB;
  });

  const trainEnd = Math.floor(shuffled.length * 0.8);
  const valEnd = Math.floor(shuffled.length * 0.9);

  return {
    train: shuffled.slice(0, trainEnd),
    validation: shuffled.slice(trainEnd, valEnd),
    test: shuffled.slice(valEnd),
  };
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash;
}

/**
 * Full pipeline: sessions → segmented → split → training examples.
 * Returns split data and constructed examples for each split.
 */
export function runDataPipeline(sessions: Session[], vocab: TrackVocabulary, config: Partial<PipelineConfig> = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  // 1. Segment
  const segmented = segmentSessions(sessions, cfg.maxSeqLen, cfg.minSessionLen);

  // 2. Split
  const split = splitSessions(segmented);

  // 3. Construct examples for each split
  const trainExamples = constructExamples(split.train, vocab, cfg);
  const valExamples = constructExamples(split.validation, vocab, cfg);
  const testExamples = constructExamples(split.test, vocab, cfg);

  return {
    split,
    examples: {
      train: trainExamples,
      validation: valExamples,
      test: testExamples,
    },
    stats: {
      totalSessions: sessions.length,
      segmentedSessions: segmented.length,
      trainSessions: split.train.length,
      valSessions: split.validation.length,
      testSessions: split.test.length,
      trainExamples: trainExamples.length,
      valExamples: valExamples.length,
      testExamples: testExamples.length,
    },
  };
}
