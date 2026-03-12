import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Save, BookOpen } from "lucide-react";
import { SessionContext, SessionPrediction } from "@/types/session";
import { profileToTaste } from "@/types/profile";
import { getRecommendations } from "@/services/recommendationService";
import { continuePlaylists } from "@/lib/continuation";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useSavedSessions } from "@/hooks/useSavedSessions";
import { useCatalogStatus } from "@/hooks/useCatalog";
import ContextPanel from "@/components/ContextPanel";
import InsightsPanel from "@/components/InsightsPanel";
import TrackTable from "@/components/TrackTable";
import SeedSongInput from "@/components/SeedSongInput";
import ExportPanel from "@/components/ExportPanel";
import { toast } from "sonner";

const Index = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const { saveSession } = useSavedSessions();
  const { stats: catalogStats, seeding } = useCatalogStatus();

  const [context, setContext] = useState<SessionContext>({
    mood: "energetic",
    activity: "workout",
    timeOfDay: "evening",
    energyLevel: "high",
  });

  const [prediction, setPrediction] = useState<SessionPrediction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"session" | "continuation">("session");

  const handleGenerate = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const taste = profile ? profileToTaste(profile) : undefined;
      const result = await getRecommendations(context, taste);
      setPrediction(result);
    } catch (err) {
      console.error("Prediction failed:", err);
      setError(err instanceof Error ? err.message : "Prediction failed");
    } finally {
      setIsLoading(false);
    }
  }, [context, profile]);

  const handleContinue = useCallback(async (seeds: string[]) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = continuePlaylists(seeds);
      setPrediction(result);
    } catch (err) {
      console.error("Continuation failed:", err);
      setError(err instanceof Error ? err.message : "Continuation failed");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!prediction || !user) {
      if (!user) toast.error("Sign in to save sessions");
      return;
    }
    const { error } = await saveSession(context, prediction, undefined, [], mode);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Session saved");
    }
  }, [prediction, user, context, mode, saveSession]);

  const hasProfile = !!(profile && (profile.favorite_genres?.length || profile.favorite_artists?.length));

  return (
    <div className="flex min-h-screen bg-background">
      <ContextPanel
        context={context}
        onContextChange={setContext}
        onGenerate={handleGenerate}
        isLoading={isLoading && mode === "session"}
        user={user}
        onSignOut={signOut}
        onNavigateProfile={() => navigate("/profile")}
        onNavigateAuth={() => navigate("/auth")}
        onNavigateExperiments={() => navigate("/experiments")}
        hasProfile={hasProfile}
        mode={mode}
        onModeChange={setMode}
        onNavigateHistory={() => navigate("/history")}
        catalogStats={catalogStats}
      />

      <main className="flex-1 min-h-screen overflow-y-auto p-8">
        {/* Seeding indicator */}
        {seeding && (
          <div className="mb-4 px-4 py-2 rounded-lg bg-accent/10 border border-accent/20 text-xs text-accent font-mono">
            Initializing catalog...
          </div>
        )}

        {error ? (
          <div className="h-full flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-2">
              <p className="text-sm text-destructive">{error}</p>
              <button onClick={handleGenerate} className="text-xs text-muted-foreground underline">Retry</button>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Seed song input for continuation mode */}
            {mode === "continuation" && (
              <SeedSongInput onContinue={handleContinue} isLoading={isLoading} />
            )}

            {prediction ? (
              <>
                {/* Action bar */}
                <div className="flex items-center justify-between">
                  <div />
                  <div className="flex items-center gap-2">
                    {user && (
                      <button
                        onClick={handleSave}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-hover border border-border text-xs text-foreground hover:bg-surface-active transition-colors"
                      >
                        <Save className="w-3.5 h-3.5" />
                        Save Session
                      </button>
                    )}
                    {user && (
                      <button
                        onClick={() => navigate("/history")}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-hover border border-border text-xs text-foreground hover:bg-surface-active transition-colors"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        History
                      </button>
                    )}
                  </div>
                </div>

                <InsightsPanel
                  sessionType={prediction.sessionType}
                  description={prediction.description}
                  featureWeights={prediction.featureWeights}
                  modelConfidence={prediction.modelConfidence}
                  candidatesGenerated={prediction.candidatesGenerated}
                  rankingModel={prediction.rankingModel}
                />
                <div className="h-px bg-border" />
                <TrackTable tracks={prediction.tracks} />
                <div className="h-px bg-border" />
                <ExportPanel tracks={prediction.tracks} sessionName={prediction.sessionType} />
              </>
            ) : mode === "session" ? (
              <div className="h-full flex items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-3">
                  <p className="text-sm text-muted-foreground">Configure session context and generate recommendations.</p>
                  <p className="text-xs font-mono text-muted-foreground/50">
                    {hasProfile
                      ? "personalized · heuristic-v1 · profile + session scoring"
                      : "heuristic-v1 · session-only · set up your taste profile for personalization"
                    }
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
