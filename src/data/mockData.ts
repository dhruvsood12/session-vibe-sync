import { SessionContext, SessionPrediction } from "@/types/session";

const trackDatabase = {
  workout: [
    { id: 1, title: "Power", artist: "Kanye West", album: "My Beautiful Dark Twisted Fantasy", bpm: 152, energy: 0.89, matchScore: 0.96, duration: "4:52", genre: "Hip-Hop", danceability: 0.72, valence: 0.63 },
    { id: 2, title: "FE!N", artist: "Travis Scott", album: "UTOPIA", bpm: 146, energy: 0.91, matchScore: 0.94, duration: "3:31", genre: "Hip-Hop", danceability: 0.68, valence: 0.41 },
    { id: 3, title: "Nonstop", artist: "Drake", album: "Scorpion", bpm: 134, energy: 0.85, matchScore: 0.91, duration: "3:58", genre: "Hip-Hop", danceability: 0.77, valence: 0.52 },
    { id: 4, title: "Superhero", artist: "Metro Boomin", album: "Heroes & Villains", bpm: 141, energy: 0.87, matchScore: 0.89, duration: "3:42", genre: "Hip-Hop", danceability: 0.71, valence: 0.48 },
    { id: 5, title: "HUMBLE.", artist: "Kendrick Lamar", album: "DAMN.", bpm: 150, energy: 0.93, matchScore: 0.87, duration: "2:57", genre: "Hip-Hop", danceability: 0.83, valence: 0.56 },
    { id: 6, title: "Blinding Lights", artist: "The Weeknd", album: "After Hours", bpm: 171, energy: 0.79, matchScore: 0.85, duration: "3:20", genre: "Synth-Pop", danceability: 0.81, valence: 0.67 },
    { id: 7, title: "Stronger", artist: "Kanye West", album: "Graduation", bpm: 104, energy: 0.82, matchScore: 0.83, duration: "5:12", genre: "Hip-Hop", danceability: 0.73, valence: 0.54 },
    { id: 8, title: "Till I Collapse", artist: "Eminem", album: "The Eminem Show", bpm: 171, energy: 0.95, matchScore: 0.81, duration: "4:57", genre: "Hip-Hop", danceability: 0.61, valence: 0.35 },
  ],
  study: [
    { id: 9, title: "Intro", artist: "The xx", album: "xx", bpm: 100, energy: 0.28, matchScore: 0.95, duration: "2:07", genre: "Indie", danceability: 0.42, valence: 0.31 },
    { id: 10, title: "Nuvole Bianche", artist: "Ludovico Einaudi", album: "Una Mattina", bpm: 67, energy: 0.15, matchScore: 0.93, duration: "5:57", genre: "Classical", danceability: 0.18, valence: 0.22 },
    { id: 11, title: "Weightless", artist: "Marconi Union", album: "Weightless", bpm: 60, energy: 0.12, matchScore: 0.91, duration: "8:09", genre: "Ambient", danceability: 0.11, valence: 0.18 },
    { id: 12, title: "Avril 14th", artist: "Aphex Twin", album: "Drukqs", bpm: 82, energy: 0.19, matchScore: 0.89, duration: "2:05", genre: "Electronic", danceability: 0.23, valence: 0.28 },
    { id: 13, title: "Gymnopédie No.1", artist: "Erik Satie", album: "Gymnopédies", bpm: 68, energy: 0.11, matchScore: 0.87, duration: "3:29", genre: "Classical", danceability: 0.14, valence: 0.25 },
    { id: 14, title: "An Ending", artist: "Brian Eno", album: "Apollo", bpm: 72, energy: 0.13, matchScore: 0.85, duration: "4:17", genre: "Ambient", danceability: 0.09, valence: 0.19 },
    { id: 15, title: "Flim", artist: "Aphex Twin", album: "Come to Daddy", bpm: 92, energy: 0.21, matchScore: 0.82, duration: "2:54", genre: "Electronic", danceability: 0.31, valence: 0.34 },
    { id: 16, title: "Holocene", artist: "Bon Iver", album: "Bon Iver", bpm: 108, energy: 0.32, matchScore: 0.80, duration: "5:36", genre: "Indie Folk", danceability: 0.28, valence: 0.21 },
  ],
  commute: [
    { id: 17, title: "Everything In Its Right Place", artist: "Radiohead", album: "Kid A", bpm: 122, energy: 0.52, matchScore: 0.94, duration: "4:11", genre: "Art Rock", danceability: 0.45, valence: 0.35 },
    { id: 18, title: "Genesis", artist: "Grimes", album: "Visions", bpm: 128, energy: 0.61, matchScore: 0.91, duration: "4:14", genre: "Electronic", danceability: 0.58, valence: 0.42 },
    { id: 19, title: "Night Owl", artist: "Gerry Rafferty", album: "Night Owl", bpm: 112, energy: 0.48, matchScore: 0.88, duration: "4:49", genre: "Soft Rock", danceability: 0.51, valence: 0.55 },
    { id: 20, title: "Pink + White", artist: "Frank Ocean", album: "Blonde", bpm: 98, energy: 0.44, matchScore: 0.86, duration: "3:04", genre: "R&B", danceability: 0.47, valence: 0.48 },
    { id: 21, title: "Electric Feel", artist: "MGMT", album: "Oracular Spectacular", bpm: 120, energy: 0.63, matchScore: 0.84, duration: "3:49", genre: "Indie Pop", danceability: 0.72, valence: 0.61 },
    { id: 22, title: "Midnight City", artist: "M83", album: "Hurry Up, We're Dreaming", bpm: 105, energy: 0.71, matchScore: 0.82, duration: "4:03", genre: "Synth-Pop", danceability: 0.64, valence: 0.58 },
    { id: 23, title: "Let It Happen", artist: "Tame Impala", album: "Currents", bpm: 118, energy: 0.56, matchScore: 0.80, duration: "7:47", genre: "Psychedelic Rock", danceability: 0.52, valence: 0.44 },
    { id: 24, title: "Dissolve", artist: "Absofacto", album: "Thousand Peaces", bpm: 96, energy: 0.39, matchScore: 0.78, duration: "3:28", genre: "Indie Pop", danceability: 0.49, valence: 0.39 },
  ],
  relax: [
    { id: 25, title: "Sunset Lover", artist: "Petit Biscuit", album: "Petit Biscuit", bpm: 85, energy: 0.31, matchScore: 0.96, duration: "3:43", genre: "Electronic", danceability: 0.44, valence: 0.52 },
    { id: 26, title: "Skinny Love", artist: "Bon Iver", album: "For Emma, Forever Ago", bpm: 76, energy: 0.24, matchScore: 0.93, duration: "3:58", genre: "Indie Folk", danceability: 0.31, valence: 0.19 },
    { id: 27, title: "Re: Stacks", artist: "Bon Iver", album: "For Emma, Forever Ago", bpm: 72, energy: 0.18, matchScore: 0.91, duration: "6:41", genre: "Indie Folk", danceability: 0.22, valence: 0.15 },
    { id: 28, title: "Saturn", artist: "SZA", album: "SOS", bpm: 88, energy: 0.35, matchScore: 0.89, duration: "3:25", genre: "R&B", danceability: 0.48, valence: 0.41 },
    { id: 29, title: "Breathe Me", artist: "Sia", album: "Colour the Small One", bpm: 82, energy: 0.27, matchScore: 0.86, duration: "4:34", genre: "Art Pop", danceability: 0.29, valence: 0.23 },
    { id: 30, title: "Cherry Wine", artist: "Hozier", album: "Hozier", bpm: 80, energy: 0.22, matchScore: 0.84, duration: "4:13", genre: "Indie Folk", danceability: 0.34, valence: 0.27 },
    { id: 31, title: "Redbone", artist: "Childish Gambino", album: "Awaken My Love", bpm: 81, energy: 0.42, matchScore: 0.82, duration: "5:27", genre: "Funk", danceability: 0.55, valence: 0.44 },
    { id: 32, title: "Myth", artist: "Beach House", album: "Bloom", bpm: 94, energy: 0.38, matchScore: 0.80, duration: "4:18", genre: "Dream Pop", danceability: 0.41, valence: 0.36 },
  ],
  work: [
    { id: 33, title: "Resonance", artist: "HOME", album: "Odyssey", bpm: 108, energy: 0.45, matchScore: 0.94, duration: "3:32", genre: "Synthwave", danceability: 0.52, valence: 0.48 },
    { id: 34, title: "Tadow", artist: "Masego & FKJ", album: "Tadow", bpm: 98, energy: 0.51, matchScore: 0.91, duration: "5:48", genre: "Jazz Fusion", danceability: 0.61, valence: 0.55 },
    { id: 35, title: "Coffee", artist: "Sylvan Esso", album: "Sylvan Esso", bpm: 118, energy: 0.55, matchScore: 0.88, duration: "3:31", genre: "Indie Pop", danceability: 0.64, valence: 0.52 },
    { id: 36, title: "Get Lucky", artist: "Daft Punk", album: "Random Access Memories", bpm: 116, energy: 0.58, matchScore: 0.86, duration: "6:09", genre: "Disco", danceability: 0.78, valence: 0.71 },
    { id: 37, title: "Deadcrush", artist: "alt-J", album: "Relaxer", bpm: 110, energy: 0.49, matchScore: 0.84, duration: "3:49", genre: "Indie Rock", danceability: 0.53, valence: 0.39 },
    { id: 38, title: "Warm On A Cold Night", artist: "HONNE", album: "Warm On A Cold Night", bpm: 102, energy: 0.43, matchScore: 0.82, duration: "4:17", genre: "Electronic R&B", danceability: 0.57, valence: 0.46 },
    { id: 39, title: "Ivy", artist: "Frank Ocean", album: "Blonde", bpm: 94, energy: 0.38, matchScore: 0.80, duration: "4:09", genre: "R&B", danceability: 0.42, valence: 0.31 },
    { id: 40, title: "Feels Like We Only Go Backwards", artist: "Tame Impala", album: "Lonerism", bpm: 104, energy: 0.47, matchScore: 0.78, duration: "3:12", genre: "Psychedelic Rock", danceability: 0.49, valence: 0.44 },
  ],
  latenight: [
    { id: 41, title: "Nightcall", artist: "Kavinsky", album: "OutRun", bpm: 96, energy: 0.55, matchScore: 0.96, duration: "4:17", genre: "Synthwave", danceability: 0.62, valence: 0.38 },
    { id: 42, title: "After Dark", artist: "Mr.Kitty", album: "Time", bpm: 108, energy: 0.48, matchScore: 0.93, duration: "4:18", genre: "Darkwave", danceability: 0.55, valence: 0.29 },
    { id: 43, title: "Nights", artist: "Frank Ocean", album: "Blonde", bpm: 90, energy: 0.42, matchScore: 0.91, duration: "5:07", genre: "R&B", danceability: 0.47, valence: 0.32 },
    { id: 44, title: "Self Control", artist: "Frank Ocean", album: "Blonde", bpm: 74, energy: 0.31, matchScore: 0.89, duration: "4:09", genre: "R&B", danceability: 0.35, valence: 0.18 },
    { id: 45, title: "Pyramids", artist: "Frank Ocean", album: "Channel Orange", bpm: 86, energy: 0.52, matchScore: 0.87, duration: "9:52", genre: "R&B", danceability: 0.51, valence: 0.35 },
    { id: 46, title: "The Less I Know The Better", artist: "Tame Impala", album: "Currents", bpm: 116, energy: 0.58, matchScore: 0.85, duration: "3:36", genre: "Psychedelic Pop", danceability: 0.72, valence: 0.59 },
    { id: 47, title: "Novacane", artist: "Frank Ocean", album: "Nostalgia, Ultra", bpm: 98, energy: 0.45, matchScore: 0.83, duration: "5:01", genre: "R&B", danceability: 0.49, valence: 0.28 },
    { id: 48, title: "505", artist: "Arctic Monkeys", album: "Favourite Worst Nightmare", bpm: 138, energy: 0.67, matchScore: 0.81, duration: "4:13", genre: "Indie Rock", danceability: 0.44, valence: 0.31 },
  ],
};

const sessionLabels: Record<string, Record<string, string>> = {
  workout: { energetic: "High-Energy Workout", chill: "Light Training", focused: "Intense Training", melancholic: "Solo Cardio" },
  study: { energetic: "Active Study", chill: "Deep Focus Study", focused: "Concentration Session", melancholic: "Reflective Study" },
  commute: { energetic: "Morning Commute", chill: "Evening Commute", focused: "Transit Focus", melancholic: "Rainy Day Commute" },
  relax: { energetic: "Casual Hangout", chill: "Deep Relaxation", focused: "Mindful Rest", melancholic: "Introspective Evening" },
  work: { energetic: "Productivity Boost", chill: "Background Work", focused: "Deep Work Session", melancholic: "Late Office Hours" },
  latenight: { energetic: "Late Night Drive", chill: "Wind Down", focused: "Night Owl Session", melancholic: "Midnight Reflection" },
};

const featureWeightsByActivity: Record<string, FeatureWeight[]> = {
  workout: [
    { label: "Tempo > 120 BPM", weight: 0.42, direction: "positive" },
    { label: "Energy Score", weight: 0.38, direction: "positive" },
    { label: "Danceability", weight: 0.31, direction: "positive" },
    { label: "Valence (Positivity)", weight: 0.22, direction: "positive" },
    { label: "Hip-Hop Genre Affinity", weight: 0.19, direction: "positive" },
    { label: "Acousticness", weight: -0.28, direction: "negative" },
  ],
  study: [
    { label: "Acousticness", weight: 0.45, direction: "positive" },
    { label: "Low Energy Score", weight: 0.39, direction: "positive" },
    { label: "Instrumentalness", weight: 0.35, direction: "positive" },
    { label: "Tempo < 100 BPM", weight: 0.28, direction: "positive" },
    { label: "Valence (Low)", weight: 0.18, direction: "positive" },
    { label: "Loudness", weight: -0.32, direction: "negative" },
  ],
  commute: [
    { label: "Moderate Tempo", weight: 0.36, direction: "positive" },
    { label: "Danceability", weight: 0.29, direction: "positive" },
    { label: "Valence Balance", weight: 0.24, direction: "positive" },
    { label: "Energy (Mid-range)", weight: 0.21, direction: "positive" },
    { label: "Genre Diversity", weight: 0.18, direction: "positive" },
    { label: "Extreme BPM", weight: -0.15, direction: "negative" },
  ],
  relax: [
    { label: "Acousticness", weight: 0.41, direction: "positive" },
    { label: "Low Energy", weight: 0.37, direction: "positive" },
    { label: "Valence (Warm)", weight: 0.26, direction: "positive" },
    { label: "Slow Tempo", weight: 0.23, direction: "positive" },
    { label: "Indie/Folk Genre", weight: 0.19, direction: "positive" },
    { label: "Loudness", weight: -0.31, direction: "negative" },
  ],
  work: [
    { label: "Moderate Energy", weight: 0.38, direction: "positive" },
    { label: "Consistent Tempo", weight: 0.33, direction: "positive" },
    { label: "Danceability", weight: 0.25, direction: "positive" },
    { label: "Valence (Positive)", weight: 0.21, direction: "positive" },
    { label: "Familiarity Score", weight: 0.17, direction: "positive" },
    { label: "High Acousticness", weight: -0.14, direction: "negative" },
  ],
  latenight: [
    { label: "Mood (Dark/Ambient)", weight: 0.44, direction: "positive" },
    { label: "Low Valence", weight: 0.36, direction: "positive" },
    { label: "Moderate Energy", weight: 0.28, direction: "positive" },
    { label: "Synthwave Affinity", weight: 0.22, direction: "positive" },
    { label: "R&B Genre Weight", weight: 0.19, direction: "positive" },
    { label: "High Danceability", weight: -0.11, direction: "negative" },
  ],
};

import { FeatureWeight } from "@/types/session";

export function generatePrediction(context: SessionContext): SessionPrediction {
  const tracks = trackDatabase[context.activity] || trackDatabase.workout;
  const sessionType = sessionLabels[context.activity]?.[context.mood] || "Custom Session";
  const featureWeights = featureWeightsByActivity[context.activity] || featureWeightsByActivity.workout;

  const descriptions: Record<string, string> = {
    workout: `Optimizing for tempo > 120 BPM, high energy score, and ${context.mood} mood vector.`,
    study: `Filtering for low-energy, high-acousticness tracks. Instrumentalness weighted at +0.35.`,
    commute: `Balancing tempo and danceability for transit context. Genre diversity enabled.`,
    relax: `Prioritizing acoustic warmth, low energy, and positive valence signals.`,
    work: `Optimizing for consistent tempo and moderate energy. Familiarity bias active.`,
    latenight: `Dark/ambient mood vector active. Low valence, synthwave genre affinity weighted.`,
  };

  return {
    sessionType,
    description: descriptions[context.activity] || descriptions.workout,
    tracks,
    featureWeights,
    modelConfidence: 0.87 + Math.random() * 0.09,
  };
}
