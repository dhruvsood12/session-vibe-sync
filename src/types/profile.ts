/**
 * Profile types for the ranking pipeline.
 * Derived from the database profile but normalized for use in scoring.
 */

export interface UserTasteProfile {
  favoriteGenres: string[];
  favoriteArtists: string[];
  topSongs: string[];
  preferredEnergy: number;
  preferredDanceability: number;
  preferredValence: number;
  preferredAcousticness: number;
  preferredTempoLow: number;
  preferredTempoHigh: number;
  discoveryPreference: "familiar" | "balanced" | "discovery";
  varietyPreference: "consistent" | "balanced" | "varied";
  artistRepetition: "repeat" | "balanced" | "diverse";
  genreBlending: "pure" | "balanced" | "blended";
}

/** Convert a raw DB profile row into a normalized taste profile for scoring */
export function profileToTaste(profile: {
  favorite_genres?: string[] | null;
  favorite_artists?: string[] | null;
  top_songs?: string[] | null;
  preferred_energy?: number | null;
  preferred_danceability?: number | null;
  preferred_valence?: number | null;
  preferred_acousticness?: number | null;
  preferred_tempo_low?: number | null;
  preferred_tempo_high?: number | null;
  discovery_preference?: string | null;
  variety_preference?: string | null;
  artist_repetition?: string | null;
  genre_blending?: string | null;
}): UserTasteProfile {
  return {
    favoriteGenres: profile.favorite_genres || [],
    favoriteArtists: profile.favorite_artists || [],
    topSongs: profile.top_songs || [],
    preferredEnergy: profile.preferred_energy ?? 0.5,
    preferredDanceability: profile.preferred_danceability ?? 0.5,
    preferredValence: profile.preferred_valence ?? 0.5,
    preferredAcousticness: profile.preferred_acousticness ?? 0.5,
    preferredTempoLow: profile.preferred_tempo_low ?? 80,
    preferredTempoHigh: profile.preferred_tempo_high ?? 140,
    discoveryPreference: (profile.discovery_preference as any) || "balanced",
    varietyPreference: (profile.variety_preference as any) || "balanced",
    artistRepetition: (profile.artist_repetition as any) || "balanced",
    genreBlending: (profile.genre_blending as any) || "balanced",
  };
}
