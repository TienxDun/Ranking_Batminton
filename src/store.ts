import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { Match, Player, PlayerGroup, LeaderboardConfig, SessionCost, Court } from './types';
import { normalizeCostBreakdown } from './utils/costUtils';
import { initialPlayers, initialMatches } from './data/seed';
import { DEFAULT_GROUP_ID, DEFAULT_GROUP_NAME } from './constants/groups';

const GOOGLE_SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL || '';

/** Gộp config từ server với local — giữ ảnh QR base64 nếu server không có */
function mergeConfigFromServer(
  local: LeaderboardConfig,
  server?: Partial<LeaderboardConfig> | null
): LeaderboardConfig {
  const remote = server ?? {};
  return {
    minMatchesForMainBoard:
      remote.minMatchesForMainBoard ?? local.minMatchesForMainBoard ?? 5,
    paymentAccountName: remote.paymentAccountName ?? local.paymentAccountName,
    // Ảnh QR base64 lưu localStorage — không sync lên server (quá lớn)
    paymentQrImage: remote.paymentQrImage ?? local.paymentQrImage,
  };
}

/** Config gửi lên server — bỏ ảnh base64 */
function configForRemoteSync(config: LeaderboardConfig): LeaderboardConfig {
  const { paymentQrImage: _, ...rest } = config;
  return rest;
}

function mergeById<T extends { id: string }>(local: T[], remote?: T[] | null): T[] {
  if (!remote || remote.length === 0) return local;
  if (local.length === 0) return remote;
  const remoteIds = new Set(remote.map(item => item.id));
  return [...remote, ...local.filter(item => !remoteIds.has(item.id))];
}

const defaultGroup: PlayerGroup = {
  id: DEFAULT_GROUP_ID,
  name: DEFAULT_GROUP_NAME,
  isActive: true,
};

function normalizeGroups(groups?: PlayerGroup[] | null): PlayerGroup[] {
  const source = groups && groups.length > 0 ? groups : [defaultGroup];
  const normalized = source.map(group => ({
    ...group,
    isActive: group.isActive !== false,
  }));

  return normalized.some(group => group.id === DEFAULT_GROUP_ID)
    ? normalized
    : [defaultGroup, ...normalized];
}

function normalizePlayers(players: Player[] = [], groups: PlayerGroup[] = []): Player[] {
  const fallbackGroupId = groups[0]?.id || DEFAULT_GROUP_ID;
  return players.map(player => ({
    ...player,
    groupIds: Array.isArray(player.groupIds) && player.groupIds.length > 0
      ? player.groupIds
      : [fallbackGroupId],
  }));
}

function normalizeGroupedItems<T extends { groupId?: string }>(
  items: T[] = [],
  groupId = DEFAULT_GROUP_ID
): Array<T & { groupId: string }> {
  return items.map(item => ({
    ...item,
    groupId: item.groupId || groupId,
  }));
}

function mergeSessionCostsFromServer(
  local: SessionCost[],
  remote?: SessionCost[] | null
): SessionCost[] {
  const merged = mergeById(local, remote);
  return merged.map(s => ({
    ...s,
    costs: normalizeCostBreakdown(s.costs),
  }));
}

interface AppState {
  groups: PlayerGroup[];
  selectedGroupId: string;
  players: Player[];
  matches: Match[];
  config: LeaderboardConfig;
  theme: 'dark' | 'light';
  selectedWeek: string;
  sessionCosts: SessionCost[];
  courts: Court[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setSelectedGroupId: (groupId: string) => void;
  setSelectedWeek: (week: string) => void;
  fetchDataFromServer: () => Promise<void>;
  addGroup: (name: string) => void;
  updateGroup: (id: string, updates: Partial<Omit<PlayerGroup, 'id'>>) => void;
  archiveGroup: (id: string) => void;
  addPlayer: (name: string, gender?: 'male' | 'female', groupIds?: string[]) => void;
  updatePlayer: (id: string, updates: Partial<Player>) => void;
  addMatch: (match: Omit<Match, 'id'>) => void;
  updateMatch: (id: string, updates: Partial<Match>) => void;
  deleteMatch: (id: string) => void;
  clearMatches: () => void;
  setConfig: (config: Partial<LeaderboardConfig>) => void;
  importData: (jsonData: string) => boolean;
  resetData: () => void;
  toggleTheme: () => void;
  addSessionCost: (session: Omit<SessionCost, 'id'>) => void;
  updateSessionCost: (id: string, updates: Partial<Omit<SessionCost, 'id'>>) => void;
  deleteSessionCost: (id: string) => void;
  addCourt: (name: string, mapUrl: string) => void;
  updateCourt: (id: string, updates: Partial<Omit<Court, 'id'>>) => void;
  deleteCourt: (id: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => {
      // Hàm đồng bộ dữ liệu ngầm lên server Google Sheets
      const sync = async (updatedFields: Partial<AppState>) => {
        const groups = updatedFields.groups ?? get().groups;
        const players = updatedFields.players ?? get().players;
        const matches = updatedFields.matches ?? get().matches;
        const config = updatedFields.config ?? get().config;
        const configRemote = configForRemoteSync(config);
        const sessionCosts = updatedFields.sessionCosts !== undefined ? updatedFields.sessionCosts : get().sessionCosts;
        const courts = updatedFields.courts !== undefined ? updatedFields.courts : get().courts;

        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          set({ error: 'Bạn đang offline. Dữ liệu chưa thể cập nhật lên hệ thống.' });
          return;
        }

        if (!GOOGLE_SCRIPT_URL) {
          console.warn('Không thể đồng bộ: Chưa cấu hình VITE_GOOGLE_SCRIPT_URL');
          set({ error: 'Chưa cấu hình VITE_GOOGLE_SCRIPT_URL' });
          return;
        }

        try {
          const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ groups, players, matches, config: configRemote, sessionCosts, courts }),
          });
          if (!response.ok) {
            console.error('Lỗi phản hồi từ Google Scripts API');
            set({ error: 'Lỗi đồng bộ dữ liệu' });
          } else {
            set({ error: null });
          }
        } catch (e) {
          console.error('Lỗi kết nối khi đồng bộ dữ liệu:', e);
          set({ error: 'Không thể kết nối đến server' });
        }
      };

      return {
        groups: [defaultGroup],
        selectedGroupId: DEFAULT_GROUP_ID,
        players: initialPlayers,
        matches: initialMatches,
        config: { minMatchesForMainBoard: 5 },
        theme: 'dark',
        selectedWeek: 'all',
        sessionCosts: [],
        courts: [],
        isLoading: false,
        error: null,
        
        fetchDataFromServer: async () => {
          set({ isLoading: true, error: null });
          if (!GOOGLE_SCRIPT_URL) {
            set({ error: 'Chưa cấu hình VITE_GOOGLE_SCRIPT_URL', isLoading: false });
            return;
          }

          try {
            const response = await fetch(GOOGLE_SCRIPT_URL);
            if (response.ok) {
              const data = await response.json();
              const localConfig = get().config;
              const localSessionCosts = get().sessionCosts;
              const localCourts = get().courts;
              const groups = normalizeGroups(data.groups);
              const fallbackGroupId = groups[0]?.id || DEFAULT_GROUP_ID;
              const selectedGroupId = groups.some(group => group.id === get().selectedGroupId)
                ? get().selectedGroupId
                : fallbackGroupId;
              const mergedSessionCosts = mergeSessionCostsFromServer(
                localSessionCosts,
                normalizeGroupedItems<SessionCost>(data.sessionCosts || [], fallbackGroupId)
              );
              const mergedCourts = mergeById(localCourts, data.courts);

              set({
                groups,
                selectedGroupId,
                players: normalizePlayers(data.players || [], groups),
                matches: normalizeGroupedItems<Match>(data.matches || [], fallbackGroupId),
                config: mergeConfigFromServer(localConfig, data.config),
                sessionCosts: mergedSessionCosts,
                courts: mergedCourts,
                isLoading: false,
                error: null,
              });

              // Server cũ chưa có sessionCosts/courts — đẩy dữ liệu local lên
              const serverMissingCosts =
                !Array.isArray(data.sessionCosts) || data.sessionCosts.length === 0;
              const serverMissingCourts =
                !Array.isArray(data.courts) || data.courts.length === 0;
              const serverMissingGroups =
                !Array.isArray(data.groups) || data.groups.length === 0;
              if (
                (serverMissingCosts && mergedSessionCosts.length > 0) ||
                (serverMissingCourts && mergedCourts.length > 0) ||
                serverMissingGroups
              ) {
                sync({ groups, sessionCosts: mergedSessionCosts, courts: mergedCourts });
              }
            } else {
              set({ error: 'Không thể tải dữ liệu từ server', isLoading: false });
            }
          } catch (err) {
            set({ error: 'Không thể kết nối đến server', isLoading: false });
          }
        },

        setSelectedGroupId: (selectedGroupId) => set({ selectedGroupId }),

        addGroup: (name) => {
          const trimmedName = name.trim();
          if (!trimmedName) return;
          const newGroups = [...get().groups, { id: uuidv4(), name: trimmedName, isActive: true }];
          set({ groups: newGroups, selectedGroupId: newGroups[newGroups.length - 1].id });
          sync({ groups: newGroups });
        },

        updateGroup: (id, updates) => {
          const newGroups = get().groups.map(group =>
            group.id === id ? { ...group, ...updates, name: updates.name?.trim() || group.name } : group
          );
          set({ groups: newGroups });
          sync({ groups: newGroups });
        },

        archiveGroup: (id) => {
          if (id === DEFAULT_GROUP_ID) return;
          const newGroups = get().groups.map(group =>
            group.id === id ? { ...group, isActive: false } : group
          );
          const activeGroup = newGroups.find(group => group.isActive);
          set({
            groups: newGroups,
            selectedGroupId: get().selectedGroupId === id
              ? activeGroup?.id || DEFAULT_GROUP_ID
              : get().selectedGroupId,
          });
          sync({ groups: newGroups });
        },

        addPlayer: (name, gender = 'male', groupIds) => {
          const selectedGroupId = get().selectedGroupId || DEFAULT_GROUP_ID;
          const newPlayers = [
            ...get().players,
            {
              id: uuidv4(),
              name,
              isActive: true,
              gender,
              groupIds: groupIds && groupIds.length > 0 ? groupIds : [selectedGroupId],
            },
          ];
          set({ players: newPlayers });
          sync({ players: newPlayers });
        },
        
        updatePlayer: (id, updates) => {
          const newPlayers = get().players.map(p => p.id === id ? { ...p, ...updates } : p);
          set({ players: newPlayers });
          sync({ players: newPlayers });
        },
        
        addMatch: (match) => {
          const newMatches = [{ ...match, id: uuidv4(), groupId: match.groupId || get().selectedGroupId }, ...get().matches];
          set({ matches: newMatches });
          sync({ matches: newMatches });
        },
        
        updateMatch: (id, updates) => {
          const newMatches = get().matches.map(m => m.id === id ? { ...m, ...updates } : m);
          set({ matches: newMatches });
          sync({ matches: newMatches });
        },
        
        deleteMatch: (id) => {
          const newMatches = get().matches.filter(m => m.id !== id);
          set({ matches: newMatches });
          sync({ matches: newMatches });
        },
        
        clearMatches: () => {
          set({ matches: [] });
          sync({ matches: [] });
        },
        
        setConfig: (config) => {
          const newConfig = { ...get().config, ...config };
          set({ config: newConfig });
          sync({ config: newConfig });
        },
        
        importData: (jsonData) => {
          try {
          const data = JSON.parse(jsonData);
          if (data.players && data.matches && data.config) {
              const groups = normalizeGroups(data.groups);
              const fallbackGroupId = groups[0]?.id || DEFAULT_GROUP_ID;
              const localConfig = get().config;
              const sessionCosts = mergeSessionCostsFromServer(
                get().sessionCosts,
                normalizeGroupedItems<SessionCost>(data.sessionCosts || [], fallbackGroupId)
              );
              const courts = mergeById(get().courts, data.courts);
              const config = mergeConfigFromServer(localConfig, data.config);
              const players = normalizePlayers(data.players, groups);
              const matches = normalizeGroupedItems<Match>(data.matches, fallbackGroupId);
              set({ groups, selectedGroupId: fallbackGroupId, players, matches, config, sessionCosts, courts });
              sync({ groups, players, matches, config, sessionCosts, courts });
              return true;
            }
            return false;
          } catch (e) {
            console.error("Import error", e);
            return false;
          }
        },
        
        resetData: () => {
          const resetFields = {
            groups: [defaultGroup],
            selectedGroupId: DEFAULT_GROUP_ID,
            players: normalizePlayers(initialPlayers, [defaultGroup]),
            matches: normalizeGroupedItems<Match>(initialMatches, DEFAULT_GROUP_ID),
            config: { minMatchesForMainBoard: 5 },
            sessionCosts: [] as SessionCost[],
            courts: [] as Court[],
          };
          set(resetFields);
          sync(resetFields);
        },

        toggleTheme: () => {
          const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
          set({ theme: nextTheme });
        },
        setSelectedWeek: (selectedWeek) => set({ selectedWeek }),

        addSessionCost: (session) => {
          const newSessionCosts = [{ ...session, id: uuidv4(), groupId: session.groupId || get().selectedGroupId }, ...get().sessionCosts];
          set({ sessionCosts: newSessionCosts });
          sync({ sessionCosts: newSessionCosts });
        },

        updateSessionCost: (id, updates) => {
          const newSessionCosts = get().sessionCosts.map(s =>
            s.id === id ? { ...s, ...updates } : s
          );
          set({ sessionCosts: newSessionCosts });
          sync({ sessionCosts: newSessionCosts });
        },

        deleteSessionCost: (id) => {
          const newSessionCosts = get().sessionCosts.filter(s => s.id !== id);
          set({ sessionCosts: newSessionCosts });
          sync({ sessionCosts: newSessionCosts });
        },

        addCourt: (name, mapUrl) => {
          const newCourts = [...get().courts, { id: uuidv4(), name: name.trim(), mapUrl: mapUrl.trim() }];
          set({ courts: newCourts });
          sync({ courts: newCourts });
        },

        updateCourt: (id, updates) => {
          const newCourts = get().courts.map(c => c.id === id ? { ...c, ...updates } : c);
          set({ courts: newCourts });
          sync({ courts: newCourts });
        },

        deleteCourt: (id) => {
          const newCourts = get().courts.filter(c => c.id !== id);
          set({ courts: newCourts });
          sync({ courts: newCourts });
        },
      };
    },
    {
      name: 'badminton-stats-storage',
      version: 2,
      migrate: (persistedState: any, version: number) => {
        const groups = normalizeGroups(persistedState?.groups);
        const fallbackGroupId = groups[0]?.id || DEFAULT_GROUP_ID;
        if (persistedState) {
          persistedState.groups = groups;
          persistedState.selectedGroupId = groups.some(group => group.id === persistedState.selectedGroupId)
            ? persistedState.selectedGroupId
            : fallbackGroupId;
        }
        if (persistedState && persistedState.players) {
          persistedState.players = persistedState.players.map((p: any) => {
            if (!p.gender) {
              const femaleNames = ["Thư", "Tuyết", "Linh", "Như", "thu", "tuyet", "linh", "nhu"];
              const isFemale = femaleNames.some(f => p.name.toLowerCase().includes(f.toLowerCase()));
              p.gender = isFemale ? 'female' : 'male';
            }
            if (!Array.isArray(p.groupIds) || p.groupIds.length === 0) {
              p.groupIds = [fallbackGroupId];
            }
            return p;
          });
        }
        if (persistedState?.matches) {
          persistedState.matches = normalizeGroupedItems(persistedState.matches, fallbackGroupId);
        }
        delete persistedState?.schedule;
        delete persistedState?.schedulerUIState;
        delete persistedState?.schedulerState;
        if (persistedState && !persistedState.sessionCosts) {
          persistedState.sessionCosts = [];
        }
        if (persistedState && !persistedState.courts) {
          persistedState.courts = [];
        }
        if (persistedState?.sessionCosts) {
          persistedState.sessionCosts = persistedState.sessionCosts.map((s: any) => ({
            ...s,
            groupId: s.groupId || fallbackGroupId,
            costs: normalizeCostBreakdown(s.costs),
          }));
        }
        return persistedState;
      }
    }
  )
);
