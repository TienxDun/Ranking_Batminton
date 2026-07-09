import React from 'react';
import { Medal, Trophy } from 'lucide-react';
import { PlayerStats } from '../../types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

export function LeaderboardTable({
  data,
  isMain,
  onSelectPlayer,
}: {
  data: PlayerStats[];
  isMain: boolean;
  onSelectPlayer: (playerId: string) => void;
}) {
    // Tính toán thứ hạng trước khi render để hỗ trợ đồng hạng (Tied Ranks)
    let currentRank = 1;
    const rankedData = data.map((player, index) => {
      if (index > 0 && player.rating < data[index - 1].rating) {
        currentRank = index + 1;
      }
      return {
        ...player,
        displayRank: currentRank
      };
    });

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-14 min-w-[3.5rem] max-w-[3.5rem] text-center sticky-header-rank whitespace-nowrap px-2">Hạng</TableHead>
            <TableHead className="sticky-header-name min-w-[110px] whitespace-nowrap">Tên</TableHead>
            <TableHead className="text-center whitespace-nowrap">Elo</TableHead>
            <TableHead className="text-center whitespace-nowrap">Trận</TableHead>
            <TableHead className="text-center whitespace-nowrap">Thắng</TableHead>
            <TableHead className="text-center whitespace-nowrap">Thua</TableHead>
            <TableHead className="text-center whitespace-nowrap">Tỉ lệ</TableHead>
            <TableHead className="text-center whitespace-nowrap">Hiệu số</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rankedData.map((player, index) => {
            const isGold = isMain && player.displayRank === 1;
            const isSilver = isMain && player.displayRank === 2;
            const isBronze = isMain && player.displayRank === 3;
            
            let rowClass = "row-normal";
            if (isGold) rowClass = "row-gold";
            else if (isSilver) rowClass = "row-silver";
            else if (isBronze) rowClass = "row-bronze";

            return (
              <TableRow
                key={player.playerId}
                className={`${rowClass} cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-400`}
                role="button"
                tabIndex={0}
                onClick={() => onSelectPlayer(player.playerId)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectPlayer(player.playerId);
                  }
                }}
                title={`Xem chi tiết ${player.name}`}
              >
                <TableCell className="w-14 min-w-[3.5rem] max-w-[3.5rem] text-center font-medium sticky-rank whitespace-nowrap px-2">
                  {isGold ? <div className="flex items-center justify-center gap-1 text-amber-400 font-bold"><Trophy className="w-4.5 h-4.5 text-amber-400 shrink-0" /> 01</div> :
                   isSilver ? <div className="flex items-center justify-center gap-1 text-slate-300 font-bold"><Medal className="w-4.5 h-4.5 text-slate-400 shrink-0" /> 02</div> :
                   isBronze ? <div className="flex items-center justify-center gap-1 text-amber-600 font-bold"><Medal className="w-4.5 h-4.5 text-amber-750 shrink-0" /> 03</div> :
                   String(player.displayRank).padStart(2, '0')}
                </TableCell>
                <TableCell className="font-semibold text-white sticky-name min-w-[110px] whitespace-nowrap">{player.name}</TableCell>
                <TableCell className="text-center whitespace-nowrap">
                  <span className="px-2 py-1 rounded bg-teal-500/10 text-teal-300 font-bold font-mono border border-teal-500/10 badge-elo">
                    {player.rating}
                  </span>
                </TableCell>
                <TableCell className="text-center text-slate-300 whitespace-nowrap">{player.totalMatches}</TableCell>
                <TableCell className="text-center text-emerald-400 font-semibold whitespace-nowrap">{player.wins}</TableCell>
                <TableCell className="text-center text-rose-400 font-semibold whitespace-nowrap">{player.losses}</TableCell>
                <TableCell className="text-center whitespace-nowrap">
                  <div className="flex flex-col items-center">
                    <span className={`font-bold ${player.winRate >= 50 ? 'text-teal-400' : 'text-rose-400'} whitespace-nowrap`}>
                      {player.winRate.toFixed(1)}%
                    </span>
                    <div className="w-12 h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${player.winRate >= 50 ? 'bg-teal-400' : 'bg-rose-400'}`} 
                        style={{ width: `${player.winRate}%` }}
                      />
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right pr-6 font-mono font-semibold whitespace-nowrap">
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
}
