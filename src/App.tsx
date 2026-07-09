/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Dashboard from './components/dashboard/Dashboard';
import Analytics from './components/analytics/Analytics';
import MatchForm from './components/match-form/MatchForm';
import MatchHistory from './components/match-history/MatchHistory';
import PlayerManagement from './components/player-management/PlayerManagement';
import SessionCosts from './components/session-costs/SessionCosts';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import OfflineNotice from './components/OfflineNotice';
import { Button } from './components/ui/button';
import { Trophy, PlusCircle, History, Users, Loader2, Sun, Moon, BarChart2, Settings, Wallet, AlertCircle, WifiOff } from 'lucide-react';
import { useStore } from './store';
import { useOnlineStatus } from './hooks/useOnlineStatus';

type Tab = 'dashboard' | 'analytics' | 'add' | 'history' | 'costs' | 'players';

const getTabFromHash = (hash: string): Tab => {
  const tab = hash.replace('#', '') as Tab;
  const validTabs: Tab[] = ['dashboard', 'analytics', 'add', 'history', 'costs', 'players'];
  return validTabs.includes(tab) ? tab : 'dashboard';
};

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>(() => getTabFromHash(window.location.hash));
  const [prefilledMatch, setPrefilledMatch] = useState<{ t1p1: string; t1p2: string; t2p1: string; t2p2: string } | undefined>(undefined);
  const {
    fetchDataFromServer,
    isLoading,
    error,
    theme,
    toggleTheme,
    groups,
    selectedGroupId,
    setSelectedGroupId,
  } = useStore();
  const isOnline = useOnlineStatus();
  const groupOptions = groups.filter(group => group.isActive || group.id === selectedGroupId);

  const changeTab = (newTab: Tab, options?: { replace?: boolean }) => {
    if (activeTab === newTab) return;
    setActiveTab(newTab);
    if (options?.replace) {
      window.history.replaceState({ tab: newTab }, '', `#${newTab}`);
    } else {
      window.history.pushState({ tab: newTab }, '', `#${newTab}`);
    }
  };

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const tab = (event.state?.tab || getTabFromHash(window.location.hash)) as Tab;
      setActiveTab(tab);
    };

    window.addEventListener('popstate', handlePopState);

    // Cài đặt trạng thái ban đầu của lịch sử trình duyệt nếu chưa có
    const currentTab = getTabFromHash(window.location.hash);
    window.history.replaceState({ tab: currentTab }, '', `#${currentTab}`);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  // Fetch lần đầu khi app mở (sau khi Zustand hydrate xong)
  useEffect(() => {
    if (useStore.persist.hasHydrated()) {
      fetchDataFromServer();
      return;
    }
    return useStore.persist.onFinishHydration(() => {
      fetchDataFromServer();
    });
  }, [fetchDataFromServer]);

  // Fetch lại khi user quay lại tab sau khi để nền
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchDataFromServer();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchDataFromServer]);

  // Fetch lại khi mạng reconnect sau khi offline
  useEffect(() => {
    const handleOnline = () => fetchDataFromServer();
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [fetchDataFromServer]);

  const renderDbStatus = () => {
    const isGoogleSheets = !!import.meta.env.VITE_GOOGLE_SCRIPT_URL;

    if (!isOnline) {
      return (
        <div
          className="offline-status flex items-center justify-center gap-1.5 w-7 h-7 lg:w-auto lg:h-9 lg:px-2.5 rounded-lg lg:rounded-xl text-[9px] lg:text-[10px] font-bold flex-shrink-0"
          title="Bạn đang offline. Dữ liệu chưa thể cập nhật lên hệ thống."
          aria-label="Bạn đang offline"
        >
          <WifiOff className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="hidden lg:inline whitespace-nowrap">Offline</span>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="flex items-center justify-center gap-1.5 w-7 h-7 lg:w-auto lg:h-9 lg:px-2.5 rounded-lg lg:rounded-xl bg-teal-500/10 border border-teal-500/20 text-[9px] lg:text-[10px] font-bold text-teal-400 flex-shrink-0">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-400 flex-shrink-0" />
          <span className="animate-pulse hidden lg:inline whitespace-nowrap">Đang đồng bộ...</span>
        </div>
      );
    }

    if (error) {
      return (
        <button
          onClick={() => fetchDataFromServer()}
          className="flex items-center justify-center gap-1.5 w-7 h-7 lg:w-auto lg:h-9 lg:px-2.5 rounded-lg lg:rounded-xl bg-rose-500/10 border border-rose-500/20 text-[9px] lg:text-[10px] font-bold text-rose-400 flex-shrink-0 cursor-pointer hover:bg-rose-500/20 active:scale-95 transition-all duration-300"
          title={`Lỗi: ${error}. Click để đồng bộ lại.`}
          aria-label="Đồng bộ lại dữ liệu"
        >
          <span className="h-2 w-2 rounded-full bg-rose-400 animate-pulse flex-shrink-0" />
          <span className="hidden lg:inline whitespace-nowrap">Mất kết nối</span>
        </button>
      );
    }

    if (isGoogleSheets) {
      return (
        <button
          onClick={() => fetchDataFromServer()}
          className="flex items-center justify-center gap-1.5 w-7 h-7 lg:w-auto lg:h-9 lg:px-2.5 rounded-lg lg:rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[9px] lg:text-[10px] font-bold text-emerald-400 flex-shrink-0 cursor-pointer hover:bg-emerald-500/20 active:scale-95 transition-all duration-300"
          title="Đã đồng bộ Sheets. Click để đồng bộ lại."
          aria-label="Đồng bộ lại dữ liệu"
        >
          <span className="h-2 w-2 rounded-full bg-emerald-400 flex-shrink-0" />
          <span className="hidden lg:inline whitespace-nowrap">Đã đồng bộ Sheets</span>
        </button>
      );
    }

    return (
      <button
        onClick={() => fetchDataFromServer()}
        className="flex items-center justify-center gap-1.5 w-7 h-7 lg:w-auto lg:h-9 lg:px-2.5 rounded-lg lg:rounded-xl bg-rose-500/10 border border-rose-500/20 text-[9px] lg:text-[10px] font-bold text-rose-400 flex-shrink-0 cursor-pointer hover:bg-rose-500/20 active:scale-95 transition-all duration-300"
        title="Chưa cấu hình DB. Click để thử kết nối lại."
        aria-label="Đồng bộ lại dữ liệu"
      >
        <span className="h-2 w-2 rounded-full bg-rose-400 flex-shrink-0" />
        <span className="hidden lg:inline whitespace-nowrap">Chưa cấu hình DB</span>
      </button>
    );
  };

  return (
    <div className="min-h-screen text-slate-100 pb-24 md:pb-8 font-sans relative overflow-x-hidden transition-colors duration-300">
      {/* Top Loading Bar */}
      {isLoading && (
        <div className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-teal-400 via-indigo-500 to-teal-400 z-50 animate-pulse" />
      )}

      {/* Background Mesh Gradients */}
      <div className="mesh-bg" />

      <header className="glass-header sticky top-0 z-10 shadow-sm pt-safe">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-2 md:gap-3 lg:gap-4">
          <h1 className="font-bold text-base sm:text-lg lg:text-xl tracking-tight flex items-center gap-2 lg:gap-3 flex-shrink-0">
            <div className="relative w-8 h-8 lg:w-10 lg:h-10 rounded-lg lg:rounded-xl bg-slate-950/40 border border-white/10 flex items-center justify-center shadow-lg shadow-teal-500/5 group hover:border-teal-500/30 transition-all duration-300">
              <div className="absolute inset-0 rounded-lg lg:rounded-xl bg-gradient-to-br from-teal-500/10 to-indigo-500/5 opacity-50 group-hover:opacity-100 transition-opacity" />
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 lg:w-6.5 lg:h-6.5 relative z-1 drop-shadow-[0_0_8px_rgba(45,212,191,0.2)]">
                <defs>
                  <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#2dd4bf" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
                {/* Outer Shield / Geometric Outer Diamond frame */}
                <path d="M50 10L82 28V60L50 90L18 60V28L50 10Z" stroke="url(#logo-grad)" strokeWidth="3" strokeLinejoin="round" opacity="0.25" />
                
                {/* Shuttlecock body */}
                <path d="M32 35C33.5 46 42.5 60 50 70" stroke="url(#logo-grad)" strokeWidth="4" strokeLinecap="round" />
                <path d="M68 35C66.5 46 57.5 60 50 70" stroke="url(#logo-grad)" strokeWidth="4" strokeLinecap="round" />
                <path d="M50 25V70" stroke="url(#logo-grad)" strokeWidth="4.5" strokeLinecap="round" />
                
                {/* Horizontal connecting bands */}
                <path d="M37 46H63" stroke="url(#logo-grad)" strokeWidth="3.5" strokeLinecap="round" opacity="0.9" />
                <path d="M41 58H59" stroke="url(#logo-grad)" strokeWidth="3.5" strokeLinecap="round" opacity="0.9" />

                {/* Solid rounded Cork Base */}
                <path d="M44 70C44 73.3 46.7 76 50 76C53.3 76 56 73.3 56 70H44Z" fill="url(#logo-grad)" />
              </svg>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1 leading-none">
                <span className="tracking-widest font-black text-xs sm:text-sm lg:text-base logo-text-main">BADMIN</span>
                <span className="tracking-widest font-black text-xs sm:text-sm lg:text-base bg-gradient-to-r from-teal-400 to-indigo-400 bg-clip-text text-transparent shadow-teal-500/20">RANK</span>
              </div>
              <span className="text-[7px] lg:text-[8px] uppercase tracking-widest text-teal-400/80 font-bold mt-0.5 lg:mt-1 hidden lg:block">Hệ Thống Giải Đấu</span>
            </div>
          </h1>

          {/* Menu Navigation ở giữa */}
          <div className="hidden md:flex items-center bg-slate-950/30 border border-white/5 p-1 rounded-xl gap-0.5 shadow-inner">
            <button 
              onClick={() => changeTab('dashboard')} 
              className={`px-2 lg:px-3.5 py-1.5 lg:py-2 rounded-lg text-[10px] lg:text-xs font-bold transition-all duration-300 flex items-center gap-1.5 lg:gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'dashboard' 
                  ? 'bg-gradient-to-r from-teal-500/20 to-indigo-500/10 text-teal-300 border border-teal-500/20 shadow-inner' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Trophy className={`w-3 h-3 lg:w-3.5 lg:h-3.5 transition-transform duration-300 ${activeTab === 'dashboard' ? 'scale-110 text-teal-400' : ''}`} /> 
              <span>BXH</span>
            </button>
            <button 
              onClick={() => changeTab('analytics')} 
              className={`px-2 lg:px-3.5 py-1.5 lg:py-2 rounded-lg text-[10px] lg:text-xs font-bold transition-all duration-300 flex items-center gap-1.5 lg:gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'analytics' 
                  ? 'bg-gradient-to-r from-teal-500/20 to-indigo-500/10 text-teal-300 border border-teal-500/20 shadow-inner' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <BarChart2 className={`w-3 h-3 lg:w-3.5 lg:h-3.5 transition-transform duration-300 ${activeTab === 'analytics' ? 'scale-110 text-teal-400' : ''}`} /> 
              <span>Thống Kê</span>
            </button>

            <button 
              onClick={() => changeTab('add')} 
              className={`px-2 lg:px-3.5 py-1.5 lg:py-2 rounded-lg text-[10px] lg:text-xs font-bold transition-all duration-300 flex items-center gap-1.5 lg:gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'add' 
                  ? 'bg-gradient-to-r from-teal-500/20 to-indigo-500/10 text-teal-300 border border-teal-500/20 shadow-inner' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <PlusCircle className={`w-3 h-3 lg:w-3.5 lg:h-3.5 transition-transform duration-300 ${activeTab === 'add' ? 'scale-110 text-teal-400' : ''}`} /> 
              <span>Thêm Trận</span>
            </button>
            <button 
              onClick={() => changeTab('history')} 
              className={`px-2 lg:px-3.5 py-1.5 lg:py-2 rounded-lg text-[10px] lg:text-xs font-bold transition-all duration-300 flex items-center gap-1.5 lg:gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'history' 
                  ? 'bg-gradient-to-r from-teal-500/20 to-indigo-500/10 text-teal-300 border border-teal-500/20 shadow-inner' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <History className={`w-3 h-3 lg:w-3.5 lg:h-3.5 transition-transform duration-300 ${activeTab === 'history' ? 'scale-110 text-teal-400' : ''}`} /> 
              <span>Lịch Sử</span>
            </button>
            <button 
              onClick={() => changeTab('costs')} 
              className={`px-2 lg:px-3.5 py-1.5 lg:py-2 rounded-lg text-[10px] lg:text-xs font-bold transition-all duration-300 flex items-center gap-1.5 lg:gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'costs' 
                  ? 'bg-gradient-to-r from-teal-500/20 to-indigo-500/10 text-teal-300 border border-teal-500/20 shadow-inner' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Wallet className={`w-3 h-3 lg:w-3.5 lg:h-3.5 transition-transform duration-300 ${activeTab === 'costs' ? 'scale-110 text-teal-400' : ''}`} /> 
              <span>Chi phí</span>
            </button>
            <button 
              onClick={() => changeTab('players')} 
              className={`px-2 lg:px-3.5 py-1.5 lg:py-2 rounded-lg text-[10px] lg:text-xs font-bold transition-all duration-300 flex items-center gap-1.5 lg:gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'players' 
                  ? 'bg-gradient-to-r from-teal-500/20 to-indigo-500/10 text-teal-300 border border-teal-500/20 shadow-inner' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Users className={`w-3 h-3 lg:w-3.5 lg:h-3.5 transition-transform duration-300 ${activeTab === 'players' ? 'scale-110 text-teal-400' : ''}`} /> 
              <span>Cài Đặt</span>
            </button>
          </div>

          {/* Action Items bên phải */}
          <div className="flex items-center gap-1.5 lg:gap-2.5 flex-shrink-0">
            <select
              value={selectedGroupId}
              onChange={event => setSelectedGroupId(event.target.value)}
              className="h-7 lg:h-9 max-w-[96px] sm:max-w-[130px] lg:max-w-[180px] rounded-lg lg:rounded-xl bg-slate-950/40 border border-white/10 px-2 text-[10px] lg:text-xs font-bold text-slate-200 focus:outline-none focus:border-teal-500 cursor-pointer"
              title="Chọn nhóm người chơi"
              aria-label="Chọn nhóm người chơi"
            >
              {groupOptions.map(group => (
                <option key={group.id} value={group.id} className="bg-slate-950">
                  {group.name}
                </option>
              ))}
            </select>
            {renderDbStatus()}
            <button
              onClick={toggleTheme}
              className="w-7 h-7 lg:w-9 lg:h-9 rounded-lg lg:rounded-xl bg-slate-950/40 border border-white/10 flex items-center justify-center shadow-lg hover:border-teal-500/30 text-slate-300 hover:text-teal-400 active:scale-95 transition-all duration-300 cursor-pointer"
              title={theme === 'light' ? "Chuyển sang giao diện Tối" : "Chuyển sang giao diện Sáng"}
              aria-label="Toggle Theme"
            >
              {theme === 'light' ? <Moon className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-indigo-400" /> : <Sun className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-amber-400" />}
            </button>
            <button
              onClick={() => changeTab('players')}
              className={`w-7 h-7 rounded-lg bg-slate-950/40 border flex items-center justify-center shadow-lg hover:border-teal-500/30 text-slate-300 hover:text-teal-400 active:scale-95 transition-all duration-300 cursor-pointer md:hidden ${
                activeTab === 'players' ? 'border-teal-500/30 text-teal-400 bg-teal-500/10' : 'border-white/10'
              }`}
              title="Cài đặt quản lý người chơi"
              aria-label="Settings"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {!isOnline && <OfflineNotice />}

      {error && (
        <div className="max-w-4xl mx-auto px-4 pt-6 pb-0 relative z-1">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 backdrop-blur-md text-rose-200">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2 rounded-xl bg-rose-500/15 text-rose-400 flex-shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-sm leading-snug">
                  {error === 'Chưa cấu hình VITE_GOOGLE_SCRIPT_URL' 
                    ? 'Chưa cấu hình cơ sở dữ liệu' 
                    : 'Lỗi kết nối cơ sở dữ liệu'}
                </p>
                <p className="text-xs text-rose-300/85 mt-0.5 leading-relaxed">
                  {error === 'Chưa cấu hình VITE_GOOGLE_SCRIPT_URL'
                    ? 'Vui lòng bổ sung VITE_GOOGLE_SCRIPT_URL vào file .env trong thư mục gốc và khởi động lại dev server.'
                    : 'Không thể kết nối tới Google Sheets. Vui lòng kiểm tra kết nối mạng của bạn hoặc cấu hình URL trong .env.'}
                </p>
              </div>
            </div>
            {error !== 'Chưa cấu hình VITE_GOOGLE_SCRIPT_URL' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchDataFromServer()}
                disabled={isLoading}
                className="flex-shrink-0 text-xs font-bold border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 hover:text-white text-rose-300 w-full sm:w-auto h-8 px-4"
              >
                Thử lại
              </Button>
            )}
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 py-6 relative z-1">
        <div className={activeTab === 'dashboard' ? 'tab-content-active' : 'hidden'}>
          <Dashboard />
        </div>
        <div className={activeTab === 'analytics' ? 'tab-content-active' : 'hidden'}>
          <Analytics active={activeTab === 'analytics'} />
        </div>

        <div className={activeTab === 'add' ? 'tab-content-active' : 'hidden'}>
          <MatchForm 
            onSaved={() => {
              setPrefilledMatch(undefined);
              changeTab('dashboard', { replace: true });
            }} 
            initialData={prefilledMatch}
          />
        </div>
        <div className={activeTab === 'history' ? 'tab-content-active' : 'hidden'}>
          <MatchHistory />
        </div>
        <div className={activeTab === 'costs' ? 'tab-content-active' : 'hidden'}>
          <SessionCosts />
        </div>
        <div className={activeTab === 'players' ? 'tab-content-active' : 'hidden'}>
          <PlayerManagement />
        </div>
      </main>

      {/* Mobile Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-nav flex justify-around p-1 z-10 pb-safe shadow-lg gap-0.5">
        <button 
          onClick={() => changeTab('dashboard')} 
          className={`flex flex-col items-center p-1 rounded-lg flex-1 transition-all ${
            activeTab === 'dashboard' ? 'text-teal-400 scale-105' : 'text-slate-400'
          }`}
        >
          <Trophy className="w-4.5 h-4.5 mb-1" />
          <span className="text-[10px] font-semibold">BXH</span>
        </button>
        <button 
          onClick={() => changeTab('analytics')} 
          className={`flex flex-col items-center p-1 rounded-lg flex-1 transition-all ${
            activeTab === 'analytics' ? 'text-teal-400 scale-105' : 'text-slate-400'
          }`}
        >
          <BarChart2 className="w-4.5 h-4.5 mb-1" />
          <span className="text-[10px] font-semibold">Thống Kê</span>
        </button>

        <button 
          onClick={() => changeTab('add')} 
          className={`flex flex-col items-center p-1 rounded-lg flex-1 transition-all ${
            activeTab === 'add' ? 'text-teal-400 scale-105' : 'text-slate-400'
          }`}
        >
          <PlusCircle className="w-4.5 h-4.5 mb-1" />
          <span className="text-[10px] font-semibold">Thêm</span>
        </button>
        <button 
          onClick={() => changeTab('history')} 
          className={`flex flex-col items-center p-1 rounded-lg flex-1 transition-all ${
            activeTab === 'history' ? 'text-teal-400 scale-105' : 'text-slate-400'
          }`}
        >
          <History className="w-4.5 h-4.5 mb-1" />
          <span className="text-[10px] font-semibold">Lịch Sử</span>
        </button>
        <button 
          onClick={() => changeTab('costs')} 
          className={`flex flex-col items-center p-1 rounded-lg flex-1 transition-all ${
            activeTab === 'costs' ? 'text-teal-400 scale-105' : 'text-slate-400'
          }`}
        >
          <Wallet className="w-4.5 h-4.5 mb-1" />
          <span className="text-[10px] font-semibold">Chi phí</span>
        </button>
      </nav>

      {/* PWA Install Prompt — Android & iOS */}
      <PWAInstallPrompt />

      {/* Footer — version */}
      <footer className="text-center pb-28 md:pb-6 pt-2 text-[10px] text-slate-600 select-none pointer-events-none">
        v{__APP_VERSION__}
      </footer>
    </div>
  );
}
