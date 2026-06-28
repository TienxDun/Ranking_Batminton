import React, { useMemo } from 'react';
import { useStore } from '../store';
import { calculateLeaderboard } from '../utils/calculations';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Trophy, Medal, AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const { players, matches, config } = useStore();

  const leaderboard = useMemo(() => calculateLeaderboard(players, matches), [players, matches]);

  const mainBoard = leaderboard.filter(p => p.totalMatches >= config.minMatchesForMainBoard);
  const secondaryBoard = leaderboard.filter(p => p.totalMatches < config.minMatchesForMainBoard && p.totalMatches > 0);

  const renderTable = (data: typeof leaderboard, isMain: boolean) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-14 min-w-[3.5rem] max-w-[3.5rem] text-center sticky-header-rank whitespace-nowrap">Hạng</TableHead>
          <TableHead className="sticky-header-name min-w-[110px] whitespace-nowrap">Tên</TableHead>
          <TableHead className="text-center whitespace-nowrap">Elo</TableHead>
          <TableHead className="text-center whitespace-nowrap">Trận</TableHead>
          <TableHead className="text-center whitespace-nowrap hidden sm:table-cell">Thắng</TableHead>
          <TableHead className="text-center whitespace-nowrap hidden sm:table-cell">Thua</TableHead>
          <TableHead className="text-center whitespace-nowrap">Tỉ lệ</TableHead>
          <TableHead className="text-center whitespace-nowrap hidden sm:table-cell">Hiệu số</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((player, index) => {
          const isGold = isMain && index === 0;
          const isSilver = isMain && index === 1;
          const isBronze = isMain && index === 2;
          
          let rowClass = "hover:bg-white/5 transition-colors";
          if (isGold) rowClass = "bg-amber-500/5 hover:bg-amber-500/10 transition-colors border-l-2 border-amber-500";
          else if (isSilver) rowClass = "bg-slate-300/5 hover:bg-slate-300/10 transition-colors border-l-2 border-slate-400";
          else if (isBronze) rowClass = "bg-amber-700/5 hover:bg-amber-700/10 transition-colors border-l-2 border-amber-700";

          return (
            <TableRow key={player.playerId} className={rowClass}>
              <TableCell className="w-14 min-w-[3.5rem] max-w-[3.5rem] text-center font-medium sticky-rank whitespace-nowrap">
                {isGold ? <div className="flex items-center justify-center gap-1 text-amber-400 font-bold"><Trophy className="w-4 h-4 text-amber-400" /> 01</div> :
                 isSilver ? <div className="flex items-center justify-center gap-1 text-slate-300 font-bold"><Medal className="w-4 h-4 text-slate-400" /> 02</div> :
                 isBronze ? <div className="flex items-center justify-center gap-1 text-amber-600 font-bold"><Medal className="w-4 h-4 text-amber-700" /> 03</div> :
                 String(index + 1).padStart(2, '0')}
              </TableCell>
              <TableCell className="font-semibold text-white sticky-name min-w-[110px] whitespace-nowrap">{player.name}</TableCell>
              <TableCell className="text-center whitespace-nowrap">
                <span className="px-2 py-1 rounded bg-teal-500/10 text-teal-300 font-bold font-mono border border-teal-500/10">
                  {player.rating}
                </span>
              </TableCell>
              <TableCell className="text-center text-slate-300 whitespace-nowrap">{player.totalMatches}</TableCell>
              <TableCell className="text-center text-emerald-400 font-semibold whitespace-nowrap hidden sm:table-cell">{player.wins}</TableCell>
              <TableCell className="text-center text-rose-400 font-semibold whitespace-nowrap hidden sm:table-cell">{player.losses}</TableCell>
              <TableCell className="text-center whitespace-nowrap">
                <div className="flex flex-col items-center">
                  <span className={`font-bold ${player.winRate >= 50 ? 'text-teal-400' : 'text-rose-400'} whitespace-nowrap`}>
                    {player.winRate.toFixed(1)}%
                  </span>
                  <div className="hidden sm:block w-12 h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${player.winRate >= 50 ? 'bg-teal-400' : 'bg-rose-400'}`} 
                      style={{ width: `${player.winRate}%` }}
                    />
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-right pr-6 font-mono font-semibold whitespace-nowrap hidden sm:table-cell">
                <span className={player.avgPointDiff > 0 ? "text-emerald-400" : player.avgPointDiff < 0 ? "text-rose-400" : "text-slate-400"}>
                  {player.avgPointDiff > 0 ? "+" : ""}{player.avgPointDiff.toFixed(1)}
                </span>
              </TableCell>
            </TableRow>
          );
        })}
        {data.length === 0 && (
          <TableRow>
            <TableCell colSpan={8} className="text-center text-slate-500 py-4">Chưa có dữ liệu</TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-6" id="dashboard-content">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center gap-3 w-full">
            <CardTitle className="text-sm xs:text-base sm:text-lg font-bold flex items-center gap-1.5 xs:gap-2 text-white whitespace-nowrap">
              <Trophy className="w-4.5 h-4.5 xs:w-5 h-5 text-amber-500 flex-shrink-0" />
              BẢNG XẾP HẠNG CHÍNH
            </CardTitle>
            <span className="text-[10px] xs:text-xs bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 xs:px-2 xs:py-1 rounded font-medium whitespace-nowrap flex-shrink-0">Real-time</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Yêu cầu tối thiểu {config.minMatchesForMainBoard} trận</p>
        </CardHeader>
        <CardContent>
          {renderTable(mainBoard, true)}
        </CardContent>
      </Card>

      {secondaryBoard.length > 0 && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-sm xs:text-base sm:text-lg font-bold flex items-center gap-1.5 xs:gap-2 text-slate-200 whitespace-nowrap">
              <AlertCircle className="w-4.5 h-4.5 xs:w-5 h-5 text-teal-400 flex-shrink-0" />
              NGƯỜI CHƠI ÍT TRẬN
            </CardTitle>
            <p className="text-xs text-slate-400 mt-1">Dưới {config.minMatchesForMainBoard} trận tham gia</p>
          </CardHeader>
          <CardContent>
            {renderTable(secondaryBoard, false)}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
