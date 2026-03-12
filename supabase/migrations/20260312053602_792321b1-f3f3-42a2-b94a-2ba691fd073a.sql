
-- Catalog Artists table
CREATE TABLE public.catalog_artists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  spotify_artist_id text UNIQUE,
  name text NOT NULL,
  genres text[] DEFAULT '{}',
  popularity integer,
  image_url text,
  spotify_url text,
  followers integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Catalog Tracks table (core catalog)
CREATE TABLE public.catalog_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  spotify_track_id text UNIQUE,
  title text NOT NULL,
  artist_name text NOT NULL,
  artist_id uuid REFERENCES public.catalog_artists(id),
  album_name text,
  album_image_url text,
  duration_ms integer,
  popularity integer,
  explicit boolean DEFAULT false,
  preview_url text,
  spotify_url text,
  isrc text,
  genre_tags text[] DEFAULT '{}',
  -- Audio features (from Spotify Audio Features API or manual)
  bpm real,
  energy real,
  danceability real,
  valence real,
  acousticness real,
  instrumentalness real,
  speechiness real,
  liveness real,
  loudness real,
  key integer,
  mode integer,
  time_signature integer,
  -- Source tracking
  source text NOT NULL DEFAULT 'seed',
  enriched boolean NOT NULL DEFAULT false,
  enriched_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_catalog_tracks_spotify_id ON public.catalog_tracks(spotify_track_id);
CREATE INDEX idx_catalog_tracks_artist ON public.catalog_tracks(artist_name);
CREATE INDEX idx_catalog_tracks_title ON public.catalog_tracks(title);
CREATE INDEX idx_catalog_tracks_source ON public.catalog_tracks(source);
CREATE INDEX idx_catalog_tracks_genre ON public.catalog_tracks USING gin(genre_tags);

-- User saved tracks (from Spotify library import)
CREATE TABLE public.user_saved_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id uuid NOT NULL REFERENCES public.catalog_tracks(id) ON DELETE CASCADE,
  added_at timestamptz DEFAULT now(),
  source text NOT NULL DEFAULT 'spotify_library',
  UNIQUE(user_id, track_id)
);

-- Imported playlists (tracking what playlists users imported)
CREATE TABLE public.imported_playlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  spotify_playlist_id text,
  name text NOT NULL,
  description text,
  track_count integer DEFAULT 0,
  image_url text,
  import_status text NOT NULL DEFAULT 'pending',
  imported_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Recommendation logs (tracking what was recommended and feedback)
CREATE TABLE public.recommendation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id uuid REFERENCES public.saved_sessions(id) ON DELETE SET NULL,
  track_id uuid REFERENCES public.catalog_tracks(id) ON DELETE SET NULL,
  rank_position integer,
  match_score real,
  ranking_model text,
  context_activity text,
  context_mood text,
  context_energy text,
  feedback text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS policies
ALTER TABLE public.catalog_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_saved_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imported_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_logs ENABLE ROW LEVEL SECURITY;

-- Catalog tracks: readable by everyone (public catalog)
CREATE POLICY "Anyone can read catalog tracks"
  ON public.catalog_tracks FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Anyone can read catalog tracks anon"
  ON public.catalog_tracks FOR SELECT
  TO anon USING (true);

-- Catalog artists: readable by everyone
CREATE POLICY "Anyone can read catalog artists"
  ON public.catalog_artists FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Anyone can read catalog artists anon"
  ON public.catalog_artists FOR SELECT
  TO anon USING (true);

-- User saved tracks: user-scoped
CREATE POLICY "Users can view their saved tracks"
  ON public.user_saved_tracks FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their saved tracks"
  ON public.user_saved_tracks FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their saved tracks"
  ON public.user_saved_tracks FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Imported playlists: user-scoped
CREATE POLICY "Users can view their imported playlists"
  ON public.imported_playlists FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert imported playlists"
  ON public.imported_playlists FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their imported playlists"
  ON public.imported_playlists FOR UPDATE
  TO authenticated USING (auth.uid() = user_id);

-- Recommendation logs: user-scoped
CREATE POLICY "Users can view their recommendation logs"
  ON public.recommendation_logs FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert recommendation logs"
  ON public.recommendation_logs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_catalog_tracks_updated_at
  BEFORE UPDATE ON public.catalog_tracks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_catalog_artists_updated_at
  BEFORE UPDATE ON public.catalog_artists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
