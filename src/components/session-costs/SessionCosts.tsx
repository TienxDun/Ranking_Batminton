import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/button';
import { requireAdminPassword } from '../../utils/adminAuth';
import { PaymentQrPreview, SessionCostDetailModal } from './SessionCostComponents';
import { SessionCostForm } from './SessionCostForm';
import { SessionCostsDashboard } from './SessionCostsDashboard';
import { useSessionCostsController } from './useSessionCostsController';

export default function SessionCosts() {
  const {
    courts, selectedGroupId, config, setConfig, editingId, date, courtId, costs,
    participantIds, notes, courtNumber, notification, deletingId, setDeletingId,
    deletingCourtId, setDeletingCourtId, showForm, showCourtManager,
    setShowCourtManager, newCourtName, setNewCourtName, newCourtMapUrl,
    setNewCourtMapUrl, formQrPreviewOpen, setFormQrPreviewOpen, viewingSession,
    setViewingSession, activePlayers, currentDateKey, sortedSessions,
    totalAllSessionsCost, totalCost, splits, perPerson, autoDetectedIds,
    selectedCourt, resetForm, openNewForm, openEditForm, handleDateChange,
    toggleParticipant, handleLineChange, handleSave, handleDelete, handleAddCourt,
    handleDeleteCourt, getPlayerName, getCourtName, costLineKeys,
    costPlaceholders, setCourtId, setCourtNumber, setCosts, setNotes,
  } = useSessionCostsController();

  return (
    <div className="space-y-6">
      {notification && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${
          notification.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span className="text-sm font-medium">{notification.text}</span>
        </div>
      )}

      {showForm ? (
        <SessionCostForm model={{
          editingId, date, courtId, courtNumber, costs, notes, participantIds,
          autoDetectedIds, activePlayers, courts, selectedCourt, costLineKeys,
          costPlaceholders, totalCost, perPerson, splits, config, resetForm,
          handleSave, handleDateChange, setCourtId, setCourtNumber, setCosts,
          setNotes, toggleParticipant, handleLineChange, setConfig,
          setFormQrPreviewOpen, getPlayerName,
        }} />
      ) : (
        <SessionCostsDashboard
          sessions={sortedSessions}
          currentDateKey={currentDateKey}
          totalAllSessionsCost={totalAllSessionsCost}
          courts={courts}
          showCourtManager={showCourtManager}
          newCourtName={newCourtName}
          newCourtMapUrl={newCourtMapUrl}
          getCourtName={getCourtName}
          viewSession={setViewingSession}
          editSession={openEditForm}
          requestDeleteSession={setDeletingId}
          toggleCourtManager={() => setShowCourtManager(value => !value)}
          openNewForm={openNewForm}
          handleAddCourt={handleAddCourt}
          setNewCourtName={setNewCourtName}
          setNewCourtMapUrl={setNewCourtMapUrl}
          requestDeleteCourt={setDeletingCourtId}
        />
      )}

      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Xác nhận xóa</h3>
            <p className="text-sm text-slate-400 mb-6">
              Bạn có chắc muốn xóa chi phí buổi đánh này? Hành động không thể hoàn tác.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => handleDelete(deletingId)}
                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white cursor-pointer"
              >
                Xóa
              </Button>
              <Button variant="ghost" onClick={() => setDeletingId(null)} className="flex-1 cursor-pointer">
                Hủy
              </Button>
            </div>
          </div>
        </div>
      )}

      {formQrPreviewOpen && (
        <PaymentQrPreview
          amount={perPerson}
          accountName={config.paymentAccountName}
          onClose={() => setFormQrPreviewOpen(false)}
        />
      )}

      {viewingSession && (
        <SessionCostDetailModal
          session={viewingSession}
          getPlayerName={getPlayerName}
          getCourtName={getCourtName}
          onClose={() => setViewingSession(null)}
          onEdit={() => openEditForm(viewingSession)}
          onDelete={() => {
            if (!requireAdminPassword()) return;
            setDeletingId(viewingSession.id);
          }}
        />
      )}

      {deletingCourtId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Xóa sân</h3>
            <p className="text-sm text-slate-400 mb-6">
              Bạn có chắc muốn xóa sân này? Các buổi đánh cũ vẫn giữ nguyên.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => handleDeleteCourt(deletingCourtId)}
                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white cursor-pointer"
              >
                Xóa
              </Button>
              <Button variant="ghost" onClick={() => setDeletingCourtId(null)} className="flex-1 cursor-pointer">
                Hủy
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
