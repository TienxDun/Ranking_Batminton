import React, { CSSProperties, useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../store';
import { calculateLeaderboard, calculateEloHistory } from '../utils/calculations';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { Trophy, Users, Calendar, Award, Flame, Zap, BarChart2, Swords, Puzzle, X } from 'lucide-react';
import { Select } from './ui/select';
import { getWeekOptions, isMatchInWeek } from '../utils/dateUtils';
import { parseISO } from 'date-fns';
import { Button } from './ui/button';
import { Match } from '../types';
import { useVisualViewportRect } from '../hooks/useVisualViewportRect';
import { useModalHistory } from '../hooks/useModalHistory';

const PLAYER_COLORS: Record<string, string> = {
  'Khoa': '#2dd4bf',   // Teal
  'Nam': '#38bdf8',    // Sky Blue
  'Dũng': '#f59e0b',   // Amber
  'Thuyên': '#10b981',  // Emerald
  'Linh': '#f43f5e',   // Rose
  'Tuyết': '#fb923c',  // Orange/Coral
  'Thư': '#ec4899',    // Pink
  'Như': '#a3e635',    // Lime/Greenish
};

const FALLBACK_COLORS = [
  '#2dd4bf', '#38bdf8', '#f59e0b', '#10b981',
  '#f43f5e', '#fb923c', '#ec4899', '#a3e635',
  '#818cf8', '#c084fc', '#64748b'
];

interface DuoStat {
  ids: string;
  names: string;
  total: number;
  wins: number;
  winRate: number;
}

type InsightDetail = 'active' | 'streak' | 'duo';

function getMatchTime(date: string): number {
  try {
    return parseISO(date).getTime();
  } catch {
    return 0;
  }
}

function formatMatchDate(date: string): string {
  try {
    const parsed = parseISO(date);
    if (Number.isNaN(parsed.getTime())) return date;

    const day = String(parsed.getDate()).padStart(2, '0');
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const year = parsed.getFullYear();
    const hasTime = date.includes('T') || date.includes(':');
    const time = hasTime
      ? ` ${String(parsed.getHours()).padStart(2, '0')}:${String(parsed.getMinutes()).padStart(2, '0')}`
      : '';

    return `${day}/${month}/${year}${time}`;
  } catch {
    return date;
  }
}

function getTeamLabel(ids: [string, string], getPlayerName: (id: string) => string): string {
  return `${getPlayerName(ids[0])} - ${getPlayerName(ids[1])}`;
}

function getMatchResultLabel(match: Match, playerId?: string): { text: string; className: string } {
  if (match.score1 === match.score2) {
    return { text: 'Hòa', className: 'text-slate-400' };
  }

  if (!playerId) {
    return match.score1 > match.score2
      ? { text: 'Đội 1 thắng', className: 'text-emerald-400' }
      : { text: 'Đội 2 thắng', className: 'text-emerald-400' };
  }

  const isTeam1 = match.team1.includes(playerId);
  const isWin = (isTeam1 && match.score1 > match.score2) || (!isTeam1 && match.score2 > match.score1);
  return isWin
    ? { text: 'Thắng', className: 'text-emerald-400' }
    : { text: 'Thua', className: 'text-rose-400' };
}

function getLongestWinStreakMatches(matches: Match[], playerId: string): Match[] {
  const chronologicalMatches = [...matches].reverse();
  let current: Match[] = [];
  let best: Match[] = [];

  chronologicalMatches.forEach(match => {
    const isTeam1 = match.team1.includes(playerId);
    const isTeam2 = match.team2.includes(playerId);
    if (!isTeam1 && !isTeam2) return;

    const isWin = (isTeam1 && match.score1 > match.score2) || (isTeam2 && match.score2 > match.score1);
    if (isWin) {
      current = [...current, match];
      if (current.length > best.length) {
        best = current;
      }
    } else {
      current = [];
    }
  });

  return [...best].reverse();
}

function isDuoMatch(match: Match, duoIds: string[]): boolean {
  return duoIds.length === 2 && (
    duoIds.every(id => match.team1.includes(id)) ||
    duoIds.every(id => match.team2.includes(id))
  );
}

function isDuoWin(match: Match, duoIds: string[]): boolean {
  const isTeam1 = duoIds.every(id => match.team1.includes(id));
  const isTeam2 = duoIds.every(id => match.team2.includes(id));
  return (isTeam1 && match.score1 > match.score2) || (isTeam2 && match.score2 > match.score1);
}

function SummaryValue({ label, value }: { label: string; value: string }) {
  const { theme } = useStore();

  if (label === 'Khoảng thời gian' && value.includes(' → ')) {
    const [from, to] = value.split(' → ');
    const isLight = theme === 'light';

    return (
      <div className="mt-3 space-y-3 relative pl-4 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-300/60 dark:before:bg-white/10">
        <div className="relative flex flex-col">
          <div className={`absolute -left-[12px] top-1 w-[8px] h-[8px] rounded-full ring-2 ring-slate-100 dark:ring-slate-900 ${
            isLight ? 'bg-teal-600' : 'bg-teal-400'
          }`} />
          <span className="text-[9px] font-bold uppercase tracking-wider text-teal-400 leading-none">Từ</span>
          <span className="text-sm font-black text-white leading-tight tabular-nums mt-1">{from}</span>
        </div>
        <div className="relative flex flex-col">
          <div className={`absolute -left-[12px] top-1 w-[8px] h-[8px] rounded-full ring-2 ring-slate-100 dark:ring-slate-900 ${
            isLight ? 'bg-indigo-600' : 'bg-indigo-400'
          }`} />
          <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-400 leading-none">Đến</span>
          <span className="text-sm font-black text-white leading-tight tabular-nums mt-1">{to}</span>
        </div>
      </div>
    );
  }

  return <p className="text-base font-black text-white mt-1 leading-snug break-words">{value}</p>;
}

// ----------------------------------------------------
// Custom Tooltips để kiểm soát màu sắc chuẩn xác theo Theme
// ----------------------------------------------------
const EloTooltip = ({ active, payload, label, theme }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className={`p-3 rounded-xl border shadow-xl backdrop-blur-md text-xs ${
        theme === 'light'
          ? 'bg-white/95 border-slate-200 text-slate-800'
          : 'bg-slate-900/95 border-white/10 text-slate-100'
      }`}>
        <p className={`font-bold mb-1.5 ${theme === 'light' ? 'text-slate-700' : 'text-slate-200'}`}>{label}</p>
        <div className="space-y-1">
          {payload.map((item: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className={`font-semibold ${theme === 'light' ? 'text-slate-600' : 'text-slate-300'}`}>{item.name}</span>
              </div>
              <span className={`font-bold font-mono ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>{item.value} Elo</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const DuoTooltip = ({ active, payload, theme }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className={`p-3 rounded-xl border shadow-xl backdrop-blur-md text-xs ${
        theme === 'light'
          ? 'bg-white/95 border-slate-200 text-slate-800'
          : 'bg-slate-900/95 border-white/10 text-slate-100'
      }`}>
        <p className={`font-bold mb-1 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>{data.names}</p>
        <div className="flex items-center gap-1.5">
          <span className={theme === 'light' ? 'text-slate-500' : 'text-slate-300'}>Tỉ lệ thắng:</span>
          <span className="font-bold text-emerald-500">{data.winRate.toFixed(0)}%</span>
        </div>
        <div className={`text-[10px] mt-0.5 ${theme === 'light' ? 'text-slate-400' : 'text-slate-400'}`}>
          ({data.wins} Thắng / {data.total} Trận)
        </div>
      </div>
    );
  }
  return null;
};

const ActivityTooltip = ({ active, payload, theme }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className={`p-3 rounded-xl border shadow-xl backdrop-blur-md text-xs ${
        theme === 'light'
          ? 'bg-white/95 border-slate-200 text-slate-800'
          : 'bg-slate-900/95 border-white/10 text-slate-100'
      }`}>
        <p className={`font-bold mb-1 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>Ngày {data.formattedDate}</p>
        <div className="flex items-center gap-1.5">
          <span className={theme === 'light' ? 'text-slate-500' : 'text-slate-300'}>Số trận đấu:</span>
          <span className="font-bold text-sky-500">{data.count} trận</span>
        </div>
      </div>
    );
  }
  return null;
};

function InsightDetailModal({
  type,
  insights,
  filteredMatches,
  players,
  selectedWeekLabel,
  onClose,
}: {
  type: InsightDetail;
  insights: {
    activePlayer: { id: string; name: string; matches: number } | null;
    bestStreak: { id: string; name: string; streak: number } | null;
    bestDuo: { ids: string; names: string; winRate: number; total: number; wins: number } | null;
  };
  filteredMatches: Match[];
  players: { id: string; name: string }[];
  selectedWeekLabel: string;
  onClose: () => void;
}) {
  const viewportRect = useVisualViewportRect();
  const isMobileViewport = viewportRect.width < 640;

  useModalHistory(onClose);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousPosition = document.body.style.position;
    const previousTop = document.body.style.top;
    const previousWidth = document.body.style.width;
    const scrollY = window.scrollY;

    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.position = previousPosition;
      document.body.style.top = previousTop;
      document.body.style.width = previousWidth;
      window.scrollTo(0, scrollY);
    };
  }, []);

  const getPlayerName = (id: string) => players.find(p => p.id === id)?.name || 'Unknown';

  const detail = useMemo(() => {
    if (type === 'active' && insights.activePlayer) {
      const playerId = insights.activePlayer.id;
      const matches = filteredMatches.filter(m => m.team1.includes(playerId) || m.team2.includes(playerId));
      const wins = matches.filter(m => {
        const result = getMatchResultLabel(m, playerId);
        return result.text === 'Thắng';
      }).length;

      return {
        title: 'Cày ải nhiều nhất',
        subtitle: `${insights.activePlayer.name} có số trận tham gia cao nhất trong bộ lọc ${selectedWeekLabel}.`,
        summary: [
          ['Người chơi', insights.activePlayer.name],
          ['Số trận', `${matches.length}`],
          ['Thắng / thua', `${wins} / ${matches.length - wins}`],
        ],
        explanation: 'Chỉ số này đếm số trận mà người chơi xuất hiện ở một trong hai đội trong bộ lọc thời gian hiện tại.',
        matches,
        playerId,
        duoIds: null as string[] | null,
      };
    }

    if (type === 'streak' && insights.bestStreak) {
      const playerId = insights.bestStreak.id;
      const matches = getLongestWinStreakMatches(filteredMatches, playerId);

      return {
        title: 'Chuỗi thắng dài nhất',
        subtitle: `${insights.bestStreak.name} có chuỗi thắng dài nhất trong bộ lọc ${selectedWeekLabel}.`,
        summary: [
          ['Người chơi', insights.bestStreak.name],
          ['Chuỗi thắng', `${matches.length} trận`],
          ['Khoảng thời gian', matches.length > 0 ? `${formatMatchDate(matches[matches.length - 1].date)} → ${formatMatchDate(matches[0].date)}` : 'N/A'],
        ],
        explanation: 'Chỉ số này duyệt các trận theo thứ tự thời gian và lấy đoạn thắng liên tiếp dài nhất của từng người. Trận thua sẽ ngắt chuỗi.',
        matches,
        playerId,
        duoIds: null as string[] | null,
      };
    }

    if (type === 'duo' && insights.bestDuo) {
      const duoIds = insights.bestDuo.ids.split('_');
      const matches = filteredMatches.filter(m => isDuoMatch(m, duoIds));
      const wins = matches.filter(m => isDuoWin(m, duoIds)).length;
      const winRate = matches.length > 0 ? (wins / matches.length) * 100 : 0;

      return {
        title: 'Cặp bài trùng nhất',
        subtitle: `${insights.bestDuo.names} có tỉ lệ thắng tốt nhất trong nhóm cặp đủ điều kiện.`,
        summary: [
          ['Cặp đôi', insights.bestDuo.names],
          ['Thắng / trận', `${wins} / ${matches.length}`],
          ['Tỉ lệ thắng', `${winRate.toFixed(0)}%`],
        ],
        explanation: 'Chỉ số này gom các cặp từng đứng cùng đội, ưu tiên cặp có từ 2 trận trở lên nếu có dữ liệu, rồi xếp theo tỉ lệ thắng và số trận.',
        matches,
        playerId: undefined,
        duoIds,
      };
    }

    return null;
  }, [filteredMatches, insights, selectedWeekLabel, type]);

  if (!detail) return null;
  const mobileOverlayStyle: CSSProperties | undefined = isMobileViewport ? {
    top: viewportRect.offsetTop,
    left: viewportRect.offsetLeft,
    width: viewportRect.width,
    height: viewportRect.height,
  } : undefined;
  const mobileDialogStyle: CSSProperties | undefined = isMobileViewport ? {
    top: viewportRect.offsetTop + viewportRect.height / 2,
    left: viewportRect.offsetLeft + viewportRect.width / 2,
    width: Math.max(240, viewportRect.width - 24),
    height: Math.max(240, viewportRect.height - 24),
    transform: 'translate(-50%, -50%)',
  } : undefined;

  return createPortal(
    <div
      className="fixed z-[100] overflow-hidden overscroll-contain bg-slate-950/75 backdrop-blur-md sm:inset-0 sm:flex sm:items-start sm:justify-center sm:p-6 sm:pt-[76px]"
      style={mobileOverlayStyle}
      role="dialog"
      aria-modal="true"
      aria-label={detail.title}
      onClick={onClose}
    >
      <div
        className="modal-surface fixed flex max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden shadow-2xl border border-white/10 sm:static sm:h-[calc(100dvh-5.5rem)] sm:max-h-[720px] sm:w-full sm:max-w-4xl"
        style={mobileDialogStyle}
        onClick={e => e.stopPropagation()}
      >
        <div className="relative flex-shrink-0 bg-slate-900 border-b border-white/10 p-4 pr-14 sm:p-5 sm:pr-14 pt-safe-modal">
          <div className="min-w-0">
            <div className="min-w-0">
              <p className="text-[10px] text-teal-600 font-bold uppercase tracking-wider mb-2">Giải thích thống kê</p>
              <h3 className="text-lg sm:text-xl font-black text-white">{detail.title}</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{detail.subtitle}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute right-3 top-safe-btn z-20 text-slate-400 hover:bg-white/5 hover:text-white cursor-pointer p-2"
            aria-label="Đóng popup"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto scroll-hide p-3 sm:p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {detail.summary.map(([label, value]) => (
              <div key={label} className="bg-white/5 border border-white/5 rounded-xl p-3 min-w-0">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{label}</p>
                <SummaryValue label={label} value={value} />
              </div>
            ))}
          </div>

          <div className="bg-teal-500/10 border border-teal-500/15 rounded-xl p-3 sm:p-4 text-sm text-slate-300 leading-relaxed">
            {detail.explanation}
          </div>

          <Card className="min-h-0">
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-400" />
                Các trận tạo nên chỉ số
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {detail.matches.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-6">Không có trận phù hợp trong bộ lọc hiện tại.</p>
              ) : (
                <div className="space-y-2 sm:space-y-0 sm:divide-y sm:divide-white/5">
                  {detail.matches.map(match => {
                    const playerResult = detail.playerId ? getMatchResultLabel(match, detail.playerId) : undefined;
                    const duoResult = detail.duoIds
                      ? { text: isDuoWin(match, detail.duoIds) ? 'Thắng' : 'Thua', className: isDuoWin(match, detail.duoIds) ? 'text-emerald-400' : 'text-rose-400' }
                      : undefined;
                    const result = playerResult || duoResult || getMatchResultLabel(match);
                    const isPositiveResult = result.className.includes('emerald');

                    return (
                      <div key={match.id} className="rounded-xl border border-white/5 bg-white/[0.03] p-3 text-sm sm:grid sm:grid-cols-[120px_1fr_auto_auto] sm:items-center sm:gap-3 sm:rounded-none sm:border-0 sm:bg-transparent sm:p-4">
                        <div className="mb-2 flex items-center justify-between gap-3 sm:mb-0 sm:block">
                          <div className="text-slate-400 tabular-nums text-xs sm:text-sm">{formatMatchDate(match.date)}</div>
                          <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-wider sm:hidden ${
                            isPositiveResult
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/15'
                          }`}>
                            {result.text}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-100 truncate">
                            {getTeamLabel(match.team1, getPlayerName)}
                          </div>
                          <div className="text-xs text-slate-500 truncate">
                            vs {getTeamLabel(match.team2, getPlayerName)}
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-950/30 px-3 py-2 sm:mt-0 sm:block sm:rounded-none sm:bg-transparent sm:px-0 sm:py-0">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 sm:hidden">Tỉ số</span>
                          <span className="font-mono text-base font-black text-white whitespace-nowrap sm:text-sm sm:font-bold">
                            {match.score1} - {match.score2}
                          </span>
                        </div>
                        <div className={`hidden font-bold whitespace-nowrap sm:block ${result.className}`}>
                          {result.text}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function Analytics({ active = true }: { active?: boolean }) {
  const { players, matches, theme, selectedWeek, setSelectedWeek } = useStore();
  const [activeInsight, setActiveInsight] = useState<InsightDetail | null>(null);

  const weekOptions = useMemo(() => getWeekOptions(matches), [matches]);

  const filteredMatches = useMemo(() => {
    const scopedMatches = (() => {
      if (selectedWeek === 'all') return matches;
      const weekInfo = weekOptions.find(w => w.id === selectedWeek);
      if (!weekInfo) return [];
      return matches.filter(m => isMatchInWeek(m.date, weekInfo.start, weekInfo.end));
    })();

    return [...scopedMatches].sort((a, b) => getMatchTime(b.date) - getMatchTime(a.date));
  }, [matches, selectedWeek, weekOptions]);

  // Khởi tạo bảng xếp hạng và Elo history
  const leaderboard = useMemo(() => calculateLeaderboard(players, filteredMatches), [players, filteredMatches]);
  const fullEloHistory = useMemo(() => calculateEloHistory(players, matches), [players, matches]);

  // Lọc Elo History theo tuần được chọn, giữ nguyên Elo tích lũy thực tế
  const eloHistory = useMemo(() => {
    if (selectedWeek === 'all') return fullEloHistory;
    const weekInfo = weekOptions.find(w => w.id === selectedWeek);
    if (!weekInfo) return fullEloHistory;

    const weekPoints = fullEloHistory.filter(pt => pt.date && isMatchInWeek(pt.date, weekInfo.start, weekInfo.end));

    if (weekPoints.length === 0) {
      let lastPointBeforeWeek = fullEloHistory[0];
      for (let i = 1; i < fullEloHistory.length; i++) {
        const pt = fullEloHistory[i];
        try {
          const ptDate = parseISO(pt.date);
          if (ptDate.getTime() < weekInfo.start.getTime()) {
            lastPointBeforeWeek = pt;
          } else {
            break;
          }
        } catch (e) {}
      }
      return [{
        ...lastPointBeforeWeek,
        name: 'Không có trận',
        date: ''
      }];
    }

    const firstWeekPointIndex = fullEloHistory.findIndex(pt => pt === weekPoints[0]);
    const startPoint = firstWeekPointIndex > 0 ? fullEloHistory[firstWeekPointIndex - 1] : fullEloHistory[0];

    const formattedStartPoint = {
      ...startPoint,
      name: 'Bắt đầu',
      date: ''
    };

    const formattedWeekPoints = weekPoints.map((pt, idx) => ({
      ...pt,
      name: `Trận ${idx + 1}`
    }));

    return [formattedStartPoint, ...formattedWeekPoints];
  }, [fullEloHistory, selectedWeek, weekOptions]);

  // Lấy danh sách Top 3 người chơi có Elo cao nhất để hiển thị mặc định
  const defaultSelectedPlayers = useMemo(() => {
    return leaderboard.slice(0, 3).map(p => p.name);
  }, [leaderboard]);

  const [visiblePlayers, setVisiblePlayers] = useState<string[]>(defaultSelectedPlayers);

  // Tự động cập nhật danh sách người chơi hiển thị khi đổi tuần
  useEffect(() => {
    setVisiblePlayers(leaderboard.slice(0, 3).map(p => p.name));
  }, [selectedWeek, leaderboard]);

  // 1. Phân tích Cặp đôi ăn ý (Duo synergy)
  const duoStats = useMemo(() => {
    const duoMap: Record<string, { wins: number; total: number; names: string }> = {};

    filteredMatches.forEach(m => {
      const isTeam1Win = m.score1 > m.score2;
      const isTeam2Win = m.score2 > m.score1;
      const isDraw = m.score1 === m.score2;

      const processTeam = (team: [string, string], isWin: boolean) => {
        if (team.length < 2) return;
        const [p1Id, p2Id] = [...team].sort();
        const p1 = players.find(p => p.id === p1Id);
        const p2 = players.find(p => p.id === p2Id);
        if (!p1 || !p2) return;

        const key = `${p1Id}_${p2Id}`;
        if (!duoMap[key]) {
          duoMap[key] = {
            wins: 0,
            total: 0,
            names: `${p1.name} & ${p2.name}`
          };
        }

        duoMap[key].total += 1;
        if (isWin && !isDraw) {
          duoMap[key].wins += 1;
        }
      };

      processTeam(m.team1, isTeam1Win);
      processTeam(m.team2, isTeam2Win);
    });

    const list: DuoStat[] = Object.entries(duoMap).map(([ids, data]) => ({
      ids,
      names: data.names,
      total: data.total,
      wins: data.wins,
      winRate: data.total > 0 ? (data.wins / data.total) * 100 : 0
    }));

    return list;
  }, [filteredMatches, players]);

  // Ưu tiên lọc các cặp thi đấu từ 2 trận trở lên để số liệu tin cậy
  const processedDuos = useMemo(() => {
    const minMatches = duoStats.some(d => d.total >= 2) ? 2 : 1;
    return duoStats
      .filter(d => d.total >= minMatches)
      .sort((a, b) => {
        if (b.winRate !== a.winRate) return b.winRate - a.winRate;
        return b.total - a.total;
      })
      .slice(0, 5); // Lấy Top 5 cặp xuất sắc nhất
  }, [duoStats]);

  // 2. Thống kê trận đấu theo ngày (Activity)
  const activityStats = useMemo(() => {
    const map: Record<string, number> = {};
    filteredMatches.forEach(m => {
      const d = m.date.substring(0, 10);
      map[d] = (map[d] || 0) + 1;
    });

    return Object.entries(map)
      .map(([date, count]) => {
        const parts = date.split('-');
        const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}` : date;
        return {
          date,
          formattedDate,
          count
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredMatches]);

  // 3. Tính toán chuỗi thắng dài nhất của mỗi người chơi trong bộ lọc hiện tại
  const playerStreaks = useMemo(() => {
    const streaks: Record<string, number> = {};
    const chronologicalMatches = [...filteredMatches].reverse();

    players.forEach(p => {
      streaks[p.id] = 0;
      let currentStreak = 0;

      for (const m of chronologicalMatches) {
        const isTeam1 = m.team1.includes(p.id);
        const isTeam2 = m.team2.includes(p.id);
        if (!isTeam1 && !isTeam2) continue; // Không tham gia trận này, bỏ qua

        const isTeam1Win = m.score1 > m.score2;
        const isTeam2Win = m.score2 > m.score1;
        const isWin = (isTeam1 && isTeam1Win) || (isTeam2 && isTeam2Win);

        if (isWin) {
          currentStreak += 1;
          streaks[p.id] = Math.max(streaks[p.id], currentStreak);
        } else {
          currentStreak = 0;
        }
      }
    });
    return streaks;
  }, [filteredMatches, players]);

  // 4. Quick Insights
  const insights = useMemo(() => {
    if (leaderboard.length === 0) return null;

    // Người chơi cày ải (nhiều trận nhất)
    const activePlayer = leaderboard.reduce((max, p) => p.totalMatches > max.totalMatches ? p : max, leaderboard[0]);

    // Chuỗi thắng dài nhất trong bộ lọc hiện tại
    let maxStreak = 0;
    let streakPlayer: { id: string; name: string } | null = null;
    Object.entries(playerStreaks).forEach(([id, val]) => {
      const streak = val as number;
      if (streak > maxStreak) {
        maxStreak = streak;
        const p = players.find(x => x.id === id);
        if (p) streakPlayer = { id: p.id, name: p.name };
      }
    });

    // Cặp đôi hủy diệt
    const bestDuo = processedDuos[0];

    return {
      activePlayer: activePlayer.totalMatches > 0 ? { id: activePlayer.playerId, name: activePlayer.name, matches: activePlayer.totalMatches } : null,
      bestStreak: maxStreak > 0 && streakPlayer ? { id: streakPlayer.id, name: streakPlayer.name, streak: maxStreak } : null,
      bestDuo: bestDuo ? { ids: bestDuo.ids, names: bestDuo.names, winRate: bestDuo.winRate, total: bestDuo.total, wins: bestDuo.wins } : null
    };
  }, [leaderboard, playerStreaks, processedDuos, players]);

  const handleTogglePlayer = (playerName: string) => {
    setVisiblePlayers(prev =>
      prev.includes(playerName)
        ? prev.filter(p => p !== playerName)
        : [...prev, playerName]
    );
  };

  const getPlayerColor = (name: string, index: number) => {
    return PLAYER_COLORS[name] || FALLBACK_COLORS[index % FALLBACK_COLORS.length];
  };

  // Màu sắc biểu đồ động theo Theme
  const axisStroke = theme === 'light' ? 'rgba(15, 23, 42, 0.15)' : 'rgba(255, 255, 255, 0.15)';
  const gridStroke = theme === 'light' ? 'rgba(15, 23, 42, 0.04)' : 'rgba(255, 255, 255, 0.04)';
  const textFill = theme === 'light' ? '#475569' : '#94a3b8';
  const legendColor = theme === 'light' ? '#1e293b' : '#cbd5e1';
  const visiblePlayersKey = visiblePlayers.join('|');
  const selectedWeekLabel = selectedWeek === 'all'
    ? 'Toàn thời gian'
    : weekOptions.find(w => w.id === selectedWeek)?.label || 'Bộ lọc hiện tại';

  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-4">
        <BarChart2 className="w-16 h-16 text-slate-600 animate-pulse" />
        <p className="text-sm font-semibold">Chưa có đủ dữ liệu trận đấu để hiển thị biểu đồ thống kê.</p>
        <p className="text-xs text-slate-500">Vui lòng thêm một vài trận đấu trước.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="analytics-content">
      {/* Bộ lọc thời gian theo tuần */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 glass p-4 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500/10 to-indigo-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shadow-md">
            <BarChart2 className="w-5 h-5 text-teal-400 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider">Thống Kê Chi Tiết</h2>
            <p className="text-[11px] text-slate-400 font-medium">Phân tích hiệu suất và xu hướng của các tuyển thủ</p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400 whitespace-nowrap">Thời gian:</span>
          <Select 
            value={selectedWeek} 
            onChange={e => setSelectedWeek(e.target.value)} 
            className="w-full sm:w-[260px] text-xs h-9 bg-slate-900 border-white/10 text-white rounded-lg"
          >
            <option value="all" className="bg-slate-900">Toàn thời gian</option>
            {weekOptions.map(option => (
              <option key={option.id} value={option.id} className="bg-slate-900">
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div key={`analytics-${selectedWeek}`} className="space-y-6 filter-refresh">
        {/* 1. Quick Insights Cards */}
        {insights && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card
              role="button"
              tabIndex={0}
              onClick={() => insights.activePlayer && setActiveInsight('active')}
              onKeyDown={e => {
                if ((e.key === 'Enter' || e.key === ' ') && insights.activePlayer) {
                  e.preventDefault();
                  setActiveInsight('active');
                }
              }}
              className="hover:border-teal-500/20 transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-400"
              title="Xem chi tiết cày ải nhiều nhất"
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shadow-md">
                  <Swords className="w-6 h-6" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Cày Ải Nhiều Nhất</span>
                  <span className="text-sm font-bold text-white mt-0.5">
                    {insights.activePlayer ? `${insights.activePlayer.name} (${insights.activePlayer.matches} trận)` : 'N/A'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card
              role="button"
              tabIndex={0}
              onClick={() => insights.bestStreak && setActiveInsight('streak')}
              onKeyDown={e => {
                if ((e.key === 'Enter' || e.key === ' ') && insights.bestStreak) {
                  e.preventDefault();
                  setActiveInsight('streak');
                }
              }}
              className="hover:border-amber-500/20 transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400"
              title="Xem chi tiết chuỗi thắng dài nhất"
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-md animate-pulse">
                  <Flame className="w-6 h-6" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Chuỗi Thắng Dài Nhất</span>
                  <span className="text-sm font-bold text-white mt-0.5">
                    {insights.bestStreak ? `${insights.bestStreak.name} (🔥 ${insights.bestStreak.streak} trận)` : 'Chưa có'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card
              role="button"
              tabIndex={0}
              onClick={() => insights.bestDuo && setActiveInsight('duo')}
              onKeyDown={e => {
                if ((e.key === 'Enter' || e.key === ' ') && insights.bestDuo) {
                  e.preventDefault();
                  setActiveInsight('duo');
                }
              }}
              className="hover:border-rose-500/20 transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-400"
              title="Xem chi tiết cặp bài trùng nhất"
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shadow-md">
                  <Puzzle className="w-6 h-6" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Cặp Bài Trùng Nhất</span>
                  <span className="text-xs font-bold text-white mt-0.5 leading-tight truncate max-w-[180px]" title={insights.bestDuo?.names}>
                    {insights.bestDuo ? insights.bestDuo.names : 'Chưa có'}
                  </span>
                  {insights.bestDuo && (
                    <span className="text-[10px] text-emerald-400 font-medium">
                      Tỉ lệ thắng: {insights.bestDuo.winRate.toFixed(0)}% ({insights.bestDuo.total} trận)
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* 2. Elo Rating Trend Line Chart */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-sm xs:text-base sm:text-lg font-bold flex items-center gap-2 text-white">
                <Trophy className="w-5 h-5 text-amber-500 flex-shrink-0" />
                BIẾN ĐỘNG ĐIỂM ELO
              </CardTitle>
              <CardDescription className="text-[11px] sm:text-xs text-slate-400 font-medium mt-0.5 leading-tight">
                Biến động sức mạnh Elo qua các trận đấu
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent key={`${selectedWeek}-${visiblePlayersKey}`} className="p-3 sm:p-6 pt-2 filter-refresh">
          {/* Bộ lọc người chơi dạng Chips clean & tinh tế */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-6 pb-4 border-b border-white/5">
            <span className="text-[11px] font-semibold text-slate-400 flex-shrink-0">
              Hiển thị trên biểu đồ:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {players.map((p, index) => {
                const isChecked = visiblePlayers.includes(p.name);
                const color = getPlayerColor(p.name, index);
                return (
                  <button
                    key={p.id}
                    onClick={() => handleTogglePlayer(p.name)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all duration-300 flex items-center gap-1.5 cursor-pointer border ${
                      isChecked
                        ? 'shadow-sm border-transparent'
                        : 'border-transparent text-slate-400 hover:text-slate-200 bg-transparent'
                    }`}
                    style={{
                      borderColor: isChecked ? `${color}30` : 'transparent',
                      backgroundColor: isChecked ? `${color}12` : 'transparent',
                      color: isChecked ? color : undefined,
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full block transition-transform duration-300"
                      style={{ 
                        backgroundColor: color,
                        transform: isChecked ? 'scale(1.15)' : 'scale(1)',
                        boxShadow: isChecked ? `0 0 5px ${color}` : 'none'
                      }}
                    />
                    <span>{p.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-[320px] w-full">
            {active && (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <LineChart
                  data={eloHistory}
                  margin={{ top: 10, right: 5, left: -30, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis
                    dataKey="name"
                    stroke={axisStroke}
                    tick={{ fill: textFill }}
                    fontSize={10}
                    tickLine={false}
                  />
                  <YAxis
                    domain={['dataMin - 50', 'dataMax + 50']}
                    stroke={axisStroke}
                    tick={{ fill: textFill }}
                    fontSize={10}
                    tickLine={false}
                  />
                  <Tooltip content={<EloTooltip theme={theme} />} />
                  {players.map((p, index) => {
                    if (!visiblePlayers.includes(p.name)) return null;
                    return (
                      <Line
                        key={p.id}
                        type="monotone"
                        dataKey={p.name}
                        name={p.name}
                        stroke={getPlayerColor(p.name, index)}
                        strokeWidth={3}
                        dot={{ r: 2 }}
                        activeDot={{ r: 5 }}
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 3. Duo Synergy & Activity Stats split */}
      <div key={`analytics-lower-${selectedWeek}`} className="grid grid-cols-1 md:grid-cols-2 gap-6 filter-refresh">
        {/* Duo Synergy */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm xs:text-base sm:text-lg font-bold flex items-center gap-2 text-white">
              <Award className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              CẶP BÀI TRÙNG (TOP 5)
            </CardTitle>
            <CardDescription className="text-[11px] sm:text-xs text-slate-400 font-medium mt-0.5 leading-tight">
              Tỉ lệ thắng khi thi đấu cùng nhau (≥ 2 trận)
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            {processedDuos.length > 0 ? (
              <div className="h-[260px] w-full">
                {active && (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <BarChart
                      data={processedDuos}
                      layout="vertical"
                      margin={{ top: 5, right: 5, left: -25, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} horizontal={false} />
                      <XAxis
                        type="number"
                        domain={[0, 100]}
                        stroke={axisStroke}
                        tick={{ fill: textFill }}
                        fontSize={10}
                        tickLine={false}
                      />
                      <YAxis
                        dataKey="names"
                        type="category"
                        stroke={axisStroke}
                        tick={{ fill: textFill }}
                        fontSize={10}
                        width={120}
                        tickLine={false}
                      />
                      <Tooltip content={<DuoTooltip theme={theme} />} />
                      <Bar
                        dataKey="winRate"
                        radius={[0, 4, 4, 0]}
                        barSize={12}
                      >
                        {processedDuos.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={index === 0 ? '#10b981' : 'url(#bar-grad)'} // Màu lục nổi bật cho vị trí Top 1
                          />
                        ))}
                      </Bar>
                      <defs>
                        <linearGradient id="bar-grad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#2dd4bf" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="#2dd4bf" stopOpacity={0.8} />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[260px] text-slate-500">
                <span className="text-xs">Chưa ghi nhận cặp đấu nào đấu cùng nhau từ 2 trận trở lên.</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Matches count */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm xs:text-base sm:text-lg font-bold flex items-center gap-2 text-white">
              <Calendar className="w-5 h-5 text-indigo-400 flex-shrink-0" />
              TẦN SUẤT TRẬN ĐẤU
            </CardTitle>
            <CardDescription className="text-[11px] sm:text-xs text-slate-400 font-medium mt-0.5 leading-tight">
              Số trận đấu được tổ chức theo từng ngày
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <div className="h-[260px] w-full">
              {active && (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <BarChart
                    data={activityStats}
                    margin={{ top: 5, right: 5, left: -30, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                    <XAxis
                      dataKey="formattedDate"
                      stroke={axisStroke}
                      tick={{ fill: textFill }}
                      fontSize={10}
                      tickLine={false}
                    />
                    <YAxis
                      stroke={axisStroke}
                      tick={{ fill: textFill }}
                      fontSize={10}
                      allowDecimals={false}
                      tickLine={false}
                    />
                    <Tooltip content={<ActivityTooltip theme={theme} />} />
                    <Bar
                      dataKey="count"
                      fill="url(#active-bar-grad)"
                      radius={[4, 4, 0, 0]}
                      barSize={20}
                    />
                    <defs>
                      <linearGradient id="active-bar-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.2} />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {activeInsight && insights && (
        <InsightDetailModal
          type={activeInsight}
          insights={insights}
          filteredMatches={filteredMatches}
          players={players}
          selectedWeekLabel={selectedWeekLabel}
          onClose={() => setActiveInsight(null)}
        />
      )}
    </div>
  );
}
