import { startOfWeek, endOfWeek, format, parseISO, getWeek } from 'date-fns';
import { Match } from '../types';

export interface WeekOption {
  id: string; // Định dạng yyyy-MM-dd của ngày Thứ Hai đầu tuần
  label: string; // Nhãn hiển thị, ví dụ: Tuần 26 (22/06/2026 - 28/06/2026)
  start: Date;
  end: Date;
}

/**
 * Phân tích danh sách trận đấu và sinh ra danh sách các tuần có trận đấu.
 * Luôn bao gồm tuần hiện tại của hệ thống.
 */
export function getWeekOptions(matches: Match[]): WeekOption[] {
  const weeksMap = new Map<string, WeekOption>();

  // 1. Thêm tuần hiện tại
  const now = new Date();
  const currentStart = startOfWeek(now, { weekStartsOn: 1 });
  const currentEnd = endOfWeek(now, { weekStartsOn: 1 });
  const currentWeekNum = getWeek(now, { weekStartsOn: 1 });
  const currentId = format(currentStart, 'yyyy-MM-dd');
  
  weeksMap.set(currentId, {
    id: currentId,
    label: `Tuần ${currentWeekNum} (${format(currentStart, 'dd/MM/yyyy')} - ${format(currentEnd, 'dd/MM/yyyy')}) (Tuần này)`,
    start: currentStart,
    end: currentEnd
  });

  // 2. Duyệt qua các trận đấu để tìm các tuần khác
  matches.forEach(m => {
    try {
      const matchDate = parseISO(m.date);
      const start = startOfWeek(matchDate, { weekStartsOn: 1 });
      const end = endOfWeek(matchDate, { weekStartsOn: 1 });
      const weekNum = getWeek(matchDate, { weekStartsOn: 1 });
      const id = format(start, 'yyyy-MM-dd');

      if (!weeksMap.has(id)) {
        weeksMap.set(id, {
          id,
          label: `Tuần ${weekNum} (${format(start, 'dd/MM/yyyy')} - ${format(end, 'dd/MM/yyyy')})`,
          start,
          end
        });
      }
    } catch (e) {
      console.error('Lỗi khi phân tích ngày của trận đấu:', e);
    }
  });

  // 3. Chuyển sang mảng và sắp xếp thời gian giảm dần (tuần mới nhất lên đầu)
  return Array.from(weeksMap.values()).sort((a, b) => b.start.getTime() - a.start.getTime());
}

/**
 * Kiểm tra xem ngày trận đấu có nằm trong tuần cụ thể không
 */
export function isMatchInWeek(matchDateStr: string, weekStart: Date, weekEnd: Date): boolean {
  try {
    const matchDate = parseISO(matchDateStr);
    const t = matchDate.getTime();
    return t >= weekStart.getTime() && t <= weekEnd.getTime();
  } catch (e) {
    return false;
  }
}
