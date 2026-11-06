import React, { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { AlertCircle, WifiOff, Zap, PlusCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { getGroupPlayers } from '../../utils/groupUtils';
import Matchmaker from '../matchmaker/Matchmaker';

interface MatchFormProps {
  onSaved: () => void;
  initialData?: {
    t1p1: string;
    t1p2: string;
    t2p1: string;
    t2p2: string;
  };
}

export default function MatchForm({ onSaved, initialData }: MatchFormProps) {
  const { players, selectedGroupId, addMatch, isLoading, theme } = useStore();
  const isLight = theme === 'light';
  const isOnline = useOnlineStatus();
  const activePlayers = getGroupPlayers(players, selectedGroupId).filter(p => p.isActive);

  const [activeMode, setActiveMode] = useState<'matchmaker' | 'score'>(() =>
    initialData ? 'score' : 'matchmaker'
  );
  const [fillNotice, setFillNotice] = useState<string | null>(null);

  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [isTimeEdited, setIsTimeEdited] = useState(false);
  const [t1p1, setT1p1] = useState(initialData?.t1p1 || '');
  const [t1p2, setT1p2] = useState(initialData?.t1p2 || '');
  const [t2p1, setT2p1] = useState(initialData?.t2p1 || '');
  const [t2p2, setT2p2] = useState(initialData?.t2p2 || '');

  useEffect(() => {
    if (initialData) {
      setT1p1(initialData.t1p1);
      setT1p2(initialData.t1p2);
      setT2p1(initialData.t2p1);
      setT2p2(initialData.t2p2);
      setActiveMode('score');
    }
  }, [initialData]);

  const [score1, setScore1] = useState<number | ''>('');
  const [score2, setScore2] = useState<number | ''>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFillFromMatchmaker = (matchData: {
    t1p1: string;
    t1p2: string;
    t2p1: string;
    t2p2: string;
  }) => {
    setT1p1(matchData.t1p1);
    setT1p2(matchData.t1p2);
    setT2p1(matchData.t2p1);
    setT2p2(matchData.t2p2);
    setActiveMode('score');
    setFillNotice('Đã nạp 4 người chơi từ sân vào bảng điểm. Hãy nhập tỉ số và bấm Lưu Trận Đấu!');
    setTimeout(() => setFillNotice(null), 5000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!isOnline) {
      setErrorMsg('Bạn đang offline. Vui lòng kết nối mạng trước khi lưu trận để điểm được cập nhật lên hệ thống.');
      return;
    }

    if (isLoading) {
      setErrorMsg('Hệ thống đang tải dữ liệu, vui lòng đợi một chút rồi thử lại!');
      return;
    }

    if (!t1p1 || !t1p2 || !t2p1 || !t2p2) {
      setErrorMsg('Vui lòng chọn đủ 4 người chơi!');
      return;
    }
    const uniquePlayers = new Set([t1p1, t1p2, t2p1, t2p2]);
    if (uniquePlayers.size !== 4) {
      setErrorMsg('Một người không thể chơi ở nhiều vị trí trong cùng một trận!');
      return;
    }

    if (score1 === '' || score2 === '') {
      setErrorMsg('Vui lòng nhập điểm chi tiết cho cả hai đội!');
      return;
    }

    const finalDate = isTimeEdited ? date : format(new Date(), "yyyy-MM-dd'T'HH:mm");

    addMatch({
      groupId: selectedGroupId,
      date: finalDate,
      team1: [t1p1, t1p2],
      team2: [t2p1, t2p2],
      isScoreExact: true,
      score1: Number(score1),
      score2: Number(score2),
    });

    // Reset some fields
    setT1p1(''); setT1p2(''); setT2p1(''); setT2p2('');
    setScore1(''); setScore2('');
    setDate(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    setIsTimeEdited(false);
    setFillNotice(null);
    onSaved();
  };

  return (
    <div className="space-y-4">
      {/* Modern Segmented Tab Switcher */}
      <div
        className={`p-1.5 rounded-2xl border transition-all duration-200 flex items-center shadow-inner ${
          isLight
            ? 'bg-slate-200/70 border-slate-300/80 shadow-slate-300/40'
            : 'bg-slate-950/70 border-white/10 shadow-black/40'
        }`}
      >
        <button
          type="button"
          onClick={() => setActiveMode('matchmaker')}
          className={`flex-1 py-2 sm:py-2.5 px-2 sm:px-3 text-xs sm:text-sm font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
            activeMode === 'matchmaker'
              ? isLight
                ? 'bg-white text-teal-900 shadow-sm border border-slate-200/80'
                : 'bg-gradient-to-r from-teal-500/20 to-teal-400/10 text-teal-300 border border-teal-500/30 shadow-md'
              : isLight
              ? 'text-slate-600 hover:text-slate-900 hover:bg-white/50 border border-transparent'
              : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <Zap className={`w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 ${activeMode === 'matchmaker' ? 'text-teal-600' : 'text-slate-400'}`} />
          <span>Tự Động Xếp Đội <span className="hidden sm:inline">(2 vs 2)</span></span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMode('score')}
          className={`flex-1 py-2 sm:py-2.5 px-2 sm:px-3 text-xs sm:text-sm font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
            activeMode === 'score'
              ? isLight
                ? 'bg-white text-teal-900 shadow-sm border border-slate-200/80'
                : 'bg-gradient-to-r from-teal-500/20 to-teal-400/10 text-teal-300 border border-teal-500/30 shadow-md'
              : isLight
              ? 'text-slate-600 hover:text-slate-900 hover:bg-white/50 border border-transparent'
              : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <PlusCircle className={`w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 ${activeMode === 'score' ? 'text-teal-600' : 'text-slate-400'}`} />
          <span>Ghi Nhận Điểm Số</span>
        </button>
      </div>

      {/* View 1: Matchmaker View */}
      {activeMode === 'matchmaker' ? (
        <Matchmaker onFillMatch={handleFillFromMatchmaker} />
      ) : (
        /* View 2: Score Entry Form */
        <Card className={`animate-in fade-in duration-200 ${isLight ? 'bg-white border-slate-200 shadow-sm' : ''}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className={`text-sm xs:text-base sm:text-lg font-bold whitespace-nowrap ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Ghi Nhận Kết Quả Trận Đấu
              </CardTitle>
              <CardDescription className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Nhập tỉ số điểm để cập nhật bảng xếp hạng Elo
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setActiveMode('matchmaker')}
              className={`text-xs h-8 cursor-pointer ${
                isLight
                  ? 'text-teal-700 hover:text-teal-900 hover:bg-teal-50 border border-teal-200'
                  : 'text-teal-400 hover:text-teal-300 hover:bg-teal-500/10'
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Xếp đội khác
            </Button>
          </CardHeader>
          <CardContent>
            {fillNotice && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2.5 text-emerald-300 text-xs sm:text-sm animate-in fade-in duration-200 shadow-sm">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                <span>{fillNotice}</span>
              </div>
            )}

            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2.5 text-rose-400 text-sm animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {!isOnline && (
              <div className="offline-alert offline-alert-compact mb-4 p-3 rounded-xl flex items-start gap-2.5 text-sm animate-in fade-in duration-200">
                <WifiOff className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>Bạn đang offline. Không thể lưu trận mới vì điểm sẽ chưa cập nhật lên hệ thống.</span>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>Thời gian đấu</label>
                <Input
                  type="datetime-local"
                  value={date}
                  onChange={e => { setDate(e.target.value); setIsTimeEdited(true); }}
                  required
                  className={isLight ? 'bg-white border-slate-300 text-slate-900' : ''}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`space-y-3 p-4 rounded-xl border ${
                  isLight ? 'bg-teal-50/60 border-teal-200' : 'bg-teal-500/5 border-teal-500/10'
                }`}>
                  <label className={`block text-xs font-bold uppercase tracking-wider ${isLight ? 'text-teal-800' : 'text-teal-400'}`}>Đội 1</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={t1p1} onChange={e => setT1p1(e.target.value)} required>
                      <option value="" className="bg-slate-900 text-white">Chọn 1</option>
                      {activePlayers.map(p => <option key={p.id} value={p.id} className="bg-slate-900 text-white">{p.name}</option>)}
                    </Select>
                    <Select value={t1p2} onChange={e => setT1p2(e.target.value)} required>
                      <option value="" className="bg-slate-900 text-white">Chọn 2</option>
                      {activePlayers.map(p => <option key={p.id} value={p.id} className="bg-slate-900 text-white">{p.name}</option>)}
                    </Select>
                  </div>
                </div>
                
                <div className={`space-y-3 p-4 rounded-xl border ${
                  isLight ? 'bg-sky-50/60 border-sky-200' : 'bg-sky-500/5 border-sky-500/10'
                }`}>
                  <label className={`block text-xs font-bold uppercase tracking-wider ${isLight ? 'text-sky-800' : 'text-sky-400'}`}>Đội 2</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={t2p1} onChange={e => setT2p1(e.target.value)} required>
                      <option value="" className="bg-slate-900 text-white">Chọn 1</option>
                      {activePlayers.map(p => <option key={p.id} value={p.id} className="bg-slate-900 text-white">{p.name}</option>)}
                    </Select>
                    <Select value={t2p2} onChange={e => setT2p2(e.target.value)} required>
                      <option value="" className="bg-slate-900 text-white">Chọn 2</option>
                      {activePlayers.map(p => <option key={p.id} value={p.id} className="bg-slate-900 text-white">{p.name}</option>)}
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className={`flex items-center justify-center gap-6 p-4 rounded-xl border ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5'
                }`}>
                  <div className="text-center w-24">
                    <label className={`block text-[10px] uppercase font-bold tracking-wider mb-1.5 ${
                      isLight ? 'text-slate-600' : 'text-slate-400'
                    }`}>Điểm Đội 1</label>
                    <Input
                      type="number"
                      min="0"
                      value={score1}
                      onChange={e => setScore1(e.target.value === '' ? '' : Number(e.target.value))}
                      required
                      className={`text-center text-xl font-bold h-11 ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : ''
                      }`}
                    />
                  </div>
                  <div className="font-bold text-slate-400 text-2xl pt-4">-</div>
                  <div className="text-center w-24">
                    <label className={`block text-[10px] uppercase font-bold tracking-wider mb-1.5 ${
                      isLight ? 'text-slate-600' : 'text-slate-400'
                    }`}>Điểm Đội 2</label>
                    <Input
                      type="number"
                      min="0"
                      value={score2}
                      onChange={e => setScore2(e.target.value === '' ? '' : Number(e.target.value))}
                      required
                      className={`text-center text-xl font-bold h-11 ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : ''
                      }`}
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full h-11 font-bold text-sm bg-teal-600 hover:bg-teal-700 text-white-force" disabled={!isOnline || isLoading}>
                {!isOnline ? 'Đang offline - chưa thể lưu' : isLoading ? 'Đang tải dữ liệu...' : 'Lưu Trận Đấu & Cập Nhật Elo'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
