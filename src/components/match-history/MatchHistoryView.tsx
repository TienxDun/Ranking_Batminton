import React from 'react';
import { createPortal } from 'react-dom';
import { format, parseISO } from 'date-fns';
import { AlertTriangle, Calendar, Pencil, Trash2, X } from 'lucide-react';
import { Match, Player } from '../../types';
import { getWeekOptions } from '../../utils/dateUtils';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { MatchDetailModal } from './MatchDetailModal';

export interface MatchHistoryViewModel {
  selectedWeek: string;
  setSelectedWeek: (week: string) => void;
  weekOptions: ReturnType<typeof getWeekOptions>;
  selectedPlayerId: string;
  setSelectedPlayerId: React.Dispatch<React.SetStateAction<string>>;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  groupPlayers: Player[];
  currentMatches: Match[];
  filteredMatches: Match[];
  getPlayerName: (id: string) => string;
  setSelectedMatch: React.Dispatch<React.SetStateAction<Match | null>>;
  editMatch: (match: Match) => void;
  deleteMatch: (id: string) => void;
  totalPages: number;
  page: number;
  deletingId: string | null;
  confirmDelete: () => void;
  setDeletingId: React.Dispatch<React.SetStateAction<string | null>>;
  selectedMatch: Match | null;
  groupMatches: Match[];
  editingMatch: Match | null;
  setEditingMatch: React.Dispatch<React.SetStateAction<Match | null>>;
  editErrorMsg: string | null;
  isOnline: boolean;
  confirmEdit: (event: React.FormEvent) => void;
  editDate: string;
  setEditDate: React.Dispatch<React.SetStateAction<string>>;
  editT1p1: string;
  setEditT1p1: React.Dispatch<React.SetStateAction<string>>;
  editT1p2: string;
  setEditT1p2: React.Dispatch<React.SetStateAction<string>>;
  editT2p1: string;
  setEditT2p1: React.Dispatch<React.SetStateAction<string>>;
  editT2p2: string;
  setEditT2p2: React.Dispatch<React.SetStateAction<string>>;
  editScore1: number | '';
  setEditScore1: React.Dispatch<React.SetStateAction<number | ''>>;
  editScore2: number | '';
  setEditScore2: React.Dispatch<React.SetStateAction<number | ''>>;
}

function MatchFilters({ model }: { model: MatchHistoryViewModel }) {
  const { selectedWeek, setSelectedWeek, weekOptions, setPage, selectedPlayerId, setSelectedPlayerId, groupPlayers } = model;
  return (
    <>
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
                {groupPlayers.map(p => (
                  <option key={p.id} value={p.id} className="bg-slate-900">
                    {p.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardHeader>
    </>
  );
}

function DesktopMatchTable({ model }: { model: MatchHistoryViewModel }) {
  const { currentMatches, setSelectedMatch, getPlayerName, editMatch: handleEditClick, deleteMatch: handleDeleteClick, filteredMatches, selectedWeek, selectedPlayerId } = model;
  return (
    <>
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
    </>
  );
}

function MobileMatchList({ model }: { model: MatchHistoryViewModel }) {
  const { currentMatches, setSelectedMatch, getPlayerName, editMatch: handleEditClick, deleteMatch: handleDeleteClick, filteredMatches, selectedWeek, selectedPlayerId } = model;
  return (
    <>
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
    </>
  );
}

function MatchPagination({ model }: { model: MatchHistoryViewModel }) {
  const { totalPages, page, setPage } = model;
  return (
    <>
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-4">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Trước</Button>
              <span className="text-sm">Trang {page} / {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Sau</Button>
            </div>
          )}
    </>
  );
}

function MatchList({ model }: { model: MatchHistoryViewModel }) {
  const { selectedWeek, selectedPlayerId } = model;
  return (
    <>
      <Card>
        <MatchFilters model={model} />
        <CardContent key={`${selectedWeek}-${selectedPlayerId}`} className="filter-refresh">
      <DesktopMatchTable model={model} />

      <MobileMatchList model={model} />

      <MatchPagination model={model} />
        </CardContent>
      </Card>
    </>
  );
}

function DeleteMatchDialog({ model }: { model: MatchHistoryViewModel }) {
  const {
    selectedWeek, setSelectedWeek, weekOptions, selectedPlayerId,
    setSelectedPlayerId, setPage, groupPlayers, currentMatches,
    filteredMatches, getPlayerName, setSelectedMatch,
    editMatch: handleEditClick, deleteMatch: handleDeleteClick,
    totalPages, page, deletingId, confirmDelete, setDeletingId,
    selectedMatch, groupMatches, editingMatch, setEditingMatch,
    editErrorMsg, isOnline, confirmEdit, editDate, setEditDate,
    editT1p1, setEditT1p1, editT1p2, setEditT1p2,
    editT2p1, setEditT2p1, editT2p2, setEditT2p2,
    editScore1, setEditScore1, editScore2, setEditScore2,
  } = model;
  return (
    <>
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
    </>
  );
}

function SelectedMatchDialog({ model }: { model: MatchHistoryViewModel }) {
  const {
    selectedWeek, setSelectedWeek, weekOptions, selectedPlayerId,
    setSelectedPlayerId, setPage, groupPlayers, currentMatches,
    filteredMatches, getPlayerName, setSelectedMatch,
    editMatch: handleEditClick, deleteMatch: handleDeleteClick,
    totalPages, page, deletingId, confirmDelete, setDeletingId,
    selectedMatch, groupMatches, editingMatch, setEditingMatch,
    editErrorMsg, isOnline, confirmEdit, editDate, setEditDate,
    editT1p1, setEditT1p1, editT1p2, setEditT1p2,
    editT2p1, setEditT2p1, editT2p2, setEditT2p2,
    editScore1, setEditScore1, editScore2, setEditScore2,
  } = model;
  return (
    <>
      {selectedMatch && (
        <MatchDetailModal
          match={selectedMatch}
          matches={groupMatches}
          players={groupPlayers}
          getPlayerName={getPlayerName}
          onClose={() => setSelectedMatch(null)}
        />
      )}
    </>
  );
}

function EditMatchDialog({ model }: { model: MatchHistoryViewModel }) {
  const {
    selectedWeek, setSelectedWeek, weekOptions, selectedPlayerId,
    setSelectedPlayerId, setPage, groupPlayers, currentMatches,
    filteredMatches, getPlayerName, setSelectedMatch,
    editMatch: handleEditClick, deleteMatch: handleDeleteClick,
    totalPages, page, deletingId, confirmDelete, setDeletingId,
    selectedMatch, groupMatches, editingMatch, setEditingMatch,
    editErrorMsg, isOnline, confirmEdit, editDate, setEditDate,
    editT1p1, setEditT1p1, editT1p2, setEditT1p2,
    editT2p1, setEditT2p1, editT2p2, setEditT2p2,
    editScore1, setEditScore1, editScore2, setEditScore2,
  } = model;
  return (
    <>
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

            {!isOnline && (
              <div className="offline-alert offline-alert-compact p-3 rounded-xl flex items-start gap-2.5 text-sm animate-in fade-in duration-200">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>Bạn đang offline. Không thể lưu thay đổi điểm số cho đến khi có mạng.</span>
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
                      {groupPlayers.map(p => <option key={p.id} value={p.id} className="bg-slate-900">{p.name}</option>)}
                    </Select>
                    <Select value={editT1p2} onChange={e => setEditT1p2(e.target.value)} required>
                      <option value="" className="bg-slate-900">Chọn 2</option>
                      {groupPlayers.map(p => <option key={p.id} value={p.id} className="bg-slate-900">{p.name}</option>)}
                    </Select>
                  </div>
                </div>
                
                {/* Đội 2 */}
                <div className="space-y-3 p-4 bg-indigo-500/5 rounded-xl border border-indigo-500/10">
                  <label className="block text-xs font-bold uppercase tracking-wider text-indigo-400">Đội 2</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={editT2p1} onChange={e => setEditT2p1(e.target.value)} required>
                      <option value="" className="bg-slate-900">Chọn 1</option>
                      {groupPlayers.map(p => <option key={p.id} value={p.id} className="bg-slate-900">{p.name}</option>)}
                    </Select>
                    <Select value={editT2p2} onChange={e => setEditT2p2(e.target.value)} required>
                      <option value="" className="bg-slate-900">Chọn 2</option>
                      {groupPlayers.map(p => <option key={p.id} value={p.id} className="bg-slate-900">{p.name}</option>)}
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
                <Button type="submit" className="bg-teal-500 hover:bg-teal-600 text-white font-semibold" disabled={!isOnline}>
                  {isOnline ? 'Lưu thay đổi' : 'Đang offline'}
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

export function MatchHistoryView({ model }: { model: MatchHistoryViewModel }) {

  return (
    <div className="relative">
      <MatchList model={model} />

      <DeleteMatchDialog model={model} />

      <SelectedMatchDialog model={model} />



      <EditMatchDialog model={model} />
    </div>
  );
}
