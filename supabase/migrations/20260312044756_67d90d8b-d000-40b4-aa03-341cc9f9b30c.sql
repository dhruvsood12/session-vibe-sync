
-- Timestamp trigger function (reusable)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  favorite_genres TEXT[] DEFAULT '{}',
  favorite_artists TEXT[] DEFAULT '{}',
  top_songs TEXT[] DEFAULT '{}',
  all_time_songs TEXT[] DEFAULT '{}',
  preferred_moods TEXT[] DEFAULT '{}',
  preferred_activities TEXT[] DEFAULT '{}',
  preferred_decades TEXT[] DEFAULT '{}',
  favorite_languages TEXT[] DEFAULT '{}',
  explicit_content BOOLEAN DEFAULT true,
  popularity_preference TEXT DEFAULT 'balanced' CHECK (popularity_preference IN ('mainstream', 'balanced', 'niche')),
  discovery_preference TEXT DEFAULT 'balanced' CHECK (discovery_preference IN ('familiar', 'balanced', 'discovery')),
  variety_preference TEXT DEFAULT 'balanced' CHECK (variety_preference IN ('consistent', 'balanced', 'varied')),
  artist_repetition TEXT DEFAULT 'balanced' CHECK (artist_repetition IN ('repeat', 'balanced', 'diverse')),
  genre_blending TEXT DEFAULT 'balanced' CHECK (genre_blending IN ('pure', 'balanced', 'blended')),
  preferred_energy REAL DEFAULT 0.5,
  preferred_danceability REAL DEFAULT 0.5,
  preferred_valence REAL DEFAULT 0.5,
  preferred_acousticness REAL DEFAULT 0.5,
  preferred_tempo_low INTEGER DEFAULT 80,
  preferred_tempo_high INTEGER DEFAULT 140,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Saved sessions table
CREATE TABLE public.saved_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  activity TEXT NOT NULL,
  mood TEXT NOT NULL,
  time_of_day TEXT NOT NULL,
  energy_level TEXT NOT NULL,
  seed_songs TEXT[] DEFAULT '{}',
  recommendation_mode TEXT DEFAULT 'session',
  generated_tracks JSONB NOT NULL DEFAULT '[]',
  feature_weights JSONB DEFAULT '[]',
  avg_score REAL,
  candidates_generated INTEGER,
  ranking_model TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions"
  ON public.saved_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own sessions"
  ON public.saved_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own sessions"
  ON public.saved_sessions FOR DELETE USING (auth.uid() = user_id);

-- Exported playlists table
CREATE TABLE public.exported_playlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.saved_sessions(id) ON DELETE SET NULL,
  platform TEXT NOT NULL,
  playlist_name TEXT NOT NULL,
  export_status TEXT NOT NULL DEFAULT 'pending' CHECK (export_status IN ('pending', 'success', 'failed')),
  external_url TEXT,
  track_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.exported_playlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own exports"
  ON public.exported_playlists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own exports"
  ON public.exported_playlists FOR INSERT WITH CHECK (auth.uid() = user_id);
