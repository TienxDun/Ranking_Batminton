import React, { useState } from 'react';
import { useStore } from '../store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { CheckCircle2, AlertCircle, Minus, Plus, Venus, Mars, Layers3, UserPlus } from 'lucide-react';
import { requireAdminPassword } from '../utils/adminAuth';
import { PlayerManagementView } from './player-management/PlayerManagementView';

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
    <PlayerManagementView model={{
      notification, isLight, config, setConfig, runAdminAction, activeGroups, groups,
      selectedGroupId, newGroupName, setNewGroupName, handleAddGroup,
      updateGroup, archiveGroup, newName, setNewName, newGender, setNewGender,
      newPlayerGroupIds, toggleNewPlayerGroup, handleAdd, players, updatePlayer,
      togglePlayerGroup, groupPanelClass, groupHeaderClass, groupBadgeClass,
      groupFormClass, groupInputClass, groupRowActiveClass, groupRowInactiveClass,
      groupRowInputClass, playerPanelClass, playerTitleClass, playerInputClass,
      playerSelectClass, groupChipClass, groupChipActiveClass,
    }} />
  );
}
