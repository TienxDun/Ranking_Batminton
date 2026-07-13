import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import paymentQrImage from '../../../assets/QR.jpg';
import { useStore } from '../../store';
import { CostLineItem, SessionCost } from '../../types';
import {
  COST_LINE_LABELS,
  COST_LINE_UNITS,
  CostLineKey,
  formatVND,
  getLineTotal,
  getTotalCost,
  isValidMapUrl,
  normalizeCostBreakdown,
  parseCostInput,
  parseQuantityInput,
  splitCostEqually,
} from '../../utils/costUtils';
import { useModalHistory } from '../../hooks/useModalHistory';
import { formatSessionDate } from './sessionCostDate';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Input } from '../ui/input';
import { Download, ExternalLink, MapPin, Pencil, QrCode, Trash2, Users, Wallet, X } from 'lucide-react';



function downloadPaymentQr() {
  const confirmed = window.confirm('Tải ảnh QR này về máy?');
  if (!confirmed) return;

  const link = document.createElement('a');
  link.href = paymentQrImage;
  link.download = 'ma-qr-nhan-tien.png';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function PaymentQrPreview({
  amount,
  accountName,
  onClose,
}: {
  amount?: number;
  accountName?: string;
  onClose: () => void;
}) {
  useModalHistory(onClose);
  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Phóng to mã QR nhận tiền"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm sm:max-w-md bg-slate-900 border border-white/10 rounded-2xl p-4 sm:p-5 shadow-2xl pt-safe-modal"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-white">Mã QR nhận tiền</h3>
            {accountName && (
              <p className="text-xs text-slate-400 truncate">{accountName}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-slate-400 hover:text-white cursor-pointer p-2"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="bg-white rounded-xl p-3 sm:p-4">
          <img
            src={paymentQrImage}
            alt="Mã QR nhận tiền phóng to"
            className="w-full aspect-square object-contain"
          />
        </div>

        {amount !== undefined && amount > 0 && (
          <p className="mt-4 text-center text-lg font-bold text-teal-400 tabular-nums">
            {formatVND(amount)}
          </p>
        )}

        <Button
          type="button"
          onClick={downloadPaymentQr}
          className="mt-4 w-full bg-teal-500 hover:bg-teal-600 text-white-force font-bold cursor-pointer"
        >
          <Download className="w-4 h-4 mr-2" />
          Tải ảnh QR
        </Button>
      </div>
    </div>,
    document.body
  );
}

export function PaymentQrPanel({
  highlightAmount,
  compact = false,
}: {
  highlightAmount?: number;
  compact?: boolean;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <>
      <Card className={`border-teal-500/15 bg-gradient-to-br from-teal-500/5 to-transparent ${compact ? 'p-2' : ''}`}>
        {!compact ? (
          <CardHeader className="pb-3 text-center sm:text-left">
            <CardTitle className="text-sm sm:text-base font-bold text-white flex items-center justify-center sm:justify-start gap-2">
              <QrCode className="w-4 h-4 text-teal-400" />
              MÃ QR NHẬN TIỀN
            </CardTitle>
            <CardDescription>
              Quét mã để chuyển khoản
            </CardDescription>
          </CardHeader>
        ) : (
          <div className="p-2 pb-1 text-center">
            <h4 className="text-xs font-bold text-teal-400 flex items-center justify-center gap-1.5 uppercase tracking-wider">
              <QrCode className="w-3.5 h-3.5" />
              QR chuyển khoản
            </h4>
          </div>
        )}
        <CardContent className={compact ? 'p-2 pt-1' : ''}>
          <div className={`flex flex-col items-center ${compact ? 'gap-2' : 'gap-4'}`}>
            <div className="flex-shrink-0">
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className={`rounded-xl bg-white p-1.5 border border-white/10 shadow-md flex items-center justify-center cursor-zoom-in transition-transform hover:scale-[1.01] ${
                  compact ? 'w-28 h-28' : 'w-36 h-36 sm:w-40 sm:h-40'
                }`}
                aria-label="Phóng to mã QR nhận tiền"
              >
                <img
                  src={paymentQrImage}
                  alt="Mã QR nhận tiền"
                  className="w-full h-full object-contain"
                />
              </button>
            </div>
            {highlightAmount !== undefined && highlightAmount > 0 && (
              <p className={`text-center font-black text-teal-400 whitespace-nowrap tabular-nums ${compact ? 'text-xs mt-0.5' : 'text-sm'}`}>
                {formatVND(highlightAmount)}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
      {previewOpen && (
        <PaymentQrPreview
          amount={highlightAmount}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </>
  );
}

export function CostLineRow({
  label,
  unitLabel,
  item,
  unitPricePlaceholder,
  onChange,
}: {
  key?: React.Key;
  label: string;
  unitLabel: string;
  item: CostLineItem;
  unitPricePlaceholder: string;
  onChange: (item: CostLineItem) => void;
}) {
  const total = getLineTotal(item);

  return (
    <div className="p-3 sm:p-4 bg-white/5 border border-white/5 rounded-xl space-y-2">
      <label className="text-sm font-medium text-slate-200">{label}</label>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex-1 min-w-0">
            <span className="text-[10px] text-slate-500 block mb-1">Đơn giá</span>
            <Input
              type="text"
              inputMode="numeric"
              placeholder={unitPricePlaceholder}
              value={item.unitPrice === 0 ? '' : String(item.unitPrice)}
              onChange={e => onChange({ ...item, unitPrice: parseCostInput(e.target.value) })}
              className="h-9"
            />
          </div>
          <span className="text-slate-500 font-medium pt-4">×</span>
          <div className="w-20 sm:w-24 flex-shrink-0">
            <span className="text-[10px] text-slate-500 block mb-1">SL ({unitLabel})</span>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="1"
              value={item.quantity === 0 ? '' : String(item.quantity)}
              onChange={e => onChange({ ...item, quantity: parseQuantityInput(e.target.value) })}
              className="h-9 text-center"
            />
          </div>
        </div>
        <div className="sm:text-right sm:min-w-[120px] pt-1 sm:pt-4 flex-shrink-0">
          <span className="text-[10px] text-slate-500 block sm:hidden mb-0.5">Thành tiền</span>
          <span className={`text-sm font-bold whitespace-nowrap tabular-nums ${total > 0 ? 'text-teal-400' : 'text-slate-500'}`}>
            = {formatVND(total)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function SessionCostDetailModal({
  session,
  getPlayerName,
  getCourtName,
  onClose,
  onEdit,
  onDelete,
}: {
  session: SessionCost;
  getPlayerName: (id: string) => string;
  getCourtName: (id?: string) => string | undefined;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { courts } = useStore();
  useModalHistory(onClose);
  const court = courts.find(c => c.id === session.courtId);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const normalized = normalizeCostBreakdown(session.costs);
  const total = getTotalCost(normalized);
  const splits = splitCostEqually(total, session.participantIds);
  const perPerson = splits[0]?.amount ?? 0;
  const costLineKeys: CostLineKey[] = ['court', 'water', 'shuttlecock', 'other'];
  const activeCostLines = costLineKeys
    .map(key => ({ key, item: normalized[key], total: getLineTotal(normalized[key]) }))
    .filter(line => line.total > 0);

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 p-3 backdrop-blur-md sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Chi tiết chi phí ngày ${formatSessionDate(session.date)}`}
      onClick={onClose}
    >
      <div
        className="modal-surface flex max-h-[calc(100dvh-1.5rem)] w-full max-w-4xl flex-col overflow-hidden border border-white/10 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="relative flex-shrink-0 border-b border-white/10 bg-slate-900 p-3 pr-14 sm:p-4 sm:pr-14 pt-safe-modal-p3">
          <div className="flex items-center gap-1.5 text-teal-600 mb-1">
            <Wallet className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Chi tiết chi phí</span>
          </div>
          <h3 className="text-lg font-black text-white">{formatSessionDate(session.date)}</h3>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <p className="text-xs text-slate-400">
              {getCourtName(session.courtId) || 'Chưa chọn sân'}
            </p>
            {session.courtNumber && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-teal-500/15 border border-teal-500/25 text-[10px] font-bold text-teal-400">
                # Sân {session.courtNumber}
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute right-3 top-safe-btn-2.5 z-20 cursor-pointer p-2 text-slate-400 hover:bg-white/5 hover:text-white"
            aria-label="Đóng chi tiết chi phí"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto scroll-hide p-3.5 space-y-3.5">
          {/* Summary Row */}
          <div className={`grid gap-2 ${session.courtNumber ? 'grid-cols-2 sm:grid-cols-5' : 'grid-cols-2 sm:grid-cols-4'}`}>
            {[
              ['Tổng', formatVND(total), 'text-white', false],
              ['Người', String(session.participantIds.length), 'text-white', false],
              ['Mỗi người', formatVND(perPerson), 'text-teal-400', false],
              ['Sân', getCourtName(session.courtId) || 'N/A', 'text-slate-200', true],
              ...(session.courtNumber ? [['Số sân', `# ${session.courtNumber}`, 'text-teal-300', false] as [string, string, string, boolean]] : []),
            ].map(([label, value, color, isCourtCard]) => {
              const hasMap = isCourtCard && court?.mapUrl && isValidMapUrl(court.mapUrl);

              return (
                <div
                  key={label}
                  className={`min-w-0 rounded-xl border border-white/5 bg-white/5 p-2 transition-colors ${
                    hasMap ? 'hover:bg-white/10 border-emerald-500/25 cursor-pointer' : ''
                  }`}
                  onClick={hasMap ? () => window.open(court.mapUrl, '_blank', 'noopener,noreferrer') : undefined}
                  title={hasMap ? 'Click để mở Google Maps' : value}
                >
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
                    {hasMap && <ExternalLink className="w-2.5 h-2.5 text-emerald-400" />}
                  </div>
                  <p className={`mt-0.5 truncate text-xs sm:text-sm font-black tabular-nums ${color}`}>
                    {value}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-3.5">
            {/* Left Column: Consolidated Details Card & Participants Card */}
            <div className="space-y-3.5 min-w-0">
              <Card className="border-teal-500/15 bg-gradient-to-br from-teal-500/[0.01] to-transparent">
                <CardHeader className="p-2 pb-1.5">
                  <CardTitle className="text-xs flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-teal-400" />
                    Chi tiết dịch vụ
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 pt-0 space-y-2">
                  {/* Expenses List */}
                  <div className="divide-y divide-white/5 border border-white/5 rounded-lg bg-slate-950/30 overflow-hidden">
                    {activeCostLines.length === 0 ? (
                      <p className="text-xs text-slate-500 italic p-2">Không có khoản chi.</p>
                    ) : activeCostLines.map(({ key, item, total: lineTotal }) => (
                      <div key={key} className="flex items-center justify-between gap-3 p-2 text-xs">
                        <div className="min-w-0">
                          <span className="font-bold text-slate-200">
                            {COST_LINE_LABELS[key]}
                          </span>
                          <span className="text-[10px] text-slate-500 ml-2">
                            ({formatVND(item.unitPrice)} x {item.quantity} {COST_LINE_UNITS[key]})
                          </span>
                        </div>
                        <span className="font-black text-teal-400 whitespace-nowrap tabular-nums">
                          {formatVND(lineTotal)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Notes inline at the bottom of details card */}
                  {session.notes && (
                    <div className="pt-2 border-t border-white/5 text-[11px] text-slate-400 leading-relaxed">
                      <span className="font-bold text-slate-500 uppercase text-[9px] tracking-wider inline mr-1">Ghi chú:</span>
                      {session.notes}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Participants List */}
              <Card className="border-indigo-500/15">
                <CardHeader className="p-2 pb-1.5">
                  <CardTitle className="text-xs flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-indigo-400" />
                    Người tham gia
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 pt-0">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {splits.map(({ playerId, amount }) => (
                      <div key={playerId} className="flex items-center justify-between gap-2 rounded-lg bg-white/[0.02] border border-white/5 px-2 py-1 text-xs">
                        <span className="font-semibold text-slate-200 truncate">{getPlayerName(playerId)}</span>
                        <span className="font-bold text-teal-400 whitespace-nowrap tabular-nums">{formatVND(amount)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Payment QR & Court Maps */}
            <div className="flex flex-col gap-3">
              <PaymentQrPanel highlightAmount={perPerson} compact />

              {court && (
                <Card className="border-emerald-500/15 bg-gradient-to-br from-emerald-500/[0.01] to-transparent p-2">
                  <div className="flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0 text-emerald-400 border border-emerald-500/15">
                        <MapPin className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] text-slate-400 uppercase font-semibold leading-none">Địa chỉ sân</p>
                        <p className="font-bold text-slate-200 text-xs mt-0.5 truncate" title={court.name}>
                          {court.name}
                        </p>
                      </div>
                    </div>
                    {court.mapUrl && isValidMapUrl(court.mapUrl) ? (
                      <a
                        href={court.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 flex items-center gap-0.5 px-2 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/15 text-emerald-400 hover:text-emerald-300 text-[10px] font-bold transition-all cursor-pointer"
                      >
                        Bản đồ <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    ) : (
                      <span className="text-[9px] text-slate-500 italic flex-shrink-0">Chưa gắn địa chỉ</span>
                    )}
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Footer actions — chỉ hiện trên mobile (sm:hidden) */}
        <div className="sm:hidden flex-shrink-0 border-t border-white/10 bg-slate-900 p-3 px-4 flex gap-2.5">
          <Button
            variant="ghost"
            className="flex-1 h-9 text-xs font-bold bg-teal-500/10 text-teal-400 border border-teal-500/20 hover:bg-teal-500/20 hover:text-teal-300 active:scale-95 transition-all duration-200 rounded-lg cursor-pointer gap-1.5"
            onClick={() => { onClose(); onEdit(); }}
          >
            <Pencil className="w-3.5 h-3.5 text-teal-400" />
            Chỉnh sửa
          </Button>
          <Button
            variant="ghost"
            className="flex-1 h-9 text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 hover:text-rose-300 active:scale-95 transition-all duration-200 rounded-lg cursor-pointer gap-1.5"
            onClick={() => { onClose(); onDelete(); }}
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            Xóa
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

