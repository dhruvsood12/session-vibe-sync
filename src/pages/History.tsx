import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Trash2, Play, Clock } from "lucide-react";
import { useSavedSessions } from "@/hooks/useSavedSessions";
import type { Track } from "@/types/session";

export default function History() {
  const navigate = useNavigate();
  const { sessions, loading, fetchSessions, deleteSession } = useSavedSessions();

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="p-2 rounded-lg hover:bg-surface-hover transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Session History</h1>
            <p className="text-xs text-muted-foreground">Your saved recommendation sessions</p>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : sessions.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <Clock className="w-8 h-8 text-muted-foreground/30 mx-auto" />
            <p className="text-sm text-muted-foreground">No saved sessions yet</p>
            <p className="text-xs text-muted-foreground/60">Generate a session and save it to see it here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => {
              const tracks = (session.generated_tracks as unknown as Track[]) || [];
              const date = new Date(session.created_at);

              return (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl bg-surface border border-border p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-foreground">
                        {session.name || `${session.mood} ${session.activity}`}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {session.ranking_model || "heuristic-v1"}
                        </span>
                        <span className="text-[10px] text-muted-foreground">·</span>
                        <span className="text-[10px] text-muted-foreground">
                          {tracks.length} tracks
                        </span>
                        <span className="text-[10px] text-muted-foreground">·</span>
                        <span className="text-[10px] text-muted-foreground">
                          {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => navigate(`/?restore=${session.id}`)}
                        className="p-1.5 rounded-md hover:bg-surface-hover transition-colors"
                        title="Rerun session"
                      >
                        <Play className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => deleteSession(session.id)}
                        className="p-1.5 rounded-md hover:bg-surface-hover transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  </div>

                  {/* Context chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {[session.activity, session.mood, session.time_of_day, session.energy_level].map((tag) => (
                      <span key={tag} className="px-2 py-0.5 rounded-md bg-surface-hover text-[10px] text-muted-foreground border border-border">
                        {tag}
                      </span>
                    ))}
                    {session.recommendation_mode && session.recommendation_mode !== "session" && (
                      <span className="px-2 py-0.5 rounded-md bg-accent/10 text-[10px] text-accent border border-accent/20">
                        {session.recommendation_mode}
                      </span>
                    )}
                  </div>

                  {/* Track preview */}
                  <div className="space-y-1">
                    {tracks.slice(0, 3).map((track, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-mono text-muted-foreground/50 w-4">{i + 1}</span>
                        <span className="text-foreground">{track.title}</span>
                        <span>—</span>
                        <span>{track.artist}</span>
                      </div>
                    ))}
                    {tracks.length > 3 && (
                      <span className="text-[10px] text-muted-foreground/50 pl-6">
                        +{tracks.length - 3} more
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
