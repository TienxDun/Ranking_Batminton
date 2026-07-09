import React from 'react';
import { Calendar, ExternalLink, MapPin, QrCode, Users, X } from 'lucide-react';
import paymentQrImage from '../../../assets/QR.jpg';
import { Court, LeaderboardConfig, Player, SessionCostBreakdown } from '../../types';
import {
  COST_LINE_LABELS,
  COST_LINE_UNITS,
  CostLineKey,
  formatVND,
  getLineTotal,
} from '../../utils/costUtils';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { CostLineRow, PaymentQrPanel } from './SessionCostComponents';

type Split = { playerId: string; amount: number };

export interface SessionCostFormModel {
  editingId: string | null;
  date: string;
  courtId: string;
  courtNumber: string;
  costs: SessionCostBreakdown;
  notes: string;
  participantIds: string[];
  autoDetectedIds: string[];
  activePlayers: Player[];
  courts: Court[];
  selectedCourt?: Court;
  costLineKeys: CostLineKey[];
  costPlaceholders: Record<CostLineKey, string>;
  totalCost: number;
  perPerson: number;
  splits: Split[];
  config: LeaderboardConfig;
  resetForm: () => void;
  handleSave: (event: React.FormEvent) => void;
  handleDateChange: (date: string) => void;
  setCourtId: React.Dispatch<React.SetStateAction<string>>;
  setCourtNumber: React.Dispatch<React.SetStateAction<string>>;
  setCosts: React.Dispatch<React.SetStateAction<SessionCostBreakdown>>;
  setNotes: React.Dispatch<React.SetStateAction<string>>;
  toggleParticipant: (playerId: string) => void;
  handleLineChange: (key: CostLineKey, item: SessionCostBreakdown[CostLineKey]) => void;
  setConfig: (config: LeaderboardConfig) => void;
  setFormQrPreviewOpen: React.Dispatch<React.SetStateAction<boolean>>;
  getPlayerName: (id: string) => string;
}

function SessionInfoFields({ model }: { model: SessionCostFormModel }) {
  const { date, handleDateChange, autoDetectedIds, courtId, setCourtId, courts, selectedCourt, courtNumber, setCourtNumber } = model;
  return (
    <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-teal-400" />
                    Ngày buổi đánh
                  </label>
                  <Input
                    type="date"
                    value={date}
                    onChange={e => handleDateChange(e.target.value)}
                    className="w-full h-10"
                  />
                  {autoDetectedIds.length > 0 && (
                    <p className="text-xs text-slate-400">
                      Tự động phát hiện {autoDetectedIds.length} người chơi từ các trận cùng ngày
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-teal-400" />
                    Sân đánh
                  </label>
                  <Select
                    value={courtId}
                    onChange={e => setCourtId(e.target.value)}
                    className="h-10"
                  >
                    <option value="">-- Chọn sân --</option>
                    {courts.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </Select>
                  {courts.length === 0 && (
                    <p className="text-xs text-slate-400">
                      Chưa có sân. Mở &quot;Quản lý chung&quot; để thêm bằng URL Google Maps.
                    </p>
                  )}
                  {selectedCourt && (
                    <a
                      href={selectedCourt.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300"
                    >
                      Xem vị trí sân trên Google Maps <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                {/* Số sân cụ thể */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200 flex items-center gap-2">
                    <span className="w-4 h-4 text-teal-400 text-base leading-none flex items-center justify-center font-black">#</span>
                    Số sân (tùy chọn)
                  </label>
                  <Input
                    type="text"
                    placeholder="VD: 5, 10, A3..."
                    value={courtNumber}
                    onChange={e => setCourtNumber(e.target.value)}
                    className="h-10"
                  />
                  <p className="text-xs text-slate-500">Số sân cụ thể trong địa điểm, nếu có nhiều sân</p>
                </div>
              </div>
    </>
  );
}

function CostFields({ model }: { model: SessionCostFormModel }) {
  const { costLineKeys, costPlaceholders, costs, handleLineChange, setCosts, notes, setNotes } = model;
  return (
    <>
              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-200">Chi phí (đơn giá × số lượng)</p>
                {costLineKeys.map(key => (
                  <CostLineRow
                    key={key}
                    label={COST_LINE_LABELS[key]}
                    unitLabel={COST_LINE_UNITS[key]}
                    item={costs[key]}
                    unitPricePlaceholder={costPlaceholders[key]}
                    onChange={item => handleLineChange(key, item)}
                  />
                ))}
              </div>

              {getLineTotal(costs.other) > 0 && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-200">Ghi chú tiền khác</label>
                  <Input
                    placeholder="VD: gửi xe, thuê vợt..."
                    value={costs.otherNote || ''}
                    onChange={e => setCosts(prev => ({ ...prev, otherNote: e.target.value }))}
                    className="h-10"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-200">Ghi chú buổi đánh (tùy chọn)</label>
                <Input
                  placeholder="VD: buổi tối, sân trong nhà..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="h-10"
                />
              </div>
    </>
  );
}

function ParticipantSelector({ model }: { model: SessionCostFormModel }) {
  const { participantIds, activePlayers, autoDetectedIds, toggleParticipant } = model;
  return (
    <>
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-200 flex items-center gap-2">
                  <Users className="w-4 h-4 text-teal-400" />
                  Người tham gia ({participantIds.length})
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {activePlayers.map(p => {
                    const isSelected = participantIds.includes(p.id);
                    const isAuto = autoDetectedIds.includes(p.id);
                    return (
                      <label
                        key={p.id}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-teal-500/10 border-teal-500/30 text-teal-300'
                            : 'bg-white/5 border-white/5 text-slate-400 hover:border-white/10'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleParticipant(p.id)}
                          className="rounded accent-teal-500"
                        />
                        <span className="text-sm font-medium truncate">{p.name}</span>
                        {isAuto && !isSelected && (
                          <span className="text-[10px] text-slate-500 ml-auto">trận</span>
                        )}
                      </label>
                    );
                  })}
                </div>
                {activePlayers.length === 0 && (
                  <p className="text-sm text-slate-400">Chưa có người chơi. Thêm người chơi trong tab Cài Đặt.</p>
                )}
              </div>
    </>
  );
}

function CostSummary({ model }: { model: SessionCostFormModel }) {
  const { participantIds, totalCost, perPerson, config, setConfig, setFormQrPreviewOpen, splits, getPlayerName } = model;
  return (
    <>
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="grid grid-cols-3 gap-2 sm:gap-3 p-3 sm:p-4 bg-gradient-to-r from-teal-500/10 to-indigo-500/5 border border-teal-500/20 rounded-xl flex-1">
                  <div className="text-center sm:text-left min-w-0">
                    <p className="text-[10px] sm:text-xs text-slate-400 mb-1 whitespace-nowrap">Tổng chi phí</p>
                    <p className="text-sm sm:text-lg font-bold text-white whitespace-nowrap tabular-nums">{formatVND(totalCost)}</p>
                  </div>
                  <div className="text-center sm:text-left min-w-0">
                    <p className="text-[10px] sm:text-xs text-slate-400 mb-1 whitespace-nowrap">Số người</p>
                    <p className="text-sm sm:text-lg font-bold text-white tabular-nums">{participantIds.length}</p>
                  </div>
                  <div className="text-center sm:text-left min-w-0">
                    <p className="text-[10px] sm:text-xs text-slate-400 mb-1 whitespace-nowrap">Mỗi người</p>
                    <p className="text-sm sm:text-lg font-bold text-teal-400 whitespace-nowrap tabular-nums">{formatVND(perPerson)}</p>
                  </div>
                </div>

                {perPerson > 0 && (
                  <div className="flex flex-col items-center justify-center gap-1 lg:w-44 flex-shrink-0 p-3 bg-white/5 border border-teal-500/20 rounded-xl">
                    <p className="text-[10px] text-slate-400 whitespace-nowrap">Quét để chuyển</p>
                    <button
                      type="button"
                      onClick={() => setFormQrPreviewOpen(true)}
                      className="w-28 h-28 rounded-lg bg-white p-1.5 cursor-zoom-in transition-transform hover:scale-[1.02]"
                      aria-label="Phóng to mã QR nhận tiền"
                    >
                      <img
                        src={paymentQrImage}
                        alt="QR nhận tiền"
                        className="w-full h-full object-contain"
                      />
                    </button>
                    <p className="text-sm font-bold text-teal-400 tabular-nums whitespace-nowrap">{formatVND(perPerson)}</p>
                    {config.paymentAccountName && (
                      <p className="text-[10px] text-slate-400 truncate max-w-full">{config.paymentAccountName}</p>
                    )}
                  </div>
                )}
              </div>

              {participantIds.length > 0 && totalCost > 0 && (
                <Table className="text-xs sm:text-sm">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap px-2 sm:px-4">Người chơi</TableHead>
                      <TableHead className="text-right whitespace-nowrap px-2 sm:px-4">Số tiền</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {splits.map(({ playerId, amount }) => (
                      <TableRow key={playerId}>
                        <TableCell className="whitespace-nowrap px-2 sm:px-4 py-2">{getPlayerName(playerId)}</TableCell>
                        <TableCell className="text-right font-semibold text-teal-400 whitespace-nowrap px-2 sm:px-4 py-2 tabular-nums">
                          {formatVND(amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
    </>
  );
}

function FormActions({ model }: { model: SessionCostFormModel }) {
  const { editingId, resetForm } = model;
  return (
    <>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button type="submit" className="flex-1 bg-teal-500 hover:bg-teal-600 text-white-force font-bold cursor-pointer">
                  {editingId ? 'Cập nhật' : 'Lưu buổi đánh'}
                </Button>
                <Button type="button" variant="ghost" onClick={resetForm} className="cursor-pointer">
                  Hủy
                </Button>
              </div>
    </>
  );
}

export function SessionCostForm({ model }: { model: SessionCostFormModel }) {
  const { editingId, resetForm, handleSave } = model;

  return (
        /* Form view: full width when adding/editing */
        <Card>
          <CardHeader className="text-center sm:text-left">
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="text-sm xs:text-base sm:text-lg font-bold text-white">
                  {editingId ? 'CHỈNH SỬA CHI PHÍ' : 'THÊM CHI PHÍ BUỔI ĐÁNH'}
                </CardTitle>
                <CardDescription>Nhập đơn giá × số lượng và chọn người tham gia để chia tiền</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={resetForm} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              <SessionInfoFields model={model} />

              <CostFields model={model} />

              <ParticipantSelector model={model} />

              <CostSummary model={model} />

              <FormActions model={model} />
            </form>
          </CardContent>
        </Card>

  );
}
