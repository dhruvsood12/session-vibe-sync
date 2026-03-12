/**
 * Spotify Catalog Edge Function
 * 
 * Handles Spotify API interactions for SessionSense catalog:
 * - Search tracks/artists
 * - Enrich track metadata with audio features
 * - Import user's saved tracks (requires user OAuth - planned)
 * 
 * Rate-limit aware: caches results in catalog_tracks table.
 * Does NOT bulk-scrape Spotify. Only fetches on-demand.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

// Cache token in memory for the function lifetime
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getSpotifyToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const clientId = Deno.env.get("SPOTIFY_CLIENT_ID");
  const clientSecret = Deno.env.get("SPOTIFY_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    throw new Error("SPOTIFY_CREDENTIALS_MISSING");
  }

  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    throw new Error(`Spotify token request failed [${res.status}]`);
  }

  const data: SpotifyTokenResponse = await res.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };

  return cachedToken.token;
}

async function spotifyFetch(path: string, token: string) {
  const res = await fetch(`${SPOTIFY_API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 429) {
    const retryAfter = res.headers.get("Retry-After") || "5";
    throw new Error(`RATE_LIMITED:${retryAfter}`);
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Spotify API error [${res.status}]: ${body}`);
  }

  return res.json();
}

function getSupabaseAdmin() {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key);
}

// Search Spotify and cache results
async function handleSearch(query: string, type: string = "track", limit: number = 20) {
  const token = await getSpotifyToken();
  const encoded = encodeURIComponent(query);
  const data = await spotifyFetch(`/search?q=${encoded}&type=${type}&limit=${limit}`, token);

  if (type === "track" && data.tracks?.items) {
    const supabase = getSupabaseAdmin();

    // Cache tracks we haven't seen before
    for (const item of data.tracks.items) {
      const { error } = await supabase.from("catalog_tracks").upsert(
        {
          spotify_track_id: item.id,
          title: item.name,
          artist_name: item.artists?.[0]?.name || "Unknown",
          album_name: item.album?.name,
          album_image_url: item.album?.images?.[0]?.url,
          duration_ms: item.duration_ms,
          popularity: item.popularity,
          explicit: item.explicit,
          preview_url: item.preview_url,
          spotify_url: item.external_urls?.spotify,
          source: "spotify_search",
        },
        { onConflict: "spotify_track_id", ignoreDuplicates: true }
      );
      if (error) console.error("Upsert error:", error.message);
    }

    return {
      tracks: data.tracks.items.map((item: any) => ({
        spotify_track_id: item.id,
        title: item.name,
        artist_name: item.artists?.[0]?.name || "Unknown",
        album_name: item.album?.name,
        album_image_url: item.album?.images?.[0]?.url,
        duration_ms: item.duration_ms,
        popularity: item.popularity,
        preview_url: item.preview_url,
        spotify_url: item.external_urls?.spotify,
      })),
      total: data.tracks.total,
    };
  }

  return data;
}

// Enrich a track with audio features
async function handleEnrich(spotifyTrackId: string) {
  const supabase = getSupabaseAdmin();

  // Check if already enriched
  const { data: existing } = await supabase
    .from("catalog_tracks")
    .select("id, enriched")
    .eq("spotify_track_id", spotifyTrackId)
    .single();

  if (existing?.enriched) {
    return { status: "already_enriched", track_id: existing.id };
  }

  const token = await getSpotifyToken();
  const features = await spotifyFetch(`/audio-features/${spotifyTrackId}`, token);

  const update = {
    bpm: features.tempo,
    energy: features.energy,
    danceability: features.danceability,
    valence: features.valence,
    acousticness: features.acousticness,
    instrumentalness: features.instrumentalness,
    speechiness: features.speechiness,
    liveness: features.liveness,
    loudness: features.loudness,
    key: features.key,
    mode: features.mode,
    time_signature: features.time_signature,
    enriched: true,
    enriched_at: new Date().toISOString(),
  };

  if (existing) {
    await supabase
      .from("catalog_tracks")
      .update(update)
      .eq("spotify_track_id", spotifyTrackId);
    return { status: "enriched", track_id: existing.id };
  }

  return { status: "track_not_in_catalog" };
}

// Batch enrich multiple tracks
async function handleBatchEnrich(spotifyTrackIds: string[]) {
  const supabase = getSupabaseAdmin();
  const token = await getSpotifyToken();

  // Spotify supports up to 100 IDs per audio-features request
  const batchSize = 100;
  const results: any[] = [];

  for (let i = 0; i < spotifyTrackIds.length; i += batchSize) {
    const batch = spotifyTrackIds.slice(i, i + batchSize);
    const ids = batch.join(",");
    const data = await spotifyFetch(`/audio-features?ids=${ids}`, token);

    for (const features of (data.audio_features || [])) {
      if (!features) continue;

      const { error } = await supabase
        .from("catalog_tracks")
        .update({
          bpm: features.tempo,
          energy: features.energy,
          danceability: features.danceability,
          valence: features.valence,
          acousticness: features.acousticness,
          instrumentalness: features.instrumentalness,
          speechiness: features.speechiness,
          liveness: features.liveness,
          loudness: features.loudness,
          key: features.key,
          mode: features.mode,
          time_signature: features.time_signature,
          enriched: true,
          enriched_at: new Date().toISOString(),
        })
        .eq("spotify_track_id", features.id);

      results.push({
        spotify_track_id: features.id,
        status: error ? "error" : "enriched",
      });
    }
  }

  return { enriched: results.length, results };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...params } = await req.json();

    let result;

    switch (action) {
      case "search":
        result = await handleSearch(params.query, params.type, params.limit);
        break;

      case "enrich":
        result = await handleEnrich(params.spotify_track_id);
        break;

      case "batch_enrich":
        result = await handleBatchEnrich(params.spotify_track_ids);
        break;

      case "health":
        // Check if Spotify credentials are configured
        const hasCredentials = !!(
          Deno.env.get("SPOTIFY_CLIENT_ID") &&
          Deno.env.get("SPOTIFY_CLIENT_SECRET")
        );
        result = {
          status: "ok",
          spotify_configured: hasCredentials,
          capabilities: hasCredentials
            ? ["search", "enrich", "batch_enrich"]
            : ["local_catalog_only"],
        };
        break;

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Spotify catalog error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";

    // Handle specific error cases
    if (message === "SPOTIFY_CREDENTIALS_MISSING") {
      return new Response(
        JSON.stringify({
          error: "Spotify API credentials not configured",
          hint: "Add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET to enable Spotify search and enrichment",
          fallback: "local_catalog",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (message.startsWith("RATE_LIMITED:")) {
      const retryAfter = message.split(":")[1];
      return new Response(
        JSON.stringify({ error: "Rate limited by Spotify", retry_after: parseInt(retryAfter) }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": retryAfter } }
      );
    }

    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
