import { Match, Player, PlayerStats } from '../types';

export function calculateLeaderboard(players: Player[], matches: Match[]): PlayerStats[] {
  const statsMap: Record<string, PlayerStats> = {};

  // Initialize stats map
  players.forEach(p => {
    statsMap[p.id] = {
      playerId: p.id,
      name: p.name,
      totalMatches: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      avgPointDiff: 0,
      exactMatchesCount: 0,
      rating: 1500, // Initial Elo rating
    };
  });

  const exactPointDiffSum: Record<string, number> = {};

  // Calculate traditional stats first
  matches.forEach(m => {
    const isTeam1Win = m.score1 > m.score2;
    const isTeam2Win = m.score2 > m.score1;
    const isDraw = m.score1 === m.score2;
    
    const team1Diff = m.score1 - m.score2;
    const team2Diff = m.score2 - m.score1;

    const processPlayer = (playerId: string, isTeam1: boolean) => {
      if (!statsMap[playerId]) return;
      
      const stats = statsMap[playerId];
      stats.totalMatches += 1;
      
      if (!isDraw) {
        if ((isTeam1 && isTeam1Win) || (!isTeam1 && isTeam2Win)) {
          stats.wins += 1;
        } else {
          stats.losses += 1;
        }
      }

      if (m.isScoreExact) {
        stats.exactMatchesCount += 1;
        exactPointDiffSum[playerId] = (exactPointDiffSum[playerId] || 0) + (isTeam1 ? team1Diff : team2Diff);
      }
    };

    m.team1.forEach(pId => processPlayer(pId, true));
    m.team2.forEach(pId => processPlayer(pId, false));
  });

  // Calculate dynamic Elo ratings chronologically
  const ratings: Record<string, number> = {};
  players.forEach(p => {
    ratings[p.id] = 1500;
  });

  // matches list is sorted newest first, so we reverse it to process from oldest to newest
  const chronologicalMatches = [...matches].reverse();

  chronologicalMatches.forEach(m => {
    // Skip if any player is no longer in the system
    const hasValidTeam1 = m.team1.every(id => ratings[id] !== undefined);
    const hasValidTeam2 = m.team2.every(id => ratings[id] !== undefined);
    if (!hasValidTeam1 || !hasValidTeam2) return;

    // Get current ratings of players
    const rA = ratings[m.team1[0]];
    const rB = ratings[m.team1[1]];
    const rC = ratings[m.team2[0]];
    const rD = ratings[m.team2[1]];

    // Average rating of each team
    const avgR1 = (rA + rB) / 2;
    const avgR2 = (rC + rD) / 2;

    const ratingChange1 = getTeamRatingChange(avgR1, avgR2, m);
    const ratingChange2 = -ratingChange1;

    // Distribute rating changes to players on each team
    ratings[m.team1[0]] += ratingChange1;
    ratings[m.team1[1]] += ratingChange1;
    ratings[m.team2[0]] += ratingChange2;
    ratings[m.team2[1]] += ratingChange2;
  });

  // Finalize stats
  const result: PlayerStats[] = Object.values(statsMap).map(stats => {
    stats.winRate = stats.totalMatches > 0 ? (stats.wins / stats.totalMatches) * 100 : 0;
    stats.avgPointDiff = stats.exactMatchesCount > 0 ? (exactPointDiffSum[stats.playerId] || 0) / stats.exactMatchesCount : 0;
    stats.rating = Math.round(ratings[stats.playerId] ?? 1500);
    return stats;
  });

  // Sort primarily by Elo rating, then by win rate, then by average point difference
  result.sort((a, b) => {
    if (b.rating !== a.rating) {
      return b.rating - a.rating;
    }
    if (b.winRate !== a.winRate) {
      return b.winRate - a.winRate;
    }
    return b.avgPointDiff - a.avgPointDiff;
  });

  return result;
}

export interface EloHistoryPoint {
  name: string;
  date: string;
  [playerName: string]: number | string;
}

export interface PlayerEloMatchBreakdown {
  match: Match;
  ratingBefore: number;
  ratingAfter: number;
  delta: number;
  isWin: boolean;
  partnerId: string;
  opponentIds: [string, string];
}

function getMatchEloScores(match: Match): [number, number] {
  if (match.isScoreExact) {
    const totalPoints = match.score1 + match.score2;
    const winPart = match.score1 > match.score2 ? 1.0 : match.score1 < match.score2 ? 0.0 : 0.5;

    if (totalPoints > 0) {
      const ratioPart = match.score1 / totalPoints;
      const team1Score = 0.6 * winPart + 0.4 * ratioPart;
      return [team1Score, 1 - team1Score];
    }

    return [winPart, 1 - winPart];
  }

  if (match.score1 > match.score2) {
    const team1Score = 0.6 * 1.0 + 0.4 * (21 / 36);
    return [team1Score, 1 - team1Score];
  }

  if (match.score2 > match.score1) {
    const team1Score = 0.6 * 0.0 + 0.4 * (15 / 36);
    return [team1Score, 1 - team1Score];
  }

  return [0.5, 0.5];
}

function getTeamRatingChange(team1Rating: number, team2Rating: number, match: Match): number {
  const expectedTeam1 = 1 / (1 + Math.pow(10, (team2Rating - team1Rating) / 400));
  const [team1Score] = getMatchEloScores(match);
  return 40 * (team1Score - expectedTeam1);
}

export function calculateEloHistory(players: Player[], matches: Match[]): EloHistoryPoint[] {
  const history: EloHistoryPoint[] = [];

  // Khởi tạo điểm Elo ban đầu
  const currentRatings: Record<string, number> = {};
  players.forEach(p => {
    currentRatings[p.id] = 1500;
  });

  // Điểm bắt đầu
  const startPoint: EloHistoryPoint = {
    name: 'Bắt đầu',
    date: '',
  };
  players.forEach(p => {
    startPoint[p.name] = 1500;
  });
  history.push(startPoint);

  // Sắp xếp các trận từ cũ nhất đến mới nhất
  const chronologicalMatches = [...matches].reverse();

  chronologicalMatches.forEach((m, index) => {
    // Bỏ qua nếu người chơi không hợp lệ
    const hasValidTeam1 = m.team1.every(id => currentRatings[id] !== undefined);
    const hasValidTeam2 = m.team2.every(id => currentRatings[id] !== undefined);
    if (!hasValidTeam1 || !hasValidTeam2) return;

    // Get current ratings of players
    const rA = currentRatings[m.team1[0]];
    const rB = currentRatings[m.team1[1]];
    const rC = currentRatings[m.team2[0]];
    const rD = currentRatings[m.team2[1]];

    // Average rating of each team
    const avgR1 = (rA + rB) / 2;
    const avgR2 = (rC + rD) / 2;

    const ratingChange1 = getTeamRatingChange(avgR1, avgR2, m);
    const ratingChange2 = -ratingChange1;

    // Cập nhật rating
    currentRatings[m.team1[0]] += ratingChange1;
    currentRatings[m.team1[1]] += ratingChange1;
    currentRatings[m.team2[0]] += ratingChange2;
    currentRatings[m.team2[1]] += ratingChange2;

    // Lưu lại điểm lịch sử sau trận đấu này
    const point: EloHistoryPoint = {
      name: `Trận ${index + 1}`,
      date: m.date,
    };
    players.forEach(p => {
      point[p.name] = Math.round(currentRatings[p.id]);
    });
    history.push(point);
  });

  return history;
}

export function calculatePlayerEloBreakdown(
  players: Player[],
  matches: Match[],
  playerId: string
): PlayerEloMatchBreakdown[] {
  const ratings: Record<string, number> = {};
  players.forEach(p => {
    ratings[p.id] = 1500;
  });

  const breakdown: PlayerEloMatchBreakdown[] = [];
  const chronologicalMatches = [...matches].reverse();

  chronologicalMatches.forEach(match => {
    const hasValidTeam1 = match.team1.every(id => ratings[id] !== undefined);
    const hasValidTeam2 = match.team2.every(id => ratings[id] !== undefined);
    if (!hasValidTeam1 || !hasValidTeam2) return;

    const team1Rating = (ratings[match.team1[0]] + ratings[match.team1[1]]) / 2;
    const team2Rating = (ratings[match.team2[0]] + ratings[match.team2[1]]) / 2;
    const team1Change = getTeamRatingChange(team1Rating, team2Rating, match);
    const team2Change = -team1Change;

    const isTeam1Player = match.team1.includes(playerId);
    const isTeam2Player = match.team2.includes(playerId);
    const ratingBefore = ratings[playerId] ?? 1500;

    match.team1.forEach(id => {
      ratings[id] += team1Change;
    });
    match.team2.forEach(id => {
      ratings[id] += team2Change;
    });

    if (!isTeam1Player && !isTeam2Player) return;

    const isWin =
      (isTeam1Player && match.score1 > match.score2) ||
      (isTeam2Player && match.score2 > match.score1);
    const team = isTeam1Player ? match.team1 : match.team2;
    const opponents = isTeam1Player ? match.team2 : match.team1;
    const ratingAfter = ratings[playerId] ?? ratingBefore;

    breakdown.push({
      match,
      ratingBefore: Math.round(ratingBefore),
      ratingAfter: Math.round(ratingAfter),
      delta: Math.round(ratingAfter - ratingBefore),
      isWin,
      partnerId: team.find(id => id !== playerId) || '',
      opponentIds: opponents,
    });
  });

  return breakdown.reverse();
}
