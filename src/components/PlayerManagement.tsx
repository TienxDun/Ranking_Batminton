import React, { useState } from 'react';
import { useStore } from '../store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { CheckCircle2, AlertCircle, Minus, Plus, Venus, Mars, Layers3, UserPlus } from 'lucide-react';
import { requireAdminPassword } from '../utils/adminAuth';

export default function PlayerManagement() {
  const {
    players,
    groups,
    selectedGroupId,
    theme,
    config,
    addGroup,
    updateGroup,
    archiveGroup,
    addPlayer,
    updatePlayer,
    setConfig,
  } = useStore();
  const [newName, setNewName] = useState('');
  const [newGender, setNewGender] = useState<'male' | 'female'>('male');
  const [newGroupName, setNewGroupName] = useState('');
  const [newPlayerGroupIds, setNewPlayerGroupIds] = useState<string[]>([selectedGroupId]);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const activeGroups = groups.filter(group => group.isActive);
  const isLight = theme === 'light';

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

  const showNotification = (type: 'success' | 'error', text: string) => {
    setNotification({ type, text });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      const groupIds = newPlayerGroupIds.length > 0 ? newPlayerGroupIds : [selectedGroupId];
      addPlayer(newName.trim(), newGender, groupIds);
      setNewName('');
      setNewGender('male');
      setNewPlayerGroupIds([selectedGroupId]);
      showNotification('success', `Đã thêm thành viên mới: ${newName.trim()} (${newGender === 'male' ? 'Nam' : 'Nữ'})`);
    }
  };

  const handleAddGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    runAdminAction(() => {
      addGroup(newGroupName);
      setNewGroupName('');
      showNotification('success', `Đã thêm nhóm: ${newGroupName.trim()}`);
    });
  };

  const toggleNewPlayerGroup = (groupId: string) => {
    setNewPlayerGroupIds(prev =>
      prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
    );
  };

  const togglePlayerGroup = (playerId: string, groupId: string) => {
    const player = players.find(item => item.id === playerId);
    if (!player) return;
    const currentGroupIds = player.groupIds || [];
    const nextGroupIds = currentGroupIds.includes(groupId)
      ? currentGroupIds.filter(id => id !== groupId)
      : [...currentGroupIds, groupId];
    if (nextGroupIds.length === 0) {
      showNotification('error', 'Mỗi người chơi cần thuộc ít nhất một nhóm.');
      return;
    }
    runAdminAction(() => updatePlayer(playerId, { groupIds: nextGroupIds }));
  };

  const ensureAdmin = () => {
    if (adminUnlocked) return true;
    if (!requireAdminPassword()) return false;
    setAdminUnlocked(true);
    return true;
  };

  const runAdminAction = (action: () => void) => {
    if (!ensureAdmin()) return;
    action();
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

      <Card>
        <CardHeader className="text-center sm:text-left">
          <CardTitle className="text-sm xs:text-base sm:text-lg font-bold text-white whitespace-nowrap">CÀI ĐẶT HỆ THỐNG</CardTitle>
          <CardDescription>Cấu hình chung</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white/5 border border-white/5 rounded-xl text-center sm:text-left">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-200 block">Số trận tối thiểu để vào Bảng Xếp Hạng Chính:</label>
              <p className="text-xs text-slate-400">Yêu cầu tối thiểu để người chơi hiển thị trên bảng chính</p>
            </div>
            <div className="flex justify-center w-full sm:w-auto">
              <div className="flex items-center justify-between bg-slate-950 border border-white/10 rounded-xl p-1 w-32 h-9">
                <button
                  type="button"
                  onClick={() => runAdminAction(() => setConfig({ minMatchesForMainBoard: Math.max(1, config.minMatchesForMainBoard - 1) }))}
                  className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/5 active:bg-white/10 transition-colors text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  disabled={config.minMatchesForMainBoard <= 1}
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                
                <input
                  type="number"
                  className="w-12 text-center font-bold bg-transparent border-0 text-white focus:outline-none focus:ring-0 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  min="1"
                  value={config.minMatchesForMainBoard}
                  onChange={e => runAdminAction(() => setConfig({ minMatchesForMainBoard: Math.max(1, parseInt(e.target.value) || 1) }))}
                />
                
                <button
                  type="button"
                  onClick={() => runAdminAction(() => setConfig({ minMatchesForMainBoard: config.minMatchesForMainBoard + 1 }))}
                  className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/5 active:bg-white/10 transition-colors text-slate-400 hover:text-white cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="text-center sm:text-left">
          <CardTitle className="text-sm xs:text-base sm:text-lg font-bold text-white whitespace-nowrap">QUẢN LÝ NGƯỜI CHƠI</CardTitle>
        </CardHeader>
        <CardContent>
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
                      >
                        Hiện
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <form onSubmit={handleAdd} className={`mb-6 rounded-xl border p-4 space-y-4 backdrop-blur-sm ${playerPanelClass}`}>
            <div className={`flex items-center gap-2 text-sm font-bold ${playerTitleClass}`}>
              <UserPlus className="w-4 h-4 text-teal-400" />
              <span>Thêm người chơi</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_132px_112px] gap-3">
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

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Tên</TableHead>
                <TableHead className="w-24 text-center whitespace-nowrap">Giới tính</TableHead>
                <TableHead className="min-w-[180px] whitespace-nowrap">Nhóm</TableHead>
                <TableHead className="w-28 text-center whitespace-nowrap hidden sm:table-cell">Trạng Thái</TableHead>
                <TableHead className="w-24 text-center whitespace-nowrap">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {players.map(p => (
                <TableRow key={p.id} className={!p.isActive ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
                  <TableCell className="whitespace-nowrap">
                    <Input 
                      value={p.name} 
                      onChange={e => runAdminAction(() => updatePlayer(p.id, { name: e.target.value }))}
                      className="border-transparent hover:border-white/10 focus:border-white/20 h-8 bg-transparent px-2 text-slate-100"
                    />
                  </TableCell>
                  <TableCell className="text-center whitespace-nowrap">
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
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5 min-w-[180px]">
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
                  <TableCell className="text-center whitespace-nowrap hidden sm:table-cell">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border whitespace-nowrap ${
                      p.isActive 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : 'bg-slate-500/10 text-slate-400 border-slate-500/10'
                    }`}>
                      {p.isActive ? 'Đang chơi' : 'Đã nghỉ'}
                    </span>
                  </TableCell>
                  <TableCell className="text-center whitespace-nowrap">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => runAdminAction(() => updatePlayer(p.id, { isActive: !p.isActive }))}
                      className="text-xs text-teal-400 hover:text-teal-300 hover:bg-teal-500/10 whitespace-nowrap"
                    >
                      {p.isActive ? 'Ẩn' : 'Hiện'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
