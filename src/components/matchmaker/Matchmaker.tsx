import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../../store';
import { format } from 'date-fns';
import { getGroupMatches, getGroupPlayers } from '../../utils/groupUtils';
import { calculateLeaderboard } from '../../utils/calculations';
import {
  generateRoundMatchups,
  updateSessionAfterRound,
  swapCourtPlayers,
  swapCourtWithBench,
  MatchmakerPlayer,
  PlayerSessionStats,
  PartnerHistoryMap,
  CourtMatch,
  MatchmakingResult,
} from '../../utils/matchmaker';
import MatchmakerView from './MatchmakerView';

interface MatchmakerProps {
  onFillMatch: (matchData: { t1p1: string; t1p2: string; t2p1: string; t2p2: string }) => void;
}

export type SelectedSwapTarget =
  | { type: 'court'; playerId: string; courtIdx: number }
  | { type: 'bench'; playerId: string };

export interface RecordedCourtScore {
  score1: number;
  score2: number;
}

export default function Matchmaker({ onFillMatch }: MatchmakerProps) {
  const { players, matches, courts: registeredCourts, selectedGroupId, theme, addMatch } = useStore();
  const isLight = theme === 'light';

  // 1. Get players in current group with their computed Elo
  const groupPlayers = useMemo(
    () => getGroupPlayers(players, selectedGroupId).filter(p => p.isActive),
    [players, selectedGroupId]
  );
  const groupMatches = useMemo(() => getGroupMatches(matches, selectedGroupId), [matches, selectedGroupId]);
  const leaderboard = useMemo(() => calculateLeaderboard(groupPlayers, groupMatches), [groupPlayers, groupMatches]);

  const eloMap = useMemo(() => {
    const map: Record<string, number> = {};
    leaderboard.forEach(item => {
      map[item.playerId] = item.rating;
    });
    return map;
  }, [leaderboard]);

  const allAvailablePlayers: MatchmakerPlayer[] = useMemo(() => {
    return groupPlayers.map(p => ({
      id: p.id,
      name: p.name,
      gender: p.gender || 'male',
      elo: eloMap[p.id] || 1500,
    }));
  }, [groupPlayers, eloMap]);

  // 2. Local Storage Persistence per group
  const storageKey = `badminton_matchmaker_${selectedGroupId}`;

  const [checkedInIds, setCheckedInIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`${storageKey}_checkedIn`);
      if (saved) {
        const parsed: string[] = JSON.parse(saved);
        return parsed.filter(id => groupPlayers.some(p => p.id === id));
      }
    } catch {}
    return groupPlayers.map(p => p.id);
  });

  const [numCourts, setNumCourts] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(`${storageKey}_numCourts`);
      if (saved) return Math.max(1, parseInt(saved, 10) || 1);
    } catch {}
    return 2;
  });

  const [roundNumber, setRoundNumber] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(`${storageKey}_roundNumber`);
      if (saved) return Math.max(1, parseInt(saved, 10) || 1);
    } catch {}
    return 1;
  });

  const [sessionStats, setSessionStats] = useState<Record<string, PlayerSessionStats>>(() => {
    try {
      const saved = localStorage.getItem(`${storageKey}_sessionStats`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  const [partnerHistory, setPartnerHistory] = useState<PartnerHistoryMap>(() => {
    try {
      const saved = localStorage.getItem(`${storageKey}_partnerHistory`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  const [currentMatchup, setCurrentMatchup] = useState<MatchmakingResult | null>(() => {
    try {
      const saved = localStorage.getItem(`${storageKey}_currentMatchup`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  const [recordedScores, setRecordedScores] = useState<Record<number, RecordedCourtScore>>(() => {
    try {
      const saved = localStorage.getItem(`${storageKey}_recordedScores`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  const [swapTarget, setSwapTarget] = useState<SelectedSwapTarget | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`${storageKey}_checkedIn`, JSON.stringify(checkedInIds));
      localStorage.setItem(`${storageKey}_numCourts`, numCourts.toString());
      localStorage.setItem(`${storageKey}_roundNumber`, roundNumber.toString());
      localStorage.setItem(`${storageKey}_sessionStats`, JSON.stringify(sessionStats));
      localStorage.setItem(`${storageKey}_partnerHistory`, JSON.stringify(partnerHistory));
      localStorage.setItem(`${storageKey}_recordedScores`, JSON.stringify(recordedScores));
      if (currentMatchup) {
        localStorage.setItem(`${storageKey}_currentMatchup`, JSON.stringify(currentMatchup));
      } else {
        localStorage.removeItem(`${storageKey}_currentMatchup`);
      }
    } catch {}
  }, [storageKey, checkedInIds, numCourts, roundNumber, sessionStats, partnerHistory, currentMatchup, recordedScores]);

  const showNotification = (type: 'success' | 'info', text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 3500);
  };

  const checkedInPlayers = useMemo(() => {
    return allAvailablePlayers.filter(p => checkedInIds.includes(p.id));
  }, [allAvailablePlayers, checkedInIds]);

  const courtNames = useMemo(() => {
    return registeredCourts.map(c => c.name);
  }, [registeredCourts]);

  // Handlers
  const handleToggleCheckIn = (id: string) => {
    setCheckedInIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const handleSelectAll = () => {
    setCheckedInIds(allAvailablePlayers.map(p => p.id));
  };

  const handleDeselectAll = () => {
    setCheckedInIds([]);
  };

  const handleGenerateMatchups = () => {
    if (checkedInPlayers.length < 4) {
      showNotification('info', 'Cần ít nhất 4 người chơi điểm danh để xếp trận.');
      return;
    }
    const result = generateRoundMatchups(
      checkedInPlayers,
      numCourts,
      sessionStats,
      partnerHistory,
      courtNames
    );
    setCurrentMatchup(result);
    setRecordedScores({});
    setSwapTarget(null);
    showNotification('success', `Đã xếp xong lượt ${roundNumber} với độ cân bằng tối ưu!`);
  };

  const handleConfirmAndNextRound = () => {
    if (!currentMatchup || currentMatchup.courts.length === 0) return;

    const { stats: updatedStats, history: updatedHistory } = updateSessionAfterRound(
      sessionStats,
      partnerHistory,
      checkedInPlayers,
      currentMatchup.courts
    );

    const nextRound = roundNumber + 1;
    setSessionStats(updatedStats);
    setPartnerHistory(updatedHistory);
    setRoundNumber(nextRound);
    setRecordedScores({});

    // Automatically generate next round
    const nextMatchup = generateRoundMatchups(
      checkedInPlayers,
      numCourts,
      updatedStats,
      updatedHistory,
      courtNames
    );
    setCurrentMatchup(nextMatchup);
    setSwapTarget(null);
    showNotification('success', `Đã chuyển sang lượt #${nextRound} thành công!`);
  };

  const handleResetSession = () => {
    setSessionStats({});
    setPartnerHistory({});
    setRoundNumber(1);
    setCurrentMatchup(null);
    setRecordedScores({});
    setSwapTarget(null);
    showNotification('info', 'Đã khởi tạo lại buổi đánh mới từ lượt #1.');
  };

  const handleSwapClick = (clicked: SelectedSwapTarget) => {
    if (!currentMatchup) return;

    if (!swapTarget) {
      // First player selected
      setSwapTarget(clicked);
      return;
    }

    if (swapTarget.playerId === clicked.playerId) {
      // Deselect if clicked same player
      setSwapTarget(null);
      return;
    }

    // Perform swap
    let newCourts = [...currentMatchup.courts];
    let newBench = [...currentMatchup.benchPlayers];

    if (swapTarget.type === 'court' && clicked.type === 'court') {
      newCourts = swapCourtPlayers(newCourts, swapTarget.playerId, clicked.playerId);
    } else if (swapTarget.type === 'court' && clicked.type === 'bench') {
      const swapped = swapCourtWithBench(newCourts, newBench, swapTarget.playerId, clicked.playerId);
      newCourts = swapped.courts;
      newBench = swapped.bench;
    } else if (swapTarget.type === 'bench' && clicked.type === 'court') {
      const swapped = swapCourtWithBench(newCourts, newBench, clicked.playerId, swapTarget.playerId);
      newCourts = swapped.courts;
      newBench = swapped.bench;
    }

    setCurrentMatchup({
      courts: newCourts,
      benchPlayers: newBench,
    });
    setSwapTarget(null);
    showNotification('success', 'Đã hoán đổi vị trí và cập nhật chỉ số cân bằng!');
  };

  const handlePlayMatch = (court: CourtMatch) => {
    onFillMatch({
      t1p1: court.team1[0].id,
      t1p2: court.team1[1].id,
      t2p1: court.team2[0].id,
      t2p2: court.team2[1].id,
    });
  };

  const handleQuickSaveScore = (court: CourtMatch, score1: number, score2: number) => {
    addMatch({
      groupId: selectedGroupId,
      date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      team1: [court.team1[0].id, court.team1[1].id],
      team2: [court.team2[0].id, court.team2[1].id],
      isScoreExact: true,
      score1,
      score2,
    });

    setRecordedScores(prev => ({
      ...prev,
      [court.courtIndex]: { score1, score2 },
    }));

    const courtTitle = court.courtName || `Sân ${court.courtIndex + 1}`;
    showNotification('success', `Đã lưu kết quả ${courtTitle} (${score1} - ${score2}) vào bảng xếp hạng!`);
  };

  return (
    <MatchmakerView
      isLight={isLight}
      allPlayers={allAvailablePlayers}
      checkedInIds={checkedInIds}
      numCourts={numCourts}
      setNumCourts={setNumCourts}
      roundNumber={roundNumber}
      sessionStats={sessionStats}
      currentMatchup={currentMatchup}
      recordedScores={recordedScores}
      swapTarget={swapTarget}
      notification={notification}
      onToggleCheckIn={handleToggleCheckIn}
      onSelectAll={handleSelectAll}
      onDeselectAll={handleDeselectAll}
      onGenerate={handleGenerateMatchups}
      onConfirmNextRound={handleConfirmAndNextRound}
      onResetSession={handleResetSession}
      onSwapClick={handleSwapClick}
      onPlayMatch={handlePlayMatch}
      onQuickSaveScore={handleQuickSaveScore}
    />
  );
}
