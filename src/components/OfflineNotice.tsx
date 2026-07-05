import { WifiOff } from 'lucide-react';

export default function OfflineNotice() {
  return (
    <div
      className="max-w-4xl mx-auto px-4 pt-6 pb-0 relative z-1"
      role="status"
      aria-live="polite"
    >
      <div className="offline-alert flex items-start gap-3 p-4 rounded-2xl backdrop-blur-md shadow-lg">
        <div className="offline-alert-icon p-2 rounded-xl flex-shrink-0">
          <WifiOff className="w-5 h-5" />
        </div>
        <div>
          <p className="font-bold text-sm leading-snug">Bạn đang offline</p>
          <p className="offline-alert-message text-xs mt-0.5 leading-relaxed">
            Tạm dừng ghi điểm cho đến khi có mạng để tránh dữ liệu chỉ lưu trên máy và chưa cập nhật lên hệ thống.
          </p>
        </div>
      </div>
    </div>
  );
}
