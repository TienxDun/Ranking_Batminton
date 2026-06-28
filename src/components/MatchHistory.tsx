import React, { useState } from 'react';
import { useStore } from '../store';
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

export default function MatchHistory() {
  const { matches, players, deleteMatch, clearMatches } = useStore();
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isConfirmingClearAll, setIsConfirmingClearAll] = useState(false);
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
                  <TableHead className="sticky-header-date min-w-[100px] w-[100px] whitespace-nowrap">Ngày</TableHead>
                  <TableHead className="min-w-[140px] whitespace-nowrap">Đội 1</TableHead>
                  <TableHead className="text-center min-w-[100px] whitespace-nowrap">Tỉ số</TableHead>
                  <TableHead className="min-w-[140px] whitespace-nowrap">Đội 2</TableHead>
                  <TableHead className="w-12 whitespace-nowrap"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentMatches.map(m => (
                  <TableRow key={m.id}>
                    <TableCell className="sticky-date min-w-[100px] w-[100px] whitespace-nowrap text-slate-300 text-xs font-mono">{format(parseISO(m.date), 'dd/MM/yyyy')}</TableCell>
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
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(m.id)} className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
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
                <div key={m.id} className="p-4 bg-slate-900/30 border border-white/5 rounded-xl space-y-3 hover:bg-slate-900/50 transition-all duration-200">
                  {/* Top: Date and Delete button */}
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-xs font-mono text-slate-400">
                      📅 {format(parseISO(m.date), 'dd/MM/yyyy')}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDeleteClick(m.id)} 
                      className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 h-7 w-7 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  {/* Body: Match layout with teams and score */}
                  <div className="flex items-center justify-between gap-1">
                    {/* Team 1 */}
                    <div className="flex-1 min-w-0 text-right pr-2">
                      <div className={`text-xs xs:text-sm font-bold truncate ${isTeam1Win ? 'text-teal-400' : 'text-slate-300'}`} title={`${getPlayerName(m.team1[0])} - ${getPlayerName(m.team1[1])}`}>
                        {getPlayerName(m.team1[0])} - {getPlayerName(m.team1[1])}
                      </div>
                      <span className="text-[9px] uppercase tracking-wider text-teal-500/80 font-bold block">Đội 1</span>
                    </div>

                    {/* Score / VS */}
                    <div className="flex flex-col items-center justify-center shrink-0 px-1">
                      <div className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-center min-w-[55px] max-w-[70px]">
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
                    <div className="flex-1 min-w-0 text-left pl-2">
                      <div className={`text-xs xs:text-sm font-bold truncate ${isTeam2Win ? 'text-indigo-400' : 'text-slate-300'}`} title={`${getPlayerName(m.team2[0])} - ${getPlayerName(m.team2[1])}`}>
                        {getPlayerName(m.team2[0])} - {getPlayerName(m.team2[1])}
                      </div>
                      <span className="text-[9px] uppercase tracking-wider text-indigo-500/80 font-bold block">Đội 2</span>
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
      {deletingId && (
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
        </div>
      )}

      {/* Confirmation Modal for Clearing All Matches */}
      {isConfirmingClearAll && (
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
        </div>
      )}
    </div>
  );
}
