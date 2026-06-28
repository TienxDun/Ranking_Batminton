import React, { useState } from 'react';
import { useStore } from '../store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function PlayerManagement() {
  const { players, config, addPlayer, updatePlayer, setConfig } = useStore();
  const [newName, setNewName] = useState('');
  const [newGender, setNewGender] = useState<'male' | 'female'>('male');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showNotification = (type: 'success' | 'error', text: string) => {
    setNotification({ type, text });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      addPlayer(newName.trim(), newGender);
      setNewName('');
      setNewGender('male');
      showNotification('success', `Đã thêm thành viên mới: ${newName.trim()} (${newGender === 'male' ? 'Nam' : 'Nữ'})`);
    }
  };

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

      <Card>
        <CardHeader className="text-center sm:text-left">
          <CardTitle className="text-sm xs:text-base sm:text-lg font-bold text-white whitespace-nowrap">CÀI ĐẶT HỆ THỐNG</CardTitle>
          <CardDescription>Cấu hình chung</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white/5 border border-white/5 rounded-xl text-center sm:text-left">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-200 block">Số trận tối thiểu để vào Bảng Xếp Hạng Chính:</label>
              <p className="text-xs text-slate-400">Yêu cầu tối thiểu để người chơi hiển thị trên bảng chính</p>
            </div>
            <div className="flex justify-center w-full sm:w-auto">
              <Input 
                type="number" 
                className="w-24 text-center h-9 font-bold bg-slate-950 border-white/10"
                min="1" 
                value={config.minMatchesForMainBoard} 
                onChange={e => setConfig({ minMatchesForMainBoard: parseInt(e.target.value) || 5 })} 
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="text-center sm:text-left">
          <CardTitle className="text-sm xs:text-base sm:text-lg font-bold text-white whitespace-nowrap">QUẢN LÝ NGƯỜI CHƠI</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
            <Input 
              placeholder="Tên người chơi mới..." 
              value={newName} 
              onChange={e => setNewName(e.target.value)} 
              className="w-full text-center sm:text-left h-10 sm:flex-1"
            />
            <div className="flex flex-row items-center justify-center sm:justify-start gap-2 w-full sm:w-auto">
              <select
                value={newGender}
                onChange={e => setNewGender(e.target.value as 'male' | 'female')}
                className="h-10 w-28 bg-slate-900 border border-white/10 rounded-lg px-3 text-xs text-slate-200 focus:outline-none focus:border-teal-500 font-medium cursor-pointer text-center"
              >
                <option value="male">Nam ♂</option>
                <option value="female">Nữ ♀</option>
              </select>
              <Button type="submit" className="h-10 px-6 font-bold flex-1 sm:flex-initial bg-teal-500 hover:bg-teal-600 text-slate-950 cursor-pointer">Thêm</Button>
            </div>
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Tên</TableHead>
                <TableHead className="w-24 text-center whitespace-nowrap">Giới tính</TableHead>
                <TableHead className="w-28 text-center whitespace-nowrap hidden sm:table-cell">Trạng Thái</TableHead>
                <TableHead className="w-24 text-center whitespace-nowrap">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {players.map(p => (
                <TableRow key={p.id} className={!p.isActive ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
                  <TableCell className="whitespace-nowrap">
                    <Input 
                      value={p.name} 
                      onChange={e => updatePlayer(p.id, { name: e.target.value })}
                      className="border-transparent hover:border-white/10 focus:border-white/20 h-8 bg-transparent px-2 text-slate-100"
                    />
                  </TableCell>
                  <TableCell className="text-center whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => updatePlayer(p.id, { gender: (p.gender || 'male') === 'female' ? 'male' : 'female' })}
                      className={`text-[11px] px-2.5 py-1 rounded-full font-bold border transition-all duration-200 cursor-pointer shadow-sm ${
                        (p.gender || 'male') === 'female' 
                          ? 'bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 border-pink-500/20' 
                          : 'bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border-sky-500/20'
                      }`}
                    >
                      {(p.gender || 'male') === 'female' ? 'Nữ ♀' : 'Nam ♂'}
                    </button>
                  </TableCell>
                  <TableCell className="text-center whitespace-nowrap hidden sm:table-cell">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border whitespace-nowrap ${
                      p.isActive 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : 'bg-slate-500/10 text-slate-400 border-slate-500/10'
                    }`}>
                      {p.isActive ? 'Đang chơi' : 'Đã nghỉ'}
                    </span>
                  </TableCell>
                  <TableCell className="text-center whitespace-nowrap">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => updatePlayer(p.id, { isActive: !p.isActive })}
                      className="text-xs text-teal-400 hover:text-teal-300 hover:bg-teal-500/10 whitespace-nowrap"
                    >
                      {p.isActive ? 'Ẩn' : 'Hiện'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
