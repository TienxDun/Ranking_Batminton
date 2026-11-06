import React, { useState, useMemo } from 'react';
import { useStore } from '../../store';
import { requireAdminPassword } from '../../utils/adminAuth';
import { PlayerManagementView } from './PlayerManagementView';
import { DEFAULT_GROUP_ID } from '../../constants/groups';
import { Player, PlayerGroup } from '../../types';

export default function PlayerManagement() {
  const {
    players,
    groups,
    matches,
    sessionCosts,
    selectedGroupId,
    theme,
    config,
    addGroup,
    updateGroup,
    archiveGroup,
    deleteGroup,
    addPlayer,
    updatePlayer,
    deletePlayer,
    setConfig,
  } = useStore();
  const [newName, setNewName] = useState('');
  const [newGender, setNewGender] = useState<'male' | 'female'>('male');
  const [newGroupName, setNewGroupName] = useState('');
  const [newPlayerGroupIds, setNewPlayerGroupIds] = useState<string[]>([selectedGroupId]);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState<PlayerGroup | null>(null);
  const [deletingPlayer, setDeletingPlayer] = useState<Player | null>(null);
  
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

  const handleDeleteGroupClick = (group: PlayerGroup) => {
    if (group.id === DEFAULT_GROUP_ID) {
      showNotification('error', 'Không thể xóa nhóm mặc định.');
      return;
    }
    if (groups.length <= 1) {
      showNotification('error', 'Hệ thống cần ít nhất một nhóm hoạt động.');
      return;
    }
    runAdminAction(() => {
      setDeletingGroup(group);
    });
  };

  const handleConfirmDeleteGroup = () => {
    if (!deletingGroup) return;
    const groupName = deletingGroup.name;
    const groupId = deletingGroup.id;
    deleteGroup(groupId);
    setDeletingGroup(null);
    showNotification('success', `Đã xóa nhóm: ${groupName}`);
  };

  const deletingGroupStats = useMemo(() => {
    if (!deletingGroup) return { playersCount: 0, matchesCount: 0, sessionCostsCount: 0 };
    const pCount = players.filter(p => p.groupIds?.includes(deletingGroup.id)).length;
    const mCount = matches.filter(m => (m.groupId || DEFAULT_GROUP_ID) === deletingGroup.id).length;
    const sCount = sessionCosts.filter(s => (s.groupId || DEFAULT_GROUP_ID) === deletingGroup.id).length;
    return { playersCount: pCount, matchesCount: mCount, sessionCostsCount: sCount };
  }, [deletingGroup, players, matches, sessionCosts]);

  const handleDeletePlayerClick = (player: Player) => {
    runAdminAction(() => {
      setDeletingPlayer(player);
    });
  };

  const handleConfirmDeletePlayer = () => {
    if (!deletingPlayer) return;
    const playerName = deletingPlayer.name;
    const playerId = deletingPlayer.id;
    deletePlayer(playerId);
    setDeletingPlayer(null);
    showNotification('success', `Đã xóa người chơi: ${playerName}`);
  };

  const deletingPlayerStats = useMemo(() => {
    if (!deletingPlayer) return { matchesCount: 0, sessionCostsCount: 0 };
    const mCount = matches.filter(m => m.team1.includes(deletingPlayer.id) || m.team2.includes(deletingPlayer.id)).length;
    const sCount = sessionCosts.filter(s => s.participantIds?.includes(deletingPlayer.id)).length;
    return { matchesCount: mCount, sessionCostsCount: sCount };
  }, [deletingPlayer, matches, sessionCosts]);

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
      updateGroup, archiveGroup, deleteGroup, newName, setNewName, newGender, setNewGender,
      newPlayerGroupIds, toggleNewPlayerGroup, handleAdd, players, updatePlayer, deletePlayer,
      togglePlayerGroup, deletingGroup, setDeletingGroup, handleDeleteGroupClick,
      confirmDeleteGroup: handleConfirmDeleteGroup, deletingGroupStats,
      deletingPlayer, setDeletingPlayer, handleDeletePlayerClick,
      confirmDeletePlayer: handleConfirmDeletePlayer, deletingPlayerStats,
    }} />
  );
}
