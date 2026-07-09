import React from 'react';
import { Activity, ExternalLink, MapPin, Pencil, Plus, Trash2, Wallet } from 'lucide-react';
import { Court, SessionCost } from '../../types';
import { formatVND, getTotalCost, normalizeCostBreakdown, splitCostEqually } from '../../utils/costUtils';
import { requireAdminPassword } from '../../utils/adminAuth';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { PaymentQrPanel } from './SessionCostComponents';
import { formatSessionDate, getSessionDateMeta } from './sessionCostDate';

export interface SessionCostsDashboardProps {
  sessions: SessionCost[];
  currentDateKey: string;
  totalAllSessionsCost: number;
  courts: Court[];
  showCourtManager: boolean;
  newCourtName: string;
  newCourtMapUrl: string;
  getCourtName: (id?: string) => string | undefined;
  viewSession: (session: SessionCost) => void;
  editSession: (session: SessionCost) => void;
  requestDeleteSession: (id: string) => void;
  toggleCourtManager: () => void;
  openNewForm: () => void;
  handleAddCourt: (event: React.FormEvent) => void;
  setNewCourtName: React.Dispatch<React.SetStateAction<string>>;
  setNewCourtMapUrl: React.Dispatch<React.SetStateAction<string>>;
  requestDeleteCourt: (id: string) => void;
}

function SessionHistory(props: SessionCostsDashboardProps) {
  const { sessions: sortedSessions, currentDateKey, totalAllSessionsCost,
  courts, showCourtManager, newCourtName, newCourtMapUrl, getCourtName,
  viewSession: setViewingSession, editSession: openEditForm,
  requestDeleteSession: setDeletingId, toggleCourtManager, openNewForm,
  handleAddCourt, setNewCourtName, setNewCourtMapUrl,
  requestDeleteCourt: setDeletingCourtId } = props;
  return (
    <>
          <Card>
            <CardHeader className="text-center sm:text-left">
              <CardTitle className="text-sm xs:text-base sm:text-lg font-bold text-white">LỊCH SỬ CHI PHÍ</CardTitle>
              <CardDescription>Các buổi đánh đã ghi nhận chi phí</CardDescription>
            </CardHeader>
            <CardContent>
              {sortedSessions.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">
                  Chưa có buổi đánh nào. Nhấn &quot;Thêm buổi đánh&quot; để bắt đầu.
                </p>
              ) : (
                <div className="overflow-x-auto -mx-1 sm:mx-0">
                  <Table className="text-xs sm:text-sm min-w-0">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap px-1.5 sm:px-2.5 py-2 sm:py-2.5">Ngày</TableHead>
                        <TableHead className="hidden sm:table-cell whitespace-nowrap px-1.5 sm:px-2.5">Trạng thái</TableHead>
                        <TableHead className="hidden md:table-cell whitespace-nowrap px-1.5 sm:px-2.5">Sân</TableHead>
                        <TableHead className="text-right hidden sm:table-cell whitespace-nowrap px-1.5 sm:px-2.5">Tổng</TableHead>
                        <TableHead className="text-center whitespace-nowrap px-1.5 sm:px-2.5 w-10 sm:w-auto">Người</TableHead>
                        <TableHead className="text-right whitespace-nowrap px-1.5 sm:px-2.5">
                          <span className="sm:hidden">Đ/người</span>
                          <span className="hidden sm:inline">Mỗi người</span>
                        </TableHead>
                        <TableHead className="hidden sm:table-cell text-center whitespace-nowrap px-1 sm:px-2 w-14 sm:w-20">
                          <span>Hành động</span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedSessions.map(session => {
                        const normalized = normalizeCostBreakdown(session.costs);
                        const total = getTotalCost(normalized);
                        const count = session.participantIds.length;
                        const each = count > 0 ? splitCostEqually(total, session.participantIds)[0]?.amount ?? 0 : 0;
                        const dateMeta = getSessionDateMeta(session.date, currentDateKey);
                        return (
                          <TableRow
                            key={session.id}
                            role="button"
                            tabIndex={0}
                            title={`Xem chi tiết chi phí ngày ${formatSessionDate(session.date)}`}
                            className={`cursor-pointer transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-400 ${dateMeta.rowClass}`}
                            onClick={() => setViewingSession(session)}
                            onKeyDown={e => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  setViewingSession(session);
                              }
                            }}
                          >
                            <TableCell className="font-medium px-1.5 sm:px-2.5 py-2 sm:py-2.5">
                              <div className="flex flex-col gap-0.5">
                                <span className="inline-flex items-center gap-1.5 whitespace-nowrap tabular-nums">
                                  <span className={`${dateMeta.markerClass} sm:hidden`} aria-hidden="true" />
                                  {formatSessionDate(session.date)}
                                </span>
                                {/* Sân + số sân — chỉ hiện trên mobile, ẩn từ md trở lên */}
                                {(session.courtId || session.courtNumber) && (
                                  <span className="md:hidden flex items-center gap-1 flex-wrap">
                                    {session.courtId && (
                                      <span className="text-[10px] text-slate-500 truncate max-w-[90px]">
                                        {getCourtName(session.courtId)}
                                      </span>
                                    )}
                                    {session.courtNumber && (
                                      <span className="flex-shrink-0 px-1 py-0.5 rounded text-[9px] font-bold bg-teal-500/15 text-teal-400 border border-teal-500/20">
                                        #{session.courtNumber}
                                      </span>
                                    )}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell whitespace-nowrap px-1.5 sm:px-2.5">
                              <span className={dateMeta.badgeClass}>
                                {dateMeta.label}
                              </span>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-slate-400 text-sm px-1.5 sm:px-2.5">
                              <span className="flex items-center gap-1.5 min-w-0">
                                <span className="truncate max-w-[80px]">{getCourtName(session.courtId) || '—'}</span>
                                {session.courtNumber && (
                                  <span className="flex-shrink-0 px-1 py-0.5 rounded text-[9px] font-bold bg-teal-500/15 text-teal-400 border border-teal-500/20">
                                    #{session.courtNumber}
                                  </span>
                                )}
                              </span>
                            </TableCell>
                            <TableCell className="text-right hidden sm:table-cell text-slate-300 whitespace-nowrap px-1.5 sm:px-2.5 tabular-nums">
                              {formatVND(total)}
                            </TableCell>
                            <TableCell className="text-center whitespace-nowrap px-1.5 sm:px-2.5 tabular-nums">{count}</TableCell>
                            <TableCell className="text-right font-semibold text-teal-400 whitespace-nowrap px-1.5 sm:px-2.5 tabular-nums">
                              {formatVND(each)}
                            </TableCell>
                            <TableCell className="hidden sm:table-cell px-1 sm:px-2 py-1.5 sm:py-2">
                              <div className="flex items-center justify-center gap-0.5 sm:gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={e => {
                                    e.stopPropagation();
                                    openEditForm(session);
                                  }}
                                  className="text-teal-400 hover:text-teal-300 hover:bg-teal-500/10 cursor-pointer p-1 sm:p-1.5"
                                  aria-label={`Sửa chi phí ngày ${formatSessionDate(session.date)}`}
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={e => {
                                    e.stopPropagation();
                                    if (!requireAdminPassword()) return;
                                    setDeletingId(session.id);
                                  }}
                                  className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 cursor-pointer p-1 sm:p-1.5"
                                  aria-label={`Xóa chi phí ngày ${formatSessionDate(session.date)}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
    </>
  );
}

function SessionCostSummary(props: SessionCostsDashboardProps) {
  const { sessions: sortedSessions, currentDateKey, totalAllSessionsCost,
  courts, showCourtManager, newCourtName, newCourtMapUrl, getCourtName,
  viewSession: setViewingSession, editSession: openEditForm,
  requestDeleteSession: setDeletingId, toggleCourtManager, openNewForm,
  handleAddCourt, setNewCourtName, setNewCourtMapUrl,
  requestDeleteCourt: setDeletingCourtId } = props;
  const groupSessionCosts = sortedSessions;
  return (
    <>
          {/* Top row: Stats and QR code panel side-by-side */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-4 items-stretch">
            {/* Left Card: Summary Stats and Quick Action Buttons */}
            <Card className="border-teal-500/10 bg-gradient-to-br from-teal-500/[0.02] to-transparent flex flex-col justify-between p-4">
              <div>
                <CardTitle className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-white/5">
                  <Activity className="w-3.5 h-3.5 text-teal-400" />
                  Tổng quan chi phí
                </CardTitle>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="bg-white/5 border border-white/5 rounded-xl p-2.5">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Tổng buổi đánh</p>
                    <p className="text-base font-black text-white mt-0.5 tabular-nums">{groupSessionCosts.length}</p>
                  </div>
                  <div className="bg-white/5 border border-white/5 rounded-xl p-2.5">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Tổng tích lũy</p>
                    <p className="text-base font-black text-teal-400 mt-0.5 tabular-nums">{formatVND(totalAllSessionsCost)}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4">
                <Button
                  variant="ghost"
                  onClick={toggleCourtManager}
                  className="flex-1 text-slate-300 hover:text-white border border-white/10 cursor-pointer h-9 text-xs"
                >
                  <MapPin className="w-3.5 h-3.5 mr-1.5" />
                  {showCourtManager ? 'Ẩn quản lý' : 'Quản lý sân'}
                </Button>
                <Button
                  onClick={openNewForm}
                  className="flex-1 bg-teal-500 hover:bg-teal-600 text-white-force font-bold cursor-pointer h-9 text-xs"
                >
                  <Wallet className="w-3.5 h-3.5 mr-1.5" />
                  Thêm buổi
                </Button>
              </div>
            </Card>

            {/* Right Card: QR Code sidebar */}
            <PaymentQrPanel compact />
          </div>
    </>
  );
}

function CourtManager(props: SessionCostsDashboardProps) {
  const { sessions: sortedSessions, currentDateKey, totalAllSessionsCost,
  courts, showCourtManager, newCourtName, newCourtMapUrl, getCourtName,
  viewSession: setViewingSession, editSession: openEditForm,
  requestDeleteSession: setDeletingId, toggleCourtManager, openNewForm,
  handleAddCourt, setNewCourtName, setNewCourtMapUrl,
  requestDeleteCourt: setDeletingCourtId } = props;
  return (
    <>
          {/* Court Manager (rendered full-width below top row) */}
          {showCourtManager && (
            <Card>
              <CardHeader className="text-center sm:text-left">
                <CardTitle className="text-sm xs:text-base sm:text-lg font-bold text-white flex items-center justify-center sm:justify-start gap-2">
                  <MapPin className="w-4 h-4 text-teal-400" />
                  QUẢN LÝ CHUNG
                </CardTitle>
                <CardDescription className="text-center sm:text-left">Thêm sân bằng URL Google Maps</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleAddCourt} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      placeholder="Tên sân (VD: Sân Cầu Lông ABC)"
                      value={newCourtName}
                      onChange={e => setNewCourtName(e.target.value)}
                      className="h-10"
                    />
                    <Input
                      placeholder="URL Google Maps (https://maps.google.com/...)"
                      value={newCourtMapUrl}
                      onChange={e => setNewCourtMapUrl(e.target.value)}
                      className="h-10"
                    />
                  </div>
                  <Button type="submit" className="bg-teal-500 hover:bg-teal-600 text-white-force font-bold cursor-pointer">
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm sân
                  </Button>
                </form>

                {courts.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">Chưa có sân nào. Dán link Google Maps của sân để thêm.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tên sân</TableHead>
                        <TableHead className="hidden sm:table-cell">Bản đồ</TableHead>
                        <TableHead className="text-center w-24">Hành động</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {courts.map(court => (
                        <TableRow key={court.id}>
                          <TableCell className="font-medium">{court.name}</TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <a
                              href={court.mapUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300"
                            >
                              Xem bản đồ <ExternalLink className="w-3 h-3" />
                            </a>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (!requireAdminPassword()) return;
                                  setDeletingCourtId(court.id);
                                }}
                                className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 cursor-pointer p-1.5"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
    </>
  );
}

export function SessionCostsDashboard({
  sessions: sortedSessions,
  currentDateKey,
  totalAllSessionsCost,
  courts,
  showCourtManager,
  newCourtName,
  newCourtMapUrl,
  getCourtName,
  viewSession: setViewingSession,
  editSession: openEditForm,
  requestDeleteSession,
  toggleCourtManager,
  openNewForm,
  handleAddCourt,
  setNewCourtName,
  setNewCourtMapUrl,
  requestDeleteCourt,
}: SessionCostsDashboardProps) {
  const groupSessionCosts = sortedSessions;
  const setDeletingId = requestDeleteSession;
  const setDeletingCourtId = requestDeleteCourt;

  const dashboardProps: SessionCostsDashboardProps = {
    sessions: sortedSessions, currentDateKey, totalAllSessionsCost, courts,
    showCourtManager, newCourtName, newCourtMapUrl, getCourtName,
    viewSession: setViewingSession, editSession: openEditForm,
    requestDeleteSession: setDeletingId, toggleCourtManager, openNewForm,
    handleAddCourt, setNewCourtName, setNewCourtMapUrl,
    requestDeleteCourt: setDeletingCourtId,
  };

  return (
        /* Dashboard view: top widgets + full width history table */
        <div className="space-y-6">
          {/* Lịch sử chi phí (rendered full-width at the top) */}
          <SessionHistory {...dashboardProps} />

          <SessionCostSummary {...dashboardProps} />

          <CourtManager {...dashboardProps} />
        </div>

  );
}
