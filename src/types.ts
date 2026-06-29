export type Player = {
  id: string;
  name: string;
  isActive: boolean;
  gender: 'male' | 'female';
};

export type Match = {
  id: string;
  date: string; // ISO string format YYYY-MM-DD or YYYY-MM-DDTHH:mm
  team1: [string, string]; // Player IDs
  team2: [string, string]; // Player IDs
  isScoreExact: boolean;
  score1: number;
  score2: number;
  notes?: string;
};

export type PlayerStats = {
  playerId: string;
  name: string;
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number; // Percentage 0-100
  avgPointDiff: number; // Average point difference (only for exact score matches)
  exactMatchesCount: number;
  rating: number; // Elo-based strength rating
};

export type LeaderboardConfig = {
  minMatchesForMainBoard: number;
};

export type ScheduledSet = {
  id: string;
  setIndex: number;
  team1: [string, string];
  team2: [string, string];
};

