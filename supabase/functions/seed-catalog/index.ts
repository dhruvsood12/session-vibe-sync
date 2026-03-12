/**
 * Seed Catalog Edge Function
 * 
 * Inserts seed tracks into catalog_tracks using service role.
 * Idempotent: uses upsert on title+artist_name combination.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tracks } = await req.json();

    if (!tracks || !Array.isArray(tracks)) {
      return new Response(
        JSON.stringify({ error: "tracks array required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let inserted = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const track of tracks) {
      // Check if track already exists by title + artist
      const { data: existing } = await supabase
        .from("catalog_tracks")
        .select("id")
        .eq("title", track.title)
        .eq("artist_name", track.artist_name)
        .maybeSingle();

      if (existing) {
        skipped++;
        continue;
      }

      const { error } = await supabase.from("catalog_tracks").insert({
        title: track.title,
        artist_name: track.artist_name,
        album_name: track.album_name,
        duration_ms: track.duration_ms,
        genre_tags: track.genre_tags,
        bpm: track.bpm,
        energy: track.energy,
        danceability: track.danceability,
        valence: track.valence,
        source: track.source || "seed",
        enriched: track.enriched || false,
        enriched_at: track.enriched_at,
      });

      if (error) {
        errors.push(`${track.title}: ${error.message}`);
      } else {
        inserted++;
      }
    }

    return new Response(
      JSON.stringify({ inserted, skipped, errors }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Seed catalog error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
