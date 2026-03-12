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
