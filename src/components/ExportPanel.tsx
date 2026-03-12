import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Download, Check, Share2 } from "lucide-react";
import { Track } from "@/types/session";
import { toast } from "sonner";

interface ExportPanelProps {
  tracks: Track[];
  sessionName?: string;
}

export default function ExportPanel({ tracks, sessionName }: ExportPanelProps) {
  const [copied, setCopied] = useState(false);

  const trackListText = tracks
    .map((t, i) => `${i + 1}. ${t.title} — ${t.artist} (${t.album})`)
    .join("\n");

  const handleCopy = async () => {
    await navigator.clipboard.writeText(trackListText);
    setCopied(true);
    toast.success("Track list copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCSV = () => {
    const headers = "Title,Artist,Album,BPM,Energy,Duration,Genre,Match Score";
    const rows = tracks.map((t) =>
      `"${t.title}","${t.artist}","${t.album}",${t.bpm},${t.energy},"${t.duration}","${t.genre}",${t.matchScore}`
    );
    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${sessionName || "sessionsense-playlist"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV downloaded");
  };

  const handleJSON = () => {
    const data = {
      name: sessionName || "SessionSense Playlist",
      exported_at: new Date().toISOString(),
      track_count: tracks.length,
      tracks: tracks.map((t) => ({
        title: t.title,
        artist: t.artist,
        album: t.album,
        bpm: t.bpm,
        energy: t.energy,
        danceability: t.danceability,
        valence: t.valence,
        genre: t.genre,
        duration: t.duration,
        match_score: t.matchScore,
      })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${sessionName || "sessionsense-playlist"}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("JSON downloaded");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Export</h3>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-hover border border-border text-xs text-foreground hover:bg-surface-active transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied" : "Copy List"}
        </button>
        <button
          onClick={handleCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-hover border border-border text-xs text-foreground hover:bg-surface-active transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          CSV
        </button>
        <button
          onClick={handleJSON}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-hover border border-border text-xs text-foreground hover:bg-surface-active transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          JSON
        </button>
        <button
          disabled
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-hover border border-border text-xs text-muted-foreground opacity-50 cursor-not-allowed"
          title="Connect Spotify API to enable export"
        >
          <Share2 className="w-3.5 h-3.5" />
          Spotify (coming soon)
        </button>
      </div>
    </motion.div>
  );
}
