export interface MatchmakerPlayer {
  id: string;
  name: string;
  gender: 'male' | 'female';
  elo: number;
}

export interface PlayerSessionStats {
  playerId: string;
  matchesPlayed: number;
  consecutiveRest: number;
}

export interface CourtMatch {
  courtIndex: number;
  courtName?: string;
  team1: [MatchmakerPlayer, MatchmakerPlayer];
  team2: [MatchmakerPlayer, MatchmakerPlayer];
  team1Elo: number;
  team2Elo: number;
  eloDiff: number;
  balancePercent: number; // 0 - 100%
  quality: 'perfect' | 'good' | 'fair';
}

export interface MatchmakingResult {
  courts: CourtMatch[];
  benchPlayers: MatchmakerPlayer[];
}

export type PartnerHistoryMap = Record<string, number>; // key: "id1_id2" sorted -> count

export function getPartnerKey(id1: string, id2: string): string {
  return id1 < id2 ? `${id1}_${id2}` : `${id2}_${id1}`;
}

/**
 * Calculates balance percentage from Elo difference.
 * 0 diff => 100% balance
 * 50 diff => ~90% balance
 * 150 diff => ~70% balance
 */
export function calculateBalancePercent(eloDiff: number): number {
  const percent = Math.max(50, Math.round(100 - eloDiff * 0.2));
  return Math.min(100, percent);
}

export function getMatchQuality(eloDiff: number): 'perfect' | 'good' | 'fair' {
  if (eloDiff <= 25) return 'perfect';
  if (eloDiff <= 75) return 'good';
  return 'fair';
}

/**
 * Recalculates stats for a court match after manual swaps
 */
export function recalculateCourtStats(match: CourtMatch): CourtMatch {
  const t1Elo = Math.round((match.team1[0].elo + match.team1[1].elo) / 2);
  const t2Elo = Math.round((match.team2[0].elo + match.team2[1].elo) / 2);
  const eloDiff = Math.abs(t1Elo - t2Elo);

  return {
    ...match,
    team1Elo: t1Elo,
    team2Elo: t2Elo,
    eloDiff,
    balancePercent: calculateBalancePercent(eloDiff),
    quality: getMatchQuality(eloDiff),
  };
}

/**
 * Evaluates the 3 possible pairings of 4 players and chooses the best one.
 */
export function findBestCourtPairing(
  players: MatchmakerPlayer[],
  courtIndex: number,
  partnerHistory: PartnerHistoryMap = {},
  courtName?: string
): CourtMatch {
  if (players.length !== 4) {
    throw new Error('Court must have exactly 4 players');
  }

  const [p0, p1, p2, p3] = players;

  // 3 possible pairings:
  // Option 0: (0, 1) vs (2, 3)
  // Option 1: (0, 2) vs (1, 3)
  // Option 2: (0, 3) vs (1, 2)
  const options: Array<{
    t1: [MatchmakerPlayer, MatchmakerPlayer];
    t2: [MatchmakerPlayer, MatchmakerPlayer];
  }> = [
    { t1: [p0, p1], t2: [p2, p3] },
    { t1: [p0, p2], t2: [p1, p3] },
    { t1: [p0, p3], t2: [p1, p2] },
  ];

  let bestOption = options[0];
  let lowestPenalty = Infinity;

  for (const opt of options) {
    const t1Elo = (opt.t1[0].elo + opt.t1[1].elo) / 2;
    const t2Elo = (opt.t2[0].elo + opt.t2[1].elo) / 2;
    const eloDiff = Math.abs(t1Elo - t2Elo);

    // Gender consideration:
    const t1Females = (opt.t1[0].gender === 'female' ? 1 : 0) + (opt.t1[1].gender === 'female' ? 1 : 0);
    const t2Females = (opt.t2[0].gender === 'female' ? 1 : 0) + (opt.t2[1].gender === 'female' ? 1 : 0);

    let genderPenalty = 0;
    // Heavy penalty if 2 females against 2 males when players can be split
    if ((t1Females === 2 && t2Females === 0) || (t1Females === 0 && t2Females === 2)) {
      genderPenalty = 250;
    }

    // Partner repetition penalty
    const t1Key = getPartnerKey(opt.t1[0].id, opt.t1[1].id);
    const t2Key = getPartnerKey(opt.t2[0].id, opt.t2[1].id);
    const repPenalty = ((partnerHistory[t1Key] || 0) + (partnerHistory[t2Key] || 0)) * 60;

    const totalCost = eloDiff + genderPenalty + repPenalty;

    if (totalCost < lowestPenalty) {
      lowestPenalty = totalCost;
      bestOption = opt;
    }
  }

  const initialMatch: CourtMatch = {
    courtIndex,
    courtName,
    team1: bestOption.t1,
    team2: bestOption.t2,
    team1Elo: 0,
    team2Elo: 0,
    eloDiff: 0,
    balancePercent: 0,
    quality: 'perfect',
  };

  return recalculateCourtStats(initialMatch);
}

/**
 * Selects K players from the pool to maximize fair play:
 * 1. Fewest matches played in this session
 * 2. Longest consecutive rest
 * 3. Tie-breaker with randomized jitter
 */
export function selectPlayersForRound(
  allPlayers: MatchmakerPlayer[],
  slotsNeeded: number,
  sessionStats: Record<string, PlayerSessionStats>
): { playing: MatchmakerPlayer[]; bench: MatchmakerPlayer[] } {
  if (allPlayers.length <= slotsNeeded) {
    return {
      playing: [...allPlayers],
      bench: [],
    };
  }

  // Score each player: lower score = higher priority to play
  const scored = allPlayers.map(p => {
    const stats = sessionStats[p.id] || { matchesPlayed: 0, consecutiveRest: 0 };
    const score = stats.matchesPlayed * 1000 - stats.consecutiveRest * 50 + Math.random() * 5;
    return { player: p, score };
  });

  scored.sort((a, b) => a.score - b.score);

  const playing = scored.slice(0, slotsNeeded).map(s => s.player);
  const bench = scored.slice(slotsNeeded).map(s => s.player);

  return { playing, bench };
}

/**
 * Partitions 8 players into 2 courts of 4 players each.
 * Evaluates all 35 combinations to find the globally optimal court assignment.
 */
function partitionTwoCourts(
  players8: MatchmakerPlayer[],
  partnerHistory: PartnerHistoryMap,
  courtNames?: string[]
): CourtMatch[] {
  const p0 = players8[0];
  const rest = players8.slice(1);

  let bestCourtMatches: CourtMatch[] = [];
  let bestCombinedCost = Infinity;

  for (let i = 0; i < rest.length; i++) {
    for (let j = i + 1; j < rest.length; j++) {
      for (let k = j + 1; k < rest.length; k++) {
        const c1Players = [p0, rest[i], rest[j], rest[k]];
        const c2Players = rest.filter((_, idx) => idx !== i && idx !== j && idx !== k);

        const m1 = findBestCourtPairing(c1Players, 0, partnerHistory, courtNames?.[0]);
        const m2 = findBestCourtPairing(c2Players, 1, partnerHistory, courtNames?.[1]);

        const combinedCost = m1.eloDiff + m2.eloDiff;

        if (combinedCost < bestCombinedCost) {
          bestCombinedCost = combinedCost;
          bestCourtMatches = [m1, m2];
        }
      }
    }
  }

  return bestCourtMatches;
}

/**
 * Main function: Generates the optimal court matchups for a round.
 */
export function generateRoundMatchups(
  checkedInPlayers: MatchmakerPlayer[],
  numCourts: number,
  sessionStats: Record<string, PlayerSessionStats>,
  partnerHistory: PartnerHistoryMap = {},
  courtNames?: string[]
): MatchmakingResult {
  const maxPossibleCourts = Math.floor(checkedInPlayers.length / 4);
  const actualCourts = Math.max(1, Math.min(numCourts, maxPossibleCourts));
  const slotsNeeded = actualCourts * 4;

  if (checkedInPlayers.length < 4) {
    return {
      courts: [],
      benchPlayers: [...checkedInPlayers],
    };
  }

  // 1. Select who plays and who sits on bench
  const { playing, bench } = selectPlayersForRound(checkedInPlayers, slotsNeeded, sessionStats);

  // 2. Assign playing players to courts
  let courts: CourtMatch[] = [];

  if (actualCourts === 1) {
    courts = [findBestCourtPairing(playing, 0, partnerHistory, courtNames?.[0])];
  } else if (actualCourts === 2) {
    courts = partitionTwoCourts(playing, partnerHistory, courtNames);
  } else {
    // 3 or more courts: serpentine distribution
    const sortedByElo = [...playing].sort((a, b) => b.elo - a.elo);
    const courtBuckets: MatchmakerPlayer[][] = Array.from({ length: actualCourts }, () => []);
    let courtIdx = 0;
    let direction = 1;

    for (const player of sortedByElo) {
      courtBuckets[courtIdx].push(player);
      courtIdx += direction;
      if (courtIdx >= actualCourts) {
        courtIdx = actualCourts - 1;
        direction = -1;
      } else if (courtIdx < 0) {
        courtIdx = 0;
        direction = 1;
      }
    }

    courts = courtBuckets.map((bucket, idx) =>
      findBestCourtPairing(bucket, idx, partnerHistory, courtNames?.[idx])
    );
  }

  return {
    courts,
    benchPlayers: bench,
  };
}

/**
 * Updates session tracking when a round is confirmed/completed.
 */
export function updateSessionAfterRound(
  prevStats: Record<string, PlayerSessionStats>,
  prevHistory: PartnerHistoryMap,
  allCheckedIn: MatchmakerPlayer[],
  courts: CourtMatch[]
): { stats: Record<string, PlayerSessionStats>; history: PartnerHistoryMap } {
  const newStats: Record<string, PlayerSessionStats> = {};
  const newHistory = { ...prevHistory };

  // Set of playing IDs
  const playingIds = new Set<string>();

  courts.forEach(court => {
    const [p1, p2] = court.team1;
    const [p3, p4] = court.team2;

    playingIds.add(p1.id);
    playingIds.add(p2.id);
    playingIds.add(p3.id);
    playingIds.add(p4.id);

    // Record partners
    const k1 = getPartnerKey(p1.id, p2.id);
    const k2 = getPartnerKey(p3.id, p4.id);
    newHistory[k1] = (newHistory[k1] || 0) + 1;
    newHistory[k2] = (newHistory[k2] || 0) + 1;
  });

  allCheckedIn.forEach(p => {
    const old = prevStats[p.id] || { playerId: p.id, matchesPlayed: 0, consecutiveRest: 0 };
    if (playingIds.has(p.id)) {
      newStats[p.id] = {
        playerId: p.id,
        matchesPlayed: old.matchesPlayed + 1,
        consecutiveRest: 0,
      };
    } else {
      newStats[p.id] = {
        playerId: p.id,
        matchesPlayed: old.matchesPlayed,
        consecutiveRest: old.consecutiveRest + 1,
      };
    }
  });

  return { stats: newStats, history: newHistory };
}

/**
 * Swap 2 players on court or between courts
 */
export function swapCourtPlayers(
  courts: CourtMatch[],
  id1: string,
  id2: string
): CourtMatch[] {
  let player1: MatchmakerPlayer | null = null;
  let player2: MatchmakerPlayer | null = null;

  // Find both players
  for (const c of courts) {
    for (const p of [...c.team1, ...c.team2]) {
      if (p.id === id1) player1 = p;
      if (p.id === id2) player2 = p;
    }
  }

  if (!player1 || !player2) return courts;

  const replacePlayer = (p: MatchmakerPlayer): MatchmakerPlayer => {
    if (p.id === id1) return player2!;
    if (p.id === id2) return player1!;
    return p;
  };

  return courts.map(court => {
    const newCourt: CourtMatch = {
      ...court,
      team1: [replacePlayer(court.team1[0]), replacePlayer(court.team1[1])],
      team2: [replacePlayer(court.team2[0]), replacePlayer(court.team2[1])],
    };
    return recalculateCourtStats(newCourt);
  });
}

/**
 * Swap a court player with a bench player
 */
export function swapCourtWithBench(
  courts: CourtMatch[],
  bench: MatchmakerPlayer[],
  courtPlayerId: string,
  benchPlayerId: string
): { courts: CourtMatch[]; bench: MatchmakerPlayer[] } {
  const benchPlayer = bench.find(b => b.id === benchPlayerId);
  let courtPlayer: MatchmakerPlayer | null = null;

  for (const c of courts) {
    for (const p of [...c.team1, ...c.team2]) {
      if (p.id === courtPlayerId) courtPlayer = p;
    }
  }

  if (!benchPlayer || !courtPlayer) return { courts, bench };

  const newCourts = courts.map(court => {
    const replacePlayer = (p: MatchmakerPlayer): MatchmakerPlayer => {
      if (p.id === courtPlayerId) return benchPlayer;
      return p;
    };
    const newCourt: CourtMatch = {
      ...court,
      team1: [replacePlayer(court.team1[0]), replacePlayer(court.team1[1])],
      team2: [replacePlayer(court.team2[0]), replacePlayer(court.team2[1])],
    };
    return recalculateCourtStats(newCourt);
  });

  const newBench = bench.map(p => (p.id === benchPlayerId ? courtPlayer! : p));

  return { courts: newCourts, bench: newBench };
}
