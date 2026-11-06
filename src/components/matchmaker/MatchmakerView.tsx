import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Sparkles,
  Users,
  RotateCcw,
  RotateCw,
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
  Trophy,
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
  onSwapPlayers?: (source: SelectedSwapTarget, target: SelectedSwapTarget) => void;
  onPlayMatch: (court: CourtMatch) => void;
  onQuickSaveScore: (court: CourtMatch, score1: number, score2: number) => void;
  onClearCourtScore: (court: CourtMatch) => void;
  onRotateCourt: (court: CourtMatch) => void;
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
  onSwapPlayers,
  onPlayMatch,
  onQuickSaveScore,
  onClearCourtScore,
  onRotateCourt,
}: MatchmakerViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [quickScoreCourt, setQuickScoreCourt] = useState<CourtMatch | null>(null);
  const [swapCandidate, setSwapCandidate] = useState<{
    player: MatchmakerPlayer;
    source: SelectedSwapTarget;
    label: string;
  } | null>(null);

  // Lock body scroll whenever any modal / popup is open
  useEffect(() => {
    const isAnyModalOpen = Boolean(
      isCheckInModalOpen || swapCandidate || quickScoreCourt || isResetConfirmOpen
    );
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [isCheckInModalOpen, swapCandidate, quickScoreCourt, isResetConfirmOpen]);

  const filteredPlayers = allPlayers.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const neededPlayers = numCourts * 4;
  const isEnoughPlayers = checkedInIds.length >= neededPlayers;
  const maxCourtsPossible = Math.max(1, Math.floor(checkedInIds.length / 4));

  // Đếm số sân đã ghi điểm trong lượt
  const totalCourtsInRound = currentMatchup?.courts.length || 0;
  const recordedCount = Object.keys(recordedScores).length;
  const isAllCourtsRecorded = totalCourtsInRound > 0 && recordedCount >= totalCourtsInRound;

  const handleOpenSwapModal = (
    player: MatchmakerPlayer,
    source: SelectedSwapTarget,
    label: string
  ) => {
    setSwapCandidate({ player, source, label });
  };

  const handleConfirmSwap = (target: SelectedSwapTarget) => {
    if (!swapCandidate) return;
    if (onSwapPlayers) {
      onSwapPlayers(swapCandidate.source, target);
    } else {
      onSwapClick(swapCandidate.source);
      onSwapClick(target);
    }
    setSwapCandidate(null);
  };

  return (
    <div className="space-y-5 pb-6 relative">
      {/* Floating Toast Notification (Zero Layout Shift - Positioned at bottom to avoid covering top tabs) */}
      {notification && typeof document !== 'undefined' && createPortal(
        <div className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-[100] w-max max-w-[92vw] pointer-events-none animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div
            className={`px-5 py-2.5 rounded-full border flex items-center justify-center gap-2.5 shadow-2xl backdrop-blur-md pointer-events-auto min-w-[280px] sm:min-w-[360px] ${
              notification.type === 'success'
                ? isLight
                  ? 'bg-emerald-600 border-emerald-500 text-white-force shadow-emerald-950/20'
                  : 'bg-emerald-600 border-emerald-400 text-white-force shadow-black/50'
                : isLight
                ? 'bg-teal-600 border-teal-500 text-white-force shadow-teal-950/20'
                : 'bg-teal-600 border-teal-400 text-white-force shadow-black/50'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-white-force" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-white-force" />
            )}
            <span className="text-xs sm:text-sm font-bold text-white-force whitespace-nowrap leading-none">
              {notification.text}
            </span>
          </div>
        </div>,
        document.body
      )}

      {/* Control Hub Card */}
      <Card
        className={`overflow-hidden shadow-xl rounded-2xl border ${
          isLight
            ? 'bg-white border-slate-200/90 shadow-slate-200/60'
            : 'border-teal-500/20 bg-gradient-to-br from-slate-950/90 via-slate-900/80 to-teal-950/20 shadow-black/40'
        }`}
      >
        <CardHeader className="pb-3 pt-4 sm:pt-5 px-3.5 sm:px-6">
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <div className="min-w-0 flex-1">
              <CardTitle className={`text-sm sm:text-base md:text-lg font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                XẾP ĐỘI HÌNH THI ĐẤU
              </CardTitle>
            </div>

            {/* Current Round Badge & Reset Action */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
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

        <CardContent className="space-y-3 pt-1 px-4 sm:px-6 pb-5">
          {/* Tier 1: Configuration Controls (2 Equal Columns, Clean Heights) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 1. Touch-friendly Court Stepper */}
            <div
              className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all min-h-[70px] ${
                isLight ? 'bg-slate-50/80 border-slate-200/90 shadow-xs' : 'bg-white/5 border-white/5'
              }`}
            >
              <div>
                <span className={`text-xs font-bold block ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                  Số sân thi đấu
                </span>
                <span className={`text-[11px] font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Cần {neededPlayers} VĐV ({numCourts} sân)
                </span>
              </div>
              <div className="flex items-center gap-2">
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
              className={`p-3.5 rounded-2xl border flex items-center justify-between text-left transition-all duration-200 cursor-pointer group active:scale-[0.99] min-h-[70px] ${
                isLight
                  ? 'bg-slate-50/80 border-slate-200/90 hover:border-teal-400 hover:bg-teal-50/30 shadow-xs'
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

              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-colors ${
                    isEnoughPlayers
                      ? isLight
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                      : isLight
                      ? 'bg-amber-50 border-amber-300 text-amber-800'
                      : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                  }`}
                >
                  {isEnoughPlayers ? `Đủ ${maxCourtsPossible} sân` : `Thiếu ${neededPlayers - checkedInIds.length}`}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-teal-400 transition-colors" />
              </div>
            </button>
          </div>

          {/* Tier 2: Dedicated Primary Action CTA (Full Width, Perfectly Aligned) */}
          <Button
            type="button"
            onClick={onGenerate}
            disabled={checkedInIds.length < 4}
            className={`w-full h-12 rounded-2xl font-bold text-sm border transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2.5 shadow-md ${
              currentMatchup
                ? isLight
                  ? 'bg-teal-50 hover:bg-teal-100/80 text-teal-900 border-teal-300/80 shadow-xs'
                  : 'bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border-teal-500/30 shadow-sm'
                : 'bg-teal-600 hover:bg-teal-700 text-white-force shadow-teal-600/25'
            }`}
          >
            <Sparkles className={`w-4 h-4 ${currentMatchup ? (isLight ? 'text-teal-700' : 'text-teal-400') : 'text-white-force'}`} />
            <span>{currentMatchup ? 'Đổi Kèo Lượt Này' : 'Xếp Sân Tự Động'}</span>
          </Button>
        </CardContent>
      </Card>

      {/* Empty State / Ready to Generate Placeholder */}
      {(!currentMatchup || currentMatchup.courts.length === 0) && (
        <Card
          className={`p-5 sm:p-7 rounded-3xl border text-center space-y-4 backdrop-blur-sm transition-all animate-in fade-in duration-300 ${
            isLight
              ? 'bg-white/80 border-slate-200/90 shadow-sm'
              : 'bg-slate-900/40 border-white/10'
          }`}
        >
          <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-600 dark:text-teal-400 shadow-xs">
            <Sparkles className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>

          <div className="max-w-md mx-auto space-y-1">
            <h3 className={`text-base font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Sẵn sàng xếp đội hình lượt #{roundNumber}
            </h3>
            <p className={`text-xs sm:text-sm ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              {checkedInIds.length >= 4 ? (
                <>
                  Đã có <strong className="text-teal-600 dark:text-teal-400 font-bold">{checkedInIds.length}</strong> thành viên điểm danh (Đủ cho {maxCourtsPossible} sân). Bấm nút <strong className={isLight ? 'text-slate-900' : 'text-white'}>"Xếp Sân Tự Động"</strong> ở trên để tạo các cặp đấu cân kèo!
                </>
              ) : (
                <>
                  Hiện có <strong className="text-amber-600 dark:text-amber-400 font-bold">{checkedInIds.length}</strong> người điểm danh. Cần ít nhất 4 người để bắt đầu xếp sân thi đấu.
                </>
              )}
            </p>
          </div>

          {/* Quick list of checked-in players */}
          {checkedInIds.length > 0 && (
            <div className="pt-3 border-t border-slate-200/70 dark:border-white/5 space-y-2">
              <span className={`text-[11px] font-bold uppercase tracking-wider block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Thành viên có mặt hôm nay ({checkedInIds.length})
              </span>
              <div className="flex flex-wrap justify-center gap-1.5 max-h-44 overflow-y-auto p-1 scroll-hide">
                {allPlayers
                  .filter(p => checkedInIds.includes(p.id))
                  .map(p => (
                    <span
                      key={p.id}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold border ${
                        isLight
                          ? 'bg-slate-50 border-slate-200 text-slate-800 shadow-2xs'
                          : 'bg-white/5 border-white/10 text-slate-300'
                      }`}
                    >
                      <span>{p.name}</span>
                      {p.gender === 'female' ? (
                        <Venus className="w-3 h-3 text-pink-500" />
                      ) : (
                        <Mars className="w-3 h-3 text-sky-500" />
                      )}
                      <span className={`text-[10px] ml-0.5 font-bold ${isLight ? 'text-teal-700' : 'text-teal-400'}`}>
                        {p.elo}
                      </span>
                    </span>
                  ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Courts Display Section */}
      {currentMatchup && currentMatchup.courts.length > 0 && (
        <div className="space-y-4">
          {/* Section Header with Next Round Action */}
          <div className="flex items-center justify-between gap-2.5 px-1">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <h2 className={`text-sm sm:text-base font-black uppercase tracking-wider flex items-center gap-1.5 shrink-0 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                <span className="hidden sm:inline">🏸 Đội hình thi đấu lượt #{roundNumber}</span>
                <span className="sm:hidden">🏸 Lượt #{roundNumber}</span>
              </h2>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border shrink-0 ${
                isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-white/5 border-white/10 text-slate-300'
              }`}>
                {currentMatchup.courts.length} sân
              </span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border flex items-center gap-1 shrink-0 ${
                isLight ? 'bg-teal-50 border-teal-200 text-teal-800' : 'bg-teal-500/15 border-teal-500/30 text-teal-300'
              }`}>
                <RotateCw className="w-3 h-3 text-teal-500" />
                Cuốn chiếu từng sân
              </span>
            </div>

            <Button
              type="button"
              onClick={onConfirmNextRound}
              className={`h-9 sm:h-10 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold shadow-sm cursor-pointer active:scale-98 transition-all flex items-center gap-1.5 shrink-0 ${
                isAllCourtsRecorded
                  ? 'bg-teal-600 hover:bg-teal-700 text-white-force ring-2 ring-teal-500/30'
                  : isLight
                  ? 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 hover:border-slate-400'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-white/15'
              }`}
              title="Chuyển toàn bộ các sân sang lượt tiếp theo"
            >
              <span className="hidden sm:inline">
                {isAllCourtsRecorded
                  ? `Hoàn tất & Sang lượt #${roundNumber + 1}`
                  : `Xác nhận & Sang lượt #${roundNumber + 1}`}
              </span>
              <span className="sm:hidden">
                {`Sang lượt #${roundNumber + 1}`}
              </span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-current" />
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
                swapCandidatePlayerId={swapCandidate?.player.id}
                onOpenSwapModal={handleOpenSwapModal}
                onPlayMatch={onPlayMatch}
                onOpenQuickScore={() => setQuickScoreCourt(court)}
                onQuickSaveScore={onQuickSaveScore}
                onClearCourtScore={onClearCourtScore}
                onRotateCourt={onRotateCourt}
              />
            ))}
          </div>

          {/* Bench / Resting Players Lounge */}
          <BenchLounge
            bench={currentMatchup.benchPlayers}
            sessionStats={sessionStats}
            isLight={isLight}
            swapCandidatePlayerId={swapCandidate?.player.id}
            onOpenSwapModal={handleOpenSwapModal}
          />

          {/* Bottom Next Round Action Button for Easy Navigation */}
          <div className="pt-2 flex justify-center">
            <Button
              type="button"
              onClick={onConfirmNextRound}
              className={`w-full sm:w-auto h-12 px-8 rounded-2xl text-xs sm:text-sm font-bold shadow-lg cursor-pointer active:scale-98 transition-all flex items-center justify-center gap-2 ${
                isAllCourtsRecorded
                  ? 'bg-teal-600 hover:bg-teal-700 text-white-force ring-4 ring-teal-500/20'
                  : 'bg-teal-600 hover:bg-teal-700 text-white-force shadow-teal-600/20'
              }`}
            >
              <span className="text-white-force font-bold">Xác nhận lượt #{roundNumber} & Xếp tiếp lượt #{roundNumber + 1}</span>
              <ArrowRight className="w-4 h-4 text-white-force" />
            </Button>
          </div>
        </div>
      )}

      {/* Swap Player Selection Modal */}
      {swapCandidate && currentMatchup && (
        <SwapPlayerModal
          candidate={swapCandidate}
          currentMatchup={currentMatchup}
          sessionStats={sessionStats}
          isLight={isLight}
          onClose={() => setSwapCandidate(null)}
          onConfirmSwap={handleConfirmSwap}
        />
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
        />
      )}

      {/* Reset Session Confirmation Dialog (Rendered via createPortal to be dead-center on screen) */}
      {isResetConfirmOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200 overscroll-contain touch-none"
          onClick={() => setIsResetConfirmOpen(false)}
        >
          <div
            className={`w-full max-w-sm rounded-2xl border p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 overscroll-contain touch-auto ${
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
        </div>,
        document.body
      )}

      {/* Fast Check-In Dialog / Sheet (Rendered via createPortal to be dead-center on screen) */}
      {isCheckInModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200 overscroll-contain touch-none"
          onClick={() => setIsCheckInModalOpen(false)}
        >
          <div
            className={`w-full max-w-2xl max-h-[85vh] rounded-2xl border flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 overscroll-contain touch-auto ${
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
            <div className="flex-1 overflow-y-auto p-4 scroll-hide overscroll-contain touch-pan-y">
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
        </div>,
        document.body
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
  swapCandidatePlayerId?: string;
  onOpenSwapModal: (player: MatchmakerPlayer, source: SelectedSwapTarget, label: string) => void;
  onPlayMatch: (court: CourtMatch) => void;
  onOpenQuickScore: () => void;
  onQuickSaveScore: (court: CourtMatch, score1: number, score2: number) => void;
  onClearCourtScore: (court: CourtMatch) => void;
  onRotateCourt: (court: CourtMatch) => void;
}

function CourtCard({
  court,
  sessionStats,
  isLight,
  recordedScore,
  swapCandidatePlayerId,
  onOpenSwapModal,
  onPlayMatch,
  onOpenQuickScore,
  onQuickSaveScore,
  onClearCourtScore,
  onRotateCourt,
}: CourtCardProps) {
  const isTeam1Won = recordedScore ? recordedScore.score1 > recordedScore.score2 : false;
  const isTeam2Won = recordedScore ? recordedScore.score2 > recordedScore.score1 : false;
  const hasScore = !!recordedScore;

  const qualityBadge = () => {
    if (court.quality === 'perfect') {
      return (
        <span
          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
            isLight
              ? 'bg-emerald-50 text-emerald-800'
              : 'bg-emerald-500/15 text-emerald-400'
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
          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
            isLight
              ? 'bg-teal-50 text-teal-800'
              : 'bg-teal-500/15 text-teal-300'
          }`}
        >
          <Check className="w-3 h-3" />
          Cân đối ({court.balancePercent}%)
        </span>
      );
    }
    return (
      <span
        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
          isLight
            ? 'bg-amber-50 border-amber-300 text-amber-900'
            : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
        }`}
      >
        Lệch {court.eloDiff} Elo
      </span>
    );
  };

  return (
    <div
      className={`rounded-2xl border backdrop-blur-sm p-4 relative overflow-hidden flex flex-col justify-between shadow-sm transition-all ${
        recordedScore
          ? isLight
            ? 'bg-emerald-50/40 border-emerald-300/80 text-slate-800'
            : 'bg-emerald-950/20 border-emerald-500/30 text-white'
          : isLight
          ? 'bg-white border-slate-200/90 text-slate-800'
          : 'bg-slate-900/70 border-white/10 text-white'
      }`}
    >
      {/* Court Header */}
      <div className={`flex items-center justify-between border-b pb-3 mb-3 ${isLight ? 'border-slate-100' : 'border-white/5'}`}>
        <div className="flex items-center gap-2">
          <span
            className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs ${
              isLight
                ? 'bg-teal-500/10 text-teal-800'
                : 'bg-teal-500/20 text-teal-300'
            }`}
          >
            {court.courtIndex + 1}
          </span>
          {recordedScore ? (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
              isLight
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-xs'
                : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
            }`}>
              ✓ Đã có điểm ({recordedScore.score1} - {recordedScore.score2})
            </span>
          ) : (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border flex items-center gap-1 ${
              isLight
                ? 'bg-slate-100 border-slate-200 text-slate-600'
                : 'bg-white/5 border-white/10 text-slate-300'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Đang đấu
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {qualityBadge()}
        </div>
      </div>

      {/* Badminton Match Court Visualizer (Mô phỏng thảm sân cầu lông Yonex chuẩn tỷ lệ dài x rộng dọc) */}
      <div className="w-full max-w-[310px] sm:max-w-[330px] mx-auto relative rounded-2xl overflow-hidden shadow-lg border-2 border-emerald-950/50 dark:border-emerald-600/60 bg-[#0c7143] select-none my-1 flex flex-col">
        {/* Nền Thảm Cầu Lông Xanh Chuẩn Thi Đấu */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b643a] via-[#0d7547] to-[#0b643a] pointer-events-none" />

        {/* Header Đội 1 Bar (Tách biệt ở phía trên, không bị vạch sân đè lên) */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            if (isTeam1Won) {
              onClearCourtScore(court);
            } else {
              onQuickSaveScore(court, 21, 18);
            }
          }}
          className={`relative z-20 px-3 py-2 flex items-center justify-between text-xs transition-colors cursor-pointer border-b ${
            isTeam1Won
              ? 'bg-amber-500/20 border-amber-400/40'
              : 'bg-black/25 hover:bg-black/35 border-white/10'
          }`}
          title={isTeam1Won ? "Bấm để hủy / đặt lại kết quả" : "Bấm để chọn Đội 1 chiến thắng"}
        >
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-md font-black text-[10px] tracking-wider uppercase border shadow-xs transition-all ${
              isTeam1Won
                ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-amber-500/20'
                : 'bg-white/15 text-white border-white/20'
            }`}>
              Đội 1
            </span>
            {isTeam1Won ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 border border-amber-300 shadow-xs transition-all hover:bg-rose-50 hover:text-rose-600 group/win">
                <Check className="w-3 h-3 stroke-[3] text-slate-950 group-hover/win:hidden" />
                <X className="w-3 h-3 stroke-[3] text-rose-500 hidden group-hover/win:inline" />
                <span>Thắng</span>
                <span className="text-[9px] text-rose-500 font-normal ml-0.5 hidden group-hover/win:inline">Hủy</span>
              </span>
            ) : (
              <span className="text-[10px] font-medium text-white/60 hover:text-white transition-colors">
                Chọn thắng
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 font-bold">
            {hasScore && (
              <span className={`text-xs ${isTeam1Won ? 'text-amber-300 font-black drop-shadow-xs' : 'text-white/60'}`}>
                {recordedScore.score1} đ
              </span>
            )}
            <span className="text-[11px] text-white/95 font-bold drop-shadow-xs">
              Elo TB: {court.team1Elo}
            </span>
          </div>
        </div>

        {/* Vùng Sân Đấu (Có vạch kẻ Yonex chuẩn và 4 vị trí thi đấu theo tỷ lệ dọc chuẩn) */}
        <div className="relative p-2 sm:p-2.5">
          {/* Khung Vạch Kẻ Sân Cầu Lông (Chuẩn BWF theo tỷ lệ dọc 13.4m x 6.1m) */}
          <div className="absolute inset-2 sm:inset-2.5 border-2 border-white/85 rounded-xs pointer-events-none">
            {/* Chữ YONEX ở 2 đầu sân */}
            <div className="absolute top-1 left-0 right-0 text-center text-[7.5px] font-black tracking-[0.3em] text-white/35 uppercase pointer-events-none">
              YONEX
            </div>
            <div className="absolute bottom-1 left-0 right-0 text-center text-[7.5px] font-black tracking-[0.3em] text-white/35 uppercase pointer-events-none">
              YONEX
            </div>

            {/* Đường biên đơn (Singles Sidelines): 2 vạch dọc hai bên */}
            <div className="absolute inset-y-0 left-2.5 sm:left-3 border-r border-white/60 pointer-events-none" />
            <div className="absolute inset-y-0 right-2.5 sm:right-3 border-l border-white/60 pointer-events-none" />

            {/* Vạch giao cầu dài đánh đôi (Doubles Long Service Line - Top & Bottom ~0.76m) */}
            <div className="absolute top-7 sm:top-8 left-0 right-0 border-b border-white/60 pointer-events-none" />
            <div className="absolute bottom-7 sm:bottom-8 left-0 right-0 border-t border-white/60 pointer-events-none" />

            {/* Vạch giao cầu ngắn (Short Service Line - 2 bên lưới ~1.98m) */}
            <div className="absolute top-[calc(50%-40px)] sm:top-[calc(50%-44px)] left-0 right-0 border-b border-white/70 pointer-events-none" />
            <div className="absolute bottom-[calc(50%-40px)] sm:bottom-[calc(50%-44px)] left-0 right-0 border-t border-white/70 pointer-events-none" />

            {/* Đường trung tâm (Center Line - Phân chia ô giao cầu trái / phải ở 2 nửa sân) */}
            <div className="absolute top-7 sm:top-8 bottom-[calc(50%-40px)] sm:bottom-[calc(50%-44px)] left-1/2 -translate-x-1/2 border-l border-white/70 pointer-events-none" />
            <div className="absolute top-[calc(50%+40px)] sm:top-[calc(50%+44px)] bottom-7 sm:bottom-8 left-1/2 -translate-x-1/2 border-l border-white/70 pointer-events-none" />
          </div>

          {/* Nửa Sân Trên: Đội 1 (Click vào nửa sân để chọn hoặc hủy Đội 1 thắng) */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => {
              if (isTeam1Won) {
                onClearCourtScore(court);
              } else {
                onQuickSaveScore(court, 21, 18);
              }
            }}
            className={`relative z-10 min-h-[190px] sm:min-h-[210px] flex flex-col justify-between pt-7 sm:pt-8 pb-2 px-1 transition-all cursor-pointer rounded-t-lg group ${
              isTeam1Won
                ? 'bg-amber-400/15 ring-2 ring-amber-400/70 ring-inset shadow-[inset_0_0_24px_rgba(251,191,36,0.25)]'
                : 'hover:bg-white/[0.06]'
            }`}
            title={isTeam1Won ? "Bấm để hủy / đặt lại kết quả" : "Bấm vào nửa sân Đội 1 để chọn Đội 1 chiến thắng"}
          >
            {/* 2 Vị Trí VĐV Đội 1 (Nằm trong 2 ô giao cầu trái / phải) */}
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2 relative z-20 my-auto">
              {court.team1.map(player => (
                <PlayerCourtSlot
                  key={player.id}
                  player={player}
                  sessionStats={sessionStats}
                  courtIdx={court.courtIndex}
                  courtName={`Sân ${court.courtIndex + 1}`}
                  teamName="Đội 1"
                  isLight={isLight}
                  isSelectedForSwap={swapCandidatePlayerId === player.id}
                  onOpenSwapModal={onOpenSwapModal}
                />
              ))}
            </div>

            {/* Vùng trước lưới (No-service zone của Đội 1 ~1.98m) */}
            <div className="h-8 sm:h-10 pointer-events-none" />
          </div>

          {/* Lưới Cầu Lông ở chính giữa (The Net Line) */}
          <div className="relative z-20 flex items-center justify-center my-0 pointer-events-none">
            {/* Dải lưới ngang */}
            <div className="absolute inset-0 flex flex-col justify-center">
              <div className="w-full h-1 bg-white/90 shadow-xs" />
              <div className="w-full h-3.5 bg-slate-950/70 border-y border-white/30 backdrop-blur-xs" />
            </div>

            {/* Huy hiệu trung tâm lưới (Hiển thị tỷ số hoặc độ chênh Elo) */}
            <div
              className={`relative px-3 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1.5 shadow-md border pointer-events-auto transition-all ${
                hasScore
                  ? 'bg-amber-400 text-slate-950 border-amber-300 font-black shadow-md'
                  : 'bg-white text-emerald-950 border-white/50 shadow-xs'
              }`}
            >
              {hasScore ? (
                <span className="tracking-widest text-xs font-black">
                  {recordedScore.score1} - {recordedScore.score2}
                </span>
              ) : (
                <>
                  <span className="text-emerald-900 font-black tracking-wider">LƯỚI</span>
                  <span className="opacity-40">•</span>
                  <span>Δ {court.eloDiff} Elo</span>
                </>
              )}
            </div>
          </div>

          {/* Nửa Sân Dưới: Đội 2 (Click vào nửa sân để chọn hoặc hủy Đội 2 thắng) */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => {
              if (isTeam2Won) {
                onClearCourtScore(court);
              } else {
                onQuickSaveScore(court, 18, 21);
              }
            }}
            className={`relative z-10 min-h-[190px] sm:min-h-[210px] flex flex-col justify-between pt-2 pb-7 sm:pb-8 px-1 transition-all cursor-pointer rounded-b-lg group ${
              isTeam2Won
                ? 'bg-amber-400/15 ring-2 ring-amber-400/70 ring-inset shadow-[inset_0_0_24px_rgba(251,191,36,0.25)]'
                : 'hover:bg-white/[0.06]'
            }`}
            title={isTeam2Won ? "Bấm để hủy / đặt lại kết quả" : "Bấm vào nửa sân Đội 2 để chọn Đội 2 chiến thắng"}
          >
            {/* Vùng trước lưới (No-service zone của Đội 2 ~1.98m) */}
            <div className="h-8 sm:h-10 pointer-events-none" />

            {/* 2 Vị Trí VĐV Đội 2 (Nằm trong 2 ô giao cầu trái / phải) */}
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2 relative z-20 my-auto">
              {court.team2.map(player => (
                <PlayerCourtSlot
                  key={player.id}
                  player={player}
                  sessionStats={sessionStats}
                  courtIdx={court.courtIndex}
                  courtName={`Sân ${court.courtIndex + 1}`}
                  teamName="Đội 2"
                  isLight={isLight}
                  isSelectedForSwap={swapCandidatePlayerId === player.id}
                  onOpenSwapModal={onOpenSwapModal}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Header Đội 2 Bar (Tách biệt ở phía dưới, không bị vạch sân đè lên) */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            if (isTeam2Won) {
              onClearCourtScore(court);
            } else {
              onQuickSaveScore(court, 18, 21);
            }
          }}
          className={`relative z-20 px-3 py-2 flex items-center justify-between text-xs transition-colors cursor-pointer border-t ${
            isTeam2Won
              ? 'bg-amber-500/20 border-amber-400/40'
              : 'bg-black/25 hover:bg-black/35 border-white/10'
          }`}
          title={isTeam2Won ? "Bấm để hủy / đặt lại kết quả" : "Bấm để chọn Đội 2 chiến thắng"}
        >
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-md font-black text-[10px] tracking-wider uppercase border shadow-xs transition-all ${
              isTeam2Won
                ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-amber-500/20'
                : 'bg-white/15 text-white border-white/20'
            }`}>
              Đội 2
            </span>
            {isTeam2Won ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 border border-amber-300 shadow-xs transition-all hover:bg-rose-50 hover:text-rose-600 group/win">
                <Check className="w-3 h-3 stroke-[3] text-slate-950 group-hover/win:hidden" />
                <X className="w-3 h-3 stroke-[3] text-rose-500 hidden group-hover/win:inline" />
                <span>Thắng</span>
                <span className="text-[9px] text-rose-500 font-normal ml-0.5 hidden group-hover/win:inline">Hủy</span>
              </span>
            ) : (
              <span className="text-[10px] font-medium text-white/60 hover:text-white transition-colors">
                Chọn thắng
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 font-bold">
            {hasScore && (
              <span className={`text-xs ${isTeam2Won ? 'text-amber-300 font-black drop-shadow-xs' : 'text-white/60'}`}>
                {recordedScore.score2} đ
              </span>
            )}
            <span className="text-[11px] text-white/95 font-bold drop-shadow-xs">
              Elo TB: {court.team2Elo}
            </span>
          </div>
        </div>
      </div>

      {/* Card Action Buttons */}
      <div className={`pt-3 mt-3 border-t flex flex-wrap items-center justify-between gap-2 ${isLight ? 'border-slate-100' : 'border-white/5'}`}>
        <div className="flex items-center gap-1.5">
          {recordedScore ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onOpenQuickScore}
              className={`h-9 px-2.5 text-xs font-semibold cursor-pointer rounded-xl ${
                isLight
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              title="Sửa điểm số trận đấu"
            >
              <Edit3 className="w-3.5 h-3.5 mr-1" />
              Sửa ({recordedScore.score1}-{recordedScore.score2})
            </Button>
          ) : (
            <Button
              type="button"
              onClick={onOpenQuickScore}
              className="h-9 px-3.5 text-xs font-bold rounded-xl cursor-pointer active:scale-98 transition-all flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white-force shadow-sm"
              title="Ghi điểm nhanh cho trận này"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              Ghi điểm
            </Button>
          )}
        </div>

        {/* Nút Kết thúc & Bốc trận mới cuốn chiếu */}
        {recordedScore ? (
          <Button
            type="button"
            onClick={() => onRotateCourt(court)}
            className="h-9 sm:h-10 px-3.5 sm:px-4 text-xs font-black rounded-xl cursor-pointer active:scale-98 transition-all flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white-force shadow-md shadow-emerald-950/20"
            title="Lưu kết quả trận này và bốc ngay người từ ghế chờ vào sân tiếp tục thi đấu"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Kết thúc & Bốc trận mới</span>
          </Button>
        ) : (
          <Button
            type="button"
            onClick={onOpenQuickScore}
            className={`h-9 px-3 text-xs font-medium rounded-xl cursor-pointer transition-all flex items-center gap-1.5 border ${
              isLight
                ? 'border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                : 'border-white/10 text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            title="Bấm chọn đội thắng trên sân hoặc ghi điểm để kết thúc"
          >
            <RotateCw className="w-3.5 h-3.5 opacity-40" />
            <span className="hidden sm:inline">Chưa ghi điểm</span>
            <span className="sm:hidden">Kết thúc</span>
          </Button>
        )}
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
  courtName: string;
  teamName: string;
  isLight: boolean;
  isSelectedForSwap: boolean;
  onOpenSwapModal: (player: MatchmakerPlayer, source: SelectedSwapTarget, label: string) => void;
}

function PlayerCourtSlot({
  player,
  sessionStats,
  courtIdx,
  courtName,
  teamName,
  isLight,
  isSelectedForSwap,
  onOpenSwapModal,
}: PlayerCourtSlotProps) {
  const isFemale = player.gender === 'female';
  const stats = sessionStats[player.id];
  const matchesPlayed = stats?.matchesPlayed || 0;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onOpenSwapModal(
          player,
          { type: 'court', playerId: player.id, courtIdx },
          teamName
        );
      }}
      className={`flex items-center justify-between p-2 sm:p-2.5 rounded-xl text-left transition-all duration-200 cursor-pointer group active:scale-[0.98] ${
        isSelectedForSwap
          ? 'bg-amber-300 ring-2 ring-amber-400 text-amber-950 font-black shadow-md'
          : isLight
          ? 'bg-white/95 hover:bg-white text-slate-900 shadow-sm border border-emerald-950/20 hover:border-amber-400 hover:shadow-md'
          : 'bg-slate-900/95 hover:bg-slate-900 text-white shadow-sm border border-white/20 hover:border-amber-400 hover:shadow-md'
      }`}
      title="Bấm để đổi người thi đấu"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <span className={`text-[11px] sm:text-xs font-black truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {player.name}
          </span>
          {isFemale ? (
            <Venus className="w-3 h-3 text-pink-500 flex-shrink-0" />
          ) : (
            <Mars className="w-3 h-3 text-sky-500 flex-shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-1 mt-0.5 text-[9px] sm:text-[10px]">
          <span className={`font-black ${isLight ? 'text-teal-700' : 'text-teal-300'}`}>
            {player.elo}
          </span>
          <span className={isLight ? 'text-slate-400' : 'text-slate-500'}>Elo</span>
          {matchesPlayed > 0 && (
            <span className={`ml-0.5 px-1 py-0.2 rounded text-[8px] font-semibold ${
              isLight ? 'bg-slate-100 text-slate-600' : 'bg-white/10 text-slate-300'
            }`}>
              {matchesPlayed}t
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center ml-1 flex-shrink-0">
        <span
          className={`p-1 rounded-md transition-colors ${
            isLight
              ? 'bg-slate-100 text-slate-400 group-hover:text-amber-600 group-hover:bg-amber-50'
              : 'bg-white/10 text-slate-400 group-hover:text-amber-400 group-hover:bg-amber-500/20'
          }`}
          title="Đổi người"
        >
          <ArrowRightLeft className="w-2.5 h-2.5" />
        </span>
      </div>
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
  swapCandidatePlayerId?: string;
  onOpenSwapModal: (player: MatchmakerPlayer, source: SelectedSwapTarget, label: string) => void;
}

function BenchLounge({
  bench,
  sessionStats,
  isLight,
  swapCandidatePlayerId,
  onOpenSwapModal,
}: BenchLoungeProps) {
  if (bench.length === 0) return null;

  return (
    <Card
      className={`p-3.5 sm:p-4 rounded-2xl backdrop-blur-sm ${
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

      <div className="flex flex-col gap-2">
        {bench.map(player => {
          const stats = sessionStats[player.id];
          const consecutiveRest = stats?.consecutiveRest || 0;
          const isSelected = swapCandidatePlayerId === player.id;
          const isFemale = player.gender === 'female';

          return (
            <button
              key={player.id}
              type="button"
              onClick={() => onOpenSwapModal(player, { type: 'bench', playerId: player.id }, 'Băng ghế chờ')}
              className={`w-full grid grid-cols-[1fr_24px_56px_68px] sm:grid-cols-[1fr_28px_68px_80px] items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 rounded-xl border text-left transition-all duration-200 cursor-pointer group active:scale-[0.99] ${
                isSelected
                  ? isLight
                    ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-400 text-amber-950 shadow-xs'
                    : 'bg-amber-500/25 border-amber-400 ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-900'
                  : isLight
                  ? 'bg-slate-50/90 hover:bg-white border-slate-200 hover:border-teal-400 text-slate-800 shadow-xs'
                  : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10 text-white'
              }`}
            >
              {/* Cột 1: Tên người chơi */}
              <span className={`text-xs sm:text-sm font-bold truncate min-w-0 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {player.name}
              </span>

              {/* Cột 2: Biểu tượng giới tính (căn dọc thẳng hàng) */}
              <div className="flex items-center justify-center">
                {isFemale ? (
                  <Venus className="w-3.5 h-3.5 text-pink-500 flex-shrink-0" />
                ) : (
                  <Mars className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
                )}
              </div>

              {/* Cột 3: Điểm số Elo (căn dọc thẳng hàng sang phải) */}
              <div className="text-right whitespace-nowrap">
                <span className={`text-xs sm:text-sm font-bold ${isLight ? 'text-teal-700' : 'text-teal-300'}`}>
                  {player.elo}
                </span>
                <span className={`text-[10px] ml-1 hidden sm:inline ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                  Elo
                </span>
              </div>

              {/* Cột 5: Tag lượt nghỉ (căn dọc thẳng hàng) */}
              <div className="flex justify-end">
                <span className={`px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-bold whitespace-nowrap text-center ${
                  isLight
                    ? 'bg-amber-100 text-amber-950 border border-amber-300'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  Nghỉ {consecutiveRest + 1}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

// -------------------------------------------------------------
// Component: Swap Player Modal (Popup chọn người thay thế)
// -------------------------------------------------------------
interface SwapPlayerModalProps {
  candidate: {
    player: MatchmakerPlayer;
    source: SelectedSwapTarget;
    label: string;
  };
  currentMatchup: MatchmakingResult;
  sessionStats: Record<string, PlayerSessionStats>;
  isLight: boolean;
  onClose: () => void;
  onConfirmSwap: (target: SelectedSwapTarget) => void;
}

function SwapPlayerModal({
  candidate,
  currentMatchup,
  sessionStats,
  isLight,
  onClose,
  onConfirmSwap,
}: SwapPlayerModalProps) {
  const [filterQuery, setFilterQuery] = useState('');
  const { player: sourcePlayer, label: sourceLabel } = candidate;

  // Lấy danh sách băng ghế chờ (loại trừ chính candidate nếu candidate đang ở bench)
  const benchCandidates = currentMatchup.benchPlayers.filter(p => p.id !== sourcePlayer.id);

  // Lấy danh sách tất cả người chơi trên các sân
  const courtPlayersList: {
    player: MatchmakerPlayer;
    courtIdx: number;
    courtName: string;
    teamName: string;
  }[] = [];

  currentMatchup.courts.forEach(court => {
    const cName = `Sân ${court.courtIndex + 1}`;
    court.team1.forEach(p => {
      if (p.id !== sourcePlayer.id) {
        courtPlayersList.push({ player: p, courtIdx: court.courtIndex, courtName: cName, teamName: 'Đội 1' });
      }
    });
    court.team2.forEach(p => {
      if (p.id !== sourcePlayer.id) {
        courtPlayersList.push({ player: p, courtIdx: court.courtIndex, courtName: cName, teamName: 'Đội 2' });
      }
    });
  });

  const query = filterQuery.toLowerCase().trim();
  const filteredBench = benchCandidates.filter(p => !query || p.name.toLowerCase().includes(query));
  const filteredCourtPlayers = courtPlayersList.filter(
    item => !query || item.player.name.toLowerCase().includes(query)
  );

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200 overscroll-contain touch-none"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-lg max-h-[85vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 overscroll-contain touch-auto ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-white/10 text-white'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-4 py-3 sm:px-5 sm:py-3.5 border-b flex items-center justify-between gap-3 ${isLight ? 'border-slate-200 bg-slate-50/70' : 'border-white/10 bg-white/5'}`}>
          <div className="min-w-0">
            <h3 className="font-black text-base leading-tight">Đổi người thi đấu</h3>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Chọn người để hoán đổi vị trí
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-xl transition-colors flex-shrink-0 cursor-pointer ${
              isLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/60' : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Player Current Position Card */}
        <div className={`px-4 py-2.5 sm:px-5 border-b flex items-center justify-between gap-3 ${isLight ? 'bg-amber-50/80 border-amber-200/80' : 'bg-amber-500/10 border-amber-500/20'}`}>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={`font-black text-sm sm:text-base truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>{sourcePlayer.name}</span>
              {sourcePlayer.gender === 'female' ? (
                <Venus className="w-3.5 h-3.5 text-pink-500 flex-shrink-0" />
              ) : (
                <Mars className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
              )}
              {sourceLabel === 'Đội 1' || sourceLabel === 'Đội 2' ? (
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[9px] font-black border ${
                    sourceLabel === 'Đội 1'
                      ? isLight
                        ? 'bg-teal-50 border-teal-300 text-teal-800'
                        : 'bg-teal-500/15 border-teal-500/30 text-teal-300'
                      : isLight
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-800'
                      : 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300'
                  }`}
                >
                  {sourceLabel}
                </span>
              ) : (
                <span className={`text-xs font-bold ${isLight ? 'text-amber-900' : 'text-amber-300'}`}>{sourceLabel}</span>
              )}
            </div>
            <div className="text-[11px] font-semibold mt-0.5 text-teal-600 dark:text-teal-400">
              {sourcePlayer.elo} Elo
            </div>
          </div>

          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border shadow-2xs flex-shrink-0 ${
            isLight
              ? 'bg-amber-500/15 border-amber-500/30 text-amber-900'
              : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
          }`}>
            Đang đổi vị trí
          </span>
        </div>

        {/* Search Bar */}
        {(benchCandidates.length + courtPlayersList.length > 4) && (
          <div className={`p-3 border-b ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Tìm người thay thế theo tên..."
                value={filterQuery}
                onChange={e => setFilterQuery(e.target.value)}
                className={`pl-9 h-9 text-xs rounded-xl ${
                  isLight
                    ? 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400'
                    : 'border-white/10 bg-slate-950/60 text-slate-200 placeholder:text-slate-500'
                }`}
              />
            </div>
          </div>
        )}

        {/* Player List (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 pb-6 space-y-4 scroll-hide overscroll-contain touch-pan-y">
          {/* Section 1: Bench Candidates */}
          {filteredBench.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <span className={`text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 ${
                  isLight ? 'text-amber-900' : 'text-amber-400'
                }`}>
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  Băng ghế chờ ({filteredBench.length} người đang nghỉ)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredBench.map(p => {
                  const stats = sessionStats[p.id];
                  const consecutiveRest = stats?.consecutiveRest || 0;
                  const isFemale = p.gender === 'female';

                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => onConfirmSwap({ type: 'bench', playerId: p.id })}
                      className={`p-2.5 rounded-xl border text-left flex items-center justify-between gap-2.5 transition-all cursor-pointer group active:scale-[0.98] ${
                        isLight
                          ? 'bg-slate-50 hover:bg-teal-50 hover:border-teal-400 border-slate-200 text-slate-800'
                          : 'bg-white/5 hover:bg-teal-500/15 hover:border-teal-500/40 border-white/5 text-white'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs sm:text-sm font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>{p.name}</span>
                          {isFemale ? (
                            <Venus className="w-3.5 h-3.5 text-pink-500 flex-shrink-0" />
                          ) : (
                            <Mars className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] mt-0.5">
                          <span className={`font-semibold ${isLight ? 'text-teal-700' : 'text-teal-400'}`}>
                            {p.elo} Elo
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                            isLight ? 'bg-amber-100 text-amber-950 border border-amber-300' : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            Nghỉ {consecutiveRest + 1}
                          </span>
                        </div>
                      </div>

                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1 flex-shrink-0 ${
                        isLight
                          ? 'bg-teal-600 hover:bg-teal-700 text-white-force border-teal-600'
                          : 'bg-teal-600 hover:bg-teal-500 text-white-force border-teal-500'
                      }`}>
                        Đổi
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 2: Court Players */}
          {filteredCourtPlayers.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-teal-600 dark:text-teal-400 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  Người chơi trên các sân ({filteredCourtPlayers.length} người)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredCourtPlayers.map(item => {
                  const { player: p, courtIdx, courtName, teamName } = item;
                  const isFemale = p.gender === 'female';

                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => onConfirmSwap({ type: 'court', playerId: p.id, courtIdx })}
                      className={`p-2.5 rounded-xl border text-left flex items-center justify-between gap-2.5 transition-all cursor-pointer group active:scale-[0.98] ${
                        isLight
                          ? 'bg-slate-50 hover:bg-teal-50 hover:border-teal-400 border-slate-200 text-slate-800'
                          : 'bg-white/5 hover:bg-teal-500/15 hover:border-teal-500/40 border-white/5 text-white'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          <span className={`text-xs font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>{p.name}</span>
                          {isFemale ? (
                            <Venus className="w-3 h-3 text-pink-500 flex-shrink-0" />
                          ) : (
                            <Mars className="w-3 h-3 text-sky-500 flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] mt-0.5">
                          <span className={`font-semibold ${isLight ? 'text-teal-700' : 'text-teal-400'}`}>
                            {p.elo} Elo
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded-md text-[9px] font-black border ${
                              teamName === 'Đội 1'
                                ? isLight
                                  ? 'bg-teal-50 border-teal-300 text-teal-800'
                                  : 'bg-teal-500/15 border-teal-500/30 text-teal-300'
                                : isLight
                                ? 'bg-indigo-50 border-indigo-300 text-indigo-800'
                                : 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300'
                            }`}
                          >
                            {teamName}
                          </span>
                        </div>
                      </div>

                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1 flex-shrink-0 ${
                        isLight
                          ? 'bg-teal-600 hover:bg-teal-700 text-white-force border-teal-600'
                          : 'bg-teal-600 hover:bg-teal-500 text-white-force border-teal-500'
                      }`}>
                        Đổi
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {filteredBench.length === 0 && filteredCourtPlayers.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-400">
              Không tìm thấy người chơi phù hợp để hoán đổi.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-3 border-t flex items-center justify-end ${isLight ? 'border-slate-200 bg-slate-50/50' : 'border-white/10 bg-white/5'}`}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className={`text-xs rounded-xl px-4 cursor-pointer ${isLight ? 'text-slate-600' : 'text-slate-400'}`}
          >
            Đóng
          </Button>
        </div>
      </div>
    </div>,
    document.body
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
  onOpenFullForm?: () => void;
}

function QuickScoreDialog({
  court,
  isLight,
  existingScore,
  onClose,
  onSave,
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

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200 overscroll-contain touch-none"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-md rounded-2xl border p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 overscroll-contain touch-auto ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-white/10 text-white'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-white/10">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-teal-600 dark:text-teal-400">Ghi điểm trực tiếp</span>
            <h3 className="font-black text-base">
              {`Sân ${court.courtIndex + 1}`}
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
            <div className={`p-3 rounded-xl border text-center ${isLight ? 'bg-indigo-50/60 border-indigo-200' : 'bg-indigo-500/10 border-indigo-500/20'}`}>
              <span className="text-[10px] font-black uppercase tracking-wider block text-indigo-700 dark:text-indigo-400">
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
                    isLight ? 'bg-white border-indigo-300 text-slate-900' : 'bg-slate-950 border-indigo-500/30 text-white'
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
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-white/10">
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
              className="h-9 px-4 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white-force shadow-md cursor-pointer"
            >
              Lưu kết quả & Elo
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
