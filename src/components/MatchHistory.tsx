import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../store';
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Trash2, AlertTriangle, X, Calendar, Pencil } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Select } from './ui/select';
import { Input } from './ui/input';
import { Match } from '../types';

export default function MatchHistory() {
  const { matches, players, deleteMatch, clearMatches, updateMatch } = useStore();
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isConfirmingClearAll, setIsConfirmingClearAll] = useState(false);
  
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

  const totalPages = Math.ceil(matches.length / itemsPerPage);
  const currentMatches = matches.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const handleDeleteClick = (id: string) => {
    setDeletingId(id);
  };

  const confirmDelete = () => {
    if (deletingId) {
      deleteMatch(deletingId);
      setDeletingId(null);
      // Adjust page if current page became empty
      const remainingMatchesCount = matches.length - 1;
      const newTotalPages = Math.ceil(remainingMatchesCount / itemsPerPage);
      if (page > newTotalPages && page > 1) {
        setPage(newTotalPages);
      }
    }
  };

  const handleEditClick = (match: Match) => {
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
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-sm xs:text-base sm:text-lg font-bold text-white whitespace-nowrap">Lịch Sử Trận Đấu</CardTitle>
          {matches.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsConfirmingClearAll(true)}
              className="text-xs font-bold flex items-center gap-1.5 h-8 px-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white transition-all duration-200"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa tất cả</span>
            </Button>
          )}
        </CardHeader>
        <CardContent>
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
                  <TableRow key={m.id}>
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
                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(m)} className="text-teal-400 hover:text-teal-300 hover:bg-teal-500/10 h-8 w-8 rounded-lg cursor-pointer">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(m.id)} className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 h-8 w-8 rounded-lg cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {matches.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-slate-400 py-6">Chưa có trận đấu nào</TableCell>
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
                <div key={m.id} className="px-3 py-3 bg-slate-900/30 border border-white/5 rounded-xl space-y-3 hover:bg-slate-900/50 transition-all duration-200">
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
                        onClick={() => handleEditClick(m)} 
                        className="text-teal-400 hover:text-teal-300 hover:bg-teal-500/10 h-7 w-7 rounded-lg cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDeleteClick(m.id)} 
                        className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 h-7 w-7 rounded-lg cursor-pointer"
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
            {matches.length === 0 && (
              <div className="text-center text-slate-400 py-6 text-sm">Chưa có trận đấu nào</div>
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

      {/* Confirmation Modal for Clearing All Matches */}
      {isConfirmingClearAll && createPortal(
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="glass max-w-sm w-full p-6 space-y-4 shadow-2xl relative border border-white/10 animate-in fade-in zoom-in-95 duration-150">
            <button 
              onClick={() => setIsConfirmingClearAll(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2 bg-rose-500/15 rounded-lg border border-rose-500/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-white">Xóa toàn bộ lịch sử</h3>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              Bạn có chắc chắn muốn xóa **tất cả** trận đấu trong lịch sử? Thao tác này không thể hoàn tác và bảng xếp hạng năng lực sẽ được reset về trạng thái ban đầu.
            </p>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="ghost" onClick={() => setIsConfirmingClearAll(false)} className="text-slate-300 hover:text-white">
                Hủy
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => {
                  clearMatches();
                  setIsConfirmingClearAll(false);
                  setPage(1);
                }}
              >
                Xác nhận xóa hết
              </Button>
            </div>
          </div>
        </div>,
        document.body
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
