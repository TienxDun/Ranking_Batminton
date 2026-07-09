import React, { CSSProperties, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, Swords, TrendingDown, TrendingUp, Trophy, User, Users, X } from 'lucide-react';
import { Match, Player, PlayerStats } from '../../types';
import { calculatePlayerEloBreakdown, PlayerEloMatchBreakdown } from '../../utils/calculations';
import { useModalHistory } from '../../hooks/useModalHistory';
import { useVisualViewportRect } from '../../hooks/useVisualViewportRect';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { MatchDetailModal } from '../match-history/MatchDetailModal';

function formatMatchDate(date: string): string {
  try {
    const parsed = new Date(date);
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

function getMatchResult(match: Match, playerId: string): 'win' | 'loss' | 'draw' {
  const isTeam1 = match.team1.includes(playerId);
  if (match.score1 === match.score2) return 'draw';
  if (isTeam1) return match.score1 > match.score2 ? 'win' : 'loss';
  return match.score2 > match.score1 ? 'win' : 'loss';
}

function formatDelta(value: number): string {
  return `${value >= 0 ? '+' : ''}${value}`;
}

function summarizeById(
  breakdown: PlayerEloMatchBreakdown[],
  getIds: (item: PlayerEloMatchBreakdown) => string[]
) {
  const map: Record<string, { id: string; matches: number; wins: number }> = {};

  breakdown.forEach(item => {
    getIds(item).forEach(id => {
      if (!id) return;
      if (!map[id]) {
        map[id] = { id, matches: 0, wins: 0 };
      }
      map[id].matches += 1;
      if (item.isWin) {
        map[id].wins += 1;
      }
    });
  });

  return Object.values(map)
    .sort((a, b) => b.matches - a.matches || b.wins - a.wins)
    .slice(0, 4);
}

interface PlayerDetailContentModel {
  player: PlayerStats & { displayRank: number };
  totalDelta: number;
  biggestGain?: PlayerEloMatchBreakdown;
  biggestLoss?: PlayerEloMatchBreakdown;
  partnerStats: Array<{ id: string; matches: number; wins: number }>;
  opponentStats: Array<{ id: string; matches: number; wins: number }>;
  breakdown: PlayerEloMatchBreakdown[];
  getPlayerName: (id: string) => string;
  selectMatch: (match: Match) => void;
}

function PlayerSummary({ model }: { model: PlayerDetailContentModel }) {
  const { player, totalDelta } = model;
  return (
    <>
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-2 sm:gap-3">
            {[
              ['Elo', player.rating, 'text-teal-400'],
              ['Từ mốc 1500', formatDelta(totalDelta), totalDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'],
              ['Trận', player.totalMatches, 'text-white'],
              ['Thắng', player.wins, 'text-emerald-400'],
              ['Thua', player.losses, 'text-rose-400'],
              ['Tỉ lệ', `${player.winRate.toFixed(1)}%`, player.winRate >= 50 ? 'text-teal-400' : 'text-rose-400'],
            ].map(([label, value, color]) => (
              <div key={label} className="bg-white/5 border border-white/5 rounded-xl p-3 min-w-0">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider truncate">{label}</p>
                <p className={`text-lg font-black mt-1 tabular-nums ${color}`}>{value}</p>
              </div>
            ))}
          </div>
    </>
  );
}

function PlayerInsights({ model }: { model: PlayerDetailContentModel }) {
  const { totalDelta, biggestGain, biggestLoss, partnerStats, opponentStats, getPlayerName, selectMatch: setSelectedMatch } = model;
  return (
    <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <Card className="border-teal-500/15">
              <CardHeader className="p-3 pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-teal-400" />
                  Vì sao Elo hiện tại?
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 space-y-2.5 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-400">Elo khởi điểm</span>
                  <span className="font-bold text-slate-200 tabular-nums">1500</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-400">Tổng thay đổi</span>
                  <span className={`font-bold tabular-nums ${totalDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatDelta(totalDelta)}
                  </span>
                </div>
                <button
                  type="button"
                  disabled={!biggestGain}
                  onClick={() => biggestGain && setSelectedMatch(biggestGain.match)}
                  className="flex w-full items-center justify-between gap-3 rounded-lg text-left transition-colors enabled:cursor-pointer enabled:hover:bg-white/5 disabled:cursor-default"
                  title={biggestGain ? 'Xem chi tiết trận tăng mạnh nhất' : undefined}
                >
                  <span className="text-slate-400">Trận tăng mạnh nhất</span>
                  <span className="font-bold text-emerald-400 tabular-nums">
                    {biggestGain ? formatDelta(biggestGain.delta) : 'N/A'}
                  </span>
                </button>
                <button
                  type="button"
                  disabled={!biggestLoss}
                  onClick={() => biggestLoss && setSelectedMatch(biggestLoss.match)}
                  className="flex w-full items-center justify-between gap-3 rounded-lg text-left transition-colors enabled:cursor-pointer enabled:hover:bg-white/5 disabled:cursor-default"
                  title={biggestLoss ? 'Xem chi tiết trận giảm mạnh nhất' : undefined}
                >
                  <span className="text-slate-400">Trận giảm mạnh nhất</span>
                  <span className="font-bold text-rose-400 tabular-nums">
                    {biggestLoss ? biggestLoss.delta : 'N/A'}
                  </span>
                </button>
                <p className="text-xs text-slate-500 leading-relaxed pt-2 border-t border-white/5">
                  Elo đổi theo sức mạnh trung bình hai đội, kết quả thắng/thua và độ chênh điểm. Thắng đội mạnh hoặc thắng cách biệt sẽ tăng nhiều hơn.
                </p>
              </CardContent>
            </Card>

            <Card className="border-emerald-500/15">
              <CardHeader className="p-3 pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  Đồng đội thường gặp
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 space-y-2">
                {partnerStats.length === 0 ? (
                  <p className="text-xs text-slate-500">Chưa có dữ liệu.</p>
                ) : partnerStats.map(item => (
                  <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-semibold text-slate-200 truncate">{getPlayerName(item.id)}</span>
                    <span className="text-xs text-slate-400 whitespace-nowrap">
                      {item.wins}/{item.matches} thắng
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-amber-500/15">
              <CardHeader className="p-3 pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Swords className="w-4 h-4 text-amber-400" />
                  Đối thủ gặp nhiều
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 space-y-2">
                {opponentStats.length === 0 ? (
                  <p className="text-xs text-slate-500">Chưa có dữ liệu.</p>
                ) : opponentStats.map(item => (
                  <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-semibold text-slate-200 truncate">{getPlayerName(item.id)}</span>
                    <span className="text-xs text-slate-400 whitespace-nowrap">
                      gặp {item.matches} trận
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
    </>
  );
}

function PlayerMatchHistory({ model }: { model: PlayerDetailContentModel }) {
  const { breakdown, player, getPlayerName, selectMatch: setSelectedMatch } = model;
  return (
    <>
          <Card className="min-h-0">
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-teal-400" />
                Tất cả trận đấu và biến động Elo
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto scroll-hide">
                <Table className="text-xs sm:text-sm">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap px-3">Ngày</TableHead>
                      <TableHead className="whitespace-nowrap px-3">Trận đấu</TableHead>
                      <TableHead className="text-center whitespace-nowrap px-3">Tỉ số</TableHead>
                      <TableHead className="text-center whitespace-nowrap px-3">KQ</TableHead>
                      <TableHead className="text-right whitespace-nowrap px-3">Elo</TableHead>
                      <TableHead className="text-right whitespace-nowrap px-3">+/-</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {breakdown.map(item => {
                      const result = getMatchResult(item.match, player.playerId);
                      const playerTeam = item.match.team1.includes(player.playerId) ? item.match.team1 : item.match.team2;
                      const otherTeam = item.match.team1.includes(player.playerId) ? item.match.team2 : item.match.team1;

                      return (
                        <TableRow
                          key={item.match.id}
                          role="button"
                          tabIndex={0}
                          title="Xem chi tiết trận đấu"
                          className="cursor-pointer transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-400"
                          onClick={() => setSelectedMatch(item.match)}
                          onKeyDown={event => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              setSelectedMatch(item.match);
                            }
                          }}
                        >
                          <TableCell className="whitespace-nowrap px-3 py-2 text-slate-300 tabular-nums">
                            {formatMatchDate(item.match.date)}
                          </TableCell>
                          <TableCell className="px-3 py-2 min-w-[220px]">
                            <div className="font-semibold text-slate-100">
                              {getPlayerName(playerTeam[0])} - {getPlayerName(playerTeam[1])}
                            </div>
                            <div className="text-xs text-slate-500">
                              vs {getPlayerName(otherTeam[0])} - {getPlayerName(otherTeam[1])}
                            </div>
                          </TableCell>
                          <TableCell className="text-center whitespace-nowrap px-3 py-2 font-mono font-bold">
                            {item.match.score1} - {item.match.score2}
                          </TableCell>
                          <TableCell className="text-center whitespace-nowrap px-3 py-2">
                            <span className={`font-bold ${result === 'win' ? 'text-emerald-400' : result === 'loss' ? 'text-rose-400' : 'text-slate-400'}`}>
                              {result === 'win' ? 'Thắng' : result === 'loss' ? 'Thua' : 'Hòa'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap px-3 py-2 tabular-nums text-slate-300">
                            {item.ratingBefore} → <span className="font-bold text-white">{item.ratingAfter}</span>
                          </TableCell>
                          <TableCell className={`text-right whitespace-nowrap px-3 py-2 font-bold tabular-nums ${item.delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {formatDelta(item.delta)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {breakdown.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-slate-500 py-6">
                          Người chơi này chưa có trận trong bộ lọc hiện tại.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
    </>
  );
}

export function PlayerDetailModal({
  player,
  rank,
  matches,
  players,
  selectedWeekLabel,
  onClose,
}: {
  player: PlayerStats & { displayRank: number };
  rank: number;
  matches: Match[];
  players: Player[];
  selectedWeekLabel: string;
  onClose: () => void;
}) {
  const viewportRect = useVisualViewportRect();
  const isMobileViewport = viewportRect.width < 640;
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

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

  const breakdown = useMemo(
    () => calculatePlayerEloBreakdown(players, matches, player.playerId),
    [players, matches, player.playerId]
  );

  const getPlayerName = (id: string) => players.find(p => p.id === id)?.name || 'Unknown';
  const totalDelta = player.rating - 1500;
  const biggestGain = breakdown.length > 0
    ? breakdown.reduce((max, item) => item.delta > max.delta ? item : max)
    : null;
  const biggestLoss = breakdown.length > 0
    ? breakdown.reduce((min, item) => item.delta < min.delta ? item : min)
    : null;
  const partnerStats = summarizeById(breakdown, item => [item.partnerId]);
  const opponentStats = summarizeById(breakdown, item => item.opponentIds);
  const contentModel: PlayerDetailContentModel = {
    player, totalDelta, biggestGain, biggestLoss, partnerStats, opponentStats,
    breakdown, getPlayerName, selectMatch: setSelectedMatch,
  };
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
      aria-label={`Chi tiết người chơi ${player.name}`}
      onClick={onClose}
    >
      <div
        className="modal-surface fixed flex max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden shadow-2xl border border-white/10 sm:static sm:h-[calc(100dvh-5.5rem)] sm:max-h-[760px] sm:w-full sm:max-w-5xl"
        style={mobileDialogStyle}
        onClick={e => e.stopPropagation()}
      >
        <div className="relative flex-shrink-0 bg-slate-900 border-b border-white/10 p-4 pr-14 sm:p-5 sm:pr-14 pt-safe-modal">
          <div className="min-w-0">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-teal-600 mb-2">
                <User className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Hồ sơ năng lực</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white leading-tight truncate">{player.name}</h3>
              <p className="text-xs text-slate-400 mt-1">
                Hạng {rank} trong bộ lọc: {selectedWeekLabel}
              </p>
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
          <PlayerSummary model={contentModel} />

          <PlayerInsights model={contentModel} />

          <PlayerMatchHistory model={contentModel} />
        </div>
      </div>

      {selectedMatch && (
        <MatchDetailModal
          match={selectedMatch}
          matches={matches}
          players={players}
          getPlayerName={getPlayerName}
          onClose={() => setSelectedMatch(null)}
        />
      )}
    </div>,
    document.body
  );
}
