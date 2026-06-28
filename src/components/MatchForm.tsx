import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select } from './ui/select';
import { AlertCircle } from 'lucide-react';

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
  const { players, addMatch } = useStore();
  const activePlayers = players.filter(p => p.isActive);

  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
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
    }
  }, [initialData]);
  
  const [score1, setScore1] = useState<number | ''>('');
  const [score2, setScore2] = useState<number | ''>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!t1p1 || !t1p2 || !t2p1 || !t2p2) {
      setErrorMsg("Vui lòng chọn đủ 4 người chơi!");
      return;
    }
    const uniquePlayers = new Set([t1p1, t1p2, t2p1, t2p2]);
    if (uniquePlayers.size !== 4) {
      setErrorMsg("Một người không thể chơi ở nhiều vị trí trong cùng một trận!");
      return;
    }

    if (score1 === '' || score2 === '') {
      setErrorMsg("Vui lòng nhập điểm chi tiết cho cả hai đội!");
      return;
    }

    addMatch({
      date,
      team1: [t1p1, t1p2],
      team2: [t2p1, t2p2],
      isScoreExact: true,
      score1: Number(score1),
      score2: Number(score2),
    });

    // Reset some fields
    setT1p1(''); setT1p2(''); setT2p1(''); setT2p2('');
    setScore1(''); setScore2('');
    onSaved();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm xs:text-base sm:text-lg font-bold text-white whitespace-nowrap">Thêm Trận Đấu Mới</CardTitle>
      </CardHeader>
      <CardContent>
        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2.5 text-rose-400 text-sm animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1">Ngày đấu</label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3 p-4 bg-teal-500/5 rounded-xl border border-teal-500/10">
              <label className="block text-xs font-bold uppercase tracking-wider text-teal-400">Đội 1</label>
              <div className="grid grid-cols-2 gap-2">
                <Select value={t1p1} onChange={e => setT1p1(e.target.value)} required>
                  <option value="" className="bg-slate-900">Chọn 1</option>
                  {activePlayers.map(p => <option key={p.id} value={p.id} className="bg-slate-900">{p.name}</option>)}
                </Select>
                <Select value={t1p2} onChange={e => setT1p2(e.target.value)} required>
                  <option value="" className="bg-slate-900">Chọn 2</option>
                  {activePlayers.map(p => <option key={p.id} value={p.id} className="bg-slate-900">{p.name}</option>)}
                </Select>
              </div>
            </div>
            
            <div className="space-y-3 p-4 bg-indigo-500/5 rounded-xl border border-indigo-500/10">
              <label className="block text-xs font-bold uppercase tracking-wider text-indigo-400">Đội 2</label>
              <div className="grid grid-cols-2 gap-2">
                <Select value={t2p1} onChange={e => setT2p1(e.target.value)} required>
                  <option value="" className="bg-slate-900">Chọn 1</option>
                  {activePlayers.map(p => <option key={p.id} value={p.id} className="bg-slate-900">{p.name}</option>)}
                </Select>
                <Select value={t2p2} onChange={e => setT2p2(e.target.value)} required>
                  <option value="" className="bg-slate-900">Chọn 2</option>
                  {activePlayers.map(p => <option key={p.id} value={p.id} className="bg-slate-900">{p.name}</option>)}
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-center gap-6 bg-white/5 p-4 rounded-xl border border-white/5">
              <div className="text-center w-24">
                <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5">Điểm Đội 1</label>
                <Input type="number" min="0" value={score1} onChange={e => setScore1(e.target.value === '' ? '' : Number(e.target.value))} required className="text-center text-xl font-bold h-11" />
              </div>
              <div className="font-bold text-slate-500 text-2xl pt-4">-</div>
              <div className="text-center w-24">
                <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5">Điểm Đội 2</label>
                <Input type="number" min="0" value={score2} onChange={e => setScore2(e.target.value === '' ? '' : Number(e.target.value))} required className="text-center text-xl font-bold h-11" />
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full">Lưu Trận Đấu</Button>
        </form>
      </CardContent>
    </Card>
  );
}
