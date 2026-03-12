/**
 * Catalog Service
 * 
 * Provides local-first catalog search and track retrieval.
 * Falls back to Spotify search when credentials are configured.
 * 
 * Architecture:
 * - Primary: Search catalog_tracks table in database
 * - Secondary: Spotify API via edge function (if configured)
 * - Fallback: Static trackDatabase.ts seed data
 * 
 * All searches hit the local catalog first. Spotify is only used
 * for discovery of tracks not yet in the catalog.
 */

import { supabase } from "@/integrations/supabase/client";

export interface CatalogTrack {
  id: string;
  spotify_track_id: string | null;
  title: string;
  artist_name: string;
  album_name: string | null;
  album_image_url: string | null;
  duration_ms: number | null;
  popularity: number | null;
  preview_url: string | null;
  spotify_url: string | null;
  genre_tags: string[];
  bpm: number | null;
  energy: number | null;
  danceability: number | null;
  valence: number | null;
  acousticness: number | null;
  instrumentalness: number | null;
  source: string;
  enriched: boolean;
}

export interface CatalogSearchResult {
  tracks: CatalogTrack[];
  source: "local" | "spotify" | "seed";
  total: number;
}

/**
 * Search the local catalog database.
 * Uses ilike for fuzzy matching on title and artist_name.
 */
export async function searchCatalog(
  query: string,
  limit: number = 20
): Promise<CatalogSearchResult> {
  if (!query || query.length < 2) {
    return { tracks: [], source: "local", total: 0 };
  }

  const pattern = `%${query}%`;

  const { data, error } = await supabase
    .from("catalog_tracks")
    .select("*")
    .or(`title.ilike.${pattern},artist_name.ilike.${pattern}`)
    .order("popularity", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) {
    console.error("Catalog search error:", error.message);
    return { tracks: [], source: "local", total: 0 };
  }

  return {
    tracks: (data || []) as unknown as CatalogTrack[],
    source: "local",
    total: data?.length || 0,
  };
}

/**
 * Search Spotify via edge function and cache results.
 * Only called when local catalog has insufficient results.
 */
export async function searchSpotify(
  query: string,
  limit: number = 20
): Promise<CatalogSearchResult> {
  try {
    const { data, error } = await supabase.functions.invoke("spotify-catalog", {
      body: { action: "search", query, type: "track", limit },
    });

    if (error) {
      console.warn("Spotify search unavailable:", error.message);
      return { tracks: [], source: "spotify", total: 0 };
    }

    // If Spotify isn't configured, it returns a fallback message
    if (data?.fallback === "local_catalog") {
      return { tracks: [], source: "spotify", total: 0 };
    }

    // Re-fetch from local catalog since edge function cached the results
    if (data?.tracks?.length > 0) {
      const spotifyIds = data.tracks.map((t: any) => t.spotify_track_id);
      const { data: cached } = await supabase
        .from("catalog_tracks")
        .select("*")
        .in("spotify_track_id", spotifyIds);

      return {
        tracks: (cached || []) as unknown as CatalogTrack[],
        source: "spotify",
        total: data.total || cached?.length || 0,
      };
    }

    return { tracks: [], source: "spotify", total: 0 };
  } catch (err) {
    console.warn("Spotify search failed:", err);
    return { tracks: [], source: "spotify", total: 0 };
  }
}

/**
 * Unified search: local catalog first, then Spotify if insufficient results.
 */
export async function searchTracks(
  query: string,
  options: { limit?: number; spotifyFallback?: boolean } = {}
): Promise<CatalogSearchResult> {
  const { limit = 20, spotifyFallback = true } = options;

  // 1. Search local catalog
  const localResult = await searchCatalog(query, limit);

  if (localResult.tracks.length >= 5 || !spotifyFallback) {
    return localResult;
  }

  // 2. If insufficient local results, try Spotify
  const spotifyResult = await searchSpotify(query, limit);

  if (spotifyResult.tracks.length > 0) {
    // Merge: local results first, then Spotify results not already present
    const localIds = new Set(localResult.tracks.map((t) => t.id));
    const merged = [
      ...localResult.tracks,
      ...spotifyResult.tracks.filter((t) => !localIds.has(t.id)),
    ].slice(0, limit);

    return { tracks: merged, source: "spotify", total: merged.length };
  }

  return localResult;
}

/**
 * Get all catalog tracks with audio features (for recommendation pipeline).
 * Returns only enriched tracks that have audio features available.
 */
export async function getCatalogForRecommendation(
  options: { enrichedOnly?: boolean; limit?: number } = {}
): Promise<CatalogTrack[]> {
  const { enrichedOnly = false, limit = 500 } = options;

  let query = supabase
    .from("catalog_tracks")
    .select("*")
    .order("popularity", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (enrichedOnly) {
    query = query.eq("enriched", true);
  } else {
    // At minimum need bpm and energy for ranking
    query = query.not("bpm", "is", null).not("energy", "is", null);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Catalog fetch error:", error.message);
    return [];
  }

  return (data || []) as unknown as CatalogTrack[];
}

/**
 * Get a single track by ID.
 */
export async function getTrackById(id: string): Promise<CatalogTrack | null> {
  const { data, error } = await supabase
    .from("catalog_tracks")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as unknown as CatalogTrack;
}

/**
 * Check if Spotify API is configured.
 */
export async function checkSpotifyStatus(): Promise<{
  configured: boolean;
  capabilities: string[];
}> {
  try {
    const { data, error } = await supabase.functions.invoke("spotify-catalog", {
      body: { action: "health" },
    });

    if (error || !data) {
      return { configured: false, capabilities: ["local_catalog_only"] };
    }

    return {
      configured: data.spotify_configured || false,
      capabilities: data.capabilities || ["local_catalog_only"],
    };
  } catch {
    return { configured: false, capabilities: ["local_catalog_only"] };
  }
}

/**
 * Get catalog stats for display.
 */
export async function getCatalogStats(): Promise<{
  totalTracks: number;
  enrichedTracks: number;
  sources: Record<string, number>;
}> {
  const { data: allTracks } = await supabase
    .from("catalog_tracks")
    .select("source, enriched");

  if (!allTracks) {
    return { totalTracks: 0, enrichedTracks: 0, sources: {} };
  }

  const sources: Record<string, number> = {};
  let enriched = 0;

  for (const track of allTracks) {
    sources[track.source] = (sources[track.source] || 0) + 1;
    if (track.enriched) enriched++;
  }

  return {
    totalTracks: allTracks.length,
    enrichedTracks: enriched,
    sources,
  };
}
