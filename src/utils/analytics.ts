import { parseISO } from 'date-fns';
import { Match, Player, PlayerStats } from '../types';
import { EloHistoryPoint } from './calculations';
import { isMatchInWeek } from './dateUtils';

export interface DuoStat {
  ids: string;
  names: string;
  total: number;
  wins: number;
  winRate: number;
}

export interface AnalyticsInsights {
  activePlayer: { id: string; name: string; matches: number } | null;
  bestStreak: { id: string; name: string; streak: number } | null;
  bestDuo: DuoStat | null;
}

interface WeekOption {
  id: string;
  start: Date;
  end: Date;
}

export function filterMatchesByWeek(
  matches: Match[],
  selectedWeek: string,
  weekOptions: WeekOption[]
): Match[] {
  const week = weekOptions.find(option => option.id === selectedWeek);
  const filtered = selectedWeek === 'all'
    ? matches
    : week
      ? matches.filter(match => isMatchInWeek(match.date, week.start, week.end))
      : [];

  return [...filtered].sort((left, right) => {
    const getTime = (date: string) => {
      try {
        return parseISO(date).getTime();
      } catch {
        return 0;
      }
    };
    return getTime(right.date) - getTime(left.date);
  });
}

export function filterEloHistoryByWeek(
  history: EloHistoryPoint[],
  selectedWeek: string,
  weekOptions: WeekOption[]
): EloHistoryPoint[] {
  if (selectedWeek === 'all') return history;
  const week = weekOptions.find(option => option.id === selectedWeek);
  if (!week) return history;

  const weekPoints = history.filter(point =>
    point.date && isMatchInWeek(point.date, week.start, week.end)
  );
  if (weekPoints.length === 0) {
    const lastPoint = history.reduce((latest, point) => {
      if (!point.date) return latest;
      try {
        return parseISO(point.date).getTime() < week.start.getTime() ? point : latest;
      } catch {
        return latest;
      }
    }, history[0]);
    return lastPoint ? [{ ...lastPoint, name: 'Không có trận', date: '' }] : [];
  }

  const firstIndex = history.indexOf(weekPoints[0]);
  const startPoint = firstIndex > 0 ? history[firstIndex - 1] : history[0];
  const points = weekPoints.map((point, index) => ({
    ...point,
    name: `Trận ${index + 1}`,
  }));
  return startPoint
    ? [{ ...startPoint, name: 'Bắt đầu', date: '' }, ...points]
    : points;
}

export function calculateDuoStats(matches: Match[], players: Player[]): DuoStat[] {
  const duoMap: Record<string, Omit<DuoStat, 'ids' | 'winRate'>> = {};

  const processTeam = (team: [string, string], isWin: boolean) => {
    const [firstId, secondId] = [...team].sort();
    const first = players.find(player => player.id === firstId);
    const second = players.find(player => player.id === secondId);
    if (!first || !second) return;

    const key = `${firstId}_${secondId}`;
    duoMap[key] ??= { wins: 0, total: 0, names: `${first.name} & ${second.name}` };
    duoMap[key].total++;
    if (isWin) duoMap[key].wins++;
  };

  matches.forEach(match => {
    const isDraw = match.score1 === match.score2;
    processTeam(match.team1, !isDraw && match.score1 > match.score2);
    processTeam(match.team2, !isDraw && match.score2 > match.score1);
  });

  return Object.entries(duoMap).map(([ids, data]) => ({
    ids,
    ...data,
    winRate: data.total > 0 ? (data.wins / data.total) * 100 : 0,
  }));
}

export function getTopDuos(duos: DuoStat[]): DuoStat[] {
  const minMatches = duos.some(duo => duo.total >= 2) ? 2 : 1;
  return [...duos]
    .filter(duo => duo.total >= minMatches)
    .sort((left, right) => right.winRate - left.winRate || right.total - left.total)
    .slice(0, 5);
}

export function calculateActivityStats(matches: Match[]) {
  const counts: Record<string, number> = {};
  matches.forEach(match => {
    const date = match.date.substring(0, 10);
    counts[date] = (counts[date] || 0) + 1;
  });

  return Object.entries(counts)
    .map(([date, count]) => {
      const [, month, day] = date.split('-');
      return { date, formattedDate: day && month ? `${day}/${month}` : date, count };
    })
    .sort((left, right) => left.date.localeCompare(right.date));
}

export function calculatePlayerStreaks(matches: Match[], players: Player[]) {
  return Object.fromEntries(players.map(player => {
    let longest = 0;
    let current = 0;
    [...matches].reverse().forEach(match => {
      const isTeam1 = match.team1.includes(player.id);
      const isTeam2 = match.team2.includes(player.id);
      if (!isTeam1 && !isTeam2) return;
      const isWin = (isTeam1 && match.score1 > match.score2)
        || (isTeam2 && match.score2 > match.score1);
      current = isWin ? current + 1 : 0;
      longest = Math.max(longest, current);
    });
    return [player.id, longest];
  }));
}

export function buildAnalyticsInsights(
  leaderboard: PlayerStats[],
  streaks: Record<string, number>,
  duos: DuoStat[],
  players: Player[]
): AnalyticsInsights | null {
  if (leaderboard.length === 0) return null;

  const active = leaderboard.reduce((best, player) =>
    player.totalMatches > best.totalMatches ? player : best
  );
  const bestStreakEntry = Object.entries(streaks)
    .sort((left, right) => right[1] - left[1])[0];
  const streakPlayer = players.find(player => player.id === bestStreakEntry?.[0]);

  return {
    activePlayer: active.totalMatches > 0
      ? { id: active.playerId, name: active.name, matches: active.totalMatches }
      : null,
    bestStreak: streakPlayer && bestStreakEntry[1] > 0
      ? { id: streakPlayer.id, name: streakPlayer.name, streak: bestStreakEntry[1] }
      : null,
    bestDuo: duos[0] ?? null,
  };
}
