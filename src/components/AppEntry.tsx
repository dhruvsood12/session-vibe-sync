import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { isSupabaseConfigured } from "@/integrations/supabase/client";
import { isProfileComplete } from "@/lib/profileCompleteness";
import Index from "@/pages/Index";

export default function AppEntry() {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();

  // Demo mode: allow direct app usage without auth.
  if (!isSupabaseConfigured) {
    return <Index />;
  }

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isProfileComplete(profile)) {
    return <Navigate to="/profile?onboarding=1" replace />;
  }

  return <Index />;
}

