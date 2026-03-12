import { useState, useCallback } from "react";
import { SessionContext, SessionPrediction } from "@/types/session";
import { getRecommendations } from "@/services/recommendationService";
import ContextPanel from "@/components/ContextPanel";
import InsightsPanel from "@/components/InsightsPanel";
import TrackTable from "@/components/TrackTable";

const Index = () => {
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
      const result = await getRecommendations(context);
      setPrediction(result);
    } catch (err) {
      console.error("Prediction failed:", err);
      setError(err instanceof Error ? err.message : "Prediction failed");
    } finally {
      setIsLoading(false);
    }
  }, [context]);

  return (
    <div className="flex min-h-screen bg-background">
      <ContextPanel
        context={context}
        onContextChange={setContext}
        onGenerate={handleGenerate}
        isLoading={isLoading}
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
                Heuristic ranker · 48 tracks · genre-affinity retrieval
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
