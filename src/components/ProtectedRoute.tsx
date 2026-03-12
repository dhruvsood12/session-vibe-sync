import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { isSupabaseConfigured } from "@/integrations/supabase/client";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    // In demo mode we don't require auth.
    if (!isSupabaseConfigured) return <Navigate to="/" replace />;
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}
