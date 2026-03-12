import { useState, useCallback } from "react";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Tables } from "@/integrations/supabase/types";
import type { SessionPrediction, SessionContext } from "@/types/session";

export type SavedSession = Tables<"saved_sessions">;

export function useSavedSessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSessions = useCallback(async () => {
    if (!user) return;
    if (!isSupabaseConfigured || !supabase) return;
    setLoading(true);
    const { data } = await supabase
      .from("saved_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    setSessions(data || []);
    setLoading(false);
  }, [user]);

  const saveSession = useCallback(async (
    context: SessionContext,
    prediction: SessionPrediction,
    name?: string,
    seedSongs?: string[],
    mode?: string,
  ) => {
    if (!user) return { error: new Error("Not authenticated") };
    if (!isSupabaseConfigured || !supabase) {
      return { error: new Error("Saving is disabled (Supabase is not configured)") };
    }

    const { error } = await supabase.from("saved_sessions").insert({
      user_id: user.id,
      name: name || `${prediction.sessionType} · ${new Date().toLocaleDateString()}`,
      activity: context.activity,
      mood: context.mood,
      time_of_day: context.timeOfDay,
      energy_level: context.energyLevel,
      seed_songs: seedSongs || [],
      recommendation_mode: mode || "session",
      generated_tracks: JSON.parse(JSON.stringify(prediction.tracks)),
      feature_weights: JSON.parse(JSON.stringify(prediction.featureWeights)),
      avg_score: prediction.modelConfidence,
      candidates_generated: prediction.candidatesGenerated || 0,
      ranking_model: prediction.rankingModel || "heuristic-v1",
    });

    if (error) return { error: new Error(error.message) };
    await fetchSessions();
    return { error: null };
  }, [user, fetchSessions]);

  const deleteSession = useCallback(async (id: string) => {
    if (!user) return;
    if (!isSupabaseConfigured || !supabase) return;
    await supabase.from("saved_sessions").delete().eq("id", id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
  }, [user]);

  return { sessions, loading, fetchSessions, saveSession, deleteSession };
}
