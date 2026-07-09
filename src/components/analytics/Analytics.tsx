import React, { useState, useMemo, useEffect } from 'react';
import { BarChart2 } from 'lucide-react';
import { useStore } from '../store';
import { calculateLeaderboard, calculateEloHistory } from '../utils/calculations';
import { getWeekOptions } from '../utils/dateUtils';
import { getGroupMatches, getGroupPlayers } from '../utils/groupUtils';
import {
  buildAnalyticsInsights,
  calculateActivityStats,
  calculateDuoStats,
  calculatePlayerStreaks,
  filterEloHistoryByWeek,
  filterMatchesByWeek,
  getTopDuos,
} from '../utils/analytics';
import { type InsightDetail } from './analytics/AnalyticsSupport';
import { AnalyticsView } from './analytics/AnalyticsView';

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

export default function Analytics({ active = true }: { active?: boolean }) {
  const { players, matches, selectedGroupId, theme, selectedWeek, setSelectedWeek } = useStore();
  const groupPlayers = useMemo(() => getGroupPlayers(players, selectedGroupId), [players, selectedGroupId]);
  const groupMatches = useMemo(() => getGroupMatches(matches, selectedGroupId), [matches, selectedGroupId]);
  const [activeInsight, setActiveInsight] = useState<InsightDetail | null>(null);

  const weekOptions = useMemo(() => getWeekOptions(groupMatches), [groupMatches]);

  const filteredMatches = useMemo(
    () => filterMatchesByWeek(groupMatches, selectedWeek, weekOptions),
    [groupMatches, selectedWeek, weekOptions]
  );

  // Khởi tạo bảng xếp hạng và Elo history
  const leaderboard = useMemo(() => calculateLeaderboard(groupPlayers, filteredMatches), [groupPlayers, filteredMatches]);
  const fullEloHistory = useMemo(() => calculateEloHistory(groupPlayers, groupMatches), [groupPlayers, groupMatches]);

  const eloHistory = useMemo(
    () => filterEloHistoryByWeek(fullEloHistory, selectedWeek, weekOptions),
    [fullEloHistory, selectedWeek, weekOptions]
  );

  // Lấy danh sách Top 3 người chơi có Elo cao nhất để hiển thị mặc định
  const defaultSelectedPlayers = useMemo(() => {
    return leaderboard.slice(0, 3).map(p => p.name);
  }, [leaderboard]);

  const [visiblePlayers, setVisiblePlayers] = useState<string[]>(defaultSelectedPlayers);

  // Tự động cập nhật danh sách người chơi hiển thị khi đổi tuần
  useEffect(() => {
    setVisiblePlayers(leaderboard.slice(0, 3).map(p => p.name));
  }, [selectedWeek, leaderboard]);

  const duoStats = useMemo(
    () => calculateDuoStats(filteredMatches, groupPlayers),
    [filteredMatches, groupPlayers]
  );
  const processedDuos = useMemo(() => getTopDuos(duoStats), [duoStats]);
  const activityStats = useMemo(
    () => calculateActivityStats(filteredMatches),
    [filteredMatches]
  );
  const playerStreaks = useMemo(
    () => calculatePlayerStreaks(filteredMatches, groupPlayers),
    [filteredMatches, groupPlayers]
  );
  const insights = useMemo(
    () => buildAnalyticsInsights(leaderboard, playerStreaks, processedDuos, groupPlayers),
    [leaderboard, playerStreaks, processedDuos, groupPlayers]
  );

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
    <AnalyticsView model={{
      active, selectedWeek, setSelectedWeek, weekOptions, insights,
      setActiveInsight, visiblePlayers, groupPlayers,
      togglePlayer: handleTogglePlayer, getPlayerColor, eloHistory, theme,
      axisStroke, gridStroke, textFill, visiblePlayersKey, processedDuos,
      activityStats, activeInsight, filteredMatches, selectedWeekLabel,
    }} />
  );
}
