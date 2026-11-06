import React, { useState } from 'react';
import {
  Sparkles,
  Users,
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
  ShieldCheck,
  Zap,
  X,
  Edit3,
  ArrowRight,
  SlidersHorizontal,
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
import { SelectedSwapTarget, RecordedCourtScore } from './Matchmaker';

interface MatchmakerViewProps {
  isLight: boolean;
  allPlayers: MatchmakerPlayer[];
  checkedInIds: string[];
  numCourts: number;
  setNumCourts: React.Dispatch<React.SetStateAction<number>>;
  roundNumber: number;
  sessionStats: Record<string, PlayerSessionStats>;
  currentMatchup: MatchmakingResult | null;
  recordedScores: Record<number, RecordedCourtScore>;
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
  onQuickSaveScore: (court: CourtMatch, score1: number, score2: number) => void;
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
  recordedScores,
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
  onQuickSaveScore,
}: MatchmakerViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [quickScoreCourt, setQuickScoreCourt] = useState<CourtMatch | null>(null);

  const filteredPlayers = allPlayers.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const neededPlayers = numCourts * 4;
  const isEnoughPlayers = checkedInIds.length >= neededPlayers;
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

  // Đếm số sân đã ghi điểm trong lượt
  const totalCourtsInRound = currentMatchup?.courts.length || 0;
  const recordedCount = Object.keys(recordedScores).length;
  const isAllCourtsRecorded = totalCourtsInRound > 0 && recordedCount >= totalCourtsInRound;

  return (
    <div className="space-y-5 pb-12">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-3.5 sm:p-4 rounded-2xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-3 duration-200 shadow-xl ${
            notification.type === 'success'
              ? isLight
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950 shadow-emerald-500/10'
                : 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300 shadow-emerald-950/30'
              : isLight
              ? 'bg-teal-50 border-teal-300 text-teal-950 shadow-teal-500/10'
              : 'bg-teal-950/80 border-teal-500/40 text-teal-300 shadow-teal-950/30'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className={`w-5 h-5 flex-shrink-0 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
          ) : (
            <AlertCircle className={`w-5 h-5 flex-shrink-0 ${isLight ? 'text-teal-600' : 'text-teal-400'}`} />
          )}
          <span className="text-xs sm:text-sm font-semibold leading-relaxed">{notification.text}</span>
        </div>
      )}

      {/* Control Hub Card */}
      <Card
        className={`overflow-hidden shadow-xl rounded-2xl border ${
          isLight
            ? 'bg-white border-slate-200/90 shadow-slate-200/60'
            : 'border-teal-500/20 bg-gradient-to-br from-slate-950/90 via-slate-900/80 to-teal-950/20 shadow-black/40'
        }`}
      >
        <CardHeader className="pb-3 pt-4 sm:pt-5 px-4 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-gradient-to-br from-teal-500/20 to-indigo-500/15 border border-teal-500/30 text-teal-500 shadow-sm">
                <Zap className="w-5 h-5" />
              </span>
              <div>
                <CardTitle className={`text-base sm:text-lg font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  XẾP ĐỘI HÌNH THI ĐẤU
                </CardTitle>
                <CardDescription className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Cân bằng Elo & công bằng số trận cho toàn bộ thành viên
                </CardDescription>
              </div>
            </div>

            {/* Current Round Badge & Reset Action */}
            <div className="flex items-center gap-2">
              <div
                className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 shadow-sm ${
                  isLight
                    ? 'border-teal-300 bg-teal-50 text-teal-900'
                    : 'border-teal-500/30 bg-teal-500/15 text-teal-300'
                }`}
              >
                <span>Lượt:</span>
                <span className="font-black text-sm">#{roundNumber}</span>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsResetConfirmOpen(true)}
                className={`h-8 w-8 p-0 rounded-xl cursor-pointer transition-colors ${
                  isLight
                    ? 'text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200'
                    : 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-white/10'
                }`}
                title="Làm mới buổi đấu"
                aria-label="Làm mới buổi đấu"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-1 px-4 sm:px-6 pb-5">
          {/* Controls Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* 1. Touch-friendly Court Stepper */}
            <div
              className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-white/5 border-white/5'
              }`}
            >
              <div>
                <span className={`text-xs font-bold block ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                  Số sân thi đấu
                </span>
                <span className={`text-[11px] font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Cần {neededPlayers} người ({numCourts} sân x 4)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setNumCourts(prev => Math.max(1, prev - 1))}
                  disabled={numCourts <= 1}
                  className={`w-9 h-9 rounded-xl border flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all active:scale-95 ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-800 hover:border-teal-500 hover:bg-teal-50/50 shadow-sm'
                      : 'bg-slate-900 border-white/10 text-slate-200 hover:border-teal-500/50 hover:bg-white/10'
                  }`}
                  aria-label="Giảm 1 sân"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className={`w-8 text-center font-black text-lg ${isLight ? 'text-teal-800' : 'text-teal-300'}`}>
                  {numCourts}
                </span>
                <button
                  type="button"
                  onClick={() => setNumCourts(prev => Math.min(6, prev + 1))}
                  disabled={numCourts >= 6}
                  className={`w-9 h-9 rounded-xl border flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all active:scale-95 ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-800 hover:border-teal-500 hover:bg-teal-50/50 shadow-sm'
                      : 'bg-slate-900 border-white/10 text-slate-200 hover:border-teal-500/50 hover:bg-white/10'
                  }`}
                  aria-label="Tăng 1 sân"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 2. Interactive Check-in Button/Card */}
            <button
              type="button"
              onClick={() => setIsCheckInModalOpen(true)}
              className={`p-3 rounded-2xl border flex items-center justify-between text-left transition-all duration-200 cursor-pointer group active:scale-[0.99] ${
                isLight
                  ? 'bg-slate-50/80 border-slate-200 hover:border-teal-400 hover:bg-teal-50/30'
                  : 'bg-white/5 border-white/5 hover:border-teal-500/40 hover:bg-white/10'
              }`}
            >
              <div className="min-w-0 pr-2">
                <div className="flex items-center gap-1.5">
                  <Users className={`w-3.5 h-3.5 ${isLight ? 'text-teal-700' : 'text-teal-400'}`} />
                  <span className={`text-xs font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                    Điểm danh có mặt
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`text-sm font-black ${isLight ? 'text-teal-800' : 'text-teal-300'}`}>
                    {checkedInIds.length} / {allPlayers.length}
                  </span>
                  <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    người chơi
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                    isEnoughPlayers
                      ? isLight
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                      : isLight
                      ? 'bg-amber-50 border-amber-300 text-amber-800'
                      : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                  }`}
                >
                  {isEnoughPlayers ? `Đủ ${maxCourtsPossible} sân` : `Thiếu ${neededPlayers - checkedInIds.length} người`}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-teal-400 transition-colors" />
              </div>
            </button>

            {/* 3. Smart Action Button (Differentiated visual style) */}
            <div className="flex items-center sm:col-span-2 lg:col-span-1">
              <Button
                type="button"
                onClick={onGenerate}
                disabled={checkedInIds.length < 4}
                className={`w-full h-12 rounded-2xl font-bold text-xs sm:text-sm border transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 ${
                  currentMatchup
                    ? isLight
                      ? 'bg-teal-50 hover:bg-teal-100 text-teal-900 border-teal-300/80 shadow-sm'
                      : 'bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border-teal-500/30 shadow-sm'
                    : 'bg-teal-600 hover:bg-teal-700 text-white-force shadow-md shadow-teal-600/20'
                }`}
              >
                <Sparkles className={`w-4 h-4 ${currentMatchup ? (isLight ? 'text-teal-700' : 'text-teal-400') : 'text-white-force'}`} />
                <span>{currentMatchup ? 'Đổi Kèo Lượt Này' : 'Xếp Sân Tự Động'}</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Swap Mode Guidance Banner */}
      {activeSwapPlayer && (
        <div
          className={`sticky top-20 z-30 p-3.5 sm:p-4 rounded-2xl border flex items-center justify-between gap-3 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200 ${
            isLight
              ? 'border-amber-400 bg-amber-50/95 text-amber-950 ring-2 ring-amber-400/30'
              : 'border-amber-500/50 bg-slate-950/90 text-amber-200 ring-2 ring-amber-500/30'
          }`}
        >
          <div className="flex items-center gap-2.5 text-xs sm:text-sm min-w-0">
            <ArrowRightLeft className="w-4 h-4 animate-spin text-amber-500 flex-shrink-0" />
            <div className="truncate">
              Đang chọn: <strong className="font-black text-amber-600 dark:text-amber-400 underline">{activeSwapPlayer.name}</strong>. Bấm vào cầu thủ khác trên sân hoặc băng ghế chờ để hoán đổi!
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onSwapClick({ type: 'bench', playerId: activeSwapPlayer.id })}
            className={`h-8 px-3 text-xs font-bold cursor-pointer rounded-xl flex-shrink-0 ${
              isLight
                ? 'bg-amber-200/80 hover:bg-amber-300 text-amber-900 border border-amber-300'
                : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
            }`}
          >
            Hủy chọn
          </Button>
        </div>
      )}

      {/* Courts Display Section */}
      {currentMatchup && currentMatchup.courts.length > 0 && (
        <div className="space-y-4">
          {/* Section Header with Next Round Action */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className={`text-sm sm:text-base font-black uppercase tracking-wider flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                <span>🏸 Đội hình thi đấu lượt #{roundNumber}</span>
              </h2>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-white/5 border-white/10 text-slate-300'
              }`}>
                {currentMatchup.courts.length} sân
              </span>
              {recordedCount > 0 && (
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border flex items-center gap-1 ${
                  isAllCourtsRecorded
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                    : 'bg-teal-500/15 border-teal-500/30 text-teal-600 dark:text-teal-400'
                }`}>
                  <Check className="w-3 h-3 stroke-[3]" />
                  Đã ghi {recordedCount}/{totalCourtsInRound} sân
                </span>
              )}
            </div>

            <Button
              type="button"
              onClick={onConfirmNextRound}
              className={`h-10 px-4 rounded-xl text-xs sm:text-sm font-bold shadow-md cursor-pointer active:scale-98 transition-all flex items-center gap-1.5 self-start sm:self-auto ${
                isAllCourtsRecorded
                  ? 'bg-teal-600 hover:bg-teal-700 text-white-force ring-2 ring-teal-500/30'
                  : isLight
                  ? 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-300'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-white/15'
              }`}
            >
              <span>
                {isAllCourtsRecorded
                  ? `Hoàn tất lượt #${roundNumber} & Sang lượt #${roundNumber + 1}`
                  : `Xác nhận & Sang lượt #${roundNumber + 1}`}
              </span>
              <ArrowRight className="w-4 h-4 text-current" />
            </Button>
          </div>

          {/* Court Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {currentMatchup.courts.map(court => (
              <CourtCard
                key={court.courtIndex}
                court={court}
                sessionStats={sessionStats}
                isLight={isLight}
                recordedScore={recordedScores[court.courtIndex]}
                swapTarget={swapTarget}
                onSwapClick={onSwapClick}
                onPlayMatch={onPlayMatch}
                onOpenQuickScore={() => setQuickScoreCourt(court)}
              />
            ))}
          </div>

          {/* Bench / Resting Players Lounge */}
          <BenchLounge
            bench={currentMatchup.benchPlayers}
            sessionStats={sessionStats}
            isLight={isLight}
            swapTarget={swapTarget}
            onSwapClick={onSwapClick}
          />

          {/* Bottom Next Round Action Button for Easy Navigation */}
          <div className="pt-2 flex justify-center">
            <Button
              type="button"
              onClick={onConfirmNextRound}
              className={`w-full sm:w-auto h-11 px-8 rounded-2xl text-xs sm:text-sm font-bold shadow-lg cursor-pointer active:scale-98 transition-all flex items-center justify-center gap-2 ${
                isAllCourtsRecorded
                  ? 'bg-teal-600 hover:bg-teal-700 text-white-force ring-4 ring-teal-500/20'
                  : isLight
                  ? 'bg-slate-800 hover:bg-slate-900 text-white'
                  : 'bg-teal-600/90 hover:bg-teal-600 text-white'
              }`}
            >
              <span>Xác nhận lượt #{roundNumber} & Xếp tiếp lượt #{roundNumber + 1}</span>
              <ArrowRight className="w-4 h-4 text-current" />
            </Button>
          </div>
        </div>
      )}

      {/* Quick Score Modal */}
      {quickScoreCourt && (
        <QuickScoreDialog
          court={quickScoreCourt}
          isLight={isLight}
          existingScore={recordedScores[quickScoreCourt.courtIndex]}
          onClose={() => setQuickScoreCourt(null)}
          onSave={(score1, score2) => {
            onQuickSaveScore(quickScoreCourt, score1, score2);
            setQuickScoreCourt(null);
          }}
          onOpenFullForm={() => {
            const court = quickScoreCourt;
            setQuickScoreCourt(null);
            onPlayMatch(court);
          }}
        />
      )}

      {/* Reset Session Confirmation Dialog */}
      {isResetConfirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsResetConfirmOpen(false)}
        >
          <div
            className={`w-full max-w-sm rounded-2xl border p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-white/10 text-white'
            }`}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base">Làm mới buổi đánh?</h3>
                <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Lượt đấu sẽ đặt lại về #1 và thống kê số trận trong buổi hôm nay sẽ được làm mới.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsResetConfirmOpen(false)}
                className={`text-xs rounded-xl ${isLight ? 'text-slate-600' : 'text-slate-300'}`}
              >
                Hủy bỏ
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setIsResetConfirmOpen(false);
                  onResetSession();
                }}
                className="text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white-force"
              >
                Xác nhận làm mới
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Fast Check-In Dialog / Sheet */}
      {isCheckInModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsCheckInModalOpen(false)}
        >
          <div
            className={`w-full max-w-2xl max-h-[85vh] rounded-2xl border flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-white/10 text-white'
            }`}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={`p-4 border-b flex items-center justify-between ${isLight ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-slate-950/40'}`}>
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-teal-500/15 text-teal-500 border border-teal-500/20">
                  <Users className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-black text-sm sm:text-base">Điểm danh buổi hôm nay</h3>
                  <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Đã chọn <strong className="text-teal-600 dark:text-teal-400 font-bold">{checkedInIds.length}</strong> / {allPlayers.length} thành viên (Đủ {maxCourtsPossible} sân)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCheckInModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Search & Bulk Actions */}
            <div className={`p-3 border-b flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between ${isLight ? 'border-slate-200' : 'border-white/5'}`}>
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Tìm kiếm theo tên thành viên..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className={`pl-9 h-9 text-xs rounded-xl ${
                    isLight
                      ? 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400'
                      : 'border-white/10 bg-slate-950/60 text-slate-200 placeholder:text-slate-500'
                  }`}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onSelectAll}
                  className={`h-9 px-3 text-xs font-bold rounded-xl cursor-pointer ${
                    isLight ? 'bg-teal-50 text-teal-800 border border-teal-200' : 'bg-teal-500/10 text-teal-300 border border-teal-500/20'
                  }`}
                >
                  Chọn tất cả
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onDeselectAll}
                  className={`h-9 px-3 text-xs font-bold rounded-xl cursor-pointer ${
                    isLight ? 'bg-rose-50 text-rose-800 border border-rose-200' : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                  }`}
                >
                  Bỏ chọn
                </Button>
              </div>
            </div>

            {/* Player Grid */}
            <div className="flex-1 overflow-y-auto p-4 scroll-hide">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {filteredPlayers.map(player => {
                  const isChecked = checkedInIds.includes(player.id);
                  const stats = sessionStats[player.id];
                  const matchesPlayed = stats?.matchesPlayed || 0;

                  return (
                    <button
                      key={player.id}
                      type="button"
                      onClick={() => onToggleCheckIn(player.id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
                        isChecked
                          ? isLight
                            ? 'border-teal-400 bg-teal-50/90 text-slate-900 shadow-sm ring-1 ring-teal-400/50'
                            : 'border-teal-500/40 bg-teal-500/20 text-white shadow-sm ring-1 ring-teal-500/40'
                          : isLight
                          ? 'border-slate-200 bg-white text-slate-500 opacity-60 hover:opacity-100 hover:border-slate-300'
                          : 'border-white/5 bg-slate-950/40 text-slate-400 opacity-60 hover:opacity-100 hover:border-white/20'
                      }`}
                    >
                      <div className="min-w-0 pr-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            {player.name}
                          </span>
                          {player.gender === 'female' ? (
                            <Venus className="w-3 h-3 text-pink-500 flex-shrink-0" />
                          ) : (
                            <Mars className="w-3 h-3 text-sky-500 flex-shrink-0" />
                          )}
                        </div>
                        <div className={`text-[10px] flex items-center gap-1.5 mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                          <span className={`font-semibold ${isLight ? 'text-teal-700' : 'text-teal-300'}`}>
                            {player.elo} Elo
                          </span>
                          {matchesPlayed > 0 && (
                            <span className={`px-1.5 py-0.2 rounded-md text-[9px] font-bold ${
                              isLight ? 'bg-amber-100 text-amber-800' : 'bg-white/10 text-amber-300'
                            }`}>
                              {matchesPlayed} trận
                            </span>
                          )}
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${
                          isChecked
                            ? 'bg-teal-500 border-teal-500 text-white-force'
                            : isLight
                            ? 'border-slate-300 bg-white'
                            : 'border-white/20 bg-transparent'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3] text-white-force" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`p-4 border-t flex items-center justify-between ${isLight ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-slate-950/40'}`}>
              <span className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                {checkedInIds.length < neededPlayers ? (
                  <span className="text-amber-500 font-semibold">
                    Cần thêm {neededPlayers - checkedInIds.length} người để đủ {numCourts} sân
                  </span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    ✓ Đã đủ {checkedInIds.length} người chơi cho {numCourts} sân
                  </span>
                )}
              </span>

              <Button
                type="button"
                onClick={() => setIsCheckInModalOpen(false)}
                className="h-10 px-5 rounded-xl font-bold text-xs sm:text-sm bg-teal-600 hover:bg-teal-700 text-white-force shadow-md"
              >
                Hoàn tất điểm danh
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// Component: Single Court Badminton Card
// -------------------------------------------------------------
interface CourtCardProps {
  key?: React.Key;
  court: CourtMatch;
  sessionStats: Record<string, PlayerSessionStats>;
  isLight: boolean;
  recordedScore?: RecordedCourtScore;
  swapTarget: SelectedSwapTarget | null;
  onSwapClick: (target: SelectedSwapTarget) => void;
  onPlayMatch: (court: CourtMatch) => void;
  onOpenQuickScore: () => void;
}

function CourtCard({
  court,
  sessionStats,
  isLight,
  recordedScore,
  swapTarget,
  onSwapClick,
  onPlayMatch,
  onOpenQuickScore,
}: CourtCardProps) {
  const qualityBadge = () => {
    if (court.quality === 'perfect') {
      return (
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
            isLight
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
          }`}
        >
          <ShieldCheck className="w-3 h-3" />
          Cân kèo ({court.balancePercent}%)
        </span>
      );
    }
    if (court.quality === 'good') {
      return (
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
            isLight
              ? 'bg-teal-50 border-teal-300 text-teal-800'
              : 'bg-teal-500/15 border-teal-500/30 text-teal-300'
          }`}
        >
          <Check className="w-3 h-3" />
          Cân đối ({court.balancePercent}%)
        </span>
      );
    }
    return (
      <span
        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
          isLight
            ? 'bg-amber-50 border-amber-300 text-amber-800'
            : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
        }`}
      >
        Lệch {court.eloDiff} Elo
      </span>
    );
  };

  return (
    <div
      className={`rounded-2xl border backdrop-blur-sm p-4 relative overflow-hidden flex flex-col justify-between shadow-xl transition-all ${
        recordedScore
          ? isLight
            ? 'bg-emerald-50/40 border-emerald-300/80 text-slate-800'
            : 'bg-emerald-950/20 border-emerald-500/30 text-white'
          : isLight
          ? 'bg-white border-slate-200/90 text-slate-800 shadow-slate-100'
          : 'bg-slate-900/70 border-white/10 text-white'
      }`}
    >
      {/* Court Header */}
      <div className={`flex items-center justify-between border-b pb-3 mb-3 ${isLight ? 'border-slate-200/80' : 'border-white/10'}`}>
        <div className="flex items-center gap-2">
          <span
            className={`w-7 h-7 rounded-xl border flex items-center justify-center font-black text-xs ${
              isLight
                ? 'bg-teal-50 border-teal-300 text-teal-800'
                : 'bg-teal-500/20 border-teal-500/30 text-teal-300'
            }`}
          >
            {court.courtIndex + 1}
          </span>
          <span className={`font-bold text-sm tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {court.courtName ? court.courtName : `SÂN ${court.courtIndex + 1}`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {recordedScore && (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/20 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400">
              ✓ Đã xong ({recordedScore.score1} - {recordedScore.score2})
            </span>
          )}
          {qualityBadge()}
        </div>
      </div>

      {/* Badminton Match Visualizer */}
      <div className="space-y-2.5">
        {/* Team 1 Box */}
        <div
          className={`p-3 rounded-xl border space-y-2 ${
            isLight ? 'bg-slate-50/90 border-slate-200/80' : 'bg-slate-950/40 border-white/5'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-semibold px-1">
            <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>ĐỘI 1</span>
            <span className={`font-bold ${isLight ? 'text-teal-700' : 'text-teal-400'}`}>
              Elo TB: {court.team1Elo}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {court.team1.map(player => (
              <PlayerCourtSlot
                key={player.id}
                player={player}
                sessionStats={sessionStats}
                courtIdx={court.courtIndex}
                isLight={isLight}
                isSelectedForSwap={swapTarget?.playerId === player.id}
                onSwapClick={onSwapClick}
              />
            ))}
          </div>
        </div>

        {/* Center Net Divider with VS Badge */}
        <div className="relative flex items-center justify-center py-1">
          <div className="absolute inset-0 flex items-center">
            <div className={`w-full border-t border-dashed ${isLight ? 'border-slate-300' : 'border-white/15'}`} />
          </div>
          <div
            className={`relative px-3 py-0.5 rounded-full border text-[10px] font-black flex items-center gap-1.5 shadow-sm ${
              isLight
                ? 'bg-white border-slate-300 text-teal-800'
                : 'bg-slate-900 border-white/15 text-teal-400'
            }`}
          >
            <span>VS</span>
            <span className={isLight ? 'text-slate-400' : 'text-slate-500'}>|</span>
            <span className={isLight ? 'text-slate-700 font-bold' : 'text-slate-300 font-medium'}>
              Δ {court.eloDiff} Elo
            </span>
          </div>
        </div>

        {/* Team 2 Box */}
        <div
          className={`p-3 rounded-xl border space-y-2 ${
            isLight ? 'bg-slate-50/90 border-slate-200/80' : 'bg-slate-950/40 border-white/5'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-semibold px-1">
            <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>ĐỘI 2</span>
            <span className={`font-bold ${isLight ? 'text-teal-700' : 'text-teal-400'}`}>
              Elo TB: {court.team2Elo}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {court.team2.map(player => (
              <PlayerCourtSlot
                key={player.id}
                player={player}
                sessionStats={sessionStats}
                courtIdx={court.courtIndex}
                isLight={isLight}
                isSelectedForSwap={swapTarget?.playerId === player.id}
                onSwapClick={onSwapClick}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Card Action Buttons */}
      <div className={`pt-3 mt-3 border-t flex items-center justify-between gap-2 ${isLight ? 'border-slate-200/80' : 'border-white/10'}`}>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onPlayMatch(court)}
          className={`h-9 px-3 text-xs font-semibold cursor-pointer rounded-xl ${
            isLight
              ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
          title="Mở form ghi nhận điểm số chi tiết"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5" />
          Form chi tiết
        </Button>

        <Button
          type="button"
          onClick={onOpenQuickScore}
          className={`h-9 px-4 text-xs font-bold rounded-xl cursor-pointer active:scale-98 transition-all flex items-center gap-1.5 ${
            recordedScore
              ? isLight
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white-force shadow-sm'
                : 'bg-emerald-600/80 hover:bg-emerald-600 text-white shadow-sm'
              : isLight
              ? 'bg-teal-600 hover:bg-teal-700 text-white-force shadow-sm'
              : 'bg-teal-600 hover:bg-teal-500 text-white shadow-md'
          }`}
        >
          {recordedScore ? (
            <>
              <Edit3 className="w-3.5 h-3.5" />
              <span>Sửa điểm ({recordedScore.score1}-{recordedScore.score2})</span>
            </>
          ) : (
            <>
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Ghi điểm nhanh</span>
            </>
          )}
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
  sessionStats: Record<string, PlayerSessionStats>;
  courtIdx: number;
  isLight: boolean;
  isSelectedForSwap: boolean;
  onSwapClick: (target: SelectedSwapTarget) => void;
}

function PlayerCourtSlot({
  player,
  sessionStats,
  courtIdx,
  isLight,
  isSelectedForSwap,
  onSwapClick,
}: PlayerCourtSlotProps) {
  const isFemale = player.gender === 'female';
  const stats = sessionStats[player.id];
  const matchesPlayed = stats?.matchesPlayed || 0;

  return (
    <button
      type="button"
      onClick={() => onSwapClick({ type: 'court', playerId: player.id, courtIdx })}
      className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all duration-200 cursor-pointer group ${
        isSelectedForSwap
          ? isLight
            ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-400 text-amber-950 scale-[1.02]'
            : 'bg-amber-500/25 border-amber-400 ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-900 scale-[1.02]'
          : isLight
          ? 'bg-white border-slate-200/80 hover:border-teal-400 hover:bg-teal-50/20 shadow-xs'
          : 'bg-white/5 border-white/10 hover:border-teal-500/40 hover:bg-white/10'
      }`}
      title="Bấm để đổi vị trí người chơi"
    >
      {/* Squircle Gender Avatar */}
      <div
        className={`w-8 h-8 rounded-xl border flex items-center justify-center font-black text-xs flex-shrink-0 transition-colors ${
          isFemale
            ? isLight
              ? 'bg-pink-50 border-pink-200 text-pink-700'
              : 'bg-pink-500/15 border-pink-500/30 text-pink-300'
            : isLight
            ? 'bg-sky-50 border-sky-200 text-sky-700'
            : 'bg-sky-500/15 border-sky-500/30 text-sky-300'
        }`}
      >
        {player.name.slice(0, 1).toUpperCase()}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <span className={`text-[12.5px] font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {player.name}
          </span>
          {isFemale ? (
            <Venus className="w-3 h-3 text-pink-500 flex-shrink-0" />
          ) : (
            <Mars className="w-3 h-3 text-sky-500 flex-shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className={`text-[10px] font-bold ${isLight ? 'text-teal-700' : 'text-teal-300'}`}>
            {player.elo} Elo
          </span>
          {matchesPlayed > 0 && (
            <span className={`px-1 py-0.2 rounded text-[9px] font-semibold ${
              isLight ? 'bg-slate-100 text-slate-600' : 'bg-white/10 text-slate-300'
            }`}>
              {matchesPlayed} trận
            </span>
          )}
        </div>
      </div>
      <ArrowRightLeft className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
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
    <Card
      className={`p-4 rounded-2xl backdrop-blur-sm ${
        isLight ? 'bg-white border-slate-200/90 shadow-sm' : 'border-white/10 bg-slate-950/30'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
          <h3
            className={`text-xs sm:text-sm font-bold uppercase tracking-wider ${
              isLight ? 'text-slate-900' : 'text-slate-300'
            }`}
          >
            Băng ghế chờ lượt này ({bench.length} người đang nghỉ)
          </h3>
        </div>
        <span className={`text-[11px] hidden sm:inline ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
          Bấm vào người chơi để hoán đổi với người trên sân
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {bench.map(player => {
          const stats = sessionStats[player.id];
          const matchesPlayed = stats?.matchesPlayed || 0;
          const consecutiveRest = stats?.consecutiveRest || 0;
          const isSelected = swapTarget?.playerId === player.id;
          const isFemale = player.gender === 'female';

          return (
            <button
              key={player.id}
              type="button"
              onClick={() => onSwapClick({ type: 'bench', playerId: player.id })}
              className={`p-2.5 rounded-xl border text-left transition-all duration-200 cursor-pointer flex items-center gap-2 group ${
                isSelected
                  ? isLight
                    ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-400 text-amber-950'
                    : 'bg-amber-500/25 border-amber-400 ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-900'
                  : isLight
                  ? 'bg-slate-50/80 border-slate-200 hover:border-slate-300 text-slate-800'
                  : 'bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/10 text-white'
              }`}
            >
              {/* Squircle Gender Avatar */}
              <div
                className={`w-7 h-7 rounded-lg border flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                  isFemale
                    ? isLight
                      ? 'bg-pink-50 border-pink-200 text-pink-700'
                      : 'bg-pink-500/15 border-pink-500/30 text-pink-300'
                    : isLight
                    ? 'bg-sky-50 border-sky-200 text-sky-700'
                    : 'bg-sky-500/15 border-sky-500/30 text-sky-300'
                }`}
              >
                {player.name.slice(0, 1).toUpperCase()}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {player.name}
                  </span>
                  {isFemale ? (
                    <Venus className="w-3 h-3 text-pink-500 flex-shrink-0" />
                  ) : (
                    <Mars className="w-3 h-3 text-sky-500 flex-shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-1 text-[10px] mt-0.5">
                  <span className={`font-semibold ${isLight ? 'text-teal-700' : 'text-teal-300'}`}>
                    {player.elo}
                  </span>
                  <span className={`px-1 py-0.2 rounded text-[9px] font-bold ${
                    isLight ? 'bg-amber-100 text-amber-900' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    Nghỉ {consecutiveRest + 1}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

// -------------------------------------------------------------
// Component: Quick Score Entry Dialog
// -------------------------------------------------------------
interface QuickScoreDialogProps {
  court: CourtMatch;
  isLight: boolean;
  existingScore?: RecordedCourtScore;
  onClose: () => void;
  onSave: (score1: number, score2: number) => void;
  onOpenFullForm: () => void;
}

function QuickScoreDialog({
  court,
  isLight,
  existingScore,
  onClose,
  onSave,
  onOpenFullForm,
}: QuickScoreDialogProps) {
  const [s1, setS1] = useState<number | ''>(existingScore?.score1 ?? 21);
  const [s2, setS2] = useState<number | ''>(existingScore?.score2 ?? 18);

  const team1Names = court.team1.map(p => p.name).join(' & ');
  const team2Names = court.team2.map(p => p.name).join(' & ');

  const handleQuickPreset = (scoreTeam1: number, scoreTeam2: number) => {
    setS1(scoreTeam1);
    setS2(scoreTeam2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (s1 === '' || s2 === '') return;
    onSave(Number(s1), Number(s2));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-md rounded-2xl border p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-white/10 text-white'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-white/10">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-teal-600 dark:text-teal-400">Ghi điểm trực tiếp</span>
            <h3 className="font-black text-base">
              {court.courtName || `Sân ${court.courtIndex + 1}`}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Match Teams & Score inputs */}
          <div className="grid grid-cols-2 gap-3 items-center">
            {/* Team 1 */}
            <div className={`p-3 rounded-xl border text-center ${isLight ? 'bg-teal-50/60 border-teal-200' : 'bg-teal-500/10 border-teal-500/20'}`}>
              <span className="text-[10px] font-black uppercase tracking-wider block text-teal-700 dark:text-teal-400">
                Đội 1
              </span>
              <p className="text-xs font-bold truncate mt-0.5">{team1Names}</p>
              <div className="mt-2">
                <Input
                  type="number"
                  min="0"
                  max="50"
                  value={s1}
                  onChange={e => setS1(e.target.value === '' ? '' : Number(e.target.value))}
                  required
                  autoFocus
                  className={`text-center text-2xl font-black h-12 rounded-xl ${
                    isLight ? 'bg-white border-teal-300 text-slate-900' : 'bg-slate-950 border-teal-500/30 text-white'
                  }`}
                />
              </div>
            </div>

            {/* Team 2 */}
            <div className={`p-3 rounded-xl border text-center ${isLight ? 'bg-sky-50/60 border-sky-200' : 'bg-sky-500/10 border-sky-500/20'}`}>
              <span className="text-[10px] font-black uppercase tracking-wider block text-sky-700 dark:text-sky-400">
                Đội 2
              </span>
              <p className="text-xs font-bold truncate mt-0.5">{team2Names}</p>
              <div className="mt-2">
                <Input
                  type="number"
                  min="0"
                  max="50"
                  value={s2}
                  onChange={e => setS2(e.target.value === '' ? '' : Number(e.target.value))}
                  required
                  className={`text-center text-2xl font-black h-12 rounded-xl ${
                    isLight ? 'bg-white border-sky-300 text-slate-900' : 'bg-slate-950 border-sky-500/30 text-white'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Quick Preset Buttons (Common Badminton scores) */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Gợi ý tỉ số nhanh:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                [21, 19],
                [21, 18],
                [21, 15],
                [21, 12],
                [19, 21],
                [18, 21],
                [15, 21],
                [12, 21],
              ].map(([p1, p2]) => (
                <button
                  key={`${p1}-${p2}`}
                  type="button"
                  onClick={() => handleQuickPreset(p1, p2)}
                  className={`px-2 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                    s1 === p1 && s2 === p2
                      ? 'bg-teal-500 border-teal-500 text-white-force'
                      : isLight
                      ? 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'
                  }`}
                >
                  {p1} - {p2}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-white/10">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onOpenFullForm}
              className={`text-xs h-9 rounded-xl ${isLight ? 'text-slate-600' : 'text-slate-400'}`}
            >
              Mở bảng form đầy đủ
            </Button>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-xs h-9 rounded-xl"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-9 px-4 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white-force shadow-md"
              >
                Lưu kết quả & Elo
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
