/**
 * Catalog Seed Service
 * 
 * Seeds the catalog_tracks table from the static trackDatabase.ts.
 * This is Mode A: "Seeded catalog import" — starting from a curated list.
 * 
 * Designed to run once or idempotently on app initialization.
 * Uses upsert to avoid duplicates.
 */

import { supabase } from "@/integrations/supabase/client";
import { ALL_TRACKS } from "@/data/trackDatabase";
import { isSupabaseConfigured } from "@/integrations/supabase/client";

/**
 * Convert duration string "M:SS" to milliseconds.
 */
function durationToMs(duration: string): number {
  const [min, sec] = duration.split(":").map(Number);
  return (min * 60 + sec) * 1000;
}

/**
 * Generate a deterministic seed ID for static tracks.
 * We use the title+artist as a natural key to avoid duplicates.
 */
function seedTrackId(title: string, artist: string): string {
  return `seed_${title.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${artist.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
}

/**
 * Seed the catalog with tracks from the static database.
 * Uses service role through edge function for insert (no RLS issues with anon).
 * For the seed operation, we insert directly since catalog_tracks is readable by all.
 */
export async function seedCatalogFromStatic(): Promise<{
  inserted: number;
  skipped: number;
  errors: string[];
}> {
  if (!isSupabaseConfigured || !supabase) {
    // Demo mode: no database seeding
    return { inserted: 0, skipped: ALL_TRACKS.length, errors: [] };
  }
  let inserted = 0;
  let skipped = 0;
  const errors: string[] = [];

  // Check how many seed tracks already exist
  const { count } = await supabase
    .from("catalog_tracks")
    .select("*", { count: "exact", head: true })
    .eq("source", "seed");

  if (count && count >= ALL_TRACKS.length) {
    return { inserted: 0, skipped: ALL_TRACKS.length, errors: [] };
  }

  // We need to insert via the edge function since catalog_tracks
  // doesn't have an INSERT policy for anon/authenticated users
  // (it's a system-managed table). Use the seed endpoint.
  const { data, error } = await supabase.functions.invoke("seed-catalog", {
    body: {
      tracks: ALL_TRACKS.map((track) => ({
        title: track.title,
        artist_name: track.artist,
        album_name: track.album,
        duration_ms: durationToMs(track.duration),
        genre_tags: [track.genre],
        bpm: track.bpm,
        energy: track.energy,
        danceability: track.danceability,
        valence: track.valence,
        source: "seed",
        enriched: true,
        enriched_at: new Date().toISOString(),
      })),
    },
  });

  if (error) {
    console.warn("Seed via edge function failed, catalog may need manual seeding:", error.message);
    return { inserted: 0, skipped: 0, errors: [error.message] };
  }

  return data || { inserted: 0, skipped: 0, errors: [] };
}

/**
 * Check if catalog needs seeding.
 */
export async function catalogNeedsSeeding(): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  const { count } = await supabase
    .from("catalog_tracks")
    .select("*", { count: "exact", head: true });

  return (count || 0) < ALL_TRACKS.length;
}
