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
import { useModalHistory } from '../hooks/useModalHistory';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { getGroupMatches, getGroupPlayers } from '../utils/groupUtils';

export { MatchDetailModal } from './match-history/MatchDetailModal';
import { MatchHistoryView } from './match-history/MatchHistoryView';

export default function MatchHistory() {
  const { matches, players, selectedGroupId, deleteMatch, updateMatch, selectedWeek, setSelectedWeek } = useStore();
  const isOnline = useOnlineStatus();
  const groupPlayers = useMemo(() => getGroupPlayers(players, selectedGroupId), [players, selectedGroupId]);
  const groupMatches = useMemo(() => getGroupMatches(matches, selectedGroupId), [matches, selectedGroupId]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  const weekOptions = useMemo(() => getWeekOptions(groupMatches), [groupMatches]);

  const filteredMatches = useMemo(() => {
    let result = groupMatches;

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
  }, [groupMatches, selectedWeek, selectedPlayerId, weekOptions]);
  
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

    if (!isOnline) {
      setEditErrorMsg("Bạn đang offline. Vui lòng kết nối mạng trước khi lưu thay đổi để điểm được cập nhật lên hệ thống.");
      return;
    }

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
    <MatchHistoryView model={{
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
    }} />
  );
}
