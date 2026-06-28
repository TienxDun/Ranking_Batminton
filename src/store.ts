import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { Match, Player, LeaderboardConfig, ScheduledSet } from './types';
import { initialPlayers, initialMatches } from './data/seed';

const GOOGLE_SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL || '';

interface AppState {
  players: Player[];
  matches: Match[];
  config: LeaderboardConfig;
  theme: 'dark';
  schedulerState?: {
    selectedIds: string[];
    numSets: number;
    schedule: ScheduledSet[];
    isGenerated: boolean;
  };
  isLoading: boolean;
  error: string | null;
  
  // Actions
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
  setSchedulerState: (state: AppState['schedulerState']) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => {
      // Hàm đồng bộ dữ liệu ngầm lên server (Google Sheets hoặc Express Server)
      const sync = async (updatedFields: Partial<AppState>) => {
        const players = updatedFields.players ?? get().players;
        const matches = updatedFields.matches ?? get().matches;
        const config = updatedFields.config ?? get().config;
        const schedulerState = updatedFields.schedulerState !== undefined ? updatedFields.schedulerState : get().schedulerState;

        // Nếu chạy trên GitHub Pages tĩnh và không có link Google Sheets, chỉ lưu local (Zustand Persist tự lo)
        const isGitHubPages = window.location.hostname.endsWith('github.io');
        if (!GOOGLE_SCRIPT_URL && isGitHubPages) {
          return;
        }

        try {
          if (GOOGLE_SCRIPT_URL) {
            // Gửi lên Google Apps Script (dùng text/plain để tránh preflight request OPTIONS gây lỗi CORS)
            await fetch(GOOGLE_SCRIPT_URL, {
              method: 'POST',
              headers: {
                'Content-Type': 'text/plain',
              },
              body: JSON.stringify({ players, matches, config, schedulerState }),
            });
          } else {
            // Gửi lên Express Server cục bộ
            const response = await fetch('/api/data', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ players, matches, config, schedulerState }),
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
        schedulerState: undefined,
        isLoading: false,
        error: null,
        
        fetchDataFromServer: async () => {
          // Nếu chạy trên GitHub Pages tĩnh và không cấu hình Google Sheets URL, bỏ qua fetch để tránh lỗi 404 console
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
                schedulerState: data.schedulerState,
                isLoading: false
              });
            } else {
              // Chỉ báo lỗi nếu không phải trường hợp chạy tĩnh thiếu database
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
              set({ players: data.players, matches: data.matches, config: data.config });
              sync({ players: data.players, matches: data.matches, config: data.config });
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
            schedulerState: undefined
          };
          set(resetFields);
          sync(resetFields);
        },
        
        toggleTheme: () => {},
        
        setSchedulerState: (schedulerState) => {
          set({ schedulerState });
          sync({ schedulerState });
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
        return persistedState;
      }
    }
  )
);
