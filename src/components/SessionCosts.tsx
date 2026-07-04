import React, { useState, useMemo, useEffect, useRef } from 'react';
import { format, parseISO } from 'date-fns';
import { useStore } from '../store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import {
  CheckCircle2,
  AlertCircle,
  Wallet,
  Calendar,
  Pencil,
  Trash2,
  Users,
  X,
  MapPin,
  ExternalLink,
  Plus,
} from 'lucide-react';
import { CostLineItem, SessionCost, SessionCostBreakdown } from '../types';
import {
  COST_LINE_LABELS,
  COST_LINE_UNITS,
  CostLineKey,
  emptyCostBreakdown,
  formatVND,
  getLineTotal,
  getPlayersFromMatchesOnDate,
  getTotalCost,
  isValidMapUrl,
  normalizeCostBreakdown,
  parseCostInput,
  parseQuantityInput,
  splitCostEqually,
} from '../utils/costUtils';

function todayKey(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

function formatSessionDate(date: string): string {
  try {
    return format(parseISO(date), 'dd/MM/yyyy');
  } catch {
    return date;
  }
}

function CostLineRow({
  label,
  unitLabel,
  item,
  unitPricePlaceholder,
  onChange,
}: {
  label: string;
  unitLabel: string;
  item: CostLineItem;
  unitPricePlaceholder: string;
  onChange: (item: CostLineItem) => void;
}) {
  const total = getLineTotal(item);

  return (
    <div className="p-3 sm:p-4 bg-white/5 border border-white/5 rounded-xl space-y-2">
      <label className="text-sm font-medium text-slate-200">{label}</label>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex-1 min-w-0">
            <span className="text-[10px] text-slate-500 block mb-1">Đơn giá</span>
            <Input
              type="text"
              inputMode="numeric"
              placeholder={unitPricePlaceholder}
              value={item.unitPrice === 0 ? '' : String(item.unitPrice)}
              onChange={e => onChange({ ...item, unitPrice: parseCostInput(e.target.value) })}
              className="h-9"
            />
          </div>
          <span className="text-slate-500 font-medium pt-4">×</span>
          <div className="w-20 sm:w-24 flex-shrink-0">
            <span className="text-[10px] text-slate-500 block mb-1">SL ({unitLabel})</span>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="1"
              value={item.quantity === 0 ? '' : String(item.quantity)}
              onChange={e => onChange({ ...item, quantity: parseQuantityInput(e.target.value) })}
              className="h-9 text-center"
            />
          </div>
        </div>
        <div className="sm:text-right sm:min-w-[120px] pt-1 sm:pt-4 flex-shrink-0">
          <span className="text-[10px] text-slate-500 block sm:hidden mb-0.5">Thành tiền</span>
          <span className={`text-sm font-bold whitespace-nowrap tabular-nums ${total > 0 ? 'text-teal-400' : 'text-slate-500'}`}>
            = {formatVND(total)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function SessionCosts() {
  const {
    players,
    matches,
    sessionCosts,
    courts,
    addSessionCost,
    updateSessionCost,
    deleteSessionCost,
    addCourt,
    deleteCourt,
  } = useStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [date, setDate] = useState(todayKey());
  const [courtId, setCourtId] = useState<string>('');
  const [costs, setCosts] = useState<SessionCostBreakdown>(emptyCostBreakdown());
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingCourtId, setDeletingCourtId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showCourtManager, setShowCourtManager] = useState(false);
  const [newCourtName, setNewCourtName] = useState('');
  const [newCourtMapUrl, setNewCourtMapUrl] = useState('');
  const dateChangedByUser = useRef(false);

  const activePlayers = useMemo(() => players.filter(p => p.isActive), [players]);

  const sortedSessions = useMemo(
    () => [...sessionCosts].sort((a, b) => b.date.localeCompare(a.date)),
    [sessionCosts]
  );

  const totalCost = useMemo(() => getTotalCost(costs), [costs]);
  const splits = useMemo(
    () => splitCostEqually(totalCost, participantIds),
    [totalCost, participantIds]
  );
  const perPerson = participantIds.length > 0 && totalCost > 0
    ? splits[0]?.amount ?? 0
    : 0;

  const autoDetectedIds = useMemo(
    () => getPlayersFromMatchesOnDate(matches, date),
    [matches, date]
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
    setParticipantIds(getPlayersFromMatchesOnDate(matches, todayKey()));
    setNotes('');
    setShowForm(false);
  };

  const openNewForm = () => {
    const today = todayKey();
    setEditingId(null);
    setDate(today);
    setCourtId('');
    setCosts(emptyCostBreakdown());
    setParticipantIds(getPlayersFromMatchesOnDate(matches, today));
    setNotes('');
    setShowForm(true);
  };

  const openEditForm = (session: SessionCost) => {
    setEditingId(session.id);
    setDate(session.date);
    setCourtId(session.courtId || '');
    setCosts(normalizeCostBreakdown(session.costs));
    setParticipantIds([...session.participantIds]);
    setNotes(session.notes || '');
    setShowForm(true);
  };

  const handleDateChange = (newDate: string) => {
    dateChangedByUser.current = true;
    setDate(newDate);

    const existing = sessionCosts.find(s => s.date === newDate && s.id !== editingId);
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

  const handleSave = (e: React.FormEvent) => {
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
      date,
      courtId: courtId || undefined,
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

  const handleAddCourt = (e: React.FormEvent) => {
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

  return (
    <div className="space-y-6">
      {notification && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${
          notification.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span className="text-sm font-medium">{notification.text}</span>
        </div>
      )}

      {!showForm && (
        <div className="flex flex-col sm:flex-row justify-end gap-2">
          <Button
            variant="ghost"
            onClick={() => setShowCourtManager(v => !v)}
            className="text-slate-300 hover:text-white border border-white/10 cursor-pointer"
          >
            <MapPin className="w-4 h-4 mr-2" />
            {showCourtManager ? 'Ẩn quản lý sân' : 'Quản lý sân'}
          </Button>
          <Button onClick={openNewForm} className="bg-teal-500 hover:bg-teal-600 text-white-force font-bold cursor-pointer">
            <Wallet className="w-4 h-4 mr-2" />
            Thêm buổi đánh
          </Button>
        </div>
      )}

      {showCourtManager && !showForm && (
        <Card>
          <CardHeader className="text-center sm:text-left">
            <CardTitle className="text-sm xs:text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-teal-400" />
              QUẢN LÝ SÂN ĐÁNH
            </CardTitle>
            <CardDescription>Thêm sân bằng URL Google Maps để chọn khi ghi chi phí</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleAddCourt} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  placeholder="Tên sân (VD: Sân Cầu Lông ABC)"
                  value={newCourtName}
                  onChange={e => setNewCourtName(e.target.value)}
                  className="h-10"
                />
                <Input
                  placeholder="URL Google Maps (https://maps.google.com/...)"
                  value={newCourtMapUrl}
                  onChange={e => setNewCourtMapUrl(e.target.value)}
                  className="h-10"
                />
              </div>
              <Button type="submit" className="bg-teal-500 hover:bg-teal-600 text-white-force font-bold cursor-pointer">
                <Plus className="w-4 h-4 mr-2" />
                Thêm sân
              </Button>
            </form>

            {courts.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Chưa có sân nào. Dán link Google Maps của sân để thêm.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên sân</TableHead>
                    <TableHead className="hidden sm:table-cell">Bản đồ</TableHead>
                    <TableHead className="text-center w-24">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courts.map(court => (
                    <TableRow key={court.id}>
                      <TableCell className="font-medium">{court.name}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <a
                          href={court.mapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300"
                        >
                          Xem bản đồ <ExternalLink className="w-3 h-3" />
                        </a>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingCourtId(court.id)}
                            className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 cursor-pointer p-1.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {showForm && (
        <Card>
          <CardHeader className="text-center sm:text-left">
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="text-sm xs:text-base sm:text-lg font-bold text-white">
                  {editingId ? 'CHỈNH SỬA CHI PHÍ' : 'THÊM CHI PHÍ BUỔI ĐÁNH'}
                </CardTitle>
                <CardDescription>Nhập đơn giá × số lượng và chọn người tham gia để chia tiền</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={resetForm} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-teal-400" />
                    Ngày buổi đánh
                  </label>
                  <Input
                    type="date"
                    value={date}
                    onChange={e => handleDateChange(e.target.value)}
                    className="w-full h-10"
                  />
                  {autoDetectedIds.length > 0 && (
                    <p className="text-xs text-slate-400">
                      Tự động phát hiện {autoDetectedIds.length} người chơi từ các trận cùng ngày
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-teal-400" />
                    Sân đánh
                  </label>
                  <Select
                    value={courtId}
                    onChange={e => setCourtId(e.target.value)}
                    className="h-10"
                  >
                    <option value="">-- Chọn sân --</option>
                    {courts.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </Select>
                  {courts.length === 0 && (
                    <p className="text-xs text-slate-400">
                      Chưa có sân. Mở &quot;Quản lý sân&quot; để thêm bằng URL Google Maps.
                    </p>
                  )}
                  {selectedCourt && (
                    <a
                      href={selectedCourt.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300"
                    >
                      Xem vị trí sân trên Google Maps <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-200">Chi phí (đơn giá × số lượng)</p>
                {costLineKeys.map(key => (
                  <CostLineRow
                    key={key}
                    label={COST_LINE_LABELS[key]}
                    unitLabel={COST_LINE_UNITS[key]}
                    item={costs[key]}
                    unitPricePlaceholder={costPlaceholders[key]}
                    onChange={item => handleLineChange(key, item)}
                  />
                ))}
              </div>

              {getLineTotal(costs.other) > 0 && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-200">Ghi chú tiền khác</label>
                  <Input
                    placeholder="VD: gửi xe, thuê vợt..."
                    value={costs.otherNote || ''}
                    onChange={e => setCosts(prev => ({ ...prev, otherNote: e.target.value }))}
                    className="h-10"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-200">Ghi chú buổi đánh (tùy chọn)</label>
                <Input
                  placeholder="VD: buổi tối, sân trong nhà..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="h-10"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-200 flex items-center gap-2">
                  <Users className="w-4 h-4 text-teal-400" />
                  Người tham gia ({participantIds.length})
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {activePlayers.map(p => {
                    const isSelected = participantIds.includes(p.id);
                    const isAuto = autoDetectedIds.includes(p.id);
                    return (
                      <label
                        key={p.id}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-teal-500/10 border-teal-500/30 text-teal-300'
                            : 'bg-white/5 border-white/5 text-slate-400 hover:border-white/10'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleParticipant(p.id)}
                          className="rounded accent-teal-500"
                        />
                        <span className="text-sm font-medium truncate">{p.name}</span>
                        {isAuto && !isSelected && (
                          <span className="text-[10px] text-slate-500 ml-auto">trận</span>
                        )}
                      </label>
                    );
                  })}
                </div>
                {activePlayers.length === 0 && (
                  <p className="text-sm text-slate-400">Chưa có người chơi. Thêm người chơi trong tab Cài Đặt.</p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-3 p-3 sm:p-4 bg-gradient-to-r from-teal-500/10 to-indigo-500/5 border border-teal-500/20 rounded-xl">
                <div className="text-center sm:text-left min-w-0">
                  <p className="text-[10px] sm:text-xs text-slate-400 mb-1 whitespace-nowrap">Tổng chi phí</p>
                  <p className="text-sm sm:text-lg font-bold text-white whitespace-nowrap tabular-nums">{formatVND(totalCost)}</p>
                </div>
                <div className="text-center sm:text-left min-w-0">
                  <p className="text-[10px] sm:text-xs text-slate-400 mb-1 whitespace-nowrap">Số người</p>
                  <p className="text-sm sm:text-lg font-bold text-white tabular-nums">{participantIds.length}</p>
                </div>
                <div className="text-center sm:text-left min-w-0">
                  <p className="text-[10px] sm:text-xs text-slate-400 mb-1 whitespace-nowrap">Mỗi người</p>
                  <p className="text-sm sm:text-lg font-bold text-teal-400 whitespace-nowrap tabular-nums">{formatVND(perPerson)}</p>
                </div>
              </div>

              {participantIds.length > 0 && totalCost > 0 && (
                <Table className="text-xs sm:text-sm">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap px-2 sm:px-4">Người chơi</TableHead>
                      <TableHead className="text-right whitespace-nowrap px-2 sm:px-4">Số tiền</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {splits.map(({ playerId, amount }) => (
                      <TableRow key={playerId}>
                        <TableCell className="whitespace-nowrap px-2 sm:px-4 py-2">{getPlayerName(playerId)}</TableCell>
                        <TableCell className="text-right font-semibold text-teal-400 whitespace-nowrap px-2 sm:px-4 py-2 tabular-nums">
                          {formatVND(amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <Button type="submit" className="flex-1 bg-teal-500 hover:bg-teal-600 text-white-force font-bold cursor-pointer">
                  {editingId ? 'Cập nhật' : 'Lưu buổi đánh'}
                </Button>
                <Button type="button" variant="ghost" onClick={resetForm} className="cursor-pointer">
                  Hủy
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="text-center sm:text-left">
          <CardTitle className="text-sm xs:text-base sm:text-lg font-bold text-white">LỊCH SỬ CHI PHÍ</CardTitle>
          <CardDescription>Các buổi đánh đã ghi nhận chi phí</CardDescription>
        </CardHeader>
        <CardContent>
          {sortedSessions.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">
              Chưa có buổi đánh nào. Nhấn &quot;Thêm buổi đánh&quot; để bắt đầu.
            </p>
          ) : (
            <div className="overflow-x-auto -mx-1 sm:mx-0">
            <Table className="text-xs sm:text-sm min-w-0">
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap px-2 sm:px-4 py-2 sm:py-3">Ngày</TableHead>
                  <TableHead className="hidden md:table-cell whitespace-nowrap px-2 sm:px-4">Sân</TableHead>
                  <TableHead className="text-right hidden sm:table-cell whitespace-nowrap px-2 sm:px-4">Tổng</TableHead>
                  <TableHead className="text-center whitespace-nowrap px-2 sm:px-4 w-10 sm:w-auto">Người</TableHead>
                  <TableHead className="text-right whitespace-nowrap px-2 sm:px-4">
                    <span className="sm:hidden">Đ/người</span>
                    <span className="hidden sm:inline">Mỗi người</span>
                  </TableHead>
                  <TableHead className="text-center whitespace-nowrap px-1 sm:px-4 w-14 sm:w-24">
                    <span className="hidden sm:inline">Hành động</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedSessions.map(session => {
                  const normalized = normalizeCostBreakdown(session.costs);
                  const total = getTotalCost(normalized);
                  const count = session.participantIds.length;
                  const each = count > 0 ? splitCostEqually(total, session.participantIds)[0]?.amount ?? 0 : 0;
                  return (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium whitespace-nowrap px-2 sm:px-4 py-2 sm:py-3 tabular-nums">
                        {formatSessionDate(session.date)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-slate-400 text-sm truncate max-w-[140px] px-2 sm:px-4">
                        {getCourtName(session.courtId) || '—'}
                      </TableCell>
                      <TableCell className="text-right hidden sm:table-cell text-slate-300 whitespace-nowrap px-2 sm:px-4 tabular-nums">
                        {formatVND(total)}
                      </TableCell>
                      <TableCell className="text-center whitespace-nowrap px-2 sm:px-4 tabular-nums">{count}</TableCell>
                      <TableCell className="text-right font-semibold text-teal-400 whitespace-nowrap px-2 sm:px-4 tabular-nums">
                        {formatVND(each)}
                      </TableCell>
                      <TableCell className="px-1 sm:px-4 py-2">
                        <div className="flex items-center justify-center gap-0.5 sm:gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditForm(session)}
                            className="text-teal-400 hover:text-teal-300 hover:bg-teal-500/10 cursor-pointer p-1 sm:p-1.5"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingId(session.id)}
                            className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 cursor-pointer p-1 sm:p-1.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Xác nhận xóa</h3>
            <p className="text-sm text-slate-400 mb-6">
              Bạn có chắc muốn xóa chi phí buổi đánh này? Hành động không thể hoàn tác.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => handleDelete(deletingId)}
                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white cursor-pointer"
              >
                Xóa
              </Button>
              <Button variant="ghost" onClick={() => setDeletingId(null)} className="flex-1 cursor-pointer">
                Hủy
              </Button>
            </div>
          </div>
        </div>
      )}

      {deletingCourtId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Xóa sân</h3>
            <p className="text-sm text-slate-400 mb-6">
              Bạn có chắc muốn xóa sân này? Các buổi đánh cũ vẫn giữ nguyên.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => handleDeleteCourt(deletingCourtId)}
                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white cursor-pointer"
              >
                Xóa
              </Button>
              <Button variant="ghost" onClick={() => setDeletingCourtId(null)} className="flex-1 cursor-pointer">
                Hủy
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
