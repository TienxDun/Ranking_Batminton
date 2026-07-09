import React, { useState } from 'react';
import { useStore } from '../../store';
import { requireAdminPassword } from '../../utils/adminAuth';
import { PlayerManagementView } from './PlayerManagementView';

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
      togglePlayerGroup,
    }} />
  );
}
