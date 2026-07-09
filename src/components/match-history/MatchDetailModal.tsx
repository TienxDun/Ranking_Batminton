import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { format, parseISO } from 'date-fns';
import { Eye, Hash, Trophy, X } from 'lucide-react';
import { Match, Player } from '../../types';
import { calculatePlayerEloBreakdown } from '../../utils/calculations';
import { useModalHistory } from '../../hooks/useModalHistory';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

function formatMatchDateTime(date: string) {
  const parsed = parseISO(date);
  const hasTime = date.includes('T') || date.includes(':');
  return {
    date: format(parsed, 'dd/MM/yyyy'),
    time: hasTime ? format(parsed, 'HH:mm') : 'Không ghi giờ',
  };
}

export function MatchDetailModal({
  match,
  matches,
  players,
  getPlayerName,
  onClose,
}: {
  match: Match;
  matches: Match[];
  players: Player[];
  getPlayerName: (id: string) => string;
  onClose: () => void;
}) {
  useModalHistory(onClose);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const team1Label = `${getPlayerName(match.team1[0])} - ${getPlayerName(match.team1[1])}`;
  const team2Label = `${getPlayerName(match.team2[0])} - ${getPlayerName(match.team2[1])}`;
  const team1Win = match.score1 > match.score2;
  const team2Win = match.score2 > match.score1;
  const winnerLabel = team1Win ? team1Label : team2Win ? team2Label : 'Hòa';
  const scoreDiff = Math.abs(match.score1 - match.score2);
  const dateTime = formatMatchDateTime(match.date);
  const eloImpacts = [...match.team1, ...match.team2].map(playerId => {
    const impact = calculatePlayerEloBreakdown(players, matches, playerId)
      .find(item => item.match.id === match.id);

    return {
      playerId,
      team: match.team1.includes(playerId) ? 'Đội 1' : 'Đội 2',
      impact,
    };
  });
  const team1EloChange = eloImpacts.find(item => item.playerId === match.team1[0])?.impact?.delta ?? 0;
  const team2EloChange = eloImpacts.find(item => item.playerId === match.team2[0])?.impact?.delta ?? 0;

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/75 p-3 backdrop-blur-md sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Chi tiết trận ${team1Label} gặp ${team2Label}`}
      onClick={event => {
        event.stopPropagation();
        onClose();
      }}
    >
      <div
        className="modal-surface flex max-h-[calc(100dvh-1.5rem)] w-full max-w-xl flex-col overflow-hidden border border-white/10 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="relative flex-shrink-0 border-b border-white/10 bg-slate-900 p-3 pr-12 sm:p-4 sm:pr-12 pt-safe-modal-p3">
          <div className="mb-1 flex items-center gap-1.5 text-teal-600">
            <Eye className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Chi tiết trận đấu</span>
          </div>
          <h3 className="text-base sm:text-lg font-black text-white leading-tight">
            {team1Label} vs {team2Label}
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">{dateTime.date} lúc {dateTime.time}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute right-3 top-safe-btn-2.5 z-20 cursor-pointer p-2 text-slate-400 hover:bg-white/5 hover:text-white"
            aria-label="Đóng chi tiết trận đấu"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto scroll-hide p-3.5 space-y-3.5">
          {/* Top Info Cards */}
          <div className="grid grid-cols-3 gap-2">
            {[
              ['Tỉ số', `${match.score1} - ${match.score2}`, 'text-white'],
              ['Chênh lệch', `${scoreDiff} điểm`, scoreDiff > 0 ? 'text-teal-400' : 'text-slate-300'],
              ['Kết quả', winnerLabel, team1Win || team2Win ? 'text-emerald-400' : 'text-slate-300'],
            ].map(([label, value, color]) => (
              <div key={label} className="min-w-0 rounded-xl border border-white/5 bg-white/5 p-2 sm:p-2.5">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
                <p className={`mt-0.5 truncate text-xs sm:text-sm font-black tabular-nums ${color}`} title={value}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* Teams Visual Score Grid */}
          <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
            <div className={`rounded-xl border px-3 py-2 flex items-center justify-between gap-3 ${team1Win ? 'border-teal-500/30 bg-teal-500/10' : 'border-white/5 bg-white/5'}`}>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-teal-400">Đội 1</span>
                  {team1Win && <Trophy className="w-3 h-3 text-amber-400" />}
                </div>
                <p className="text-xs sm:text-sm font-bold text-white truncate" title={team1Label}>{team1Label}</p>
              </div>
              <span className="font-mono text-xl sm:text-2xl font-black text-teal-400 tabular-nums flex-shrink-0">{match.score1}</span>
            </div>

            <div className="flex items-center justify-center px-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
              VS
            </div>

            <div className={`rounded-xl border px-3 py-2 flex items-center justify-between gap-3 ${team2Win ? 'border-indigo-500/30 bg-indigo-500/10' : 'border-white/5 bg-white/5'}`}>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-400">Đội 2</span>
                  {team2Win && <Trophy className="w-3 h-3 text-amber-400" />}
                </div>
                <p className="text-xs sm:text-sm font-bold text-white truncate" title={team2Label}>{team2Label}</p>
              </div>
              <span className="font-mono text-xl sm:text-2xl font-black text-indigo-400 tabular-nums flex-shrink-0">{match.score2}</span>
            </div>
          </div>

          {/* Elo Impacts Card */}
          <Card className="border-amber-500/15">
            <CardHeader className="p-2 pb-1.5">
              <CardTitle className="text-xs flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-amber-400" />
                Ảnh hưởng Elo
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 pt-0 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-teal-500/15 bg-teal-500/10 p-2">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-teal-400">Đội 1</p>
                  <p className={`mt-0.5 text-sm sm:text-base font-black tabular-nums ${team1EloChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {team1EloChange >= 0 ? '+' : ''}{team1EloChange}
                  </p>
                </div>
                <div className="rounded-lg border border-indigo-500/15 bg-indigo-500/10 p-2">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-indigo-400">Đội 2</p>
                  <p className={`mt-0.5 text-sm sm:text-base font-black tabular-nums ${team2EloChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {team2EloChange >= 0 ? '+' : ''}{team2EloChange}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                {eloImpacts.map(({ playerId, team, impact }) => (
                  <div key={playerId} className="flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-slate-950/30 px-2.5 py-1.5 text-xs">
                    <div className="min-w-0 flex items-center gap-1.5">
                      <span className="font-bold text-slate-200 truncate">{getPlayerName(playerId)}</span>
                      <span className="text-[9px] text-slate-500">({team})</span>
                    </div>
                    {impact ? (
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-slate-400">
                          {impact.ratingBefore} → <span className="text-slate-200">{impact.ratingAfter}</span>
                        </span>
                        <span className={`font-black tabular-nums ${impact.delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {impact.delta >= 0 ? '+' : ''}{impact.delta}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-500 italic">Không có dữ liệu</span>
                    )}
                  </div>
                ))}
              </div>

              <p className="text-[10px] leading-relaxed text-slate-500">
                Elo được tính theo sức mạnh trung bình hai đội, kết quả thắng/thua và độ chênh điểm của trận.
              </p>
            </CardContent>
          </Card>

          {match.notes && (
            <div className="rounded-lg border border-white/5 bg-white/5 p-2 text-xs text-slate-300">
              <p className="mb-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">Ghi chú</p>
              {match.notes}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
