import React, { CSSProperties, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { parseISO } from 'date-fns';
import { Calendar, X } from 'lucide-react';
import { useStore } from '../../store';
import { Match } from '../../types';
import { useModalHistory } from '../../hooks/useModalHistory';
import { useVisualViewportRect } from '../../hooks/useVisualViewportRect';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

export type InsightDetail = 'active' | 'streak' | 'duo';

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
export const EloTooltip = ({ active, payload, label, theme }: any) => {
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

export const DuoTooltip = ({ active, payload, theme }: any) => {
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

export const ActivityTooltip = ({ active, payload, theme }: any) => {
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

export function InsightDetailModal({
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

