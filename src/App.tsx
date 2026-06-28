/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import MatchForm from './components/MatchForm';
import MatchScheduler from './components/MatchScheduler';
import MatchHistory from './components/MatchHistory';
import PlayerManagement from './components/PlayerManagement';
import { Button } from './components/ui/button';
import { Trophy, PlusCircle, History, Users, CalendarRange } from 'lucide-react';
import { useStore } from './store';

type Tab = 'dashboard' | 'add' | 'schedule' | 'history' | 'players';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [prefilledMatch, setPrefilledMatch] = useState<{ t1p1: string; t1p2: string; t2p1: string; t2p2: string } | undefined>(undefined);
  const { fetchDataFromServer, isLoading, error } = useStore();

  useEffect(() => {
    // Luôn khóa cứng ứng dụng ở giao diện Tối (Dark mode)
    document.documentElement.classList.remove('light');
    
    // Fetch dữ liệu mới nhất từ server Express khi ứng dụng khởi chạy
    fetchDataFromServer();
  }, [fetchDataFromServer]);

  const handleFillMatch = (matchData: { t1p1: string; t1p2: string; t2p1: string; t2p2: string }) => {
    setPrefilledMatch(matchData);
    setActiveTab('add');
  };

  const renderDbStatus = () => {
    const isGoogleSheets = !!import.meta.env.VITE_GOOGLE_SCRIPT_URL;

    if (isLoading) {
      return (
        <div className="flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[9px] sm:text-[10px] font-bold text-amber-400">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span>Đang tải...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-[9px] sm:text-[10px] font-bold text-rose-400">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse" />
          <span>Mất kết nối</span>
        </div>
      );
    }

    if (isGoogleSheets) {
      return (
        <div className="flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] sm:text-[10px] font-bold text-emerald-400" title="Kết nối thành công với Google Sheets Database">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span>Đã đồng bộ Sheets</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-[9px] sm:text-[10px] font-bold text-teal-400" title="Chạy ở chế độ lưu trữ cục bộ">
        <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
        <span>Dữ liệu Local</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen text-slate-100 pb-24 md:pb-8 font-sans relative overflow-x-hidden transition-colors duration-300">
      {/* Background Mesh Gradients */}
      <div className="mesh-bg" />

      <header className="glass-header sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="font-bold text-lg sm:text-xl tracking-tight flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl bg-slate-950/40 border border-white/10 flex items-center justify-center shadow-lg shadow-teal-500/5 group hover:border-teal-500/30 transition-all duration-300">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-teal-500/10 to-indigo-500/5 opacity-50 group-hover:opacity-100 transition-opacity" />
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6.5 h-6.5 relative z-1 drop-shadow-[0_0_8px_rgba(45,212,191,0.2)]">
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
              <div className="flex items-center gap-1.5 leading-none">
                <span className="tracking-widest font-black text-sm xs:text-base sm:text-lg bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">BADMIN</span>
                <span className="tracking-widest font-black text-sm xs:text-base sm:text-lg bg-gradient-to-r from-teal-400 to-indigo-400 bg-clip-text text-transparent shadow-teal-500/20">RANK</span>
              </div>
              <span className="text-[8px] uppercase tracking-widest text-teal-400/80 font-bold mt-1 block">Hệ Thống Giải Đấu</span>
            </div>
          </h1>
          <div className="flex items-center gap-2.5">
            {renderDbStatus()}
            <div className="hidden md:flex items-center bg-slate-950/30 border border-white/5 p-1 rounded-xl">
              <button 
                onClick={() => setActiveTab('dashboard')} 
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                  activeTab === 'dashboard' 
                    ? 'bg-gradient-to-r from-teal-500/20 to-indigo-500/10 text-teal-300 border border-teal-500/20 shadow-inner' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <Trophy className={`w-3.5 h-3.5 transition-transform duration-300 ${activeTab === 'dashboard' ? 'scale-110 text-teal-400' : ''}`} /> 
                <span>BXH</span>
              </button>
              <button 
                onClick={() => setActiveTab('schedule')} 
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                  activeTab === 'schedule' 
                    ? 'bg-gradient-to-r from-teal-500/20 to-indigo-500/10 text-teal-300 border border-teal-500/20 shadow-inner' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <CalendarRange className={`w-3.5 h-3.5 transition-transform duration-300 ${activeTab === 'schedule' ? 'scale-110 text-teal-400' : ''}`} /> 
                <span>Xếp Lịch</span>
              </button>
              <button 
                onClick={() => setActiveTab('add')} 
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                  activeTab === 'add' 
                    ? 'bg-gradient-to-r from-teal-500/20 to-indigo-500/10 text-teal-300 border border-teal-500/20 shadow-inner' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <PlusCircle className={`w-3.5 h-3.5 transition-transform duration-300 ${activeTab === 'add' ? 'scale-110 text-teal-400' : ''}`} /> 
                <span>Thêm Trận</span>
              </button>
              <button 
                onClick={() => setActiveTab('history')} 
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                  activeTab === 'history' 
                    ? 'bg-gradient-to-r from-teal-500/20 to-indigo-500/10 text-teal-300 border border-teal-500/20 shadow-inner' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <History className={`w-3.5 h-3.5 transition-transform duration-300 ${activeTab === 'history' ? 'scale-110 text-teal-400' : ''}`} /> 
                <span>Lịch Sử</span>
              </button>
              <button 
                onClick={() => setActiveTab('players')} 
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                  activeTab === 'players' 
                    ? 'bg-gradient-to-r from-teal-500/20 to-indigo-500/10 text-teal-300 border border-teal-500/20 shadow-inner' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <Users className={`w-3.5 h-3.5 transition-transform duration-300 ${activeTab === 'players' ? 'scale-110 text-teal-400' : ''}`} /> 
                <span>Cài Đặt</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 relative z-1">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'schedule' && <MatchScheduler onFillMatch={handleFillMatch} />}
        {activeTab === 'add' && (
          <MatchForm 
            onSaved={() => {
              setPrefilledMatch(undefined);
              setActiveTab('dashboard');
            }} 
            initialData={prefilledMatch}
          />
        )}
        {activeTab === 'history' && <MatchHistory />}
        {activeTab === 'players' && <PlayerManagement />}
      </main>

      {/* Mobile Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-nav flex justify-around p-2 z-10 pb-safe shadow-lg">
        <button 
          onClick={() => setActiveTab('dashboard')} 
          className={`flex flex-col items-center p-2 rounded-lg flex-1 transition-all ${
            activeTab === 'dashboard' ? 'text-teal-400 scale-105' : 'text-slate-400'
          }`}
        >
          <Trophy className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-semibold">BXH</span>
        </button>
        <button 
          onClick={() => setActiveTab('schedule')} 
          className={`flex flex-col items-center p-2 rounded-lg flex-1 transition-all ${
            activeTab === 'schedule' ? 'text-teal-400 scale-105' : 'text-slate-400'
          }`}
        >
          <CalendarRange className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-semibold">Xếp Lịch</span>
        </button>
        <button 
          onClick={() => setActiveTab('add')} 
          className={`flex flex-col items-center p-2 rounded-lg flex-1 transition-all ${
            activeTab === 'add' ? 'text-teal-400 scale-105' : 'text-slate-400'
          }`}
        >
          <PlusCircle className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-semibold">Thêm</span>
        </button>
        <button 
          onClick={() => setActiveTab('history')} 
          className={`flex flex-col items-center p-2 rounded-lg flex-1 transition-all ${
            activeTab === 'history' ? 'text-teal-400 scale-105' : 'text-slate-400'
          }`}
        >
          <History className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-semibold">Lịch Sử</span>
        </button>
        <button 
          onClick={() => setActiveTab('players')} 
          className={`flex flex-col items-center p-2 rounded-lg flex-1 transition-all ${
            activeTab === 'players' ? 'text-teal-400 scale-105' : 'text-slate-400'
          }`}
        >
          <Users className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-semibold">Cài Đặt</span>
        </button>
      </nav>
    </div>
  );
}
