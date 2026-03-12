import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Check } from "lucide-react";
import { useProfile, ProfileUpdate } from "@/hooks/useProfile";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

const GENRE_OPTIONS = [
  "Hip-Hop", "R&B", "Pop", "Rock", "Indie", "Electronic", "Classical",
  "Jazz", "Ambient", "Folk", "Metal", "Punk", "Latin", "Funk", "Soul",
  "Country", "Reggae", "Blues", "Disco", "Synthwave", "Darkwave",
  "Dream Pop", "Art Rock", "Psychedelic", "Lo-Fi",
];

const DECADE_OPTIONS = ["1960s", "1970s", "1980s", "1990s", "2000s", "2010s", "2020s"];

const ACTIVITY_OPTIONS = [
  "workout", "study", "commute", "relax", "work", "latenight", "party",
];

const MOOD_OPTIONS = ["energetic", "chill", "focused", "melancholic", "happy", "nostalgic"];

function TagSelector({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (opt: string) => {
    onChange(selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt]);
  };
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selected.includes(opt)
                ? "bg-accent/20 text-accent border border-accent/30"
                : "bg-surface-hover text-muted-foreground border border-border hover:text-foreground"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function TriToggle({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
      <div className="flex gap-1 bg-background rounded-xl p-1">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              value === opt.value
                ? "bg-surface-hover text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground/70"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function AudioSlider({
  label,
  value,
  onChange,
  leftLabel,
  rightLabel,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  leftLabel: string;
  rightLabel: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
        <span className="text-xs font-mono text-muted-foreground tabular-nums">{value.toFixed(2)}</span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={0}
        max={1}
        step={0.05}
        className="w-full"
      />
      <div className="flex justify-between">
        <span className="text-[10px] text-muted-foreground/60">{leftLabel}</span>
        <span className="text-[10px] text-muted-foreground/60">{rightLabel}</span>
      </div>
    </div>
  );
}

function TextListInput({
  label,
  placeholder,
  values,
  onChange,
  max,
}: {
  label: string;
  placeholder: string;
  values: string[];
  onChange: (v: string[]) => void;
  max: number;
}) {
  const [input, setInput] = useState("");

  const add = () => {
    const trimmed = input.trim();
    if (trimmed && values.length < max && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
      setInput("");
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label} <span className="text-muted-foreground/50">({values.length}/{max})</span>
      </label>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder={placeholder}
          className="bg-surface border-border text-sm"
        />
        <button
          type="button"
          onClick={add}
          disabled={values.length >= max}
          className="px-3 py-2 rounded-lg bg-surface-hover text-xs font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          Add
        </button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {values.map((v) => (
            <span
              key={v}
              className="px-2.5 py-1 rounded-md bg-surface-hover text-xs text-foreground flex items-center gap-1.5 border border-border"
            >
              {v}
              <button
                type="button"
                onClick={() => onChange(values.filter((x) => x !== v))}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const { profile, loading, updateProfile } = useProfile();
  const [saving, setSaving] = useState(false);

  // Local state
  const [displayName, setDisplayName] = useState("");
  const [favoriteGenres, setFavoriteGenres] = useState<string[]>([]);
  const [favoriteArtists, setFavoriteArtists] = useState<string[]>([]);
  const [topSongs, setTopSongs] = useState<string[]>([]);
  const [allTimeSongs, setAllTimeSongs] = useState<string[]>([]);
  const [preferredMoods, setPreferredMoods] = useState<string[]>([]);
  const [preferredActivities, setPreferredActivities] = useState<string[]>([]);
  const [preferredDecades, setPreferredDecades] = useState<string[]>([]);
  const [discoveryPreference, setDiscoveryPreference] = useState("balanced");
  const [popularityPreference, setPopularityPreference] = useState("balanced");
  const [varietyPreference, setVarietyPreference] = useState("balanced");
  const [artistRepetition, setArtistRepetition] = useState("balanced");
  const [genreBlending, setGenreBlending] = useState("balanced");
  const [preferredEnergy, setPreferredEnergy] = useState(0.5);
  const [preferredDanceability, setPreferredDanceability] = useState(0.5);
  const [preferredValence, setPreferredValence] = useState(0.5);
  const [preferredAcousticness, setPreferredAcousticness] = useState(0.5);
  const [preferredTempoLow, setPreferredTempoLow] = useState(80);
  const [preferredTempoHigh, setPreferredTempoHigh] = useState(140);

  // Hydrate from profile
  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.display_name || "");
    setFavoriteGenres(profile.favorite_genres || []);
    setFavoriteArtists(profile.favorite_artists || []);
    setTopSongs(profile.top_songs || []);
    setAllTimeSongs(profile.all_time_songs || []);
    setPreferredMoods(profile.preferred_moods || []);
    setPreferredActivities(profile.preferred_activities || []);
    setPreferredDecades(profile.preferred_decades || []);
    setDiscoveryPreference(profile.discovery_preference || "balanced");
    setPopularityPreference(profile.popularity_preference || "balanced");
    setVarietyPreference(profile.variety_preference || "balanced");
    setArtistRepetition(profile.artist_repetition || "balanced");
    setGenreBlending(profile.genre_blending || "balanced");
    setPreferredEnergy(profile.preferred_energy ?? 0.5);
    setPreferredDanceability(profile.preferred_danceability ?? 0.5);
    setPreferredValence(profile.preferred_valence ?? 0.5);
    setPreferredAcousticness(profile.preferred_acousticness ?? 0.5);
    setPreferredTempoLow(profile.preferred_tempo_low ?? 80);
    setPreferredTempoHigh(profile.preferred_tempo_high ?? 140);
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    const updates: ProfileUpdate = {
      display_name: displayName || null,
      favorite_genres: favoriteGenres,
      favorite_artists: favoriteArtists,
      top_songs: topSongs,
      all_time_songs: allTimeSongs,
      preferred_moods: preferredMoods,
      preferred_activities: preferredActivities,
      preferred_decades: preferredDecades,
      discovery_preference: discoveryPreference,
      popularity_preference: popularityPreference,
      variety_preference: varietyPreference,
      artist_repetition: artistRepetition,
      genre_blending: genreBlending,
      preferred_energy: preferredEnergy,
      preferred_danceability: preferredDanceability,
      preferred_valence: preferredValence,
      preferred_acousticness: preferredAcousticness,
      preferred_tempo_low: preferredTempoLow,
      preferred_tempo_high: preferredTempoHigh,
    };
    const { error } = await updateProfile(updates);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Profile saved");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="p-2 rounded-lg hover:bg-surface-hover transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-muted-foreground" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Taste Profile</h1>
              <p className="text-xs text-muted-foreground">
                Your preferences shape how SessionSense ranks recommendations
              </p>
            </div>
          </div>
          <motion.button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-foreground text-primary-foreground text-sm font-medium disabled:opacity-70"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
          >
            {saving ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saving ? "Saved" : "Save"}
          </motion.button>
        </div>

        {/* Display Name */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Display Name</label>
          <Input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            className="bg-surface border-border max-w-xs"
          />
        </div>

        <div className="h-px bg-border" />

        {/* Music Taste */}
        <div className="space-y-6">
          <h2 className="text-sm font-semibold text-foreground">Music Taste</h2>
          <TagSelector label="Favorite Genres" options={GENRE_OPTIONS} selected={favoriteGenres} onChange={setFavoriteGenres} />
          <TextListInput label="Favorite Artists" placeholder="Artist name" values={favoriteArtists} onChange={setFavoriteArtists} max={20} />
          <TextListInput label="Current Top Songs" placeholder="Song — Artist" values={topSongs} onChange={setTopSongs} max={10} />
          <TextListInput label="All-Time Favorites" placeholder="Song — Artist" values={allTimeSongs} onChange={setAllTimeSongs} max={10} />
          <TagSelector label="Preferred Decades" options={DECADE_OPTIONS} selected={preferredDecades} onChange={setPreferredDecades} />
        </div>

        <div className="h-px bg-border" />

        {/* Listening Context */}
        <div className="space-y-6">
          <h2 className="text-sm font-semibold text-foreground">Listening Context</h2>
          <TagSelector label="Preferred Moods" options={MOOD_OPTIONS} selected={preferredMoods} onChange={setPreferredMoods} />
          <TagSelector label="Preferred Activities" options={ACTIVITY_OPTIONS} selected={preferredActivities} onChange={setPreferredActivities} />
        </div>

        <div className="h-px bg-border" />

        {/* Audio Preferences */}
        <div className="space-y-6">
          <h2 className="text-sm font-semibold text-foreground">Audio Preferences</h2>
          <AudioSlider label="Energy" value={preferredEnergy} onChange={setPreferredEnergy} leftLabel="Calm" rightLabel="Intense" />
          <AudioSlider label="Danceability" value={preferredDanceability} onChange={setPreferredDanceability} leftLabel="Still" rightLabel="Groovy" />
          <AudioSlider label="Valence" value={preferredValence} onChange={setPreferredValence} leftLabel="Dark" rightLabel="Bright" />
          <AudioSlider label="Acousticness" value={preferredAcousticness} onChange={setPreferredAcousticness} leftLabel="Electronic" rightLabel="Acoustic" />

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Tempo Range <span className="text-muted-foreground/50">({preferredTempoLow}–{preferredTempoHigh} BPM)</span>
            </label>
            <Slider
              value={[preferredTempoLow, preferredTempoHigh]}
              onValueChange={([lo, hi]) => { setPreferredTempoLow(lo); setPreferredTempoHigh(hi); }}
              min={40}
              max={200}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between">
              <span className="text-[10px] text-muted-foreground/60">40 BPM</span>
              <span className="text-[10px] text-muted-foreground/60">200 BPM</span>
            </div>
          </div>
        </div>

        <div className="h-px bg-border" />

        {/* Behavioral Preferences */}
        <div className="space-y-6">
          <h2 className="text-sm font-semibold text-foreground">Behavioral Preferences</h2>
          <TriToggle
            label="Discovery vs Familiarity"
            options={[
              { value: "familiar", label: "Familiar" },
              { value: "balanced", label: "Balanced" },
              { value: "discovery", label: "Discovery" },
            ]}
            value={discoveryPreference}
            onChange={setDiscoveryPreference}
          />
          <TriToggle
            label="Popularity"
            options={[
              { value: "niche", label: "Niche" },
              { value: "balanced", label: "Balanced" },
              { value: "mainstream", label: "Mainstream" },
            ]}
            value={popularityPreference}
            onChange={setPopularityPreference}
          />
          <TriToggle
            label="Variety"
            options={[
              { value: "consistent", label: "Consistent" },
              { value: "balanced", label: "Balanced" },
              { value: "varied", label: "Varied" },
            ]}
            value={varietyPreference}
            onChange={setVarietyPreference}
          />
          <TriToggle
            label="Artist Repetition"
            options={[
              { value: "repeat", label: "Repeat" },
              { value: "balanced", label: "Balanced" },
              { value: "diverse", label: "Diverse" },
            ]}
            value={artistRepetition}
            onChange={setArtistRepetition}
          />
          <TriToggle
            label="Genre Blending"
            options={[
              { value: "pure", label: "Pure" },
              { value: "balanced", label: "Balanced" },
              { value: "blended", label: "Blended" },
            ]}
            value={genreBlending}
            onChange={setGenreBlending}
          />
        </div>

        <div className="pb-8" />
      </div>
    </div>
  );
}
