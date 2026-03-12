import { useState } from "react";
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { Track } from "@/types/session";

interface TrackTableProps {
  tracks: Track[];
}

export default function TrackTable({ tracks }: TrackTableProps) {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.15 }}
      className="space-y-3"
    >
      <h2 className="text-lg font-semibold tracking-tight text-foreground">Tracklist</h2>

      <div className="rounded-xl overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[40px_1fr_72px_72px_80px_72px] gap-2 px-4 py-2 text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border/50">
          <span>#</span>
          <span>Title</span>
          <span className="text-right">BPM</span>
          <span className="text-right">Energy</span>
          <span className="text-right">Match</span>
          <span className="text-right">Duration</span>
        </div>

        {/* Rows */}
        {tracks.map((track, i) => (
          <motion.div
            key={track.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.06, type: "spring", stiffness: 400, damping: 30 }}
            onMouseEnter={() => setHoveredRow(track.id)}
            onMouseLeave={() => setHoveredRow(null)}
            className="grid grid-cols-[40px_1fr_72px_72px_80px_72px] gap-2 px-4 py-2.5 items-center transition-colors rounded-lg hover:bg-surface-hover group cursor-default"
          >
            {/* Index / Play */}
            <span className="text-sm font-mono text-muted-foreground tabular-nums">
              {hoveredRow === track.id ? (
                <Play className="w-3.5 h-3.5 text-foreground fill-foreground" />
              ) : (
                i + 1
              )}
            </span>

            {/* Title + Artist */}
            <div className="min-w-0">
              <div className="text-sm font-medium text-foreground truncate leading-tight">{track.title}</div>
              <div className="text-xs text-muted-foreground truncate">{track.artist}</div>
            </div>

            {/* BPM */}
            <span className="text-xs font-mono text-muted-foreground tabular-nums text-right">{track.bpm}</span>

            {/* Energy */}
            <span className="text-xs font-mono text-muted-foreground tabular-nums text-right">{track.energy.toFixed(2)}</span>

            {/* Match Score */}
            <span className="text-xs font-mono text-accent tabular-nums text-right">{track.matchScore.toFixed(2)}</span>

            {/* Duration */}
            <span className="text-xs font-mono text-muted-foreground tabular-nums text-right">{track.duration}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
