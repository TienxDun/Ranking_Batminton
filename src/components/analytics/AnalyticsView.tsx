import React from 'react';
import {
  Award, BarChart2, Calendar, Flame, Puzzle, Swords, Trophy,
} from 'lucide-react';
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { Match, Player } from '../../types';
import { EloHistoryPoint } from '../../utils/calculations';
import {
  AnalyticsInsights, calculateActivityStats, DuoStat,
} from '../../utils/analytics';
import { getWeekOptions } from '../../utils/dateUtils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Select } from '../ui/select';
import {
  ActivityTooltip, DuoTooltip, EloTooltip, InsightDetailModal, InsightDetail,
} from './AnalyticsSupport';

export interface AnalyticsViewModel {
  active: boolean;
  selectedWeek: string;
  setSelectedWeek: (week: string) => void;
  weekOptions: ReturnType<typeof getWeekOptions>;
  insights: AnalyticsInsights | null;
  setActiveInsight: React.Dispatch<React.SetStateAction<InsightDetail | null>>;
  visiblePlayers: string[];
  groupPlayers: Player[];
  togglePlayer: (name: string) => void;
  getPlayerColor: (name: string, index: number) => string;
  eloHistory: EloHistoryPoint[];
  theme: 'dark' | 'light';
  axisStroke: string;
  gridStroke: string;
  textFill: string;
  visiblePlayersKey: string;
  processedDuos: DuoStat[];
  activityStats: ReturnType<typeof calculateActivityStats>;
  activeInsight: InsightDetail | null;
  filteredMatches: Match[];
  selectedWeekLabel: string;
}

function AnalyticsHeader({ model }: { model: AnalyticsViewModel }) {
  const { selectedWeek, setSelectedWeek, weekOptions } = model;
  return (
    <>
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
    </>
  );
}

function InsightCards({ model }: { model: AnalyticsViewModel }) {
  const { selectedWeek, insights, setActiveInsight } = model;
  return (
    <>
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
    </>
  );
}

function EloTrendChart({ model }: { model: AnalyticsViewModel }) {
  const { active, selectedWeek, visiblePlayersKey, visiblePlayers, groupPlayers, togglePlayer: handleTogglePlayer, getPlayerColor, eloHistory, gridStroke, axisStroke, textFill, theme } = model;
  return (
    <>
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
              {groupPlayers.map((p, index) => {
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
                  {groupPlayers.map((p, index) => {
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
    </>
  );
}

function AnalyticsBarCharts({ model }: { model: AnalyticsViewModel }) {
  const { active, selectedWeek, processedDuos, activityStats, gridStroke, axisStroke, textFill, theme } = model;
  return (
    <>
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
    </>
  );
}

export function AnalyticsView({ model }: { model: AnalyticsViewModel }) {
  const {
    activeInsight, insights, filteredMatches, groupPlayers, selectedWeekLabel,
    setActiveInsight,
  } = model;

  return (
    <div className="space-y-6" id="analytics-content">
      <AnalyticsHeader model={model} />

      <InsightCards model={model} />

      <EloTrendChart model={model} />

      <AnalyticsBarCharts model={model} />

      {activeInsight && insights && (
        <InsightDetailModal
          type={activeInsight}
          insights={insights}
          filteredMatches={filteredMatches}
          players={groupPlayers}
          selectedWeekLabel={selectedWeekLabel}
          onClose={() => setActiveInsight(null)}
        />
      )}
    </div>
  );
}
