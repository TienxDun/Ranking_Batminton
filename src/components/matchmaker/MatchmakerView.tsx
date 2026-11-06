import React, { useState } from 'react';
import {
  Sparkles,
  Users,
  Play,
  RotateCcw,
  ArrowRightLeft,
  Search,
  CheckCircle2,
  AlertCircle,
  Mars,
  Venus,
  Plus,
  Minus,
  Check,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  MatchmakerPlayer,
  PlayerSessionStats,
  CourtMatch,
  MatchmakingResult,
} from '../../utils/matchmaker';
import { SelectedSwapTarget } from './Matchmaker';

interface MatchmakerViewProps {
  isLight: boolean;
  allPlayers: MatchmakerPlayer[];
  checkedInIds: string[];
  numCourts: number;
  setNumCourts: React.Dispatch<React.SetStateAction<number>>;
  roundNumber: number;
  sessionStats: Record<string, PlayerSessionStats>;
  currentMatchup: MatchmakingResult | null;
  swapTarget: SelectedSwapTarget | null;
  notification: { type: 'success' | 'info'; text: string } | null;
  onToggleCheckIn: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onGenerate: () => void;
  onConfirmNextRound: () => void;
  onResetSession: () => void;
  onSwapClick: (target: SelectedSwapTarget) => void;
  onPlayMatch: (court: CourtMatch) => void;
}

export default function MatchmakerView({
  isLight,
  allPlayers,
  checkedInIds,
  numCourts,
  setNumCourts,
  roundNumber,
  sessionStats,
  currentMatchup,
  swapTarget,
  notification,
  onToggleCheckIn,
  onSelectAll,
  onDeselectAll,
  onGenerate,
  onConfirmNextRound,
  onResetSession,
  onSwapClick,
  onPlayMatch,
}: MatchmakerViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCheckInOpen, setIsCheckInOpen] = useState(true);

  const filteredPlayers = allPlayers.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const maxCourtsPossible = Math.max(1, Math.floor(checkedInIds.length / 4));

  const getSwapSelectedPlayer = () => {
    if (!swapTarget || !currentMatchup) return null;
    if (swapTarget.type === 'court') {
      const court = currentMatchup.courts[swapTarget.courtIdx];
      if (!court) return null;
      return [...court.team1, ...court.team2].find(p => p.id === swapTarget.playerId) || null;
    }
    return currentMatchup.benchPlayers.find(p => p.id === swapTarget.playerId) || null;
  };

  const activeSwapPlayer = getSwapSelectedPlayer();

  return (
    <div className="space-y-5">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-3.5 sm:p-4 rounded-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-3 duration-200 shadow-lg ${
            notification.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              : 'bg-teal-500/15 border-teal-500/30 text-teal-300'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-teal-400" />
          )}
          <span className="text-xs sm:text-sm font-semibold">{notification.text}</span>
        </div>
      )}

      {/* Hero Header Card */}
      <Card className="overflow-hidden border-teal-500/20 bg-gradient-to-br from-slate-950/80 via-slate-900/60 to-teal-950/20 shadow-xl">
        <CardHeader className="pb-3 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-base sm:text-xl font-black text-white flex items-center justify-center sm:justify-start gap-2 tracking-tight">
                <span className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-teal-500/20 to-indigo-500/20 border border-teal-500/30 text-teal-400 shadow-sm">
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
                </span>
                <span>XẾP ĐỘI HÌNH THI ĐẤU (2 VS 2)</span>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-slate-400 mt-1">
                Tự động cân bằng Elo, phân bổ đều số trận & ghép cặp công bằng cho toàn bộ sân
              </CardDescription>
            </div>

            <div className="flex items-center justify-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-bold border border-teal-500/30 bg-teal-500/10 text-teal-300">
                Lượt hiện tại: <strong className="text-white text-sm">#{roundNumber}</strong>
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onResetSession}
                className={`h-8 px-2.5 text-xs cursor-pointer ${
                  isLight
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-white/10'
                }`}
                title="Đặt lại buổi đánh"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                Làm mới buổi
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-1">
          {/* Quick Config Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 sm:p-4 rounded-xl border border-white/5 bg-slate-950/40">
            {/* Court Count Stepper */}
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-white/5 border border-white/5">
              <div>
                <span className="text-xs font-bold text-slate-200 block">Số sân thi đấu:</span>
                <span className="text-[11px] text-slate-400">
                  Cần {numCourts * 4} người cho {numCourts} sân
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setNumCourts(prev => Math.max(1, prev - 1))}
                  disabled={numCourts <= 1}
                  className="w-8 h-8 rounded-lg bg-slate-900 border border-white/10 flex items-center justify-center text-slate-200 hover:text-white hover:border-teal-500/50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-7 text-center font-black text-teal-300 text-base">{numCourts}</span>
                <button
                  type="button"
                  onClick={() => setNumCourts(prev => Math.min(4, prev + 1))}
                  disabled={numCourts >= 4}
                  className="w-8 h-8 rounded-lg bg-slate-900 border border-white/10 flex items-center justify-center text-slate-200 hover:text-white hover:border-teal-500/50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Check-in Quick Stats */}
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-white/5 border border-white/5">
              <div>
                <span className="text-xs font-bold text-slate-200 block">Điểm danh có mặt:</span>
                <span className="text-[11px] text-teal-400 font-semibold">
                  {checkedInIds.length} / {allPlayers.length} người chơi
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-teal-500/15 border border-teal-500/30 text-teal-300">
                Đủ {maxCourtsPossible} sân
              </span>
            </div>

            {/* Main Action Generate Button */}
            <div className="flex items-center">
              <Button
                type="button"
                onClick={onGenerate}
                disabled={checkedInIds.length < 4}
                className="w-full h-11 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-bold text-xs sm:text-sm shadow-lg shadow-teal-500/20 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {currentMatchup ? 'Xếp lại lượt này' : 'Xếp Sân Tự Động'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Swap Mode Guidance Banner */}
      {activeSwapPlayer && (
        <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/15 text-amber-200 flex items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm">
            <ArrowRightLeft className="w-4 h-4 text-amber-400 animate-pulse flex-shrink-0" />
            <span>
              Đang chọn <strong>{activeSwapPlayer.name}</strong>. Hãy bấm vào cầu thủ khác trên sân hoặc ở băng ghế nghỉ để hoán đổi vị trí.
            </span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onSwapClick({ type: 'bench', playerId: activeSwapPlayer.id })}
            className="h-7 text-xs text-amber-300 hover:text-white hover:bg-amber-500/20 cursor-pointer"
          >
            Hủy chọn
          </Button>
        </div>
      )}

      {/* Courts Display Section */}
      {currentMatchup && currentMatchup.courts.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-1">
            <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
              <span>🏸 Đội hình thi đấu lượt #{roundNumber}</span>
              <span className="text-xs font-normal text-slate-400">({currentMatchup.courts.length} sân)</span>
            </h2>

            <Button
              type="button"
              onClick={onConfirmNextRound}
              className="h-9 px-4 text-xs sm:text-sm font-bold bg-teal-500 hover:bg-teal-600 text-white shadow-md shadow-teal-500/15 cursor-pointer"
            >
              Hoàn tất & Xếp Lượt Tiếp Theo
              <span className="ml-1.5 font-black">→</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {currentMatchup.courts.map(court => (
              <CourtCard
                key={court.courtIndex}
                court={court}
                isLight={isLight}
                swapTarget={swapTarget}
                onSwapClick={onSwapClick}
                onPlayMatch={onPlayMatch}
              />
            ))}
          </div>

          {/* Bench / Resting Players */}
          <BenchLounge
            bench={currentMatchup.benchPlayers}
            sessionStats={sessionStats}
            isLight={isLight}
            swapTarget={swapTarget}
            onSwapClick={onSwapClick}
          />
        </div>
      )}

      {/* Player Check-in Accordion Section */}
      <Card className="border-white/10 bg-slate-950/40 backdrop-blur-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setIsCheckInOpen(prev => !prev)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
              <Users className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-white">Điểm danh người chơi buổi hôm nay</h3>
              <p className="text-xs text-slate-400">
                Đã chọn {checkedInIds.length} / {allPlayers.length} người • Bấm để {isCheckInOpen ? 'thu gọn' : 'mở rộng'}
              </p>
            </div>
          </div>
          {isCheckInOpen ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>

        {isCheckInOpen && (
          <CardContent className="border-t border-white/5 pt-4 space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="Tìm theo tên người chơi..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-8 h-9 text-xs border-white/10 bg-slate-900/60 text-slate-200 placeholder:text-slate-500"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onSelectAll}
                  className="h-8 px-2.5 text-xs text-teal-400 hover:text-teal-300 hover:bg-teal-500/10 cursor-pointer"
                >
                  Chọn tất cả
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onDeselectAll}
                  className="h-8 px-2.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 cursor-pointer"
                >
                  Bỏ chọn
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 pt-1">
              {filteredPlayers.map(player => {
                const isChecked = checkedInIds.includes(player.id);
                const stats = sessionStats[player.id];
                const matchesPlayed = stats?.matchesPlayed || 0;

                return (
                  <button
                    key={player.id}
                    type="button"
                    onClick={() => onToggleCheckIn(player.id)}
                    className={`flex items-center justify-between p-2 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
                      isChecked
                        ? 'border-teal-500/40 bg-teal-500/15 text-white shadow-sm'
                        : isLight
                        ? 'border-slate-200 bg-white text-slate-500 opacity-60 hover:opacity-100'
                        : 'border-white/5 bg-slate-900/40 text-slate-400 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="min-w-0 pr-1">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold truncate">{player.name}</span>
                        {player.gender === 'female' ? (
                          <Venus className="w-3 h-3 text-pink-400 flex-shrink-0" />
                        ) : (
                          <Mars className="w-3 h-3 text-sky-400 flex-shrink-0" />
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span className="text-teal-300 font-semibold">{player.elo} Elo</span>
                        {matchesPlayed > 0 && (
                          <span className="px-1 py-0.2 rounded bg-white/10 text-[9px] text-amber-300">
                            {matchesPlayed} trận
                          </span>
                        )}
                      </div>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-md border flex items-center justify-center flex-shrink-0 ${
                        isChecked
                          ? 'bg-teal-500 border-teal-500 text-white'
                          : 'border-white/20 bg-transparent'
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

// -------------------------------------------------------------
// Component: Single Court Badminton Card
// -------------------------------------------------------------
interface CourtCardProps {
  key?: React.Key;
  court: CourtMatch;
  isLight: boolean;
  swapTarget: SelectedSwapTarget | null;
  onSwapClick: (target: SelectedSwapTarget) => void;
  onPlayMatch: (court: CourtMatch) => void;
}

function CourtCard({ court, isLight, swapTarget, onSwapClick, onPlayMatch }: CourtCardProps) {
  const qualityBadge = () => {
    if (court.quality === 'perfect') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" />
          Cân kèo ({court.balancePercent}%)
        </span>
      );
    }
    if (court.quality === 'good') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/15 border border-teal-500/30 text-teal-300 flex items-center gap-1">
          <Check className="w-3 h-3" />
          Cân đối ({court.balancePercent}%)
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 border border-amber-500/30 text-amber-400">
        Lệch {court.eloDiff} Elo
      </span>
    );
  };

  return (
    <div
      className={`rounded-2xl border backdrop-blur-sm p-4 relative overflow-hidden flex flex-col justify-between shadow-xl ${
        isLight
          ? 'bg-white/80 border-slate-200 text-slate-800'
          : 'bg-slate-900/70 border-white/10 text-white'
      }`}
    >
      {/* Court Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-teal-500/20 border border-teal-500/30 flex items-center justify-center font-black text-xs text-teal-300">
            {court.courtIndex + 1}
          </span>
          <span className="font-bold text-sm tracking-wide">
            {court.courtName ? court.courtName : `SÂN ${court.courtIndex + 1}`}
          </span>
        </div>
        <div>{qualityBadge()}</div>
      </div>

      {/* Badminton Match Visualizer */}
      <div className="space-y-2.5">
        {/* Team 1 Box */}
        <div className="p-3 rounded-xl bg-slate-950/40 border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 px-1">
            <span>ĐỘI 1</span>
            <span className="text-teal-400 font-bold">Elo TB: {court.team1Elo}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {court.team1.map(player => (
              <PlayerCourtSlot
                key={player.id}
                player={player}
                courtIdx={court.courtIndex}
                isSelectedForSwap={swapTarget?.playerId === player.id}
                onSwapClick={onSwapClick}
              />
            ))}
          </div>
        </div>

        {/* Center Net Divider with VS Badge */}
        <div className="relative flex items-center justify-center py-1">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-dashed border-white/15" />
          </div>
          <div className="relative px-3 py-0.5 rounded-full bg-slate-900 border border-white/15 text-[10px] font-black text-teal-400 flex items-center gap-1.5 shadow-sm">
            <span>VS</span>
            <span className="text-slate-400 font-normal">|</span>
            <span className="text-slate-300">Δ {court.eloDiff} Elo</span>
          </div>
        </div>

        {/* Team 2 Box */}
        <div className="p-3 rounded-xl bg-slate-950/40 border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 px-1">
            <span>ĐỘI 2</span>
            <span className="text-teal-400 font-bold">Elo TB: {court.team2Elo}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {court.team2.map(player => (
              <PlayerCourtSlot
                key={player.id}
                player={player}
                courtIdx={court.courtIndex}
                isSelectedForSwap={swapTarget?.playerId === player.id}
                onSwapClick={onSwapClick}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Card Action Button */}
      <div className="pt-3 mt-3 border-t border-white/10 flex items-center justify-end">
        <Button
          type="button"
          onClick={() => onPlayMatch(court)}
          className="w-full sm:w-auto h-9 px-4 text-xs font-bold bg-gradient-to-r from-teal-500/20 to-indigo-500/20 hover:from-teal-500/30 hover:to-indigo-500/30 text-teal-300 border border-teal-500/30 cursor-pointer active:scale-98"
        >
          <Play className="w-3.5 h-3.5 mr-1.5 text-teal-400 fill-teal-400" />
          Đấu trận này / Nhập điểm
        </Button>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Component: Player Slot inside Court
// -------------------------------------------------------------
interface PlayerCourtSlotProps {
  key?: React.Key;
  player: MatchmakerPlayer;
  courtIdx: number;
  isSelectedForSwap: boolean;
  onSwapClick: (target: SelectedSwapTarget) => void;
}

function PlayerCourtSlot({
  player,
  courtIdx,
  isSelectedForSwap,
  onSwapClick,
}: PlayerCourtSlotProps) {
  return (
    <button
      type="button"
      onClick={() => onSwapClick({ type: 'court', playerId: player.id, courtIdx })}
      className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all duration-200 cursor-pointer group ${
        isSelectedForSwap
          ? 'bg-amber-500/25 border-amber-400 ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-900 scale-[1.02]'
          : 'bg-white/5 border-white/10 hover:border-teal-500/40 hover:bg-white/10'
      }`}
      title="Bấm để đổi vị trí người chơi"
    >
      <div className="w-7 h-7 rounded-lg bg-slate-900 border border-white/10 flex items-center justify-center font-bold text-xs text-white flex-shrink-0 group-hover:border-teal-500/40">
        {player.name.slice(0, 1).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <span className="text-xs font-bold text-white truncate">{player.name}</span>
          {player.gender === 'female' ? (
            <Venus className="w-3 h-3 text-pink-400 flex-shrink-0" />
          ) : (
            <Mars className="w-3 h-3 text-sky-400 flex-shrink-0" />
          )}
        </div>
        <span className="text-[10px] text-teal-300 font-semibold block">{player.elo} Elo</span>
      </div>
      <ArrowRightLeft className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

// -------------------------------------------------------------
// Component: Bench / Resting Players Lounge
// -------------------------------------------------------------
interface BenchLoungeProps {
  bench: MatchmakerPlayer[];
  sessionStats: Record<string, PlayerSessionStats>;
  isLight: boolean;
  swapTarget: SelectedSwapTarget | null;
  onSwapClick: (target: SelectedSwapTarget) => void;
}

function BenchLounge({
  bench,
  sessionStats,
  isLight,
  swapTarget,
  onSwapClick,
}: BenchLoungeProps) {
  if (bench.length === 0) return null;

  return (
    <Card className="border-white/10 bg-slate-950/30 backdrop-blur-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          <h3 className="text-xs sm:text-sm font-bold text-slate-300 uppercase tracking-wider">
            Băng ghế chờ lượt này ({bench.length} người đang nghỉ)
          </h3>
        </div>
        <span className="text-[11px] text-slate-400 hidden sm:inline">
          Nhấp vào người chơi để hoán đổi với người trên sân
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {bench.map(player => {
          const stats = sessionStats[player.id];
          const matchesPlayed = stats?.matchesPlayed || 0;
          const consecutiveRest = stats?.consecutiveRest || 0;
          const isSelected = swapTarget?.playerId === player.id;

          return (
            <button
              key={player.id}
              type="button"
              onClick={() => onSwapClick({ type: 'bench', playerId: player.id })}
              className={`p-2 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'bg-amber-500/25 border-amber-400 ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-900'
                  : isLight
                  ? 'bg-white border-slate-200 hover:border-slate-300'
                  : 'bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white truncate">{player.name}</span>
                {player.gender === 'female' ? (
                  <Venus className="w-3 h-3 text-pink-400 flex-shrink-0" />
                ) : (
                  <Mars className="w-3 h-3 text-sky-400 flex-shrink-0" />
                )}
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span className="text-teal-300 font-semibold">{player.elo} Elo</span>
                <span className="text-amber-300 font-medium">
                  {matchesPlayed} trận • Nghỉ {consecutiveRest + 1}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
