import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../store';
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Trash2, AlertTriangle, X, Calendar, Pencil, Eye, Trophy, Hash } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Select } from './ui/select';
import { Input } from './ui/input';
import { Match, Player } from '../types';
import { getWeekOptions, isMatchInWeek } from '../utils/dateUtils';
import { requireAdminPassword } from '../utils/adminAuth';
import { calculatePlayerEloBreakdown } from '../utils/calculations';

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
        <div className="relative flex-shrink-0 border-b border-white/10 bg-slate-900 p-3 pr-12 sm:p-4 sm:pr-12">
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
            className="absolute right-3 top-2.5 z-20 cursor-pointer p-2 text-slate-400 hover:bg-white/5 hover:text-white"
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

export default function MatchHistory() {
  const { matches, players, deleteMatch, updateMatch, selectedWeek, setSelectedWeek } = useStore();
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  const weekOptions = useMemo(() => getWeekOptions(matches), [matches]);

  const filteredMatches = useMemo(() => {
    let result = matches;

    // 1. Lọc theo tuần
    if (selectedWeek !== 'all') {
      const weekInfo = weekOptions.find(w => w.id === selectedWeek);
      if (weekInfo) {
        result = result.filter(m => isMatchInWeek(m.date, weekInfo.start, weekInfo.end));
      }
    }

    // 2. Lọc theo người chơi
    if (selectedPlayerId !== 'all') {
      result = result.filter(m => 
        m.team1.includes(selectedPlayerId) || m.team2.includes(selectedPlayerId)
      );
    }

    return result;
  }, [matches, selectedWeek, selectedPlayerId, weekOptions]);
  
  // States cho tính năng chỉnh sửa
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editT1p1, setEditT1p1] = useState('');
  const [editT1p2, setEditT1p2] = useState('');
  const [editT2p1, setEditT2p1] = useState('');
  const [editT2p2, setEditT2p2] = useState('');
  const [editScore1, setEditScore1] = useState<number | ''>('');
  const [editScore2, setEditScore2] = useState<number | ''>('');
  const [editErrorMsg, setEditErrorMsg] = useState<string | null>(null);
  
  const itemsPerPage = 10;

  const getPlayerName = (id: string) => players.find(p => p.id === id)?.name || 'Unknown';

  const totalPages = Math.ceil(filteredMatches.length / itemsPerPage);
  const currentMatches = filteredMatches.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const handleDeleteClick = (id: string) => {
    if (!requireAdminPassword()) return;
    setDeletingId(id);
  };

  const confirmDelete = () => {
    if (deletingId) {
      deleteMatch(deletingId);
      setDeletingId(null);
      // Adjust page if current page became empty
      const remainingMatchesCount = filteredMatches.length - 1;
      const newTotalPages = Math.ceil(remainingMatchesCount / itemsPerPage);
      if (page > newTotalPages && page > 1) {
        setPage(newTotalPages);
      }
    }
  };

  const handleEditClick = (match: Match) => {
    if (!requireAdminPassword()) return;
    setEditingMatch(match);
    let formattedDate = match.date;
    if (!formattedDate.includes('T')) {
      formattedDate = `${formattedDate}T00:00`;
    }
    setEditDate(formattedDate);
    setEditT1p1(match.team1[0]);
    setEditT1p2(match.team1[1]);
    setEditT2p1(match.team2[0]);
    setEditT2p2(match.team2[1]);
    setEditScore1(match.score1);
    setEditScore2(match.score2);
    setEditErrorMsg(null);
  };

  const confirmEdit = (e: React.FormEvent) => {
    e.preventDefault();
    setEditErrorMsg(null);

    if (!editingMatch) return;

    if (!editT1p1 || !editT1p2 || !editT2p1 || !editT2p2) {
      setEditErrorMsg("Vui lòng chọn đủ 4 người chơi!");
      return;
    }

    const uniquePlayers = new Set([editT1p1, editT1p2, editT2p1, editT2p2]);
    if (uniquePlayers.size !== 4) {
      setEditErrorMsg("Một người không thể chơi ở nhiều vị trí trong cùng một trận!");
      return;
    }

    if (editScore1 === '' || editScore2 === '') {
      setEditErrorMsg("Vui lòng nhập điểm chi tiết cho cả hai đội!");
      return;
    }

    updateMatch(editingMatch.id, {
      date: editDate,
      team1: [editT1p1, editT1p2],
      team2: [editT2p1, editT2p2],
      score1: Number(editScore1),
      score2: Number(editScore2),
    });

    setEditingMatch(null);
  };

  return (
    <div className="relative">
      <Card>
        <CardHeader className="pb-4 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 border-b border-white/5 mb-4">
          <div>
            <CardTitle className="text-sm xs:text-base sm:text-lg font-bold text-white whitespace-nowrap">Lịch Sử Trận Đấu</CardTitle>
          </div>
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-center gap-3 w-full xl:w-auto justify-end">
            <div className="flex items-center gap-2 w-full sm:w-auto flex-1 sm:flex-none">
              <span className="text-xs text-slate-400 whitespace-nowrap">Thời gian:</span>
              <Select 
                value={selectedWeek} 
                onChange={e => {
                  setSelectedWeek(e.target.value);
                  setPage(1);
                }} 
                className="w-full sm:w-[200px] text-xs h-9 bg-slate-900 border-white/10 text-white rounded-lg"
              >
                <option value="all" className="bg-slate-900">Toàn thời gian</option>
                {weekOptions.map(option => (
                  <option key={option.id} value={option.id} className="bg-slate-900">
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto flex-1 sm:flex-none">
              <span className="text-xs text-slate-400 whitespace-nowrap">Người chơi:</span>
              <Select 
                value={selectedPlayerId} 
                onChange={e => {
                  setSelectedPlayerId(e.target.value);
                  setPage(1);
                }} 
                className="w-full sm:w-[160px] text-xs h-9 bg-slate-900 border-white/10 text-white rounded-lg"
              >
                <option value="all" className="bg-slate-900">Tất cả</option>
                {players.map(p => (
                  <option key={p.id} value={p.id} className="bg-slate-900">
                    {p.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent key={`${selectedWeek}-${selectedPlayerId}`} className="filter-refresh">
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky-header-date min-w-[110px] w-[110px] whitespace-nowrap">Ngày</TableHead>
                  <TableHead className="min-w-[140px] whitespace-nowrap">Đội 1</TableHead>
                  <TableHead className="text-center min-w-[100px] whitespace-nowrap">Tỉ số</TableHead>
                  <TableHead className="min-w-[140px] whitespace-nowrap">Đội 2</TableHead>
                  <TableHead className="w-20 whitespace-nowrap"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentMatches.map(m => (
                  <TableRow
                    key={m.id}
                    role="button"
                    tabIndex={0}
                    title="Xem chi tiết trận đấu"
                    className="cursor-pointer transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-400"
                    onClick={() => setSelectedMatch(m)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedMatch(m);
                      }
                    }}
                  >
                    <TableCell className="sticky-date min-w-[110px] w-[110px] whitespace-nowrap text-slate-300 text-xs font-mono">
                      <div className="flex flex-col">
                        <span>{format(parseISO(m.date), 'dd/MM/yyyy')}</span>
                        {(m.date.includes('T') || m.date.includes(':')) && (
                          <span className="text-[10px] text-slate-400/80 mt-0.5">
                            {format(parseISO(m.date), 'HH:mm')}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="min-w-[140px] whitespace-nowrap">
                      <div className={`${m.score1 > m.score2 ? 'font-bold text-teal-400' : 'text-slate-300'} whitespace-nowrap`}>
                        {getPlayerName(m.team1[0])} - {getPlayerName(m.team1[1])}
                      </div>
                    </TableCell>
                    <TableCell className="text-center min-w-[100px] whitespace-nowrap">
                      <div className="inline-flex flex-col items-center justify-center px-3 py-1 bg-white/5 border border-white/5 rounded-lg whitespace-nowrap">
                        <span className="font-mono font-bold text-sm text-slate-100 whitespace-nowrap">
                          {m.score1} - {m.score2}
                        </span>
                        {!m.isScoreExact && <span className="text-[9px] uppercase tracking-wider text-teal-400 font-medium font-mono mt-0.5 whitespace-nowrap">W/L Only</span>}
                      </div>
                    </TableCell>
                    <TableCell className="min-w-[140px] whitespace-nowrap">
                      <div className={`${m.score2 > m.score1 ? 'font-bold text-indigo-400' : 'text-slate-300'} whitespace-nowrap`}>
                        {getPlayerName(m.team2[0])} - {getPlayerName(m.team2[1])}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={e => {
                            e.stopPropagation();
                            handleEditClick(m);
                          }}
                          className="text-teal-400 hover:text-teal-300 hover:bg-teal-500/10 h-8 w-8 rounded-lg cursor-pointer"
                          aria-label="Sửa trận đấu"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={e => {
                            e.stopPropagation();
                            handleDeleteClick(m.id);
                          }}
                          className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 h-8 w-8 rounded-lg cursor-pointer"
                          aria-label="Xóa trận đấu"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredMatches.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-slate-400 py-6">
                      {selectedWeek === 'all' && selectedPlayerId === 'all' 
                        ? 'Chưa có trận đấu nào' 
                        : 'Không có trận đấu nào phù hợp với bộ lọc'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card List View */}
          <div className="block md:hidden space-y-3">
            {currentMatches.map(m => {
              const isTeam1Win = m.score1 > m.score2;
              const isTeam2Win = m.score2 > m.score1;
              return (
                <div
                  key={m.id}
                  role="button"
                  tabIndex={0}
                  title="Xem chi tiết trận đấu"
                  className="px-3 py-3 bg-slate-900/30 border border-white/5 rounded-xl space-y-3 hover:bg-slate-900/50 transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-400"
                  onClick={() => setSelectedMatch(m)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedMatch(m);
                    }
                  }}
                >
                  {/* Top: Date and Delete button */}
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
                      <Calendar className="w-3.5 h-3.5 text-teal-500/85 flex-shrink-0" />
                      <span>{format(parseISO(m.date), 'dd/MM/yyyy')}</span>
                      {(m.date.includes('T') || m.date.includes(':')) && (
                        <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-teal-400 font-medium">
                          {format(parseISO(m.date), 'HH:mm')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={e => {
                          e.stopPropagation();
                          handleEditClick(m);
                        }} 
                        className="text-teal-400 hover:text-teal-300 hover:bg-teal-500/10 h-7 w-7 rounded-lg cursor-pointer"
                        aria-label="Sửa trận đấu"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={e => {
                          e.stopPropagation();
                          handleDeleteClick(m.id);
                        }} 
                        className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 h-7 w-7 rounded-lg cursor-pointer"
                        aria-label="Xóa trận đấu"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Body: Match layout with teams and score */}
                  <div className="flex items-center justify-between gap-1">
                    {/* Team 1 */}
                    <div className="flex-1 min-w-0 text-right pr-1">
                      <div className={`text-xs xs:text-sm font-bold break-words whitespace-normal ${isTeam1Win ? 'text-teal-400' : 'text-slate-300'}`} title={`${getPlayerName(m.team1[0])} - ${getPlayerName(m.team1[1])}`}>
                        {getPlayerName(m.team1[0])} - {getPlayerName(m.team1[1])}
                      </div>
                      <span className="text-[9px] uppercase tracking-wider text-teal-400/85 font-bold block mt-0.5">Đội 1</span>
                    </div>

                    {/* Score / VS */}
                    <div className="flex flex-col items-center justify-center shrink-0 px-1">
                      <div className="px-2 py-0.5 bg-slate-950 border border-white/10 rounded-lg text-center min-w-[50px] max-w-[65px] shadow-inner">
                        <span className="font-mono font-bold text-xs xs:text-sm text-slate-100 whitespace-nowrap">
                          {m.score1} - {m.score2}
                        </span>
                      </div>
                      {!m.isScoreExact && (
                        <span className="text-[8px] uppercase tracking-wider text-teal-400 font-bold font-mono mt-0.5 text-center scale-90 whitespace-nowrap">
                          W/L
                        </span>
                      )}
                    </div>

                    {/* Team 2 */}
                    <div className="flex-1 min-w-0 text-left pl-1">
                      <div className={`text-xs xs:text-sm font-bold break-words whitespace-normal ${isTeam2Win ? 'text-amber-400' : 'text-slate-300'}`} title={`${getPlayerName(m.team2[0])} - ${getPlayerName(m.team2[1])}`}>
                        {getPlayerName(m.team2[0])} - {getPlayerName(m.team2[1])}
                      </div>
                      <span className="text-[9px] uppercase tracking-wider text-amber-400/85 font-bold block mt-0.5">Đội 2</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredMatches.length === 0 && (
              <div className="text-center text-slate-400 py-6 text-sm">
                {selectedWeek === 'all' && selectedPlayerId === 'all' 
                  ? 'Chưa có trận đấu nào' 
                  : 'Không có trận đấu nào phù hợp với bộ lọc'}
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-4">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Trước</Button>
              <span className="text-sm">Trang {page} / {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Sau</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Beautiful Glassmorphism Confirmation Modal */}
      {deletingId && createPortal(
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="glass max-w-sm w-full p-6 space-y-4 shadow-2xl relative border border-white/10 animate-in fade-in zoom-in-95 duration-150">
            <button 
              onClick={() => setDeletingId(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2 bg-rose-500/15 rounded-lg border border-rose-500/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-white">Xác nhận xoá</h3>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              Bạn có chắc chắn muốn xoá trận đấu này khỏi lịch sử? Bảng xếp hạng năng lực sẽ tự động cập nhật ngay lập tức.
            </p>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="ghost" onClick={() => setDeletingId(null)} className="text-slate-300 hover:text-white">
                Hủy
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Xoá trận đấu
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {selectedMatch && (
        <MatchDetailModal
          match={selectedMatch}
          matches={matches}
          players={players}
          getPlayerName={getPlayerName}
          onClose={() => setSelectedMatch(null)}
        />
      )}



      {/* Beautiful Glassmorphism Edit Match Modal */}
      {editingMatch && createPortal(
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="glass max-w-lg w-full p-6 space-y-4 shadow-2xl relative border border-white/10 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setEditingMatch(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-3 text-teal-400 border-b border-white/5 pb-3">
              <div className="p-2 bg-teal-500/15 rounded-lg border border-teal-500/20">
                <Pencil className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-white">Chỉnh sửa trận đấu</h3>
            </div>

            {editErrorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2.5 text-rose-400 text-sm animate-in fade-in duration-200">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{editErrorMsg}</span>
              </div>
            )}

            <form onSubmit={confirmEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Thời gian đấu</label>
                <Input type="datetime-local" value={editDate} onChange={e => setEditDate(e.target.value)} required />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Đội 1 */}
                <div className="space-y-3 p-4 bg-teal-500/5 rounded-xl border border-teal-500/10">
                  <label className="block text-xs font-bold uppercase tracking-wider text-teal-400">Đội 1</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={editT1p1} onChange={e => setEditT1p1(e.target.value)} required>
                      <option value="" className="bg-slate-900">Chọn 1</option>
                      {players.map(p => <option key={p.id} value={p.id} className="bg-slate-900">{p.name}</option>)}
                    </Select>
                    <Select value={editT1p2} onChange={e => setEditT1p2(e.target.value)} required>
                      <option value="" className="bg-slate-900">Chọn 2</option>
                      {players.map(p => <option key={p.id} value={p.id} className="bg-slate-900">{p.name}</option>)}
                    </Select>
                  </div>
                </div>
                
                {/* Đội 2 */}
                <div className="space-y-3 p-4 bg-indigo-500/5 rounded-xl border border-indigo-500/10">
                  <label className="block text-xs font-bold uppercase tracking-wider text-indigo-400">Đội 2</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={editT2p1} onChange={e => setEditT2p1(e.target.value)} required>
                      <option value="" className="bg-slate-900">Chọn 1</option>
                      {players.map(p => <option key={p.id} value={p.id} className="bg-slate-900">{p.name}</option>)}
                    </Select>
                    <Select value={editT2p2} onChange={e => setEditT2p2(e.target.value)} required>
                      <option value="" className="bg-slate-900">Chọn 2</option>
                      {players.map(p => <option key={p.id} value={p.id} className="bg-slate-900">{p.name}</option>)}
                    </Select>
                  </div>
                </div>
              </div>

              {/* Điểm số */}
              <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                <div className="flex items-center justify-center gap-6">
                  <div className="text-center w-24">
                    <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5">Điểm Đội 1</label>
                    <Input type="number" min="0" value={editScore1} onChange={e => setEditScore1(e.target.value === '' ? '' : Number(e.target.value))} required className="text-center text-xl font-bold h-11" />
                  </div>
                  <div className="font-bold text-slate-500 text-2xl pt-4">-</div>
                  <div className="text-center w-24">
                    <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5">Điểm Đội 2</label>
                    <Input type="number" min="0" value={editScore2} onChange={e => setEditScore2(e.target.value === '' ? '' : Number(e.target.value))} required className="text-center text-xl font-bold h-11" />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="ghost" onClick={() => setEditingMatch(null)} className="text-slate-300 hover:text-white">
                  Hủy
                </Button>
                <Button type="submit" className="bg-teal-500 hover:bg-teal-600 text-white font-semibold">
                  Lưu thay đổi
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
