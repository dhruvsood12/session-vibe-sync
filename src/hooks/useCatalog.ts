/**
 * Catalog Hook
 * 
 * Provides catalog search and status for UI components.
 * Manages seeding on first load, search debouncing, and Spotify status.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  searchTracks,
  checkSpotifyStatus,
  getCatalogStats,
  type CatalogTrack,
  type CatalogSearchResult,
} from "@/services/catalogService";
import { catalogNeedsSeeding, seedCatalogFromStatic } from "@/services/catalogSeed";

export function useCatalogSearch(debounceMs: number = 300) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CatalogTrack[]>([]);
  const [source, setSource] = useState<CatalogSearchResult["source"]>("local");
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const result = await searchTracks(q, { limit: 10, spotifyFallback: true });
      setResults(result.tracks);
      setSource(result.source);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (query.length < 2) {
      setResults([]);
      return;
    }
    timerRef.current = setTimeout(() => search(query), debounceMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, debounceMs, search]);

  return { query, setQuery, results, source, loading };
}

export function useCatalogStatus() {
  const [spotifyConfigured, setSpotifyConfigured] = useState(false);
  const [stats, setStats] = useState<{
    totalTracks: number;
    enrichedTracks: number;
    sources: Record<string, number>;
  } | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      // Check if seeding needed
      const needsSeed = await catalogNeedsSeeding();
      if (needsSeed && !cancelled) {
        setSeeding(true);
        await seedCatalogFromStatic();
        setSeeding(false);
        setSeeded(true);
      } else {
        setSeeded(true);
      }

      // Check Spotify status
      const status = await checkSpotifyStatus();
      if (!cancelled) setSpotifyConfigured(status.configured);

      // Get stats
      const catalogStats = await getCatalogStats();
      if (!cancelled) setStats(catalogStats);
    }

    init();
    return () => { cancelled = true; };
  }, []);

  return { spotifyConfigured, stats, seeding, seeded };
}
