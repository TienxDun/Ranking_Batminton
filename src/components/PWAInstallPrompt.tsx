import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, Share, MoreVertical } from 'lucide-react';

// Extend Window interface for beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

type Platform = 'android' | 'ios' | 'other';

const DISMISSED_KEY = 'pwa_install_dismissed_at';
const DISMISS_COOLDOWN_DAYS = 7; // Hiện lại sau 7 ngày nếu người dùng bấm "Không, cảm ơn"

function detectPlatform(): Platform {
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';
  return 'other';
}

function isRunningAsApp(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

function wasDismissedRecently(): boolean {
  const ts = localStorage.getItem(DISMISSED_KEY);
  if (!ts) return false;
  const daysAgo = (Date.now() - Number(ts)) / (1000 * 60 * 60 * 24);
  return daysAgo < DISMISS_COOLDOWN_DAYS;
}

export default function PWAInstallPrompt() {
  const [platform, setPlatform] = useState<Platform>('other');
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    const p = detectPlatform();
    setPlatform(p);

    // Không hiển thị nếu đã cài app hoặc bấm "Không" gần đây
    if (isRunningAsApp() || wasDismissedRecently()) return;

    if (p === 'android') {
      // Android: lắng nghe sự kiện beforeinstallprompt của trình duyệt
      const handler = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        setShowPrompt(true);
      };
      window.addEventListener('beforeinstallprompt', handler);
      return () => window.removeEventListener('beforeinstallprompt', handler);
    }

    if (p === 'ios') {
      // iOS: Không có sự kiện tự động, hiện sau 2s
      const timer = setTimeout(() => setShowPrompt(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    setShowPrompt(false);
    setShowIOSGuide(false);
  };

  const handleAndroidInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  if (!showPrompt) return null;

  // ── iOS Guide Modal ─────────────────────────────────────────────────────────
  if (platform === 'ios' && showIOSGuide) {
    return createPortal(
      <div
        className="flex items-end sm:items-center justify-center p-4"
        style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(2,6,23,0.75)', backdropFilter: 'blur(6px)' }}
        onClick={(e) => { if (e.target === e.currentTarget) handleDismiss(); }}
      >
        <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img src="pwa-192x192.png" alt="BadminRank" className="w-10 h-10 rounded-xl border border-white/10" />
              <div>
                <p className="text-sm font-bold text-white">BadminRank</p>
                <p className="text-[10px] text-slate-400">Cài đặt làm ứng dụng</p>
              </div>
            </div>
            <button onClick={handleDismiss} className="text-slate-500 hover:text-white transition-colors p-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Steps */}
          <div className="space-y-3">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Các bước cài đặt trên iOS</p>
            <div className="space-y-2.5">
              <Step number={1} icon={<Share className="w-4 h-4 text-teal-400" />}>
                Nhấn nút <span className="text-teal-400 font-bold">Chia sẻ</span>{' '}
                <span className="inline-block bg-slate-800 border border-white/10 rounded px-1 py-0.5 text-[10px] mx-0.5">⬆</span>{' '}
                ở thanh công cụ Safari phía dưới
              </Step>
              <Step number={2} icon={<span className="text-teal-400 text-base">＋</span>}>
                Cuộn xuống và chọn{' '}
                <span className="text-white font-semibold">"Thêm vào Màn hình chính"</span>
              </Step>
              <Step number={3} icon={<Download className="w-4 h-4 text-teal-400" />}>
                Nhấn <span className="text-white font-semibold">"Thêm"</span> ở góc trên bên phải để hoàn tất
              </Step>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="w-full py-2 text-xs text-slate-400 hover:text-white transition-colors border border-white/10 rounded-xl"
          >
            Không, cảm ơn
          </button>
        </div>
      </div>,
      document.body
    );
  }

  // ── Bottom Banner (Android + iOS initial) ───────────────────────────────────
  return createPortal(
    <div
      style={{ position: 'fixed', bottom: '72px', left: 0, right: 0, zIndex: 9998, padding: '0 12px 8px' }}
    >
      <div className="max-w-lg mx-auto bg-slate-900/95 border border-teal-500/20 rounded-2xl p-3.5 shadow-2xl shadow-teal-950/40 flex items-center gap-3"
        style={{ backdropFilter: 'blur(12px)', animation: 'slideUpBanner 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards' }}
      >
        {/* App Icon */}
        <img
          src="pwa-192x192.png"
          alt="BadminRank"
          className="w-12 h-12 rounded-xl border border-white/10 flex-shrink-0"
        />

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-white leading-tight">Cài BadminRank làm ứng dụng</p>
          <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
            {platform === 'ios'
              ? 'Truy cập nhanh hơn, dùng offline, không cần mở trình duyệt'
              : 'Cài đặt để dùng như app thật sự, hỗ trợ offline'}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {platform === 'android' ? (
            <button
              onClick={handleAndroidInstall}
              className="px-3 py-1.5 bg-teal-500 hover:bg-teal-400 text-white-force text-[11px] font-bold rounded-lg transition-colors whitespace-nowrap"
            >
              Cài đặt
            </button>
          ) : (
            <button
              onClick={() => setShowIOSGuide(true)}
              className="px-3 py-1.5 bg-teal-500 hover:bg-teal-400 text-white-force text-[11px] font-bold rounded-lg transition-colors whitespace-nowrap"
            >
              Hướng dẫn
            </button>
          )}
          <button
            onClick={handleDismiss}
            className="text-slate-500 hover:text-white transition-colors p-1"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Helper component ──────────────────────────────────────────────────────────
function Step({ number, icon, children }: { number: number; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-500/15 border border-teal-500/30 flex items-center justify-center">
        <span className="text-[10px] font-black text-teal-400">{number}</span>
      </div>
      <div className="flex items-start gap-2 pt-0.5">
        <span className="flex-shrink-0 mt-px">{icon}</span>
        <p className="text-xs text-slate-300 leading-relaxed">{children}</p>
      </div>
    </div>
  );
}
