import { useState, useCallback, useEffect, useRef } from "react";
import { SessionContext, SessionPrediction } from "@/types/session";
import { generatePrediction } from "@/data/mockData";
import ContextPanel from "@/components/ContextPanel";
import InsightsPanel from "@/components/InsightsPanel";
import TrackTable from "@/components/TrackTable";
import LoadingOverlay from "@/components/LoadingOverlay";

const Index = () => {
  const [context, setContext] = useState<SessionContext>({
    mood: "energetic",
    activity: "workout",
    timeOfDay: "evening",
    energyLevel: "high",
  });

  const [prediction, setPrediction] = useState<SessionPrediction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleGenerate = useCallback(() => {
    setIsLoading(true);
    setLoadingStep(0);
    setPrediction(null);

    // Clear any previous interval
    if (intervalRef.current) clearInterval(intervalRef.current);

    let step = 0;
    intervalRef.current = setInterval(() => {
      step++;
      if (step >= 4) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        const result = generatePrediction(context);
        setPrediction(result);
        setIsLoading(false);
      } else {
        setLoadingStep(step);
      }
    }, 600);
  }, [context]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <ContextPanel
        context={context}
        onContextChange={setContext}
        onGenerate={handleGenerate}
        isLoading={isLoading}
      />

      <main className="flex-1 min-h-screen overflow-y-auto p-8">
        {isLoading ? (
          <div className="h-full flex items-center justify-center min-h-[60vh]">
            <LoadingOverlay currentStep={loadingStep} />
          </div>
        ) : prediction ? (
          <div className="max-w-4xl mx-auto space-y-8">
            <InsightsPanel
              sessionType={prediction.sessionType}
              description={prediction.description}
              featureWeights={prediction.featureWeights}
              modelConfidence={prediction.modelConfidence}
            />
            <div className="h-px bg-border" />
            <TrackTable tracks={prediction.tracks} />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-3">
              <p className="text-sm text-muted-foreground">Configure session context and generate recommendations.</p>
              <p className="text-xs font-mono text-muted-foreground/50">LightGBM ranking model · Spotify MPD features</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
