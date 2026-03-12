export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      catalog_artists: {
        Row: {
          created_at: string
          followers: number | null
          genres: string[] | null
          id: string
          image_url: string | null
          name: string
          popularity: number | null
          spotify_artist_id: string | null
          spotify_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          followers?: number | null
          genres?: string[] | null
          id?: string
          image_url?: string | null
          name: string
          popularity?: number | null
          spotify_artist_id?: string | null
          spotify_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          followers?: number | null
          genres?: string[] | null
          id?: string
          image_url?: string | null
          name?: string
          popularity?: number | null
          spotify_artist_id?: string | null
          spotify_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      catalog_tracks: {
        Row: {
          acousticness: number | null
          album_image_url: string | null
          album_name: string | null
          artist_id: string | null
          artist_name: string
          bpm: number | null
          created_at: string
          danceability: number | null
          duration_ms: number | null
          energy: number | null
          enriched: boolean
          enriched_at: string | null
          explicit: boolean | null
          genre_tags: string[] | null
          id: string
          instrumentalness: number | null
          isrc: string | null
          key: number | null
          liveness: number | null
          loudness: number | null
          mode: number | null
          popularity: number | null
          preview_url: string | null
          source: string
          speechiness: number | null
          spotify_track_id: string | null
          spotify_url: string | null
          time_signature: number | null
          title: string
          updated_at: string
          valence: number | null
        }
        Insert: {
          acousticness?: number | null
          album_image_url?: string | null
          album_name?: string | null
          artist_id?: string | null
          artist_name: string
          bpm?: number | null
          created_at?: string
          danceability?: number | null
          duration_ms?: number | null
          energy?: number | null
          enriched?: boolean
          enriched_at?: string | null
          explicit?: boolean | null
          genre_tags?: string[] | null
          id?: string
          instrumentalness?: number | null
          isrc?: string | null
          key?: number | null
          liveness?: number | null
          loudness?: number | null
          mode?: number | null
          popularity?: number | null
          preview_url?: string | null
          source?: string
          speechiness?: number | null
          spotify_track_id?: string | null
          spotify_url?: string | null
          time_signature?: number | null
          title: string
          updated_at?: string
          valence?: number | null
        }
        Update: {
          acousticness?: number | null
          album_image_url?: string | null
          album_name?: string | null
          artist_id?: string | null
          artist_name?: string
          bpm?: number | null
          created_at?: string
          danceability?: number | null
          duration_ms?: number | null
          energy?: number | null
          enriched?: boolean
          enriched_at?: string | null
          explicit?: boolean | null
          genre_tags?: string[] | null
          id?: string
          instrumentalness?: number | null
          isrc?: string | null
          key?: number | null
          liveness?: number | null
          loudness?: number | null
          mode?: number | null
          popularity?: number | null
          preview_url?: string | null
          source?: string
          speechiness?: number | null
          spotify_track_id?: string | null
          spotify_url?: string | null
          time_signature?: number | null
          title?: string
          updated_at?: string
          valence?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "catalog_tracks_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "catalog_artists"
            referencedColumns: ["id"]
          },
        ]
      }
      exported_playlists: {
        Row: {
          created_at: string
          export_status: string
          external_url: string | null
          id: string
          platform: string
          playlist_name: string
          session_id: string | null
          track_count: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          export_status?: string
          external_url?: string | null
          id?: string
          platform: string
          playlist_name: string
          session_id?: string | null
          track_count?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          export_status?: string
          external_url?: string | null
          id?: string
          platform?: string
          playlist_name?: string
          session_id?: string | null
          track_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exported_playlists_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "saved_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      imported_playlists: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          import_status: string
          imported_at: string | null
          name: string
          spotify_playlist_id: string | null
          track_count: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          import_status?: string
          imported_at?: string | null
          name: string
          spotify_playlist_id?: string | null
          track_count?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          import_status?: string
          imported_at?: string | null
          name?: string
          spotify_playlist_id?: string | null
          track_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          all_time_songs: string[] | null
          artist_repetition: string | null
          avatar_url: string | null
          created_at: string
          discovery_preference: string | null
          display_name: string | null
          explicit_content: boolean | null
          favorite_artists: string[] | null
          favorite_genres: string[] | null
          favorite_languages: string[] | null
          genre_blending: string | null
          id: string
          popularity_preference: string | null
          preferred_acousticness: number | null
          preferred_activities: string[] | null
          preferred_danceability: number | null
          preferred_decades: string[] | null
          preferred_energy: number | null
          preferred_moods: string[] | null
          preferred_tempo_high: number | null
          preferred_tempo_low: number | null
          preferred_valence: number | null
          top_songs: string[] | null
          updated_at: string
          user_id: string
          variety_preference: string | null
        }
        Insert: {
          all_time_songs?: string[] | null
          artist_repetition?: string | null
          avatar_url?: string | null
          created_at?: string
          discovery_preference?: string | null
          display_name?: string | null
          explicit_content?: boolean | null
          favorite_artists?: string[] | null
          favorite_genres?: string[] | null
          favorite_languages?: string[] | null
          genre_blending?: string | null
          id?: string
          popularity_preference?: string | null
          preferred_acousticness?: number | null
          preferred_activities?: string[] | null
          preferred_danceability?: number | null
          preferred_decades?: string[] | null
          preferred_energy?: number | null
          preferred_moods?: string[] | null
          preferred_tempo_high?: number | null
          preferred_tempo_low?: number | null
          preferred_valence?: number | null
          top_songs?: string[] | null
          updated_at?: string
          user_id: string
          variety_preference?: string | null
        }
        Update: {
          all_time_songs?: string[] | null
          artist_repetition?: string | null
          avatar_url?: string | null
          created_at?: string
          discovery_preference?: string | null
          display_name?: string | null
          explicit_content?: boolean | null
          favorite_artists?: string[] | null
          favorite_genres?: string[] | null
          favorite_languages?: string[] | null
          genre_blending?: string | null
          id?: string
          popularity_preference?: string | null
          preferred_acousticness?: number | null
          preferred_activities?: string[] | null
          preferred_danceability?: number | null
          preferred_decades?: string[] | null
          preferred_energy?: number | null
          preferred_moods?: string[] | null
          preferred_tempo_high?: number | null
          preferred_tempo_low?: number | null
          preferred_valence?: number | null
          top_songs?: string[] | null
          updated_at?: string
          user_id?: string
          variety_preference?: string | null
        }
        Relationships: []
      }
      recommendation_logs: {
        Row: {
          context_activity: string | null
          context_energy: string | null
          context_mood: string | null
          created_at: string
          feedback: string | null
          id: string
          match_score: number | null
          rank_position: number | null
          ranking_model: string | null
          session_id: string | null
          track_id: string | null
          user_id: string | null
        }
        Insert: {
          context_activity?: string | null
          context_energy?: string | null
          context_mood?: string | null
          created_at?: string
          feedback?: string | null
          id?: string
          match_score?: number | null
          rank_position?: number | null
          ranking_model?: string | null
          session_id?: string | null
          track_id?: string | null
          user_id?: string | null
        }
        Update: {
          context_activity?: string | null
          context_energy?: string | null
          context_mood?: string | null
          created_at?: string
          feedback?: string | null
          id?: string
          match_score?: number | null
          rank_position?: number | null
          ranking_model?: string | null
          session_id?: string | null
          track_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recommendation_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "saved_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendation_logs_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "catalog_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_sessions: {
        Row: {
          activity: string
          avg_score: number | null
          candidates_generated: number | null
          created_at: string
          energy_level: string
          feature_weights: Json | null
          generated_tracks: Json
          id: string
          mood: string
          name: string | null
          ranking_model: string | null
          recommendation_mode: string | null
          seed_songs: string[] | null
          time_of_day: string
          user_id: string
        }
        Insert: {
          activity: string
          avg_score?: number | null
          candidates_generated?: number | null
          created_at?: string
          energy_level: string
          feature_weights?: Json | null
          generated_tracks?: Json
          id?: string
          mood: string
          name?: string | null
          ranking_model?: string | null
          recommendation_mode?: string | null
          seed_songs?: string[] | null
          time_of_day: string
          user_id: string
        }
        Update: {
          activity?: string
          avg_score?: number | null
          candidates_generated?: number | null
          created_at?: string
          energy_level?: string
          feature_weights?: Json | null
          generated_tracks?: Json
          id?: string
          mood?: string
          name?: string | null
          ranking_model?: string | null
          recommendation_mode?: string | null
          seed_songs?: string[] | null
          time_of_day?: string
          user_id?: string
        }
        Relationships: []
      }
      user_saved_tracks: {
        Row: {
          added_at: string | null
          id: string
          source: string
          track_id: string
          user_id: string
        }
        Insert: {
          added_at?: string | null
          id?: string
          source?: string
          track_id: string
          user_id: string
        }
        Update: {
          added_at?: string | null
          id?: string
          source?: string
          track_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_saved_tracks_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "catalog_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
