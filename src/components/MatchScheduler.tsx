import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Trophy, CalendarRange, Sparkles, UserCheck, Play, ArrowRight, RefreshCw, AlertCircle, HelpCircle } from 'lucide-react';
import { ScheduledSet } from '../types';

interface MatchSchedulerProps {
  onFillMatch: (matchData: { t1p1: string; t1p2: string; t2p1: string; t2p2: string }) => void;
}

export default function MatchScheduler({ onFillMatch }: MatchSchedulerProps) {
  const { players, schedulerState, setSchedulerState } = useStore();
  const activePlayers = players.filter(p => p.isActive);

  // Helper to calculate perfect sets
  const getPerfectSets = (playerCount: number) => {
    if (playerCount < 4) return { sets: 0, setsPerPlayer: 0 };
    let K = 1;
    while ((playerCount * K) % 4 !== 0) {
      K++;
    }
    return {
      sets: (playerCount * K) / 4,
      setsPerPlayer: K
    };
  };

  // 1. Selected IDs (persisted in Zustand store)
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    if (schedulerState?.selectedIds) {
      // Filter out players who might have been deleted or set inactive
      return schedulerState.selectedIds.filter(id => activePlayers.some(p => p.id === id));
    }
    return activePlayers.map(p => p.id);
  });

  // 2. Multiplier for sets (how many times the minimum perfect sets)
  const [multiplier, setMultiplier] = useState<number>(() => {
    if (schedulerState?.selectedIds && schedulerState?.numSets) {
      const perfect = getPerfectSets(schedulerState.selectedIds.length);
      if (perfect.sets > 0) {
        return Math.max(1, Math.round(schedulerState.numSets / perfect.sets));
      }
    }
    return 1;
  });

  // 3. Number of Sets
  const [numSets, setNumSets] = useState<number>(() => {
    if (schedulerState?.numSets) return schedulerState.numSets;
    const perfect = getPerfectSets(selectedIds.length);
    return perfect.sets > 0 ? perfect.sets : 6;
  });

  // 4. Schedule (persisted in Zustand store)
  const [schedule, setSchedule] = useState<ScheduledSet[]>(() => {
    return schedulerState?.schedule || [];
  });

  // 5. Is Generated (persisted in Zustand store)
  const [isGenerated, setIsGenerated] = useState<boolean>(() => {
    return schedulerState?.isGenerated || false;
  });

  const [swapNotification, setSwapNotification] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState<boolean>(false);

  // Auto calculate and update sets whenever player selection or multiplier changes
  useEffect(() => {
    const perfect = getPerfectSets(selectedIds.length);
    if (perfect.sets > 0) {
      setNumSets(perfect.sets * multiplier);
    } else {
      setNumSets(0);
    }
  }, [selectedIds.length, multiplier]);

  // Synchronize to Zustand store to preserve state across tab switches / reload
  useEffect(() => {
    setSchedulerState({
      selectedIds,
      numSets,
      schedule,
      isGenerated
    });
  }, [selectedIds, numSets, schedule, isGenerated, setSchedulerState]);

  const handleTogglePlayer = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedIds(activePlayers.map(p => p.id));
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
  };

  const generateSchedule = () => {
    if (selectedIds.length < 4) return;

    const generated: ScheduledSet[] = [];
    const playCounts: Record<string, number> = {};
    selectedIds.forEach(id => {
      playCounts[id] = 0;
    });

    let lastSet: string[] = [];
    let prevSet: string[] = [];

    for (let s = 1; s <= numSets; s++) {
      // Generate all combinations of 4 players from selectedIds
      const combinations: string[][] = [];
      const getCombinations = (start: number, activeCombo: string[]) => {
        if (activeCombo.length === 4) {
          combinations.push([...activeCombo]);
          return;
        }
        for (let i = start; i < selectedIds.length; i++) {
          activeCombo.push(selectedIds[i]);
          getCombinations(i + 1, activeCombo);
          activeCombo.pop();
        }
      };
      getCombinations(0, []);

      interface Candidate {
        players: string[];
        team1: [string, string];
        team2: [string, string];
        score: number;
      }

      const candidates: Candidate[] = [];

      for (const combo of combinations) {
        // Evaluate the 3 unique pairings for this combination of 4 players:
        const pairings: [ [string, string], [string, string] ][] = [
          [[combo[0], combo[1]], [combo[2], combo[3]]],
          [[combo[0], combo[2]], [combo[1], combo[3]]],
          [[combo[0], combo[3]], [combo[1], combo[2]]],
        ];

        for (const [t1, t2] of pairings) {
          // Count female players on each team
          const t1Females = t1.filter(id => players.find(p => p.id === id)?.gender === 'female').length;
          const t2Females = t2.filter(id => players.find(p => p.id === id)?.gender === 'female').length;

          const hasTeamWith2Females = t1Females >= 2 || t2Females >= 2;

          let score = 0;

          // Penalty 1: No team can have 2 women
          if (hasTeamWith2Females) {
            score += 100000;
          }

          // Penalty 2: Consecutive play (1 person cannot play more than 2 consecutive sets if possible)
          let consecutiveCount = 0;
          combo.forEach(id => {
            if (lastSet.includes(id) && prevSet.includes(id)) {
              consecutiveCount++;
            }
          });
          score += consecutiveCount * 5000;

          // Penalty 3: Fair play counts (minimize variance)
          let totalPlayCount = 0;
          combo.forEach(id => {
            totalPlayCount += playCounts[id] || 0;
          });
          score += totalPlayCount * 100;

          // Randomize equal options slightly
          score += Math.random() * 5;

          candidates.push({
            players: combo,
            team1: t1,
            team2: t2,
            score
          });
        }
      }

      // Sort by score ascending (lowest is best)
      candidates.sort((a, b) => a.score - b.score);

      const best = candidates[0];
      if (best) {
        generated.push({
          id: `${s}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          setIndex: s,
          team1: best.team1,
          team2: best.team2,
        });

        // Update play counts
        best.players.forEach(id => {
          playCounts[id] = (playCounts[id] || 0) + 1;
        });

        // Update history
        prevSet = [...lastSet];
        lastSet = [...best.players];
      }
    }

    setSchedule(generated);
    setIsGenerated(true);
  };

  const getPlayerName = (id: string) => {
    return players.find(p => p.id === id)?.name || 'Người chơi ẩn';
  };

  const handlePlayerChange = (setId: string, oldPlayerId: string, newPlayerId: string) => {
    let swapMsg = '';
    
    setSchedule(prevSchedule => {
      const newSchedule = prevSchedule.map(s => ({
        ...s,
        team1: [...s.team1] as [string, string],
        team2: [...s.team2] as [string, string]
      }));

      const targetSetIndex = newSchedule.findIndex(s => s.id === setId);
      if (targetSetIndex === -1) return prevSchedule;

      const targetSet = newSchedule[targetSetIndex];

      // 1. Replace in target set
      let replacedInTarget = false;
      if (targetSet.team1[0] === oldPlayerId) {
        targetSet.team1[0] = newPlayerId;
        replacedInTarget = true;
      } else if (targetSet.team1[1] === oldPlayerId) {
        targetSet.team1[1] = newPlayerId;
        replacedInTarget = true;
      } else if (targetSet.team2[0] === oldPlayerId) {
        targetSet.team2[0] = newPlayerId;
        replacedInTarget = true;
      } else if (targetSet.team2[1] === oldPlayerId) {
        targetSet.team2[1] = newPlayerId;
        replacedInTarget = true;
      }

      if (!replacedInTarget) return prevSchedule;

      const oldName = getPlayerName(oldPlayerId);
      const newName = getPlayerName(newPlayerId);
      swapMsg = `Đã đổi ${oldName} thành ${newName} ở SET ${targetSet.setIndex}.`;

      // 2. Find a swap set to balance the counts.
      let swapSetIndex = -1;
      
      // Search forward
      for (let i = targetSetIndex + 1; i < newSchedule.length; i++) {
        const s = newSchedule[i];
        const hasNew = s.team1.includes(newPlayerId) || s.team2.includes(newPlayerId);
        const hasOld = s.team1.includes(oldPlayerId) || s.team2.includes(oldPlayerId);
        if (hasNew && !hasOld) {
          swapSetIndex = i;
          break;
        }
      }

      // Search backward if not found
      if (swapSetIndex === -1) {
        for (let i = targetSetIndex - 1; i >= 0; i--) {
          const s = newSchedule[i];
          const hasNew = s.team1.includes(newPlayerId) || s.team2.includes(newPlayerId);
          const hasOld = s.team1.includes(oldPlayerId) || s.team2.includes(oldPlayerId);
          if (hasNew && !hasOld) {
            swapSetIndex = i;
            break;
          }
        }
      }

      if (swapSetIndex !== -1) {
        const swapSet = newSchedule[swapSetIndex];
        if (swapSet.team1[0] === newPlayerId) {
          swapSet.team1[0] = oldPlayerId;
        } else if (swapSet.team1[1] === newPlayerId) {
          swapSet.team1[1] = oldPlayerId;
        } else if (swapSet.team2[0] === newPlayerId) {
          swapSet.team2[0] = oldPlayerId;
        } else if (swapSet.team2[1] === newPlayerId) {
          swapSet.team2[1] = oldPlayerId;
        }
        swapMsg += ` Đã tự động hoán đổi ngược lại ${newName} thành ${oldName} ở SET ${swapSet.setIndex} để cân đối số set đấu!`;
      } else {
        swapMsg += ` Không tìm thấy set phù hợp khác chứa ${newName} để đổi bù, số lượng set của hai người có thể lệch nhẹ.`;
      }

      return newSchedule;
    });

    if (swapMsg) {
      setSwapNotification(swapMsg);
      setTimeout(() => {
        setSwapNotification(prev => prev === swapMsg ? null : prev);
      }, 5000);
    }
  };

  // Tính số set đấu trung bình của mỗi người chơi đã chọn
  const getPlayerStats = () => {
    const stats: Record<string, number> = {};
    selectedIds.forEach(id => { stats[id] = 0; });
    schedule.forEach(s => {
      s.team1.forEach(id => { if (stats[id] !== undefined) stats[id]++; });
      s.team2.forEach(id => { if (stats[id] !== undefined) stats[id]++; });
    });
    return stats;
  };

  const playerStats = getPlayerStats();
  const perfect = getPerfectSets(selectedIds.length);

  return (
    <div className="space-y-6" id="scheduler-content">
      {/* Cấu hình Xếp Lịch */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-sm xs:text-base sm:text-lg font-bold flex items-center gap-2 text-white whitespace-nowrap">
            <CalendarRange className="w-5 h-5 text-teal-400 flex-shrink-0" />
            XẾP LỊCH ĐẤU THEO SET
          </CardTitle>
          <CardDescription>
            Tự động chia cặp đấu cân bằng và đảm bảo không ai phải chơi quá 2 set liên tục.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tự động tính toán số set và Cấu hình số vòng đấu */}
          <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-4">
            {/* Hàng trên: Cấu hình hệ số vòng đấu */}
            <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-3 pb-3 border-b border-white/5 text-center xs:text-left">
              <div className="space-y-0.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block">Số vòng đấu (Tỷ lệ)</span>
                <span className="text-[10px] text-slate-400 block">Tăng giảm để nhân bản số set đấu</span>
              </div>
              <div className="flex items-center justify-center gap-2 w-full xs:w-auto">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 px-2.5 text-xs font-bold bg-white/5 border-white/10 hover:bg-white/10 cursor-pointer" 
                  onClick={() => setMultiplier(prev => Math.max(1, prev - 1))}
                  disabled={selectedIds.length < 4}
                >
                  Giảm
                </Button>
                <div className="bg-slate-950 px-3 py-1 rounded-lg border border-white/10 min-w-[50px] text-center">
                  <span className="text-xs font-black text-teal-400 font-mono">x{multiplier}</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 px-2.5 text-xs font-bold bg-white/5 border-white/10 hover:bg-white/10 cursor-pointer" 
                  onClick={() => setMultiplier(prev => Math.min(5, prev + 1))}
                  disabled={selectedIds.length < 4}
                >
                  Tăng
                </Button>
              </div>
            </div>

            {/* Hàng dưới: Hộp thông tin thống kê số set */}
            {selectedIds.length >= 4 ? (
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-slate-950/30 border border-white/5 p-3 rounded-xl text-center">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider mb-0.5">Số set / người</span>
                  <span className="text-teal-400 font-black text-sm xs:text-base font-mono">{perfect.setsPerPlayer * multiplier} set</span>
                </div>
                <div className="bg-slate-950/30 border border-white/5 p-3 rounded-xl text-center">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider mb-0.5">Tổng số set</span>
                  <span className="text-teal-400 font-black text-sm xs:text-base font-mono">{numSets} set</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-2 text-xs text-amber-400 font-medium">
                ⚠️ Chọn tối thiểu 4 người chơi để tính số set
              </div>
            )}
          </div>

          {/* Chọn người chơi hôm nay */}
          <div className="space-y-3">
            <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 border-b border-white/5 pb-2 text-center xs:text-left">
              <label className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center justify-center xs:justify-start gap-1.5">
                <UserCheck className="w-4 h-4 text-teal-400 flex-shrink-0" />
                Người chơi hôm nay ({selectedIds.length}/{activePlayers.length})
              </label>
              <div className="flex items-center justify-center gap-2 w-full xs:w-auto">
                <button 
                  type="button" 
                  onClick={handleSelectAll} 
                  className="text-[10px] bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg text-slate-300 font-semibold whitespace-nowrap cursor-pointer transition-all"
                >
                  Chọn tất cả
                </button>
                <button 
                  type="button" 
                  onClick={handleDeselectAll} 
                  className="text-[10px] bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg text-slate-300 font-semibold whitespace-nowrap cursor-pointer transition-all"
                >
                  Bỏ chọn
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-2">
              {activePlayers.map(player => {
                const isSelected = selectedIds.includes(player.id);
                return (
                  <button
                    key={player.id}
                    type="button"
                    onClick={() => handleTogglePlayer(player.id)}
                    className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all duration-200 truncate flex items-center gap-2 cursor-pointer ${
                      isSelected 
                        ? 'bg-teal-500/10 border-teal-500/30 text-teal-300 shadow-sm shadow-teal-500/5' 
                        : 'bg-white/2 border-white/5 text-slate-400 hover:border-white/10 hover:text-slate-300'
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border text-[8px] font-bold ${
                      isSelected ? 'bg-teal-500 border-teal-500 text-white' : 'border-slate-500'
                    }`}>
                      {isSelected && '✓'}
                    </div>
                    <span className="truncate flex-1 flex items-center justify-between gap-1">
                      <span className="truncate">{player.name}</span>
                      <span className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                        player.gender === 'female' 
                          ? 'text-pink-400 bg-pink-500/10 border border-pink-500/10' 
                          : 'text-sky-400 bg-sky-500/10 border border-sky-500/10'
                      }`}>
                        {player.gender === 'female' ? '♀' : '♂'}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            {selectedIds.length < 4 && (
              <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>Bạn cần chọn tối thiểu 4 người chơi để tiến hành xếp lịch thi đấu đôi.</span>
              </div>
            )}
          </div>

          {/* Nút Tạo Lịch */}
          <Button
            type="button"
            className="w-full h-11 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold tracking-wide shadow-md shadow-teal-500/10 hover:opacity-95"
            disabled={selectedIds.length < 4}
            onClick={() => setShowConfirm(true)}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            SẮP XẾP LỊCH ĐẤU NGAY
          </Button>
        </CardContent>
      </Card>

      {/* Hiển thị Gợi ý / Cảnh báo về Ràng buộc */}
      {selectedIds.length >= 4 && selectedIds.length < 6 && (
        <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-xl text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-bold">
            <HelpCircle className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            Thông tin phân chia
          </div>
          <p className="text-slate-400 leading-relaxed">
            Do bạn chọn <strong>{selectedIds.length} người chơi</strong>, theo thuật toán toán học thì chắc chắn sẽ có người phải thi đấu 3 set liên tiếp (vì số lượng người nghỉ ít hơn). Để không ai chơi quá 2 set liên tiếp, bạn nên chọn từ <strong>6 người chơi trở lên</strong>.
          </p>
        </div>
      )}

      {/* Kết quả xếp lịch */}
      {isGenerated && schedule.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              Lịch thi đấu đã tạo ({schedule.length} set)
            </h3>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs h-8 whitespace-nowrap cursor-pointer" 
              onClick={() => setShowConfirm(true)}
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Xếp lại ngẫu nhiên
            </Button>
          </div>

          {swapNotification && (
            <div className="p-3 bg-teal-500/10 border border-teal-500/20 text-teal-300 rounded-xl text-xs flex items-center gap-2 animate-fade-in shadow-sm shadow-teal-500/5">
              <Sparkles className="w-4 h-4 text-teal-400 flex-shrink-0 animate-pulse" />
              <span>{swapNotification}</span>
            </div>
          )}

          {/* Danh sách các Set */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {schedule.map((set) => (
              <Card key={set.id} className="relative overflow-hidden border border-white/5 bg-slate-900/40 hover:border-white/10 transition-all duration-200">
                {/* Viền trang trí bên cạnh */}
                <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-teal-500 to-indigo-500" />
                
                <CardContent className="p-4 flex flex-col justify-between h-full space-y-4">
                  {/* Tiêu đề set */}
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-xs font-black tracking-widest text-teal-400 font-mono">SET {set.setIndex}</span>
                    <span className="text-[10px] text-slate-500">Đấu Đôi</span>
                  </div>

                  {/* Sơ đồ trận đấu */}
                  <div className="flex items-center justify-between py-2 px-1 text-center">
                    {/* Đội 1 */}
                    <div className="flex-1 space-y-2">
                      <div className="relative">
                        <select
                          value={set.team1[0]}
                          onChange={(e) => handlePlayerChange(set.id, set.team1[0], e.target.value)}
                          className="w-full text-xs font-semibold text-teal-300 bg-teal-500/5 hover:bg-teal-500/10 px-2 py-1.5 rounded-lg border border-teal-500/10 hover:border-teal-500/30 text-center cursor-pointer focus:outline-none appearance-none transition-all duration-150 truncate pr-5"
                        >
                          <option value={set.team1[0]} disabled className="bg-slate-950 text-slate-300 font-bold">
                            {getPlayerName(set.team1[0])} {players.find(p => p.id === set.team1[0])?.gender === 'female' ? '♀' : '♂'}
                          </option>
                          {selectedIds
                            .filter(id => id !== set.team1[0] && !set.team1.includes(id) && !set.team2.includes(id))
                            .map(id => (
                              <option key={id} value={id} className="bg-slate-950 text-slate-100">
                                Đổi sang: {getPlayerName(id)} {players.find(p => p.id === id)?.gender === 'female' ? '(Nữ ♀)' : '(Nam ♂)'}
                              </option>
                            ))}
                        </select>
                        <span className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-[8px] text-teal-500/50">▼</span>
                      </div>

                      <div className="relative">
                        <select
                          value={set.team1[1]}
                          onChange={(e) => handlePlayerChange(set.id, set.team1[1], e.target.value)}
                          className="w-full text-xs font-semibold text-teal-300 bg-teal-500/5 hover:bg-teal-500/10 px-2 py-1.5 rounded-lg border border-teal-500/10 hover:border-teal-500/30 text-center cursor-pointer focus:outline-none appearance-none transition-all duration-150 truncate pr-5"
                        >
                          <option value={set.team1[1]} disabled className="bg-slate-950 text-slate-300 font-bold">
                            {getPlayerName(set.team1[1])} {players.find(p => p.id === set.team1[1])?.gender === 'female' ? '♀' : '♂'}
                          </option>
                          {selectedIds
                            .filter(id => id !== set.team1[1] && !set.team1.includes(id) && !set.team2.includes(id))
                            .map(id => (
                              <option key={id} value={id} className="bg-slate-950 text-slate-100">
                                Đổi sang: {getPlayerName(id)} {players.find(p => p.id === id)?.gender === 'female' ? '(Nữ ♀)' : '(Nam ♂)'}
                              </option>
                            ))}
                        </select>
                        <span className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-[8px] text-teal-500/50">▼</span>
                      </div>
                      <span className="text-[9px] uppercase tracking-wider text-teal-500 font-bold block mt-1">Đội 1</span>
                    </div>

                    {/* Chữ VS ở giữa */}
                    <div className="px-3 flex flex-col items-center justify-center">
                      <span className="text-xs font-black text-slate-500 bg-white/5 h-7 w-7 rounded-full flex items-center justify-center border border-white/5 font-mono shadow-sm">
                        VS
                      </span>
                    </div>

                    {/* Đội 2 */}
                    <div className="flex-1 space-y-2">
                      <div className="relative">
                        <select
                          value={set.team2[0]}
                          onChange={(e) => handlePlayerChange(set.id, set.team2[0], e.target.value)}
                          className="w-full text-xs font-semibold text-indigo-300 bg-indigo-500/5 hover:bg-indigo-500/10 px-2 py-1.5 rounded-lg border border-indigo-500/10 hover:border-indigo-500/30 text-center cursor-pointer focus:outline-none appearance-none transition-all duration-150 truncate pr-5"
                        >
                          <option value={set.team2[0]} disabled className="bg-slate-950 text-slate-300 font-bold">
                            {getPlayerName(set.team2[0])} {players.find(p => p.id === set.team2[0])?.gender === 'female' ? '♀' : '♂'}
                          </option>
                          {selectedIds
                            .filter(id => id !== set.team2[0] && !set.team1.includes(id) && !set.team2.includes(id))
                            .map(id => (
                              <option key={id} value={id} className="bg-slate-950 text-slate-100">
                                Đổi sang: {getPlayerName(id)} {players.find(p => p.id === id)?.gender === 'female' ? '(Nữ ♀)' : '(Nam ♂)'}
                              </option>
                            ))}
                        </select>
                        <span className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-[8px] text-indigo-500/50">▼</span>
                      </div>

                      <div className="relative">
                        <select
                          value={set.team2[1]}
                          onChange={(e) => handlePlayerChange(set.id, set.team2[1], e.target.value)}
                          className="w-full text-xs font-semibold text-indigo-300 bg-indigo-500/5 hover:bg-indigo-500/10 px-2 py-1.5 rounded-lg border border-indigo-500/10 hover:border-indigo-500/30 text-center cursor-pointer focus:outline-none appearance-none transition-all duration-150 truncate pr-5"
                        >
                          <option value={set.team2[1]} disabled className="bg-slate-950 text-slate-300 font-bold">
                            {getPlayerName(set.team2[1])} {players.find(p => p.id === set.team2[1])?.gender === 'female' ? '♀' : '♂'}
                          </option>
                          {selectedIds
                            .filter(id => id !== set.team2[1] && !set.team1.includes(id) && !set.team2.includes(id))
                            .map(id => (
                              <option key={id} value={id} className="bg-slate-950 text-slate-100">
                                Đổi sang: {getPlayerName(id)} {players.find(p => p.id === id)?.gender === 'female' ? '(Nữ ♀)' : '(Nam ♂)'}
                              </option>
                            ))}
                        </select>
                        <span className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-[8px] text-indigo-500/50">▼</span>
                      </div>
                      <span className="text-[9px] uppercase tracking-wider text-indigo-500 font-bold block mt-1">Đội 2</span>
                    </div>
                  </div>

                  {/* Nút ghi nhận điểm số */}
                  <Button
                    size="sm"
                    className="w-full text-xs font-bold bg-white/5 hover:bg-teal-500/20 hover:text-teal-400 border border-white/5 hover:border-teal-500/20 text-slate-300 h-8 mt-2 transition-all duration-200 cursor-pointer"
                    onClick={() => onFillMatch({
                      t1p1: set.team1[0],
                      t1p2: set.team1[1],
                      t2p1: set.team2[0],
                      t2p2: set.team2[1]
                    })}
                  >
                    <Play className="w-3 h-3 mr-1" />
                    Ghi nhận điểm số
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Thống kê số trận đấu của mỗi người chơi để kiểm tra tính công bằng */}
          <Card className="border border-white/5 bg-slate-900/30">
            <CardHeader className="py-3">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">Thống kê số lượng set đấu phân bổ</CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-4">
              <div className="flex flex-wrap gap-2 text-[11px] text-slate-300">
                {selectedIds.map(id => (
                  <div key={id} className="bg-white/5 px-2.5 py-1 rounded-lg border border-white/5 whitespace-nowrap">
                    <span className="font-semibold text-teal-400 mr-1.5">{getPlayerName(id)}:</span>
                    <span className="font-mono font-bold text-slate-100">{playerStats[id] || 0} set</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Custom Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in">
          <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-sm w-full p-5 space-y-5 shadow-2xl shadow-teal-950/20 text-center scale-100">
            <div className="flex flex-col items-center space-y-2">
              <div className="h-11 w-11 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-400 border border-teal-500/20 mb-1">
                <CalendarRange className="w-5 h-5 animate-pulse" />
              </div>
              <h3 className="text-sm font-bold text-white tracking-wide">Xác nhận tạo lịch thi đấu?</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed max-w-[280px]">
                Hệ thống sẽ tự động phân chia ngẫu nhiên <span className="text-teal-400 font-bold">{selectedIds.length} người chơi</span> thành <span className="text-teal-400 font-bold">{numSets} set</span> đấu tối ưu và công bằng nhất.
              </p>
            </div>
            
            <div className="flex gap-2.5 justify-center pt-1">
              <Button
                variant="outline"
                type="button"
                onClick={() => setShowConfirm(false)}
                className="h-9 px-4 text-xs font-semibold bg-white/5 border-white/10 hover:bg-white/10 text-slate-300 cursor-pointer rounded-xl flex-1"
              >
                Hủy bỏ
              </Button>
              <Button
                type="button"
                onClick={() => {
                  generateSchedule();
                  setShowConfirm(false);
                }}
                className="h-9 px-4 text-xs font-bold bg-teal-500 hover:bg-teal-600 text-slate-950 cursor-pointer rounded-xl flex-1"
              >
                Đồng ý & Tạo
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
