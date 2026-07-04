import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { Match, Player, LeaderboardConfig, ScheduledSet, SessionCost, Court } from './types';
import { normalizeCostBreakdown } from './utils/costUtils';
import { initialPlayers, initialMatches } from './data/seed';

const GOOGLE_SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL || '';

interface AppState {
  players: Player[];
  matches: Match[];
  config: LeaderboardConfig;
  theme: 'dark' | 'light';
  selectedWeek: string;
  // schedule: lịch thi đấu đã tạo — được sync lên DB, chia sẻ giữa mọi người dùng
  schedule: ScheduledSet[];
  sessionCosts: SessionCost[];
  courts: Court[];
  // schedulerUIState: trạng thái UI cục bộ — chỉ lưu localStorage, không sync
  schedulerUIState?: {
    selectedIds: string[];
    numSets: number;
    isGenerated: boolean;
  };
  /** @deprecated use schedule + schedulerUIState instead */
  schedulerState?: {
    selectedIds: string[];
    numSets: number;
    schedule: ScheduledSet[];
    isGenerated: boolean;
  };
  isLoading: boolean;
  error: string | null;

  // Actions
  setSelectedWeek: (week: string) => void;
  fetchDataFromServer: () => Promise<void>;
  addPlayer: (name: string, gender?: 'male' | 'female') => void;
  updatePlayer: (id: string, updates: Partial<Player>) => void;
  addMatch: (match: Omit<Match, 'id'>) => void;
  updateMatch: (id: string, updates: Partial<Match>) => void;
  deleteMatch: (id: string) => void;
  clearMatches: () => void;
  setConfig: (config: Partial<LeaderboardConfig>) => void;
  importData: (jsonData: string) => boolean;
  resetData: () => void;
  toggleTheme: () => void;
  /** Lưu lịch thi đấu lên DB và chia sẻ với mọi người dùng */
  saveScheduleToDB: (newSchedule: ScheduledSet[]) => void;
  /** Cập nhật UI state cục bộ (selectedIds, numSets, isGenerated) — không sync DB */
  setSchedulerUIState: (state: AppState['schedulerUIState']) => void;
  /** @deprecated dùng saveScheduleToDB + setSchedulerUIState thay thế */
  setSchedulerState: (state: AppState['schedulerState']) => void;
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
      // Hàm đồng bộ dữ liệu ngầm lên server (Google Sheets hoặc Express Server)
      const sync = async (updatedFields: Partial<AppState>) => {
        const players = updatedFields.players ?? get().players;
        const matches = updatedFields.matches ?? get().matches;
        const config = updatedFields.config ?? get().config;
        // Chỉ sync `schedule` (lịch thi đấu đã tạo) lên DB — schedulerUIState là local only
        const schedule = updatedFields.schedule !== undefined ? updatedFields.schedule : get().schedule;
        const sessionCosts = updatedFields.sessionCosts !== undefined ? updatedFields.sessionCosts : get().sessionCosts;
        const courts = updatedFields.courts !== undefined ? updatedFields.courts : get().courts;

        // Nếu chạy trên GitHub Pages tĩnh và không có link Google Sheets, chỉ lưu local
        const isGitHubPages = window.location.hostname.endsWith('github.io');
        if (!GOOGLE_SCRIPT_URL && isGitHubPages) {
          return;
        }

        try {
          if (GOOGLE_SCRIPT_URL) {
            await fetch(GOOGLE_SCRIPT_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'text/plain' },
              body: JSON.stringify({ players, matches, config, schedule, sessionCosts, courts }),
            });
          } else {
            const response = await fetch('/api/data', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ players, matches, config, schedule, sessionCosts, courts }),
            });
            if (!response.ok) {
              console.error('Lỗi phản hồi từ API Express');
            }
          }
        } catch (e) {
          console.error('Lỗi kết nối khi đồng bộ dữ liệu:', e);
        }
      };

      return {
        players: initialPlayers,
        matches: initialMatches,
        config: { minMatchesForMainBoard: 5 },
        theme: 'dark',
        selectedWeek: 'all',
        schedule: [],
        sessionCosts: [],
        courts: [],
        schedulerUIState: undefined,
        schedulerState: undefined, // legacy compat
        isLoading: false,
        error: null,
        
        fetchDataFromServer: async () => {
          const isGitHubPages = window.location.hostname.endsWith('github.io');
          if (!GOOGLE_SCRIPT_URL && isGitHubPages) {
            set({ isLoading: false, error: null });
            return;
          }

          set({ isLoading: true, error: null });
          try {
            const url = GOOGLE_SCRIPT_URL || '/api/data';
            const response = await fetch(url);
            if (response.ok) {
              const data = await response.json();
              set({
                players: data.players || [],
                matches: data.matches || [],
                config: data.config || { minMatchesForMainBoard: 5 },
                // Ưu tiên `schedule` mới, fallback về schedulerState.schedule cũ nếu DB cũ
                schedule: data.schedule || data.schedulerState?.schedule || [],
                sessionCosts: data.sessionCosts || [],
                courts: data.courts || [],
                isLoading: false
              });
            } else {
              set({ error: isGitHubPages ? null : 'Không thể tải dữ liệu từ server', isLoading: false });
            }
          } catch (err) {
            set({ error: isGitHubPages ? null : 'Không thể kết nối đến server', isLoading: false });
          }
        },

        addPlayer: (name, gender = 'male') => {
          const newPlayers = [...get().players, { id: uuidv4(), name, isActive: true, gender }];
          set({ players: newPlayers });
          sync({ players: newPlayers });
        },
        
        updatePlayer: (id, updates) => {
          const newPlayers = get().players.map(p => p.id === id ? { ...p, ...updates } : p);
          set({ players: newPlayers });
          sync({ players: newPlayers });
        },
        
        addMatch: (match) => {
          const newMatches = [{ ...match, id: uuidv4() }, ...get().matches];
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
              const sessionCosts = data.sessionCosts || [];
              const courts = data.courts || [];
              set({ players: data.players, matches: data.matches, config: data.config, sessionCosts, courts });
              sync({ players: data.players, matches: data.matches, config: data.config, sessionCosts, courts });
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
            players: initialPlayers,
            matches: initialMatches,
            config: { minMatchesForMainBoard: 5 },
            schedule: [] as ScheduledSet[],
            sessionCosts: [] as SessionCost[],
            courts: [] as Court[],
            schedulerState: undefined
          };
          set(resetFields);
          sync(resetFields);
        },

        toggleTheme: () => {
          const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
          set({ theme: nextTheme });
        },
        setSelectedWeek: (selectedWeek) => set({ selectedWeek }),

        saveScheduleToDB: (newSchedule: ScheduledSet[]) => {
          set({ schedule: newSchedule });
          sync({ schedule: newSchedule });
        },

        setSchedulerUIState: (schedulerUIState) => {
          set({ schedulerUIState });
          // Không sync lên DB — chỉ lưu localStorage qua zustand persist
        },

        // Legacy: giữ lại để không break code cũ
        setSchedulerState: (schedulerState) => {
          set({ schedulerState });
          // Không sync lên DB nữa — dùng saveScheduleToDB thay thế
        },

        addSessionCost: (session) => {
          const newSessionCosts = [{ ...session, id: uuidv4() }, ...get().sessionCosts];
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
      migrate: (persistedState: any, version: number) => {
        if (persistedState && persistedState.players) {
          persistedState.players = persistedState.players.map((p: any) => {
            if (!p.gender) {
              const femaleNames = ["Thư", "Tuyết", "Linh", "Như", "thu", "tuyet", "linh", "nhu"];
              const isFemale = femaleNames.some(f => p.name.toLowerCase().includes(f.toLowerCase()));
              p.gender = isFemale ? 'female' : 'male';
            }
            return p;
          });
        }
        if (persistedState && !persistedState.sessionCosts) {
          persistedState.sessionCosts = [];
        }
        if (persistedState && !persistedState.courts) {
          persistedState.courts = [];
        }
        if (persistedState?.sessionCosts) {
          persistedState.sessionCosts = persistedState.sessionCosts.map((s: any) => ({
            ...s,
            costs: normalizeCostBreakdown(s.costs),
          }));
        }
        return persistedState;
      }
    }
  )
);
