import { motion } from "framer-motion";
import { FeatureWeight } from "@/types/session";

interface InsightsPanelProps {
  sessionType: string;
  description: string;
  featureWeights: FeatureWeight[];
  modelConfidence: number;
}

export default function InsightsPanel({ sessionType, description, featureWeights, modelConfidence }: InsightsPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="space-y-5"
    >
      <div className="flex items-baseline justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Listening Insights</h2>
          <p className="text-xs text-muted-foreground font-mono">{description}</p>
        </div>
        <div className="text-right space-y-0.5">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Confidence</div>
          <div className="text-sm font-mono text-accent tabular-nums">{modelConfidence.toFixed(3)}</div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/20">
          <span className="text-xs font-medium text-accent">Predicted: {sessionType}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        {featureWeights.map((fw, i) => (
          <motion.div
            key={fw.label}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05, type: "spring", stiffness: 400, damping: 30 }}
            className="flex items-center gap-3"
          >
            <span className="text-xs font-mono text-muted-foreground w-36 shrink-0 truncate">{fw.label}</span>
            <div className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${fw.direction === "positive" ? "bg-accent" : "bg-destructive/60"}`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.abs(fw.weight) * 100}%` }}
                transition={{ delay: i * 0.05 + 0.1, duration: 0.4, ease: "easeOut" }}
              />
            </div>
            <span className={`text-xs font-mono tabular-nums w-12 text-right ${
              fw.direction === "positive" ? "text-accent" : "text-destructive/80"
            }`}>
              {fw.direction === "positive" ? "+" : ""}{fw.weight.toFixed(2)}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
