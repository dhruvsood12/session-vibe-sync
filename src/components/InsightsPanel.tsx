import { motion } from "framer-motion";
import { FeatureWeight } from "@/types/session";

interface InsightsPanelProps {
  sessionType: string;
  description: string;
  featureWeights: FeatureWeight[];
  modelConfidence: number;
  candidatesGenerated?: number;
  rankingModel?: string;
}

export default function InsightsPanel({
  sessionType,
  description,
  featureWeights,
  modelConfidence,
  candidatesGenerated,
  rankingModel,
}: InsightsPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="space-y-5"
    >
      <div className="flex items-baseline justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Ranking Output</h2>
          <p className="text-xs text-muted-foreground font-mono">{description}</p>
        </div>
        <div className="text-right space-y-0.5">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Avg Score</div>
          <div className="text-sm font-mono text-accent tabular-nums">{modelConfidence.toFixed(3)}</div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/20">
          <span className="text-xs font-medium text-accent">{sessionType}</span>
        </div>
        {rankingModel && (
          <div className="px-3 py-1.5 rounded-lg bg-surface-hover border border-border">
            <span className="text-xs font-mono text-muted-foreground">{rankingModel}</span>
          </div>
        )}
        {candidatesGenerated != null && (
          <div className="px-3 py-1.5 rounded-lg bg-surface-hover border border-border">
            <span className="text-xs font-mono text-muted-foreground">{candidatesGenerated} candidates</span>
          </div>
        )}
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Feature Contributions (weighted avg across top-K)</div>
        <div className="grid grid-cols-1 gap-2">
          {featureWeights.map((fw, i) => (
            <motion.div
              key={fw.label}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, type: "spring", stiffness: 400, damping: 30 }}
              className="flex items-center gap-3"
            >
              <span className="text-xs font-mono text-muted-foreground w-28 shrink-0 truncate">{fw.label}</span>
              <div className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-accent"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(Math.abs(fw.weight) / 0.1 * 100, 100)}%` }}
                  transition={{ delay: i * 0.04 + 0.1, duration: 0.4, ease: "easeOut" }}
                />
              </div>
              <span className="text-xs font-mono tabular-nums w-14 text-right text-muted-foreground">
                {fw.weight.toFixed(3)}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
