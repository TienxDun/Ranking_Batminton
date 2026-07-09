import React, { CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../store';
import { calculateLeaderboard, calculatePlayerEloBreakdown, PlayerEloMatchBreakdown } from '../utils/calculations';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Select } from './ui/select';
import { Trophy, Medal, AlertCircle, X, User, TrendingUp, TrendingDown, Users, Swords, PlusCircle } from 'lucide-react';
import { getWeekOptions, isMatchInWeek } from '../utils/dateUtils';
import { Button } from './ui/button';
import { Match, Player, PlayerStats } from '../types';
import { useVisualViewportRect } from '../hooks/useVisualViewportRect';
import { MatchDetailModal } from './MatchHistory';
import { useModalHistory } from '../hooks/useModalHistory';
import { getGroupMatches, getGroupPlayers } from '../utils/groupUtils';

import { PlayerDetailModal } from './dashboard/PlayerDetailModal';
import { LeaderboardTable } from './dashboard/LeaderboardTable';

export default function Dashboard() {
  const { players, matches, selectedGroupId, config, selectedWeek, setSelectedWeek } = useStore();
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const prevGroupIdRef = useRef(selectedGroupId);
  const groupPlayers = useMemo(() => getGroupPlayers(players, selectedGroupId), [players, selectedGroupId]);
  const groupMatches = useMemo(() => getGroupMatches(matches, selectedGroupId), [matches, selectedGroupId]);

  // Reset bộ lọc tuần khi chuyển nhóm để tránh hiển thị bảng trống nhầm lẫn
  useEffect(() => {
    if (prevGroupIdRef.current !== selectedGroupId) {
      prevGroupIdRef.current = selectedGroupId;
      setSelectedWeek('all');
    }
  }, [selectedGroupId, setSelectedWeek]);

  const weekOptions = useMemo(() => getWeekOptions(groupMatches), [groupMatches]);

  const filteredMatches = useMemo(() => {
    if (selectedWeek === 'all') return groupMatches;
    const weekInfo = weekOptions.find(w => w.id === selectedWeek);
    if (!weekInfo) return groupMatches;
    return groupMatches.filter(m => isMatchInWeek(m.date, weekInfo.start, weekInfo.end));
  }, [groupMatches, selectedWeek, weekOptions]);

  const leaderboard = useMemo(() => calculateLeaderboard(groupPlayers, filteredMatches), [groupPlayers, filteredMatches]);

  const currentMinMatches = selectedWeek === 'all' ? config.minMatchesForMainBoard : 1;

  const mainBoard = leaderboard.filter(p => p.totalMatches >= currentMinMatches);
  const secondaryBoard = leaderboard.filter(p => p.totalMatches < currentMinMatches && p.totalMatches > 0);
  const selectedWeekLabel = selectedWeek === 'all'
    ? 'Toàn thời gian'
    : weekOptions.find(w => w.id === selectedWeek)?.label || 'Bộ lọc hiện tại';

  const selectedPlayer = useMemo(() => {
    if (!selectedPlayerId) return null;
    const rankedAll = [...mainBoard, ...secondaryBoard].map((player, index) => ({
      ...player,
      displayRank: index + 1,
    }));
    return rankedAll.find(p => p.playerId === selectedPlayerId) || null;
  }, [mainBoard, secondaryBoard, selectedPlayerId]);

  // Empty state khi nhóm chưa có trận nào
  if (groupMatches.length === 0) {
    return (
      <div className="space-y-6" id="dashboard-content">
        <Card>
          <CardContent className="py-16 flex flex-col items-center justify-center text-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
              <Trophy className="w-8 h-8 text-teal-400/50" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">Nhóm chưa có trận đấu nào</h3>
              <p className="text-sm text-slate-400 max-w-sm">
                Bảng xếp hạng sẽ hiển thị sau khi bạn thêm trận đấu cho nhóm này.
                Mỗi nhóm có trận đấu độc lập với nhau.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-teal-400 bg-teal-500/10 border border-teal-500/20 rounded-xl px-4 py-3">
              <PlusCircle className="w-4 h-4 flex-shrink-0" />
              <span>Vào tab <strong>Thêm Trận</strong> để nhập kết quả trận đấu cho nhóm này</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
          <LeaderboardTable data={mainBoard} isMain onSelectPlayer={setSelectedPlayerId} />
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
            <LeaderboardTable data={secondaryBoard} isMain={false} onSelectPlayer={setSelectedPlayerId} />
          </CardContent>
        </Card>
      )}

      {selectedPlayer && (
        <PlayerDetailModal
          player={selectedPlayer}
          rank={selectedPlayer.displayRank}
          matches={filteredMatches}
          players={groupPlayers}
          selectedWeekLabel={selectedWeekLabel}
          onClose={() => setSelectedPlayerId(null)}
        />
      )}
    </div>
  );
}
