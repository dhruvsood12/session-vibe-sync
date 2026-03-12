import { useState, useEffect, useCallback } from "react";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Tables, TablesUpdate } from "@/integrations/supabase/types";

export type Profile = Tables<"profiles">;
export type ProfileUpdate = TablesUpdate<"profiles">;

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    if (!isSupabaseConfigured || !supabase) {
      setError("Profiles are disabled (Supabase is not configured)");
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error) {
      setError(error.message);
    } else {
      setProfile(data);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = useCallback(async (updates: ProfileUpdate) => {
    if (!user) return { error: new Error("Not authenticated") };
    if (!isSupabaseConfigured || !supabase) {
      return { error: new Error("Profiles are disabled (Supabase is not configured)") };
    }

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      return { error: new Error(error.message) };
    }
    setProfile(data);
    return { error: null };
  }, [user]);

  return { profile, loading, error, updateProfile, refetch: fetchProfile };
}
