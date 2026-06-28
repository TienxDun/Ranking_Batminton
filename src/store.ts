import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { Match, Player, LeaderboardConfig, ScheduledSet } from './types';
import { initialPlayers, initialMatches } from './data/seed';

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
  
  // Actions
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
    (set, get) => ({
      players: initialPlayers,
      matches: initialMatches,
      config: { minMatchesForMainBoard: 5 },
      theme: 'dark',
      schedulerState: undefined,
      
      addPlayer: (name, gender = 'male') => set((state) => ({
        players: [...state.players, { id: uuidv4(), name, isActive: true, gender }]
      })),
      
      updatePlayer: (id, updates) => set((state) => ({
        players: state.players.map(p => p.id === id ? { ...p, ...updates } : p)
      })),
      
      addMatch: (match) => set((state) => ({
        matches: [{ ...match, id: uuidv4() }, ...state.matches]
      })),
      
      updateMatch: (id, updates) => set((state) => ({
        matches: state.matches.map(m => m.id === id ? { ...m, ...updates } : m)
      })),
      
      deleteMatch: (id) => set((state) => ({
        matches: state.matches.filter(m => m.id !== id)
      })),
      
      clearMatches: () => set({ matches: [] }),
      
      setConfig: (config) => set((state) => ({
        config: { ...state.config, ...config }
      })),
      
      importData: (jsonData) => {
        try {
          const data = JSON.parse(jsonData);
          if (data.players && data.matches && data.config) {
            set({ players: data.players, matches: data.matches, config: data.config });
            return true;
          }
          return false;
        } catch (e) {
          console.error("Import error", e);
          return false;
        }
      },
      
      resetData: () => set({ players: initialPlayers, matches: initialMatches, config: { minMatchesForMainBoard: 5 }, theme: 'dark', schedulerState: undefined }),
      toggleTheme: () => {},
      setSchedulerState: (schedulerState) => set({ schedulerState }),
    }),
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
