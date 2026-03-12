import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, X, Sparkles, Search, Database, Globe } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useCatalogSearch } from "@/hooks/useCatalog";
import { ALL_TRACKS } from "@/data/trackDatabase";
import type { CatalogTrack } from "@/services/catalogService";

interface SeedSongInputProps {
  onContinue: (seeds: string[]) => void;
  isLoading: boolean;
}

function formatDuration(ms: number | null): string {
  if (!ms) return "";
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

export default function SeedSongInput({ onContinue, isLoading }: SeedSongInputProps) {
  const [seeds, setSeeds] = useState<string[]>([]);
  const { query, setQuery, results: catalogResults, source, loading: searchLoading } = useCatalogSearch(250);
  const [fallbackResults, setFallbackResults] = useState<typeof ALL_TRACKS>([]);

  // Fallback to static database if catalog search returns nothing
  useEffect(() => {
    if (query.length >= 2 && catalogResults.length === 0 && !searchLoading) {
      const lower = query.toLowerCase();
      const matches = ALL_TRACKS.filter(
        (t) =>
          t.title.toLowerCase().includes(lower) ||
          t.artist.toLowerCase().includes(lower)
      ).slice(0, 5);
      setFallbackResults(matches);
    } else {
      setFallbackResults([]);
    }
  }, [query, catalogResults, searchLoading]);

  const addSeed = useCallback((value: string) => {
    if (seeds.length < 5 && !seeds.includes(value)) {
      setSeeds((prev) => [...prev, value]);
    }
    setQuery("");
  }, [seeds, setQuery]);

  const removeSeed = (index: number) => {
    setSeeds(seeds.filter((_, i) => i !== index));
  };

  const showSuggestions = query.length >= 2 && (catalogResults.length > 0 || fallbackResults.length > 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Seed Songs <span className="text-muted-foreground/50">({seeds.length}/5)</span>
        </label>
        {seeds.length >= 1 && (
          <motion.button
            onClick={() => onContinue(seeds)}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/15 border border-accent/25 text-xs font-medium text-accent hover:bg-accent/20 transition-colors disabled:opacity-50"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            {isLoading ? "Generating..." : "Continue Playlist"}
          </motion.button>
        )}
      </div>

      {/* Seed chips */}
      {seeds.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {seeds.map((seed, i) => (
            <span
              key={i}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-hover border border-border text-xs text-foreground"
            >
              {seed}
              <button onClick={() => removeSeed(i)} className="text-muted-foreground hover:text-destructive">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input with autocomplete */}
      {seeds.length < 5 && (
        <div className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && query.trim()) {
                    e.preventDefault();
                    addSeed(query.trim());
                  }
                }}
                placeholder="Search catalog..."
                className="bg-surface border-border text-sm pl-9"
              />
              {searchLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 border border-muted-foreground/30 border-t-accent rounded-full animate-spin" />
              )}
            </div>
            <button
              onClick={() => query.trim() && addSeed(query.trim())}
              disabled={seeds.length >= 5}
              className="p-2 rounded-lg bg-surface-hover border border-border hover:bg-surface-active transition-colors disabled:opacity-50"
            >
              <Plus className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Suggestions dropdown */}
          {showSuggestions && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-lg shadow-elevated overflow-hidden z-10 max-h-64 overflow-y-auto">
              {/* Source indicator */}
              <div className="px-3 py-1.5 border-b border-border/50 flex items-center gap-1.5">
                {source === "spotify" ? (
                  <Globe className="w-3 h-3 text-accent" />
                ) : (
                  <Database className="w-3 h-3 text-muted-foreground" />
                )}
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  {catalogResults.length > 0
                    ? source === "spotify"
                      ? "Spotify-enriched catalog"
                      : "Local catalog"
                    : "Seed catalog (fallback)"}
                </span>
              </div>

              {/* Catalog results */}
              {catalogResults.map((track) => (
                <button
                  key={track.id}
                  onClick={() => addSeed(track.title)}
                  className="w-full px-3 py-2 text-left hover:bg-surface-hover transition-colors flex items-center gap-3"
                >
                  {track.album_image_url && (
                    <img
                      src={track.album_image_url}
                      alt=""
                      className="w-8 h-8 rounded object-cover shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-foreground truncate">{track.title}</div>
                    <div className="text-[10px] text-muted-foreground truncate">
                      {track.artist_name}
                      {track.album_name && ` · ${track.album_name}`}
                    </div>
                  </div>
                  <div className="text-right shrink-0 space-y-0.5">
                    {track.genre_tags?.[0] && (
                      <div className="text-[10px] text-muted-foreground/50">{track.genre_tags[0]}</div>
                    )}
                    {track.duration_ms && (
                      <div className="text-[10px] text-muted-foreground/50">{formatDuration(track.duration_ms)}</div>
                    )}
                  </div>
                </button>
              ))}

              {/* Fallback static results */}
              {fallbackResults.map((track) => (
                <button
                  key={track.id}
                  onClick={() => addSeed(track.title)}
                  className="w-full px-3 py-2 text-left hover:bg-surface-hover transition-colors flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs text-foreground">{track.title}</span>
                    <span className="text-xs text-muted-foreground ml-2">— {track.artist}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground/50">{track.genre}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <p className="text-[10px] text-muted-foreground/50">
        Search the curated catalog. Spotify-enriched results available when API is configured.
      </p>
    </div>
  );
}
