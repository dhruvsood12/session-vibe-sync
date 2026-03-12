/**
 * Track Vocabulary
 *
 * Maps between track IDs and dense indices for model consumption.
 * Handles special tokens (PAD, UNK) and provides lookup utilities.
 *
 * In production, the vocabulary would be built from the full Spotify
 * Million Playlist Dataset. Here it operates on the local catalog.
 */

import { MLTrack } from "../types";
import { ALL_TRACKS } from "@/data/trackDatabase";

/** Special token indices */
export const PAD_TOKEN = 0;
export const UNK_TOKEN = 1;
export const SPECIAL_TOKENS = 2;

export class TrackVocabulary {
  private idToIndex: Map<number, number> = new Map();
  private indexToId: Map<number, number> = new Map();
  private tracks: Map<number, MLTrack> = new Map();
  readonly size: number;

  constructor(trackList?: MLTrack[]) {
    const items = trackList ?? ALL_TRACKS.map((t) => ({
      trackId: t.id,
      title: t.title,
      artist: t.artist,
      genre: t.genre,
      bpm: t.bpm,
      energy: t.energy,
      danceability: t.danceability,
      valence: t.valence,
    }));

    items.forEach((track, i) => {
      const idx = i + SPECIAL_TOKENS;
      this.idToIndex.set(track.trackId, idx);
      this.indexToId.set(idx, track.trackId);
      this.tracks.set(track.trackId, track);
    });

    this.size = items.length + SPECIAL_TOKENS;
  }

  /** Convert track ID to dense index */
  encode(trackId: number): number {
    return this.idToIndex.get(trackId) ?? UNK_TOKEN;
  }

  /** Convert dense index back to track ID */
  decode(index: number): number | null {
    if (index < SPECIAL_TOKENS) return null;
    return this.indexToId.get(index) ?? null;
  }

  /** Encode a sequence of track IDs with padding */
  encodeSequence(trackIds: number[], maxLen: number): { indices: number[]; mask: number[] } {
    const indices: number[] = [];
    const mask: number[] = [];

    for (let i = 0; i < maxLen; i++) {
      if (i < trackIds.length) {
        indices.push(this.encode(trackIds[i]));
        mask.push(1);
      } else {
        indices.push(PAD_TOKEN);
        mask.push(0);
      }
    }

    return { indices, mask };
  }

  /** Get track metadata by ID */
  getTrack(trackId: number): MLTrack | undefined {
    return this.tracks.get(trackId);
  }

  /** Get all track IDs in the vocabulary */
  getAllTrackIds(): number[] {
    return Array.from(this.idToIndex.keys());
  }

  /** Check if a track ID exists in the vocabulary */
  has(trackId: number): boolean {
    return this.idToIndex.has(trackId);
  }
}

/** Singleton vocabulary built from the local catalog */
let _defaultVocab: TrackVocabulary | null = null;

export function getDefaultVocabulary(): TrackVocabulary {
  if (!_defaultVocab) {
    _defaultVocab = new TrackVocabulary();
  }
  return _defaultVocab;
}
