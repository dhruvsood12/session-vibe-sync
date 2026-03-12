import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, X, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ALL_TRACKS } from "@/data/trackDatabase";

interface SeedSongInputProps {
  onContinue: (seeds: string[]) => void;
  isLoading: boolean;
}

export default function SeedSongInput({ onContinue, isLoading }: SeedSongInputProps) {
  const [seeds, setSeeds] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<typeof ALL_TRACKS>([]);

  const handleInputChange = (value: string) => {
    setInput(value);
    if (value.length >= 2) {
      const lower = value.toLowerCase();
      const matches = ALL_TRACKS.filter(
        (t) =>
          t.title.toLowerCase().includes(lower) ||
          t.artist.toLowerCase().includes(lower)
      ).slice(0, 5);
      setSuggestions(matches);
    } else {
      setSuggestions([]);
    }
  };

  const addSeed = (value: string) => {
    if (seeds.length < 5 && !seeds.includes(value)) {
      setSeeds([...seeds, value]);
    }
    setInput("");
    setSuggestions([]);
  };

  const removeSeed = (index: number) => {
    setSeeds(seeds.filter((_, i) => i !== index));
  };

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
            <Input
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && input.trim()) {
                  e.preventDefault();
                  addSeed(input.trim());
                }
              }}
              placeholder="Search catalog..."
              className="bg-surface border-border text-sm"
            />
            <button
              onClick={() => input.trim() && addSeed(input.trim())}
              disabled={seeds.length >= 5}
              className="p-2 rounded-lg bg-surface-hover border border-border hover:bg-surface-active transition-colors disabled:opacity-50"
            >
              <Plus className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Suggestions dropdown */}
          {suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-lg shadow-elevated overflow-hidden z-10">
              {suggestions.map((track) => (
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
        Enter songs from the catalog. The system will find similar tracks using content-based similarity.
      </p>
    </div>
  );
}
