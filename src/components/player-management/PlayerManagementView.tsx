import React from 'react';
import { createPortal } from 'react-dom';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Layers3,
  Mars,
  Minus,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  UserPlus,
  Venus,
  Eye,
  X,
} from 'lucide-react';
import { LeaderboardConfig, Player, PlayerGroup } from '../../types';
import { DEFAULT_GROUP_ID } from '../../constants/groups';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

type Notification = { type: 'success' | 'error'; text: string } | null;

export interface PlayerManagementViewModel {
  notification: Notification;
  isLight: boolean;
  config: LeaderboardConfig;
  setConfig: (config: Partial<LeaderboardConfig>) => void;
  runAdminAction: (action: () => void) => void;
  activeGroups: PlayerGroup[];
  groups: PlayerGroup[];
  selectedGroupId: string;
  newGroupName: string;
  setNewGroupName: React.Dispatch<React.SetStateAction<string>>;
  handleAddGroup: (event: React.FormEvent) => void;
  updateGroup: (id: string, updates: Partial<Omit<PlayerGroup, 'id'>>) => void;
  archiveGroup: (id: string) => void;
  deleteGroup: (id: string) => void;
  newName: string;
  setNewName: React.Dispatch<React.SetStateAction<string>>;
  newGender: 'male' | 'female';
  setNewGender: React.Dispatch<React.SetStateAction<'male' | 'female'>>;
  newElo: string;
  setNewElo: React.Dispatch<React.SetStateAction<string>>;
  playerEloMap: Record<string, number>;
  handleUpdatePlayerElo: (playerId: string, targetElo: number) => void;
  newPlayerGroupIds: string[];
  toggleNewPlayerGroup: (groupId: string) => void;
  handleAdd: (event: React.FormEvent) => void;
  players: Player[];
  updatePlayer: (id: string, updates: Partial<Player>) => void;
  deletePlayer: (id: string) => void;
  togglePlayerGroup: (playerId: string, groupId: string) => void;
  deletingGroup: PlayerGroup | null;
  setDeletingGroup: React.Dispatch<React.SetStateAction<PlayerGroup | null>>;
  handleDeleteGroupClick: (group: PlayerGroup) => void;
  confirmDeleteGroup: () => void;
  deletingGroupStats: { playersCount: number; matchesCount: number; sessionCostsCount: number };
  deletingPlayer: Player | null;
  setDeletingPlayer: React.Dispatch<React.SetStateAction<Player | null>>;
  handleDeletePlayerClick: (player: Player) => void;
  confirmDeletePlayer: () => void;
  deletingPlayerStats: { matchesCount: number; sessionCostsCount: number };
}

function SystemSettingsCard({ model }: { model: PlayerManagementViewModel }) {
  const { config, setConfig, runAdminAction, isLight } = model;
  return (
    <Card className={isLight ? 'bg-white border-slate-200/90 shadow-sm' : 'bg-slate-900 border-white/10'}>
      <CardHeader className="text-left pb-2.5">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className={`w-4 h-4 ${isLight ? 'text-teal-600' : 'text-teal-400'}`} />
          <CardTitle className={`text-sm xs:text-base sm:text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
            CÀI ĐẶT HỆ THỐNG
          </CardTitle>
        </div>
        <CardDescription className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
          Quy tắc xếp hạng
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className={`flex items-center justify-between gap-3 p-3 rounded-xl ${
          isLight ? 'bg-slate-50/70' : 'bg-white/[0.03]'
        }`}>
          <div className="space-y-0.5 min-w-0 pr-2">
            <label className={`text-xs sm:text-sm font-semibold block ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
              Số trận tối thiểu vào BXH
            </label>
            <p className={`text-[11px] sm:text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Điều kiện hiển thị trên bảng chính
            </p>
          </div>
          <div className="flex-shrink-0">
            <div className={`flex items-center justify-between rounded-lg p-0.5 w-24 sm:w-28 h-8 border ${
              isLight ? 'bg-white border-slate-200 shadow-2xs' : 'bg-slate-950 border-white/10'
            }`}>
              <button
                type="button"
                onClick={() => runAdminAction(() => setConfig({ minMatchesForMainBoard: Math.max(1, config.minMatchesForMainBoard - 1) }))}
                className={`w-6 h-6 rounded flex items-center justify-center transition-colors cursor-pointer ${
                  isLight
                    ? 'hover:bg-slate-100 active:bg-slate-200 text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed'
                    : 'hover:bg-white/5 active:bg-white/10 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed'
                }`}
                disabled={config.minMatchesForMainBoard <= 1}
              >
                <Minus className="w-3 h-3" />
              </button>
              
              <input
                type="number"
                className={`w-8 sm:w-10 text-center font-bold bg-transparent border-0 focus:outline-none focus:ring-0 text-xs sm:text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}
                min="1"
                value={config.minMatchesForMainBoard}
                onChange={e => runAdminAction(() => setConfig({ minMatchesForMainBoard: Math.max(1, parseInt(e.target.value) || 1) }))}
              />
              
              <button
                type="button"
                onClick={() => runAdminAction(() => setConfig({ minMatchesForMainBoard: config.minMatchesForMainBoard + 1 }))}
                className={`w-6 h-6 rounded flex items-center justify-center transition-colors cursor-pointer ${
                  isLight
                    ? 'hover:bg-slate-100 active:bg-slate-200 text-slate-600 hover:text-slate-900'
                    : 'hover:bg-white/5 active:bg-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function GroupManager({ model }: { model: PlayerManagementViewModel }) {
  const {
    isLight, runAdminAction, activeGroups, groups,
    newGroupName, setNewGroupName, handleAddGroup,
    updateGroup, archiveGroup, handleDeleteGroupClick,
  } = model;

  // Compute CSS classes locally based on isLight
  const groupPanelClass = isLight
    ? 'border-slate-200/70 bg-white/70 shadow-sm'
    : 'border-white/10 bg-slate-950/30 shadow-black/20';
  const groupHeaderClass = isLight ? 'border-slate-200/70 text-slate-700' : 'border-white/10 text-slate-200';
  const groupBadgeClass = isLight
    ? 'border-slate-200 bg-slate-50 text-slate-500'
    : 'border-white/10 bg-slate-950/40 text-slate-400';
  const groupFormClass = isLight
    ? 'border-slate-200 bg-slate-50/90'
    : 'border-white/10 bg-slate-950/30';
  const groupInputClass = isLight
    ? 'border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus-visible:border-teal-500 focus-visible:ring-teal-500/20'
    : 'border-white/10 bg-slate-950/40 text-slate-100 placeholder:text-slate-500 focus-visible:border-teal-500 focus-visible:ring-teal-500/20';
  const groupRowActiveClass = isLight
    ? 'border-slate-200 bg-white'
    : 'border-white/10 bg-slate-950/40';
  const groupRowInactiveClass = isLight
    ? 'border-slate-200 bg-slate-50 opacity-80'
    : 'border-white/10 bg-slate-950/20 opacity-70';
  const groupRowInputClass = isLight
    ? 'border-transparent bg-transparent text-slate-800 placeholder:text-slate-400 focus-visible:ring-teal-500/20'
    : 'border-transparent bg-transparent text-slate-100 placeholder:text-slate-500 focus-visible:ring-teal-500/20';

  return (
    <div className={`mb-5 overflow-hidden rounded-xl border backdrop-blur-sm ${groupPanelClass}`}>
      <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b px-4 py-3 ${groupHeaderClass}`}>
        <div className="flex items-center justify-center sm:justify-start gap-2 text-sm font-bold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-teal-500/20 bg-teal-500/10">
            <Layers3 className="w-4 h-4 text-teal-400" />
          </span>
          <span>Nhóm người chơi</span>
        </div>
        <span className={`mx-auto sm:mx-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${groupBadgeClass}`}>
          {activeGroups.length} nhóm đang dùng
        </span>
      </div>

      <div className="space-y-3 p-4">
        <form onSubmit={handleAddGroup} className={`grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 rounded-xl border p-2 ${groupFormClass}`}>
          <Input
            placeholder="Tên nhóm mới..."
            value={newGroupName}
            onChange={e => setNewGroupName(e.target.value)}
            className={`h-10 text-sm ${groupInputClass}`}
          />
          <Button type="submit" className="h-10 px-4 text-xs font-bold bg-teal-500 hover:bg-teal-600 text-white-force cursor-pointer">
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Thêm nhóm
          </Button>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {groups.map(group => (
            <div key={group.id} className={`flex min-h-11 items-center gap-2 rounded-xl border px-2.5 py-2 ${
              group.isActive ? groupRowActiveClass : groupRowInactiveClass
            }`}>
              <Input
                value={group.name}
                onChange={e => runAdminAction(() => updateGroup(group.id, { name: e.target.value }))}
                className={`h-8 flex-1 px-2 text-sm font-semibold ${groupRowInputClass}`}
              />
              {group.isActive ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => runAdminAction(() => archiveGroup(group.id))}
                  className={`h-8 px-2 text-xs cursor-pointer ${isLight ? 'text-rose-500 hover:text-rose-600 hover:bg-rose-500/10' : 'text-rose-400 hover:text-rose-300 hover:bg-rose-500/10'}`}
                  disabled={activeGroups.length <= 1}
                  title="Ẩn nhóm khỏi thanh chọn"
                >
                  Ẩn
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => runAdminAction(() => updateGroup(group.id, { isActive: true }))}
                  className={`h-8 px-2 text-xs cursor-pointer ${isLight ? 'text-teal-600 hover:text-teal-700 hover:bg-teal-500/10' : 'text-teal-400 hover:text-teal-300 hover:bg-teal-500/10'}`}
                  title="Hiện lại nhóm"
                >
                  Hiện
                </Button>
              )}
              {group.id !== DEFAULT_GROUP_ID && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteGroupClick(group)}
                  className={`h-8 px-2 text-xs cursor-pointer ${isLight ? 'text-rose-500 hover:text-rose-600 hover:bg-rose-500/10' : 'text-rose-400 hover:text-rose-300 hover:bg-rose-500/10'}`}
                  title="Xóa nhóm"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AddPlayerForm({ model }: { model: PlayerManagementViewModel }) {
  const {
    isLight, activeGroups, newName, setNewName, newGender, setNewGender,
    newElo, setNewElo, newPlayerGroupIds, toggleNewPlayerGroup, handleAdd,
  } = model;

  // Compute CSS classes locally based on isLight
  const playerPanelClass = isLight
    ? 'border-slate-200/70 bg-white/70 shadow-sm'
    : 'border-white/10 bg-slate-950/30 shadow-black/20';
  const playerTitleClass = isLight ? 'text-slate-700' : 'text-slate-200';
  const playerInputClass = isLight
    ? 'border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:border-teal-500'
    : 'border-white/10 bg-slate-950/40 text-slate-100 placeholder:text-slate-500 focus:border-teal-500';
  const playerSelectClass = isLight
    ? 'border-slate-200 bg-white text-slate-700 focus:border-teal-500'
    : 'border-white/10 bg-slate-950/40 text-slate-200 focus:border-teal-500';
  const groupChipClass = isLight
    ? 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'
    : 'bg-slate-950/35 border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200';
  const groupChipActiveClass = isLight
    ? 'bg-teal-500/15 border-teal-500/30 text-teal-700'
    : 'bg-teal-500/15 border-teal-500/30 text-teal-300';

  return (
    <form onSubmit={handleAdd} className={`mb-6 rounded-xl border p-4 space-y-4 backdrop-blur-sm ${playerPanelClass}`}>
      <div className={`flex items-center gap-2 text-sm font-bold ${playerTitleClass}`}>
        <UserPlus className="w-4 h-4 text-teal-400" />
        <span>Thêm người chơi</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_130px_100px] gap-3 items-center">
        <Input
          placeholder="Tên người chơi mới..."
          value={newName}
          onChange={e => setNewName(e.target.value)}
          className={`w-full h-11 text-left ${playerInputClass}`}
        />
        <select
          value={newGender}
          onChange={e => setNewGender(e.target.value as 'male' | 'female')}
          className={`h-11 w-full rounded-lg border px-3 text-xs font-medium cursor-pointer focus:outline-none ${playerSelectClass}`}
        >
          <option value="male">Nam ♂</option>
          <option value="female">Nữ ♀</option>
        </select>
        <Button type="submit" className="h-11 px-4 font-bold bg-teal-500 hover:bg-teal-600 text-white-force cursor-pointer">
          <Plus className="w-4 h-4 mr-1.5" />
          Thêm
        </Button>
      </div>

      {/* Thanh trượt ngang điều chỉnh Elo khởi điểm */}
      <div className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-white/5 border-white/5'
      }`}>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
            Elo khởi điểm:
          </span>
          <span className="font-mono font-black text-sm px-2.5 py-0.5 rounded-lg bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30 tabular-nums">
            {newElo}
          </span>
        </div>

        <div className="flex-1 flex items-center gap-2.5 max-w-lg">
          <span className="text-[10px] font-bold text-slate-400 shrink-0">800</span>
          <input
            type="range"
            min={800}
            max={2500}
            step={10}
            value={newElo}
            onChange={e => setNewElo(e.target.value)}
            className="w-full accent-teal-500 h-2 bg-slate-200 dark:bg-white/15 rounded-lg cursor-pointer"
          />
          <span className="text-[10px] font-bold text-slate-400 shrink-0">2500</span>
        </div>

        {/* Mốc Elo chọn nhanh */}
        <div className="flex items-center gap-1.5 shrink-0">
          {[1300, 1500, 1700, 1900].map(val => (
            <button
              key={val}
              type="button"
              onClick={() => setNewElo(val.toString())}
              className={`text-[10px] px-2 py-1 rounded-md font-bold transition-all cursor-pointer border ${
                parseInt(newElo, 10) === val
                  ? 'bg-teal-500 text-white border-teal-500 shadow-xs'
                  : isLight
                  ? 'bg-white border-slate-200 text-slate-600 hover:border-teal-400 hover:text-teal-700'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              {val}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-2 sm:items-start">
        <span className={`text-xs font-bold uppercase tracking-wider pt-1.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
          Thuộc nhóm
        </span>
        <div className="flex flex-wrap gap-2">
          {activeGroups.map(group => {
            const isChecked = newPlayerGroupIds.includes(group.id);
            return (
              <button
                key={group.id}
                type="button"
                onClick={() => toggleNewPlayerGroup(group.id)}
                className={`text-[11px] px-2.5 py-1.5 rounded-full border font-bold transition-all cursor-pointer ${
                  isChecked ? groupChipActiveClass : groupChipClass
                }`}
              >
                {isChecked ? '✓ ' : ''}{group.name}
              </button>
            );
          })}
        </div>
      </div>
    </form>
  );
}

interface ColumnVisibility {
  gender: boolean;
  elo: boolean;
  group: boolean;
  status: boolean;
}

const COLUMN_STORAGE_KEY = 'badminton_player_columns_v2';

function PlayerEloSliderCell({
  player,
  currentElo,
  onUpdateElo,
  isLight,
}: {
  player: Player;
  currentElo: number;
  onUpdateElo: (playerId: string, val: number) => void;
  isLight: boolean;
}) {
  const [val, setVal] = React.useState(currentElo);

  React.useEffect(() => {
    setVal(currentElo);
  }, [currentElo]);

  const commitValue = (newVal: number) => {
    const clamped = Math.max(800, Math.min(2500, newVal));
    if (clamped !== currentElo) {
      onUpdateElo(player.id, clamped);
    }
  };

  return (
    <div className="flex items-center justify-center gap-1.5 w-full max-w-[190px] mx-auto py-0.5">
      {/* Nút giảm 10 */}
      <button
        type="button"
        onClick={() => {
          const next = Math.max(800, val - 10);
          setVal(next);
          commitValue(next);
        }}
        className={`w-5 h-5 rounded flex items-center justify-center text-[11px] font-black border transition-all cursor-pointer active:scale-90 shrink-0 ${
          isLight
            ? 'bg-white border-slate-200 text-slate-600 hover:border-teal-400 hover:text-teal-700 hover:bg-teal-50/50 shadow-2xs'
            : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-teal-300'
        }`}
        title="Giảm 10 Elo"
      >
        -
      </button>

      {/* Thanh trượt ngang */}
      <input
        type="range"
        min={800}
        max={2500}
        step={10}
        value={val}
        onChange={e => setVal(parseInt(e.target.value, 10))}
        onMouseUp={e => commitValue(parseInt((e.target as HTMLInputElement).value, 10))}
        onTouchEnd={e => commitValue(parseInt((e.target as HTMLInputElement).value, 10))}
        onKeyUp={e => {
          if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            commitValue(parseInt((e.target as HTMLInputElement).value, 10));
          }
        }}
        className="flex-1 min-w-[65px] h-1.5 bg-slate-200 dark:bg-white/15 rounded-lg appearance-none cursor-pointer accent-teal-500"
        title={`Kéo thanh trượt để chỉnh Elo: ${val}`}
      />

      {/* Nút tăng 10 */}
      <button
        type="button"
        onClick={() => {
          const next = Math.min(2500, val + 10);
          setVal(next);
          commitValue(next);
        }}
        className={`w-5 h-5 rounded flex items-center justify-center text-[11px] font-black border transition-all cursor-pointer active:scale-90 shrink-0 ${
          isLight
            ? 'bg-white border-slate-200 text-slate-600 hover:border-teal-400 hover:text-teal-700 hover:bg-teal-50/50 shadow-2xs'
            : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-teal-300'
        }`}
        title="Tăng 10 Elo"
      >
        +
      </button>

      {/* Điểm số Elo hiển thị */}
      <span
        className={`w-12 text-center font-mono font-black text-xs px-1 py-0.5 rounded-md border tabular-nums shrink-0 ${
          isLight
            ? 'bg-teal-50 border-teal-200 text-teal-800 shadow-2xs'
            : 'bg-teal-500/10 border-teal-500/25 text-teal-300'
        }`}
      >
        {val}
      </span>
    </div>
  );
}

function PlayerTable({ model }: { model: PlayerManagementViewModel }) {
  const { runAdminAction, activeGroups, players, updatePlayer, togglePlayerGroup, handleDeletePlayerClick, isLight } = model;
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isColumnMenuOpen, setIsColumnMenuOpen] = React.useState(false);
  const columnDropdownRef = React.useRef<HTMLDivElement>(null);

  const [visibleColumns, setVisibleColumns] = React.useState<ColumnVisibility>(() => {
    try {
      const saved = localStorage.getItem(COLUMN_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      gender: true,
      elo: true,
      group: false, // Ẩn mặc định để thu gọn bảng
      status: false, // Ẩn mặc định để thu gọn bảng
    };
  });

  // Đóng dropdown khi bấm ra ngoài
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (columnDropdownRef.current && !columnDropdownRef.current.contains(event.target as Node)) {
        setIsColumnMenuOpen(false);
      }
    }
    if (isColumnMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isColumnMenuOpen]);

  const toggleColumn = (key: keyof ColumnVisibility) => {
    setVisibleColumns(prev => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const applyPreset = (preset: 'compact' | 'all') => {
    const next: ColumnVisibility = preset === 'compact'
      ? { gender: true, elo: true, group: false, status: false }
      : { gender: true, elo: true, group: true, status: true };
    setVisibleColumns(next);
    try {
      localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(next));
    } catch {}
  };

  const activeColumnCount = Object.values(visibleColumns).filter(Boolean).length;

  const filteredPlayers = React.useMemo(() => {
    if (!searchQuery.trim()) return players;
    const q = searchQuery.toLowerCase().trim();
    return players.filter(p => p.name.toLowerCase().includes(q));
  }, [players, searchQuery]);

  return (
    <div className="space-y-2">
      {/* Thanh bộ lọc & tùy chọn hiển thị cột - Thiết kế 1 hàng liền mạch, không vỡ layout */}
      <div className={`p-2 sm:p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
        isLight ? 'bg-slate-50/80 border-slate-200/80 shadow-2xs' : 'bg-slate-900/60 border-white/10'
      }`}>
        {/* Tìm kiếm người chơi */}
        <div className="relative flex-1 min-w-0">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Tìm theo tên..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className={`h-8 pl-8 pr-7 text-xs rounded-lg w-full transition-all ${
              isLight
                ? 'bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus-visible:border-teal-500 focus-visible:ring-teal-500/20 shadow-2xs'
                : 'bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus-visible:border-teal-500'
            }`}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              title="Xóa tìm kiếm"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Desktop: Hiển thị các nút chip trực tiếp trên 1 hàng duy nhất */}
        <div className="hidden sm:flex items-center gap-1.5 shrink-0">
          <span className={`text-[11px] font-bold uppercase tracking-wider mr-0.5 flex items-center gap-1 ${
            isLight ? 'text-slate-500' : 'text-slate-400'
          }`}>
            <SlidersHorizontal className="w-3 h-3 text-teal-500" />
            Cột:
          </span>

          {[
            { key: 'gender', label: 'Giới tính' },
            { key: 'elo', label: 'Elo' },
            { key: 'group', label: 'Nhóm' },
            { key: 'status', label: 'Trạng thái' },
          ].map(col => {
            const isVisible = visibleColumns[col.key as keyof ColumnVisibility];
            return (
              <button
                key={col.key}
                type="button"
                onClick={() => toggleColumn(col.key as keyof ColumnVisibility)}
                className={`text-[11px] px-2.5 py-1 rounded-lg border font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95 ${
                  isVisible
                    ? isLight
                      ? 'bg-teal-50 border-teal-300 text-teal-800 shadow-2xs font-black'
                      : 'bg-teal-500/20 border-teal-500/40 text-teal-300 font-black'
                    : isLight
                    ? 'bg-white border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200'
                }`}
                title={isVisible ? `Bấm để ẩn cột ${col.label}` : `Bấm để hiện cột ${col.label}`}
              >
                <span>{isVisible ? '✓' : '+'}</span>
                <span>{col.label}</span>
              </button>
            );
          })}
        </div>

        {/* Mobile: Nút dropdown gọn gàng kèm Popover menu */}
        <div className="relative sm:hidden shrink-0" ref={columnDropdownRef}>
          <button
            type="button"
            onClick={() => setIsColumnMenuOpen(prev => !prev)}
            className={`h-8 px-2.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
              isLight
                ? isColumnMenuOpen
                  ? 'bg-teal-50 border-teal-400 text-teal-800'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                : isColumnMenuOpen
                ? 'bg-teal-500/20 border-teal-500 text-teal-300'
                : 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/10'
            }`}
            title="Tùy chọn cột hiển thị"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-teal-500" />
            <span>Cột</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-teal-500/15 text-teal-600 dark:text-teal-400">
              {activeColumnCount}/4
            </span>
            <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isColumnMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Menu Dropdown trên mobile */}
          {isColumnMenuOpen && (
            <div className={`absolute right-0 top-full mt-1.5 z-40 w-52 p-2 rounded-xl border shadow-xl animate-in fade-in zoom-in-95 duration-150 ${
              isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-white/15 text-slate-100'
            }`}>
              <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Cột hiển thị</span>
                <span className="text-teal-500 font-mono">{activeColumnCount}/4</span>
              </div>

              <div className="space-y-0.5 my-1">
                {[
                  { key: 'gender', label: 'Giới tính' },
                  { key: 'elo', label: 'Elo (Thanh trượt)' },
                  { key: 'group', label: 'Nhóm' },
                  { key: 'status', label: 'Trạng thái' },
                ].map(col => {
                  const isChecked = visibleColumns[col.key as keyof ColumnVisibility];
                  return (
                    <button
                      key={col.key}
                      type="button"
                      onClick={() => toggleColumn(col.key as keyof ColumnVisibility)}
                      className={`w-full px-2.5 py-2 rounded-lg flex items-center justify-between text-xs transition-colors cursor-pointer text-left ${
                        isChecked
                          ? isLight ? 'bg-teal-50 text-teal-900 font-bold' : 'bg-teal-500/15 text-teal-200 font-bold'
                          : isLight ? 'hover:bg-slate-50 text-slate-600' : 'hover:bg-white/5 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] font-bold ${
                          isChecked
                            ? 'bg-teal-500 border-teal-500 text-white'
                            : isLight ? 'border-slate-300 bg-white' : 'border-white/20 bg-transparent'
                        }`}>
                          {isChecked ? '✓' : ''}
                        </span>
                        <span>{col.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className={`pt-1.5 mt-1 border-t flex items-center justify-between gap-1 text-[11px] ${
                isLight ? 'border-slate-100' : 'border-white/10'
              }`}>
                <button
                  type="button"
                  onClick={() => applyPreset('compact')}
                  className="px-2 py-1 text-slate-500 hover:text-teal-600 font-semibold rounded cursor-pointer"
                >
                  Mặc định
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('all')}
                  className="px-2 py-1 text-teal-600 font-bold rounded cursor-pointer"
                >
                  Hiện tất cả
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bảng dữ liệu người chơi thu gọn */}
      <div className="overflow-x-auto rounded-xl border border-transparent">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[140px] whitespace-nowrap">Tên</TableHead>
              {visibleColumns.gender && (
                <TableHead className="w-20 text-center whitespace-nowrap">Giới tính</TableHead>
              )}
              {visibleColumns.elo && (
                <TableHead className="w-48 text-center whitespace-nowrap">Elo (Thanh trượt)</TableHead>
              )}
              {visibleColumns.group && (
                <TableHead className="min-w-[160px] whitespace-nowrap">Nhóm</TableHead>
              )}
              {visibleColumns.status && (
                <TableHead className="w-24 text-center whitespace-nowrap">Trạng Thái</TableHead>
              )}
              <TableHead className="w-24 text-center whitespace-nowrap">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPlayers.map(p => (
              <TableRow key={p.id} className={!p.isActive ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
                {/* Cột Tên (có kèm chỉ báo trạng thái & icon giới tính nếu cột tương ứng bị ẩn) */}
                <TableCell className="min-w-[140px] whitespace-nowrap py-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        p.isActive ? 'bg-emerald-500' : 'bg-slate-400'
                      }`}
                      title={p.isActive ? 'Đang chơi' : 'Đã nghỉ'}
                    />
                    {!visibleColumns.gender && (
                      <span
                        className={`text-xs font-bold shrink-0 ${
                          (p.gender || 'male') === 'female' ? 'text-pink-500' : 'text-sky-500'
                        }`}
                        title={p.gender === 'female' ? 'Nữ' : 'Nam'}
                      >
                        {p.gender === 'female' ? '♀' : '♂'}
                      </span>
                    )}
                    <Input 
                      value={p.name} 
                      onChange={e => runAdminAction(() => updatePlayer(p.id, { name: e.target.value }))}
                      className={`border-transparent hover:border-slate-300 dark:hover:border-white/10 focus:border-teal-500 h-8 bg-transparent px-2 ${
                        isLight ? 'text-slate-900' : 'text-slate-100'
                      }`}
                    />
                  </div>
                </TableCell>

                {/* Cột Giới tính (Tùy chọn) */}
                {visibleColumns.gender && (
                  <TableCell className="text-center whitespace-nowrap py-2">
                    <button
                      type="button"
                      onClick={() => runAdminAction(() => updatePlayer(p.id, { gender: (p.gender || 'male') === 'female' ? 'male' : 'female' }))}
                      className={`inline-flex items-center justify-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-bold border transition-all duration-200 cursor-pointer shadow-sm ${
                        (p.gender || 'male') === 'female' 
                          ? 'bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 border-pink-500/20' 
                          : 'bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border-sky-500/20'
                      }`}
                    >
                      {(p.gender || 'male') === 'female' ? (
                        <>
                          <span>Nữ</span>
                          <Venus className="w-3.5 h-3.5 stroke-[2.5]" />
                        </>
                      ) : (
                        <>
                          <span>Nam</span>
                          <Mars className="w-3.5 h-3.5 stroke-[2.5]" />
                        </>
                      )}
                    </button>
                  </TableCell>
                )}

                {/* Cột Elo (Tùy chọn) */}
                {visibleColumns.elo && (
                  <TableCell className="text-center whitespace-nowrap py-2">
                    <PlayerEloSliderCell
                      player={p}
                      currentElo={model.playerEloMap[p.id] ?? (p.initialRating ?? 1500)}
                      onUpdateElo={(playerId, val) => runAdminAction(() => model.handleUpdatePlayerElo(playerId, val))}
                      isLight={isLight}
                    />
                  </TableCell>
                )}

                {/* Cột Nhóm (Tùy chọn, ẩn mặc định) */}
                {visibleColumns.group && (
                  <TableCell className="py-2">
                    <div className="flex flex-wrap gap-1.5 min-w-[160px]">
                      {activeGroups.map(group => {
                        const isChecked = (p.groupIds || []).includes(group.id);
                        return (
                          <button
                            key={group.id}
                            type="button"
                            onClick={() => togglePlayerGroup(p.id, group.id)}
                            className={`text-[10px] px-2 py-1 rounded-full border font-bold transition-all cursor-pointer ${
                              isChecked
                                ? 'bg-teal-500/15 border-teal-500/30 text-teal-300'
                                : 'bg-white/5 border-white/10 text-slate-500 hover:text-slate-300'
                            }`}
                          >
                            {isChecked ? '✓ ' : ''}{group.name}
                          </button>
                        );
                      })}
                    </div>
                  </TableCell>
                )}

                {/* Cột Trạng thái (Tùy chọn, ẩn mặc định) */}
                {visibleColumns.status && (
                  <TableCell className="text-center whitespace-nowrap py-2">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border whitespace-nowrap ${
                      p.isActive 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : 'bg-slate-500/10 text-slate-400 border-slate-500/10'
                    }`}>
                      {p.isActive ? 'Đang chơi' : 'Đã nghỉ'}
                    </span>
                  </TableCell>
                )}

                {/* Cột Hành động */}
                <TableCell className="text-center whitespace-nowrap py-2">
                  <div className="flex items-center justify-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => runAdminAction(() => updatePlayer(p.id, { isActive: !p.isActive }))}
                      className="text-xs text-teal-400 hover:text-teal-300 hover:bg-teal-500/10 whitespace-nowrap h-8 px-2 cursor-pointer"
                    >
                      {p.isActive ? 'Ẩn' : 'Hiện'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeletePlayerClick(p)}
                      className={`h-8 px-2 text-xs cursor-pointer ${
                        isLight ? 'text-rose-500 hover:text-rose-600 hover:bg-rose-500/10' : 'text-rose-400 hover:text-rose-300 hover:bg-rose-500/10'
                      }`}
                      title="Xóa người chơi"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredPlayers.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-xs text-slate-400">
                  Không tìm thấy người chơi nào phù hợp với "{searchQuery}"
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function DeleteGroupModal({ model }: { model: PlayerManagementViewModel }) {
  const { deletingGroup, setDeletingGroup, confirmDeleteGroup, deletingGroupStats, isLight } = model;
  if (!deletingGroup || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`border rounded-2xl p-5 sm:p-6 max-w-sm sm:max-w-md w-full shadow-2xl space-y-4 ${
        isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-white/10 text-slate-100'
      }`}>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Xóa nhóm "{deletingGroup.name}"
            </h3>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Hành động này sẽ xóa vĩnh viễn nhóm
            </p>
          </div>
        </div>

        <div className={`p-3 rounded-xl border text-xs space-y-1.5 ${
          isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-950/50 border-white/5 text-slate-300'
        }`}>
          <p className="font-semibold text-rose-500">Lưu ý khi xóa nhóm:</p>
          <ul className="list-disc list-inside space-y-1 pl-1">
            <li>
              <span>Có <strong>{deletingGroupStats.playersCount}</strong> người chơi thuộc nhóm này.</span>
              <span className="block text-[11px] opacity-80 pl-4">Họ sẽ được giữ lại (nếu không còn nhóm nào sẽ chuyển về nhóm mặc định).</span>
            </li>
            {deletingGroupStats.matchesCount > 0 && (
              <li className="text-rose-500 font-medium">
                Sẽ xóa <strong>{deletingGroupStats.matchesCount}</strong> trận đấu thuộc nhóm này.
              </li>
            )}
            {deletingGroupStats.sessionCostsCount > 0 && (
              <li className="text-rose-500 font-medium">
                Sẽ xóa <strong>{deletingGroupStats.sessionCostsCount}</strong> buổi thu chi thuộc nhóm này.
              </li>
            )}
          </ul>
        </div>

        <div className="flex gap-2 sm:gap-3 pt-2">
          <Button
            type="button"
            onClick={confirmDeleteGroup}
            className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-semibold cursor-pointer h-9 text-xs sm:text-sm"
          >
            Xóa vĩnh viễn
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setDeletingGroup(null)}
            className={`flex-1 cursor-pointer h-9 text-xs sm:text-sm ${
              isLight
                ? 'border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                : 'text-slate-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            Hủy
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function DeletePlayerModal({ model }: { model: PlayerManagementViewModel }) {
  const { deletingPlayer, setDeletingPlayer, confirmDeletePlayer, deletingPlayerStats, isLight } = model;
  if (!deletingPlayer || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`border rounded-2xl p-5 sm:p-6 max-w-sm sm:max-w-md w-full shadow-2xl space-y-4 ${
        isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-white/10 text-slate-100'
      }`}>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Xóa người chơi "{deletingPlayer.name}"
            </h3>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Hành động này sẽ xóa vĩnh viễn người chơi
            </p>
          </div>
        </div>

        <div className={`p-3 rounded-xl border text-xs space-y-1.5 ${
          isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-950/50 border-white/5 text-slate-300'
        }`}>
          <p className="font-semibold text-rose-500">Lưu ý khi xóa người chơi:</p>
          <ul className="list-disc list-inside space-y-1 pl-1">
            {deletingPlayerStats.matchesCount > 0 ? (
              <li className="text-rose-500 font-medium">
                Sẽ xóa <strong>{deletingPlayerStats.matchesCount}</strong> trận đấu có người chơi này tham gia.
              </li>
            ) : (
              <li className="text-emerald-500 font-medium">Chưa tham gia trận đấu nào (an toàn để xóa).</li>
            )}
            {deletingPlayerStats.sessionCostsCount > 0 && (
              <li className="text-rose-500 font-medium">
                Sẽ xóa tên người chơi khỏi <strong>{deletingPlayerStats.sessionCostsCount}</strong> buổi thu chi liên quan.
              </li>
            )}
          </ul>
        </div>

        <div className="flex gap-2 sm:gap-3 pt-2">
          <Button
            type="button"
            onClick={confirmDeletePlayer}
            className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-semibold cursor-pointer h-9 text-xs sm:text-sm"
          >
            Xóa vĩnh viễn
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setDeletingPlayer(null)}
            className={`flex-1 cursor-pointer h-9 text-xs sm:text-sm ${
              isLight
                ? 'border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                : 'text-slate-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            Hủy
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function PlayerManagementView({ model }: { model: PlayerManagementViewModel }) {
  const { notification } = model;

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

      <SystemSettingsCard model={model} />

      <Card>
        <CardHeader className="text-center sm:text-left">
          <CardTitle className="text-sm xs:text-base sm:text-lg font-bold text-white whitespace-nowrap">QUẢN LÝ NGƯỜI CHƠI</CardTitle>
        </CardHeader>
        <CardContent>
          <GroupManager model={model} />

          <AddPlayerForm model={model} />

          <PlayerTable model={model} />
        </CardContent>
      </Card>

      <DeleteGroupModal model={model} />
      <DeletePlayerModal model={model} />
    </div>
  );
}
