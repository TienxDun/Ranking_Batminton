import React, { CSSProperties, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../store';
import { calculateLeaderboard, calculatePlayerEloBreakdown, PlayerEloMatchBreakdown } from '../utils/calculations';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Select } from './ui/select';
import { Trophy, Medal, AlertCircle, X, User, TrendingUp, TrendingDown, Users, Swords } from 'lucide-react';
import { getWeekOptions, isMatchInWeek } from '../utils/dateUtils';
import { Button } from './ui/button';
import { Match, Player, PlayerStats } from '../types';
import { useVisualViewportRect } from '../hooks/useVisualViewportRect';
import { MatchDetailModal } from './MatchHistory';

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

function PlayerDetailModal({
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
        className="glass fixed flex max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden shadow-2xl border border-white/10 sm:static sm:h-[calc(100dvh-5.5rem)] sm:max-h-[760px] sm:w-full sm:max-w-5xl"
        style={mobileDialogStyle}
        onClick={e => e.stopPropagation()}
      >
        <div className="relative flex-shrink-0 bg-slate-950/90 backdrop-blur-xl border-b border-white/10 p-4 pr-14 sm:p-5 sm:pr-14">
          <div className="min-w-0">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-teal-400 mb-2">
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
            className="absolute right-3 top-3 z-20 text-slate-400 hover:text-white cursor-pointer p-2"
            aria-label="Đóng popup"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto scroll-hide p-3 sm:p-4 space-y-4">
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
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-400">Trận tăng mạnh nhất</span>
                  <span className="font-bold text-emerald-400 tabular-nums">
                    {biggestGain ? formatDelta(biggestGain.delta) : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-400">Trận giảm mạnh nhất</span>
                  <span className="font-bold text-rose-400 tabular-nums">
                    {biggestLoss ? biggestLoss.delta : 'N/A'}
                  </span>
                </div>
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

export default function Dashboard() {
  const { players, matches, config, selectedWeek, setSelectedWeek } = useStore();
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  const weekOptions = useMemo(() => getWeekOptions(matches), [matches]);

  const filteredMatches = useMemo(() => {
    if (selectedWeek === 'all') return matches;
    const weekInfo = weekOptions.find(w => w.id === selectedWeek);
    if (!weekInfo) return matches;
    return matches.filter(m => isMatchInWeek(m.date, weekInfo.start, weekInfo.end));
  }, [matches, selectedWeek, weekOptions]);

  const leaderboard = useMemo(() => calculateLeaderboard(players, filteredMatches), [players, filteredMatches]);

  const currentMinMatches = selectedWeek === 'all' ? config.minMatchesForMainBoard : 1;

  const mainBoard = leaderboard.filter(p => p.totalMatches >= currentMinMatches);
  const secondaryBoard = leaderboard.filter(p => p.totalMatches < currentMinMatches && p.totalMatches > 0);
  const selectedWeekLabel = selectedWeek === 'all'
    ? 'Toàn thời gian'
    : weekOptions.find(w => w.id === selectedWeek)?.label || 'Bộ lọc hiện tại';

  const renderTable = (data: typeof leaderboard, isMain: boolean) => {
    // Tính toán thứ hạng trước khi render để hỗ trợ đồng hạng (Tied Ranks)
    let currentRank = 1;
    const rankedData = data.map((player, index) => {
      if (index > 0 && player.rating < data[index - 1].rating) {
        currentRank = index + 1;
      }
      return {
        ...player,
        displayRank: currentRank
      };
    });

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-14 min-w-[3.5rem] max-w-[3.5rem] text-center sticky-header-rank whitespace-nowrap px-2">Hạng</TableHead>
            <TableHead className="sticky-header-name min-w-[110px] whitespace-nowrap">Tên</TableHead>
            <TableHead className="text-center whitespace-nowrap">Elo</TableHead>
            <TableHead className="text-center whitespace-nowrap">Trận</TableHead>
            <TableHead className="text-center whitespace-nowrap">Thắng</TableHead>
            <TableHead className="text-center whitespace-nowrap">Thua</TableHead>
            <TableHead className="text-center whitespace-nowrap">Tỉ lệ</TableHead>
            <TableHead className="text-center whitespace-nowrap">Hiệu số</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rankedData.map((player, index) => {
            const isGold = isMain && player.displayRank === 1;
            const isSilver = isMain && player.displayRank === 2;
            const isBronze = isMain && player.displayRank === 3;
            
            let rowClass = "hover:bg-white/5 transition-colors";
            if (isGold) rowClass = "bg-amber-500/5 hover:bg-amber-500/10 transition-colors border-l-2 border-amber-500";
            else if (isSilver) rowClass = "bg-slate-300/5 hover:bg-slate-300/10 transition-colors border-l-2 border-slate-400";
            else if (isBronze) rowClass = "bg-amber-700/5 hover:bg-amber-700/10 transition-colors border-l-2 border-amber-700";

            return (
              <TableRow
                key={player.playerId}
                className={`${rowClass} cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-400`}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedPlayerId(player.playerId)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedPlayerId(player.playerId);
                  }
                }}
                title={`Xem chi tiết ${player.name}`}
              >
                <TableCell className="w-14 min-w-[3.5rem] max-w-[3.5rem] text-center font-medium sticky-rank whitespace-nowrap px-2">
                  {isGold ? <div className="flex items-center justify-center gap-1 text-amber-400 font-bold"><Trophy className="w-4 h-4 text-amber-400 shrink-0" /> 01</div> :
                   isSilver ? <div className="flex items-center justify-center gap-1 text-slate-300 font-bold"><Medal className="w-4 h-4 text-slate-400 shrink-0" /> 02</div> :
                   isBronze ? <div className="flex items-center justify-center gap-1 text-amber-600 font-bold"><Medal className="w-4 h-4 text-amber-700 shrink-0" /> 03</div> :
                   String(player.displayRank).padStart(2, '0')}
                </TableCell>
                <TableCell className="font-semibold text-white sticky-name min-w-[110px] whitespace-nowrap">{player.name}</TableCell>
                <TableCell className="text-center whitespace-nowrap">
                  <span className="px-2 py-1 rounded bg-teal-500/10 text-teal-300 font-bold font-mono border border-teal-500/10">
                    {player.rating}
                  </span>
                </TableCell>
                <TableCell className="text-center text-slate-300 whitespace-nowrap">{player.totalMatches}</TableCell>
                <TableCell className="text-center text-emerald-400 font-semibold whitespace-nowrap">{player.wins}</TableCell>
                <TableCell className="text-center text-rose-400 font-semibold whitespace-nowrap">{player.losses}</TableCell>
                <TableCell className="text-center whitespace-nowrap">
                  <div className="flex flex-col items-center">
                    <span className={`font-bold ${player.winRate >= 50 ? 'text-teal-400' : 'text-rose-400'} whitespace-nowrap`}>
                      {player.winRate.toFixed(1)}%
                    </span>
                    <div className="w-12 h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${player.winRate >= 50 ? 'bg-teal-400' : 'bg-rose-400'}`} 
                        style={{ width: `${player.winRate}%` }}
                      />
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right pr-6 font-mono font-semibold whitespace-nowrap">
                  <span className={player.avgPointDiff > 0 ? "text-emerald-400" : player.avgPointDiff < 0 ? "text-rose-400" : "text-slate-400"}>
                    {player.avgPointDiff > 0 ? "+" : ""}{player.avgPointDiff.toFixed(1)}
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
          {data.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-slate-500 py-4">Chưa có dữ liệu</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    );
  };

  const selectedPlayer = useMemo(() => {
    if (!selectedPlayerId) return null;
    const rankedAll = [...mainBoard, ...secondaryBoard].map((player, index) => ({
      ...player,
      displayRank: index + 1,
    }));
    return rankedAll.find(p => p.playerId === selectedPlayerId) || null;
  }, [mainBoard, secondaryBoard, selectedPlayerId]);

  return (
    <div className="space-y-6" id="dashboard-content">
      <Card>
        <CardHeader className="pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 mb-4">
          <div>
            <CardTitle className="text-sm xs:text-base sm:text-lg font-bold flex items-center gap-1.5 xs:gap-2 text-white whitespace-nowrap">
              <Trophy className="w-4.5 h-4.5 xs:w-5 h-5 text-amber-500 flex-shrink-0" />
              BẢNG XẾP HẠNG CHÍNH
            </CardTitle>
            <p className="text-xs text-slate-400 mt-1">
              {selectedWeek === 'all' 
                ? `Yêu cầu tối thiểu ${config.minMatchesForMainBoard} trận tích lũy` 
                : `Yêu cầu tối thiểu 1 trận trong tuần`}
            </p>
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
        </CardHeader>
        <CardContent key={selectedWeek} className="filter-refresh">
          {renderTable(mainBoard, true)}
        </CardContent>
      </Card>

      {secondaryBoard.length > 0 && (
        <Card key={`secondary-${selectedWeek}`} className="filter-refresh">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm xs:text-base sm:text-lg font-bold flex items-center gap-1.5 xs:gap-2 text-slate-200 whitespace-nowrap">
              <AlertCircle className="w-4.5 h-4.5 xs:w-5 h-5 text-teal-400 flex-shrink-0" />
              NGƯỜI CHƠI ÍT TRẬN
            </CardTitle>
            <p className="text-xs text-slate-400 mt-1">Dưới {currentMinMatches} trận tham gia</p>
          </CardHeader>
          <CardContent>
            {renderTable(secondaryBoard, false)}
          </CardContent>
        </Card>
      )}

      {selectedPlayer && (
        <PlayerDetailModal
          player={selectedPlayer}
          rank={selectedPlayer.displayRank}
          matches={filteredMatches}
          players={players}
          selectedWeekLabel={selectedWeekLabel}
          onClose={() => setSelectedPlayerId(null)}
        />
      )}
    </div>
  );
}
