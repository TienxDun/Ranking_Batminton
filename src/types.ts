export type Player = {
  id: string;
  name: string;
  isActive: boolean;
  gender: 'male' | 'female';
  groupIds: string[];
};

export type PlayerGroup = {
  id: string;
  name: string;
  isActive: boolean;
};

export type Match = {
  id: string;
  groupId: string;
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
  /** Ảnh QR nhận tiền — lưu dạng base64 data URL (data:image/...;base64,...) */
  paymentQrImage?: string;
  paymentAccountName?: string;
};

export type CostLineItem = {
  unitPrice: number;
  quantity: number;
};

export type SessionCostBreakdown = {
  court: CostLineItem;
  water: CostLineItem;
  shuttlecock: CostLineItem;
  other: CostLineItem;
  otherNote?: string;
};

export type Court = {
  id: string;
  name: string;
  mapUrl: string;
};

export type SessionCost = {
  id: string;
  groupId: string;
  date: string;
  courtId?: string;
  courtNumber?: string; // Số sân cụ thể, VD: "5", "10", "A3"
  costs: SessionCostBreakdown;
  participantIds: string[];
  notes?: string;
};

