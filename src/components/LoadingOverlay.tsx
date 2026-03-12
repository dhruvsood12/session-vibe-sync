import { motion, AnimatePresence } from "framer-motion";

const steps = [
  "Extracting features...",
  "Computing vector similarity...",
  "Ranking candidates...",
  "Assembling session...",
];

interface LoadingOverlayProps {
  currentStep: number;
}

export default function LoadingOverlay({ currentStep }: LoadingOverlayProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6">
      <motion.div
        className="w-10 h-10 rounded-full border-2 border-accent/20 border-t-accent"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
      <div className="space-y-3 text-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={currentStep}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="text-sm font-mono text-foreground"
          >
            {steps[currentStep] || steps[0]}
          </motion.p>
        </AnimatePresence>
        <div className="flex gap-1.5 justify-center">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                i <= currentStep ? "bg-accent" : "bg-surface-hover"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
