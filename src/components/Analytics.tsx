import React, { useState, useMemo, useEffect } from 'react';
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
import { Trophy, Users, Calendar, Award, Flame, Zap, BarChart2 } from 'lucide-react';
import { Select } from './ui/select';
import { getWeekOptions, isMatchInWeek } from '../utils/dateUtils';
import { parseISO } from 'date-fns';

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

export default function Analytics() {
  const { players, matches, theme } = useStore();
  const [selectedWeek, setSelectedWeek] = useState<string>('all');

  const weekOptions = useMemo(() => getWeekOptions(matches), [matches]);

  const filteredMatches = useMemo(() => {
    if (selectedWeek === 'all') return matches;
    const weekInfo = weekOptions.find(w => w.id === selectedWeek);
    if (!weekInfo) return matches;
    return matches.filter(m => isMatchInWeek(m.date, weekInfo.start, weekInfo.end));
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

  // 3. Tính toán chuỗi thắng hiện tại của mỗi người chơi
  const playerStreaks = useMemo(() => {
    const streaks: Record<string, number> = {};
    players.forEach(p => {
      streaks[p.id] = 0;
      
      // filteredMatches được sắp xếp mới nhất lên đầu
      for (const m of filteredMatches) {
        const isTeam1 = m.team1.includes(p.id);
        const isTeam2 = m.team2.includes(p.id);
        if (!isTeam1 && !isTeam2) continue; // Không tham gia trận này, bỏ qua

        const isTeam1Win = m.score1 > m.score2;
        const isTeam2Win = m.score2 > m.score1;
        const isWin = (isTeam1 && isTeam1Win) || (isTeam2 && isTeam2Win);

        if (isWin) {
          streaks[p.id] += 1;
        } else {
          break; // Đứt chuỗi thắng
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

    // Chuỗi thắng hiện tại tốt nhất
    let maxStreak = 0;
    let streakPlayer = 'Chưa có';
    Object.entries(playerStreaks).forEach(([id, val]) => {
      const streak = val as number;
      if (streak > maxStreak) {
        maxStreak = streak;
        const p = players.find(x => x.id === id);
        if (p) streakPlayer = p.name;
      }
    });

    // Cặp đôi hủy diệt
    const bestDuo = processedDuos[0];

    return {
      activePlayer: activePlayer.totalMatches > 0 ? { name: activePlayer.name, matches: activePlayer.totalMatches } : null,
      bestStreak: maxStreak > 0 ? { name: streakPlayer, streak: maxStreak } : null,
      bestDuo: bestDuo ? { names: bestDuo.names, winRate: bestDuo.winRate, total: bestDuo.total } : null
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

      {/* 1. Quick Insights Cards */}
      {insights && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="hover:border-teal-500/20 transition-all duration-300">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shadow-md">
                <Users className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Cày Ải Nhiều Nhất</span>
                <span className="text-sm font-bold text-white mt-0.5">
                  {insights.activePlayer ? `${insights.activePlayer.name} (${insights.activePlayer.matches} trận)` : 'N/A'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:border-amber-500/20 transition-all duration-300">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-md animate-pulse">
                <Flame className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Chuỗi Thắng Hiện Tại</span>
                <span className="text-sm font-bold text-white mt-0.5">
                  {insights.bestStreak ? `${insights.bestStreak.name} (🔥 ${insights.bestStreak.streak} trận)` : 'Chưa có'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:border-rose-500/20 transition-all duration-300">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shadow-md">
                <Zap className="w-6 h-6" />
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
        <CardContent className="p-3 sm:p-6 pt-2">
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
            <ResponsiveContainer width="100%" height="100%">
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
          </div>
        </CardContent>
      </Card>

      {/* 3. Duo Synergy & Activity Stats split */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <ResponsiveContainer width="100%" height="100%">
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
              <ResponsiveContainer width="100%" height="100%">
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
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
