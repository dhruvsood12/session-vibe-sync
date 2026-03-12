import { motion } from "framer-motion";
import { Mood, Activity, TimeOfDay, EnergyLevel, SessionContext } from "@/types/session";
import { Zap } from "lucide-react";

interface SegmentedControlProps<T extends string> {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

function SegmentedControl<T extends string>({ label, options, value, onChange }: SegmentedControlProps<T>) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
      <div className="flex flex-wrap gap-1 rounded-xl bg-background p-1">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`relative flex-1 min-w-[calc(50%-2px)] px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
              value === option.value
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground/70"
            }`}
          >
            {value === option.value && (
              <motion.div
                layoutId={label}
                className="absolute inset-0 rounded-lg bg-surface-hover shadow-[0_1px_2px_rgba(0,0,0,0.3)]"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

interface ContextPanelProps {
  context: SessionContext;
  onContextChange: (context: SessionContext) => void;
  onGenerate: () => void;
  isLoading: boolean;
}

const moodOptions: { value: Mood; label: string }[] = [
  { value: "energetic", label: "Energetic" },
  { value: "chill", label: "Chill" },
  { value: "focused", label: "Focused" },
  { value: "melancholic", label: "Melancholic" },
];

const activityOptions: { value: Activity; label: string }[] = [
  { value: "workout", label: "Workout" },
  { value: "study", label: "Study" },
  { value: "commute", label: "Commute" },
  { value: "relax", label: "Relax" },
  { value: "work", label: "Work" },
  { value: "latenight", label: "Late Night" },
];

const timeOptions: { value: TimeOfDay; label: string }[] = [
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" },
  { value: "night", label: "Night" },
];

const energyOptions: { value: EnergyLevel; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export default function ContextPanel({ context, onContextChange, onGenerate, isLoading }: ContextPanelProps) {
  return (
    <aside className="w-80 shrink-0 h-screen overflow-y-auto bg-surface shadow-surface p-5 flex flex-col gap-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-accent" />
          <h1 className="text-sm font-semibold tracking-tight text-foreground">SessionSense</h1>
        </div>
        <p className="text-xs text-muted-foreground">Context-aware music recommendation</p>
      </div>

      <div className="h-px bg-border" />

      <div className="space-y-5 flex-1">
        <SegmentedControl
          label="Activity"
          options={activityOptions}
          value={context.activity}
          onChange={(v) => onContextChange({ ...context, activity: v })}
        />
        <SegmentedControl
          label="Mood"
          options={moodOptions}
          value={context.mood}
          onChange={(v) => onContextChange({ ...context, mood: v })}
        />
        <SegmentedControl
          label="Time of Day"
          options={timeOptions}
          value={context.timeOfDay}
          onChange={(v) => onContextChange({ ...context, timeOfDay: v })}
        />
        <SegmentedControl
          label="Energy Level"
          options={energyOptions}
          value={context.energyLevel}
          onChange={(v) => onContextChange({ ...context, energyLevel: v })}
        />
      </div>

      <motion.button
        onClick={onGenerate}
        disabled={isLoading}
        className="w-full h-10 rounded-lg bg-foreground text-primary-foreground font-medium text-sm disabled:opacity-70 transition-opacity"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <motion.span
              className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full inline-block"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
            />
            Generating...
          </span>
        ) : (
          "Generate Session"
        )}
      </motion.button>

      <div className="text-[10px] text-muted-foreground/50 font-mono">
        LightGBM v4.1 · Spotify MPD · 1M playlists
      </div>
    </aside>
  );
}
