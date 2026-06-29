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

    // Expected outcome (probability of winning) for Team 1 using logistic curve
    const E1 = 1 / (1 + Math.pow(10, (avgR2 - avgR1) / 400));
    const E2 = 1 - E1;

    // Actual outcome (S1, S2) blended from win/loss outcome and point ratio
    let S1 = 0.5;
    let S2 = 0.5;

    if (m.isScoreExact) {
      const s1 = m.score1;
      const s2 = m.score2;
      const totalPoints = s1 + s2;
      const winPart = s1 > s2 ? 1.0 : s1 < s2 ? 0.0 : 0.5;

      if (totalPoints > 0) {
        // Blends win outcome (60% weight) and ratio of points won (40% weight)
        // This ensures close games (e.g., 21-19) yield smaller rating changes,
        // and blowouts (e.g., 21-5) yield significantly larger rating changes.
        const ratioPart = s1 / totalPoints;
        S1 = 0.6 * winPart + 0.4 * ratioPart;
      } else {
        S1 = winPart;
      }
      S2 = 1 - S1;
    } else {
      // Inexact score (e.g., 1-0 or 0-1) - simulate a typical 21-15 match margin
      const isTeam1Win = m.score1 > m.score2;
      if (isTeam1Win) {
        S1 = 0.6 * 1.0 + 0.4 * (21 / 36); // ~0.833
      } else if (m.score2 > m.score1) {
        S1 = 0.6 * 0.0 + 0.4 * (15 / 36); // ~0.167
      } else {
        S1 = 0.5;
      }
      S2 = 1 - S1;
    }

    // Update factor K (base of 40 for healthy responsiveness)
    const K = 40;
    const ratingChange1 = K * (S1 - E1);
    const ratingChange2 = K * (S2 - E2); // zero-sum: equals -ratingChange1

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

    // Expected outcome (probability of winning) for Team 1
    const E1 = 1 / (1 + Math.pow(10, (avgR2 - avgR1) / 400));
    const E2 = 1 - E1;

    // Actual outcome (S1, S2) blended from win/loss outcome and point ratio
    let S1 = 0.5;
    let S2 = 0.5;

    if (m.isScoreExact) {
      const s1 = m.score1;
      const s2 = m.score2;
      const totalPoints = s1 + s2;
      const winPart = s1 > s2 ? 1.0 : s1 < s2 ? 0.0 : 0.5;

      if (totalPoints > 0) {
        const ratioPart = s1 / totalPoints;
        S1 = 0.6 * winPart + 0.4 * ratioPart;
      } else {
        S1 = winPart;
      }
      S2 = 1 - S1;
    } else {
      const isTeam1Win = m.score1 > m.score2;
      if (isTeam1Win) {
        S1 = 0.6 * 1.0 + 0.4 * (21 / 36);
      } else if (m.score2 > m.score1) {
        S1 = 0.6 * 0.0 + 0.4 * (15 / 36);
      } else {
        S1 = 0.5;
      }
      S2 = 1 - S1;
    }

    const K = 40;
    const ratingChange1 = K * (S1 - E1);
    const ratingChange2 = K * (S2 - E2);

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
