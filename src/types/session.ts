export interface Track {
  id: number;
  title: string;
  artist: string;
  album: string;
  bpm: number;
  energy: number;
  matchScore: number;
  duration: string;
  genre: string;
  danceability: number;
  valence: number;
  shapValues?: ShapValue[];
}

export interface FeatureWeight {
  label: string;
  weight: number;
  direction: "positive" | "negative";
}

export interface ShapValue {
  feature: string;
  value: number;
  contribution: number;
}

export interface SessionPrediction {
  sessionType: string;
  description: string;
  tracks: Track[];
  featureWeights: FeatureWeight[];
  modelConfidence: number;
  candidatesGenerated?: number;
  rankingModel?: string;
}

export type Mood = "energetic" | "chill" | "focused" | "melancholic";
export type Activity = "workout" | "study" | "commute" | "relax" | "work" | "latenight";
export type TimeOfDay = "morning" | "afternoon" | "evening" | "night";
export type EnergyLevel = "low" | "medium" | "high";

export interface SessionContext {
  mood: Mood;
  activity: Activity;
  timeOfDay: TimeOfDay;
  energyLevel: EnergyLevel;
}
