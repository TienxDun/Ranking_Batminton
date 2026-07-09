import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../../store';
import { CostLineItem, SessionCost, SessionCostBreakdown } from '../../types';
import { requireAdminPassword } from '../../utils/adminAuth';
import {
  CostLineKey, emptyCostBreakdown, getPlayersFromMatchesOnDate, getTotalCost,
  isValidMapUrl, normalizeCostBreakdown, splitCostEqually,
} from '../../utils/costUtils';
import { getGroupMatches, getGroupPlayers, getGroupSessionCosts } from '../../utils/groupUtils';
import { formatSessionDate, todayKey } from './sessionCostDate';

export function useSessionCostsController() {
  const {
    players,
    matches,
    sessionCosts,
    selectedGroupId,
    courts,
    addSessionCost,
    updateSessionCost,
    deleteSessionCost,
    addCourt,
    deleteCourt,
    config,
    setConfig,
  } = useStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [date, setDate] = useState(todayKey());
  const [courtId, setCourtId] = useState<string>('');
  const [costs, setCosts] = useState<SessionCostBreakdown>(emptyCostBreakdown());
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [courtNumber, setCourtNumber] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingCourtId, setDeletingCourtId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showCourtManager, setShowCourtManager] = useState(false);
  const [newCourtName, setNewCourtName] = useState('');
  const [newCourtMapUrl, setNewCourtMapUrl] = useState('');
  const [formQrPreviewOpen, setFormQrPreviewOpen] = useState(false);
  const [viewingSession, setViewingSession] = useState<SessionCost | null>(null);
  const dateChangedByUser = useRef(false);

  const groupPlayers = useMemo(() => getGroupPlayers(players, selectedGroupId), [players, selectedGroupId]);
  const groupMatches = useMemo(() => getGroupMatches(matches, selectedGroupId), [matches, selectedGroupId]);
  const groupSessionCosts = useMemo(
    () => getGroupSessionCosts(sessionCosts, selectedGroupId),
    [sessionCosts, selectedGroupId]
  );
  const activePlayers = useMemo(() => groupPlayers.filter(p => p.isActive), [groupPlayers]);
  const currentDateKey = todayKey();

  const sortedSessions = useMemo(
    () => [...groupSessionCosts].sort((a, b) => b.date.localeCompare(a.date)),
    [groupSessionCosts]
  );

  const totalAllSessionsCost = useMemo(() => {
    return groupSessionCosts.reduce((sum, session) => {
      const normalized = normalizeCostBreakdown(session.costs);
      return sum + getTotalCost(normalized);
    }, 0);
  }, [groupSessionCosts]);

  const totalCost = useMemo(() => getTotalCost(costs), [costs]);
  const splits = useMemo(
    () => splitCostEqually(totalCost, participantIds),
    [totalCost, participantIds]
  );
  const perPerson = participantIds.length > 0 && totalCost > 0
    ? splits[0]?.amount ?? 0
    : 0;

  const autoDetectedIds = useMemo(
    () => getPlayersFromMatchesOnDate(groupMatches, date),
    [groupMatches, date]
  );

  const selectedCourt = courts.find(c => c.id === courtId);

  useEffect(() => {
    if (!showForm || editingId) return;
    if (dateChangedByUser.current) {
      setParticipantIds(autoDetectedIds);
      dateChangedByUser.current = false;
    }
  }, [autoDetectedIds, showForm, editingId]);

  const showNotification = (type: 'success' | 'error', text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 4000);
  };

  const resetForm = () => {
    setEditingId(null);
    setDate(todayKey());
    setCourtId('');
    setCosts(emptyCostBreakdown());
    setParticipantIds(getPlayersFromMatchesOnDate(groupMatches, todayKey()));
    setNotes('');
    setCourtNumber('');
    setShowForm(false);
  };

  const openNewForm = () => {
    const today = todayKey();
    setEditingId(null);
    setDate(today);
    setCourtId('');
    setCosts(emptyCostBreakdown());
    setParticipantIds(getPlayersFromMatchesOnDate(groupMatches, today));
    setNotes('');
    setCourtNumber('');
    setShowForm(true);
  };

  const openEditForm = (session: SessionCost) => {
    if (!requireAdminPassword()) return;
    setEditingId(session.id);
    setDate(session.date);
    setCourtId(session.courtId || '');
    setCosts(normalizeCostBreakdown(session.costs));
    setParticipantIds([...session.participantIds]);
    setNotes(session.notes || '');
    setCourtNumber(session.courtNumber || '');
    setShowForm(true);
  };

  const handleDateChange = (newDate: string) => {
    dateChangedByUser.current = true;
    setDate(newDate);

    const existing = groupSessionCosts.find(s => s.date === newDate && s.id !== editingId);
    if (existing) {
      openEditForm(existing);
    }
  };

  const toggleParticipant = (playerId: string) => {
    setParticipantIds(prev =>
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  const handleLineChange = (key: CostLineKey, item: CostLineItem) => {
    setCosts(prev => ({ ...prev, [key]: item }));
  };

  const handleSave = (e: FormEvent) => {
    e.preventDefault();

    if (participantIds.length === 0) {
      showNotification('error', 'Vui lòng chọn ít nhất 1 người tham gia.');
      return;
    }
    if (totalCost <= 0) {
      showNotification('error', 'Tổng chi phí phải lớn hơn 0.');
      return;
    }

    const payload = {
      groupId: selectedGroupId,
      date,
      courtId: courtId || undefined,
      courtNumber: courtNumber.trim() || undefined,
      costs: {
        ...costs,
        otherNote: costs.otherNote?.trim() || undefined,
      },
      participantIds,
      notes: notes.trim() || undefined,
    };

    if (editingId) {
      updateSessionCost(editingId, payload);
      showNotification('success', `Đã cập nhật chi phí buổi ${formatSessionDate(date)}.`);
    } else {
      addSessionCost(payload);
      showNotification('success', `Đã lưu chi phí buổi ${formatSessionDate(date)}.`);
    }
    resetForm();
  };

  const handleDelete = (id: string) => {
    deleteSessionCost(id);
    setDeletingId(null);
    if (editingId === id) resetForm();
    showNotification('success', 'Đã xóa buổi đánh.');
  };

  const handleAddCourt = (e: FormEvent) => {
    e.preventDefault();
    if (!newCourtName.trim()) {
      showNotification('error', 'Vui lòng nhập tên sân.');
      return;
    }
    if (!isValidMapUrl(newCourtMapUrl)) {
      showNotification('error', 'URL Google Maps không hợp lệ.');
      return;
    }
    addCourt(newCourtName.trim(), newCourtMapUrl.trim());
    setNewCourtName('');
    setNewCourtMapUrl('');
    showNotification('success', `Đã thêm sân: ${newCourtName.trim()}`);
  };

  const handleDeleteCourt = (id: string) => {
    deleteCourt(id);
    if (courtId === id) setCourtId('');
    setDeletingCourtId(null);
    showNotification('success', 'Đã xóa sân.');
  };

  const getPlayerName = (id: string) => players.find(p => p.id === id)?.name || 'Unknown';
  const getCourtName = (id?: string) => courts.find(c => c.id === id)?.name;

  const costLineKeys: CostLineKey[] = ['court', 'water', 'shuttlecock', 'other'];
  const costPlaceholders: Record<CostLineKey, string> = {
    court: '80000',
    water: '10000',
    shuttlecock: '25000',
    other: '0',
  };

  return {
    players, courts, selectedGroupId, config, setConfig,
    editingId, date, courtId, costs, participantIds, notes, courtNumber,
    notification, deletingId, setDeletingId, deletingCourtId, setDeletingCourtId,
    showForm, showCourtManager, setShowCourtManager, newCourtName, setNewCourtName,
    newCourtMapUrl, setNewCourtMapUrl, formQrPreviewOpen, setFormQrPreviewOpen,
    viewingSession, setViewingSession, activePlayers, currentDateKey,
    sortedSessions, totalAllSessionsCost, totalCost, splits, perPerson,
    autoDetectedIds, selectedCourt, resetForm, openNewForm, openEditForm,
    handleDateChange, toggleParticipant, handleLineChange, handleSave,
    handleDelete, handleAddCourt, handleDeleteCourt, getPlayerName, getCourtName,
    costLineKeys, costPlaceholders, setCourtId, setCourtNumber, setCosts, setNotes,
  };
}
