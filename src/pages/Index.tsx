import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { SessionContext, SessionPrediction } from "@/types/session";
import { profileToTaste } from "@/types/profile";
import { getRecommendations } from "@/services/recommendationService";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import ContextPanel from "@/components/ContextPanel";
import InsightsPanel from "@/components/InsightsPanel";
import TrackTable from "@/components/TrackTable";

const Index = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();

  const [context, setContext] = useState<SessionContext>({
    mood: "energetic",
    activity: "workout",
    timeOfDay: "evening",
    energyLevel: "high",
  });

  const [prediction, setPrediction] = useState<SessionPrediction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="flex min-h-screen bg-background">
      <ContextPanel
        context={context}
        onContextChange={setContext}
        onGenerate={handleGenerate}
        isLoading={isLoading}
        user={user}
        onSignOut={signOut}
        onNavigateProfile={() => navigate("/profile")}
        onNavigateAuth={() => navigate("/auth")}
        hasProfile={!!(profile && (profile.favorite_genres?.length || profile.favorite_artists?.length))}
      />

      <main className="flex-1 min-h-screen overflow-y-auto p-8">
        {error ? (
          <div className="h-full flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-2">
              <p className="text-sm text-destructive">{error}</p>
              <button onClick={handleGenerate} className="text-xs text-muted-foreground underline">
                Retry
              </button>
            </div>
          </div>
        ) : prediction ? (
          <div className="max-w-4xl mx-auto space-y-8">
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
          </div>
        ) : (
          <div className="h-full flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-3">
              <p className="text-sm text-muted-foreground">Configure session context and generate recommendations.</p>
              <p className="text-xs font-mono text-muted-foreground/50">
                {profile && (profile.favorite_genres?.length || profile.favorite_artists?.length)
                  ? "personalized · heuristic-v1 · profile + session scoring"
                  : "heuristic-v1 · session-only · set up your taste profile for personalization"
                }
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
