import { Match, Player, SessionCost } from '../types';
import { DEFAULT_GROUP_ID } from '../constants/groups';

export function isPlayerInGroup(player: Player, groupId: string): boolean {
  const groupIds = player.groupIds?.length ? player.groupIds : [DEFAULT_GROUP_ID];
  return groupIds.includes(groupId);
}

export function getGroupPlayers(players: Player[], groupId: string): Player[] {
  return players.filter(player => isPlayerInGroup(player, groupId));
}

export function getGroupMatches(matches: Match[], groupId: string): Match[] {
  return matches.filter(match => (match.groupId || DEFAULT_GROUP_ID) === groupId);
}

export function getGroupSessionCosts(sessionCosts: SessionCost[], groupId: string): SessionCost[] {
  return sessionCosts.filter(session => (session.groupId || DEFAULT_GROUP_ID) === groupId);
}
