/**
 * Experimental ML Evaluation Page
 *
 * Runs offline evaluation of all recommendation models and displays
 * comparative metrics. This is the research/portfolio layer of SessionSense.
 */

import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Play, FlaskConical, AlertTriangle } from "lucide-react";
import { runExperiment, ExperimentResult } from "@/ml";

export default function Experiments() {
  const navigate = useNavigate();
  const [result, setResult] = useState<ExperimentResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = useCallback(() => {
    setIsRunning(true);
    // Use setTimeout to allow UI to update before computation
    setTimeout(() => {
      try {
        const experimentResult = runExperiment(200);
        setResult(experimentResult);
      } catch (err) {
        console.error("Experiment failed:", err);
      } finally {
        setIsRunning(false);
      }
    }, 50);
  }, []);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="p-2 rounded-lg hover:bg-surface-hover transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-accent" />
              <h1 className="text-lg font-semibold text-foreground">ML Experiments</h1>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Offline evaluation of recommendation models on synthetic session data
            </p>
          </div>
        </div>

        {/* Warning banner */}
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-accent/5 border border-accent/20">
          <AlertTriangle className="w-4 h-4 text-accent mt-0.5 shrink-0" />
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">Synthetic data disclaimer</p>
            <p>
              All metrics below are computed on synthetic sessions generated from a 48-track catalog.
              These results validate the evaluation pipeline but do NOT represent real-world model performance.
              Real evaluation requires the Spotify Million Playlist Dataset (~66M interactions).
            </p>
          </div>
        </div>

        {/* Run button */}
        <motion.button
          onClick={handleRun}
          disabled={isRunning}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-foreground text-primary-foreground font-medium text-sm disabled:opacity-70 transition-opacity"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
        >
          <Play className="w-4 h-4" />
          {isRunning ? "Running evaluation..." : "Run Experiment"}
        </motion.button>

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Data stats */}
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-3">Dataset Statistics</h2>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Catalog Size", value: result.dataStats.catalogSize },
                  { label: "Total Sessions", value: result.dataStats.totalSessions },
                  { label: "Train Sessions", value: result.dataStats.trainSessions },
                  { label: "Test Sessions", value: result.dataStats.testSessions },
                ].map((stat) => (
                  <div key={stat.label} className="p-3 rounded-xl bg-surface border border-border">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{stat.label}</div>
                    <div className="text-lg font-mono text-foreground mt-1">{stat.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Model comparison table */}
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-3">Model Comparison</h2>
              <div className="rounded-xl overflow-hidden border border-border">
                {/* Header */}
                <div className="grid grid-cols-[1fr_100px_100px_100px_100px_80px] gap-1 px-4 py-2.5 bg-surface text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
                  <span>Model</span>
                  <span className="text-right">NDCG@10</span>
                  <span className="text-right">Recall@10</span>
                  <span className="text-right">HitRate@10</span>
                  <span className="text-right">MAP@10</span>
                  <span className="text-right">Status</span>
                </div>

                {/* Rows */}
                {result.evaluations.map((ev, i) => (
                  <motion.div
                    key={ev.modelName}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="grid grid-cols-[1fr_100px_100px_100px_100px_80px] gap-1 px-4 py-3 items-center border-b border-border/50 last:border-0 hover:bg-surface-hover transition-colors"
                  >
                    <div>
                      <div className="text-sm font-medium text-foreground">{ev.modelName}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{ev.numExamples} examples</div>
                    </div>
                    <span className="text-xs font-mono text-right tabular-nums text-accent">
                      {ev.metrics.ndcg_at_10 !== null ? ev.metrics.ndcg_at_10.toFixed(4) : "—"}
                    </span>
                    <span className="text-xs font-mono text-right tabular-nums text-muted-foreground">
                      {ev.metrics.recall_at_10 !== null ? ev.metrics.recall_at_10.toFixed(4) : "—"}
                    </span>
                    <span className="text-xs font-mono text-right tabular-nums text-muted-foreground">
                      {ev.metrics.hitRate_at_10 !== null ? ev.metrics.hitRate_at_10.toFixed(4) : "—"}
                    </span>
                    <span className="text-xs font-mono text-right tabular-nums text-muted-foreground">
                      {ev.metrics.map_at_10 !== null ? ev.metrics.map_at_10.toFixed(4) : "—"}
                    </span>
                    <span className={`text-[10px] text-right font-mono ${
                      ev.status === "computed" ? "text-accent" : "text-muted-foreground"
                    }`}>
                      {ev.status}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Warnings */}
            {result.warnings.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-foreground mb-3">Caveats</h2>
                <ul className="space-y-2">
                  {result.warnings.map((w, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                      <span className="text-accent mt-0.5">•</span>
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Architecture notes */}
            <div className="p-4 rounded-xl bg-surface border border-border">
              <h3 className="text-xs font-semibold text-foreground mb-2">Architecture Notes</h3>
              <div className="text-xs text-muted-foreground space-y-1.5 font-mono leading-relaxed">
                <p>Evaluation protocol: Leave-one-out (predict last track from session history)</p>
                <p>Baselines: Popularity (global frequency), Item-KNN (co-occurrence cosine), Implicit ALS (matrix factorization)</p>
                <p>Sequence model: SASRec-style self-attention — currently using content-based embedding initialization (NOT trained)</p>
                <p>Loss function (planned): BPR with popularity-weighted negative sampling</p>
                <p>Next step: Train on Spotify Million Playlist Dataset with PyTorch, export weights for inference</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
