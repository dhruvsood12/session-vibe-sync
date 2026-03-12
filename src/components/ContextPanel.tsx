import { motion } from "framer-motion";
import { Mood, Activity, TimeOfDay, EnergyLevel, SessionContext } from "@/types/session";
import { Zap, User as UserIcon, LogOut, LogIn, Clock, FlaskConical } from "lucide-react";
import { User } from "@supabase/supabase-js";

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
  user: User | null;
  onSignOut: () => void;
  onNavigateProfile: () => void;
  onNavigateAuth: () => void;
  onNavigateHistory: () => void;
  onNavigateExperiments: () => void;
  hasProfile: boolean;
  mode: "session" | "continuation";
  onModeChange: (mode: "session" | "continuation") => void;
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

export default function ContextPanel({
  context,
  onContextChange,
  onGenerate,
  isLoading,
  user,
  onSignOut,
  onNavigateProfile,
  onNavigateAuth,
  onNavigateHistory,
  onNavigateExperiments,
  hasProfile,
  mode,
  onModeChange,
}: ContextPanelProps) {
  return (
    <aside className="w-80 shrink-0 h-screen overflow-y-auto bg-surface shadow-surface p-5 flex flex-col gap-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-accent" />
            <h1 className="text-sm font-semibold tracking-tight text-foreground">SessionSense</h1>
          </div>
          {user ? (
            <div className="flex items-center gap-1">
              <button onClick={onNavigateExperiments} className="p-1.5 rounded-md hover:bg-surface-hover transition-colors" title="ML Experiments">
                <FlaskConical className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              <button onClick={onNavigateHistory} className="p-1.5 rounded-md hover:bg-surface-hover transition-colors" title="History">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              <button onClick={onNavigateProfile} className="p-1.5 rounded-md hover:bg-surface-hover transition-colors" title="Taste Profile">
                <UserIcon className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              <button onClick={onSignOut} className="p-1.5 rounded-md hover:bg-surface-hover transition-colors" title="Sign out">
                <LogOut className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          ) : (
            <button onClick={onNavigateAuth} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md hover:bg-surface-hover transition-colors">
              <LogIn className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Sign in</span>
            </button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Context-aware music recommendation</p>
      </div>

      {/* Profile nudge */}
      {user && !hasProfile && (
        <button
          onClick={onNavigateProfile}
          className="w-full px-3 py-2 rounded-lg bg-accent/10 border border-accent/20 text-xs text-accent text-left hover:bg-accent/15 transition-colors"
        >
          Set up your taste profile for personalized recommendations →
        </button>
      )}

      <div className="h-px bg-border" />

      {/* Mode selector */}
      <SegmentedControl
        label="Mode"
        options={[
          { value: "session" as const, label: "Session" },
          { value: "continuation" as const, label: "Continue" },
        ]}
        value={mode}
        onChange={(v) => onModeChange(v as "session" | "continuation")}
      />

      {/* Session context controls */}
      {mode === "session" && (
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
      )}

      {mode === "continuation" && (
        <div className="flex-1 flex items-center">
          <p className="text-xs text-muted-foreground">
            Search for seed songs in the main panel. The system will find similar tracks using content-based similarity scoring.
          </p>
        </div>
      )}

      {mode === "session" && (
        <motion.button
          onClick={onGenerate}
          disabled={isLoading}
          className="w-full h-10 rounded-lg bg-foreground text-primary-foreground font-medium text-sm disabled:opacity-70 transition-opacity"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
          {isLoading ? "Ranking..." : "Generate Session"}
        </motion.button>
      )}

      <div className="text-[10px] text-muted-foreground/50 font-mono">
        {mode === "continuation" ? "content-similarity-v1" : hasProfile ? "personalized · heuristic-v1" : "session-only · heuristic-v1"} · 48 tracks
      </div>
    </aside>
  );
}
