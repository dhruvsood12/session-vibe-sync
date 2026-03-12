/**
 * Synthetic Session Generator
 *
 * Generates plausible listening sessions from the track catalog for
 * offline evaluation of baselines and sequence models.
 *
 * Strategy:
 * - Group tracks by genre/energy clusters
 * - Sample sessions that follow realistic patterns:
 *   - Genre coherence within sessions (users don't randomly jump genres)
 *   - Energy arcs (users may start high and wind down, or vice versa)
 *   - Artist clustering (repeated artist plays are common)
 *
 * IMPORTANT: These are synthetic. Real evaluation requires the Spotify
 * Million Playlist Dataset. Results on synthetic data are useful for
 * pipeline validation but NOT for claiming model performance.
 */

import { Session } from "../types";
import { ALL_TRACKS } from "@/data/trackDatabase";
import { Track } from "@/types/session";

/** Deterministic pseudo-random using a seed (for reproducibility) */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

/** Group tracks by genre */
function groupByGenre(tracks: Track[]): Map<string, Track[]> {
  const groups = new Map<string, Track[]>();
  for (const t of tracks) {
    const existing = groups.get(t.genre) || [];
    existing.push(t);
    groups.set(t.genre, existing);
  }
  return groups;
}

/** Group tracks by energy band */
function getEnergyBand(energy: number): string {
  if (energy < 0.3) return "low";
  if (energy < 0.6) return "mid";
  return "high";
}

interface SessionGenConfig {
  numSessions: number;
  minLength: number;
  maxLength: number;
  seed: number;
}

const DEFAULT_CONFIG: SessionGenConfig = {
  numSessions: 200,
  minLength: 3,
  maxLength: 10,
  seed: 42,
};

/**
 * Generate synthetic sessions from the track catalog.
 *
 * Uses genre coherence and energy clustering to create
 * sessions that resemble real listening behavior.
 */
export function generateSyntheticSessions(config: Partial<SessionGenConfig> = {}): Session[] {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const rand = seededRandom(cfg.seed);
  const genreGroups = groupByGenre(ALL_TRACKS);
  const genres = Array.from(genreGroups.keys());
  const sessions: Session[] = [];

  for (let i = 0; i < cfg.numSessions; i++) {
    const sessionLen = cfg.minLength + Math.floor(rand() * (cfg.maxLength - cfg.minLength + 1));
    const trackIds: number[] = [];
    const timestamps: number[] = [];

    // Strategy selection (deterministic based on session index)
    const strategy = rand();

    if (strategy < 0.5) {
      // Genre-coherent session: pick 1-2 genres and sample from them
      const primaryGenre = genres[Math.floor(rand() * genres.length)];
      const primaryTracks = genreGroups.get(primaryGenre) || [];
      const useSecondary = rand() < 0.3 && genres.length > 1;
      const secondaryGenre = genres[Math.floor(rand() * genres.length)];
      const secondaryTracks = useSecondary ? (genreGroups.get(secondaryGenre) || []) : [];
      const pool = [...primaryTracks, ...secondaryTracks];

      for (let j = 0; j < sessionLen && pool.length > 0; j++) {
        const idx = Math.floor(rand() * pool.length);
        const track = pool[idx];
        if (!trackIds.includes(track.id)) {
          trackIds.push(track.id);
          timestamps.push(j);
        }
      }
    } else if (strategy < 0.8) {
      // Energy-arc session: sort by energy for a coherent arc
      const band = getEnergyBand(rand());
      const pool = ALL_TRACKS.filter((t) => getEnergyBand(t.energy) === band);
      const shuffled = [...pool].sort(() => rand() - 0.5);

      for (let j = 0; j < sessionLen && j < shuffled.length; j++) {
        trackIds.push(shuffled[j].id);
        timestamps.push(j);
      }
    } else {
      // Artist-clustered session
      const artists = [...new Set(ALL_TRACKS.map((t) => t.artist))];
      const primaryArtist = artists[Math.floor(rand() * artists.length)];
      const artistTracks = ALL_TRACKS.filter((t) => t.artist === primaryArtist);
      const otherTracks = ALL_TRACKS.filter((t) => t.artist !== primaryArtist);

      // Add artist tracks first, then fill with similar
      for (const t of artistTracks) {
        if (trackIds.length < sessionLen) {
          trackIds.push(t.id);
          timestamps.push(trackIds.length - 1);
        }
      }
      const shuffledOther = [...otherTracks].sort(() => rand() - 0.5);
      for (const t of shuffledOther) {
        if (trackIds.length < sessionLen) {
          trackIds.push(t.id);
          timestamps.push(trackIds.length - 1);
        }
      }
    }

    if (trackIds.length >= cfg.minLength) {
      sessions.push({
        sessionId: `synth-${i}`,
        trackIds,
        timestamps,
      });
    }
  }

  return sessions;
}
