import { format, parseISO } from 'date-fns';

export function todayKey(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function getWeekdayName(date: string, options?: { short?: boolean }): string {
  try {
    const daysFull = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const daysShort = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    
    const dateStr = date.slice(0, 10);
    const parsedDate = new Date(`${dateStr}T00:00:00`);
    if (isNaN(parsedDate.getTime())) {
      return '';
    }
    const dayIndex = parsedDate.getDay();
    return options?.short ? daysShort[dayIndex] : daysFull[dayIndex];
  } catch {
    return '';
  }
}

export function formatOnlyDate(date: string): string {
  try {
    const dateStr = date.slice(0, 10);
    const parsedDate = new Date(`${dateStr}T00:00:00`);
    if (isNaN(parsedDate.getTime())) {
      return date;
    }
    const day = String(parsedDate.getDate()).padStart(2, '0');
    const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const year = parsedDate.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return date;
  }
}

export function formatSessionDate(date: string, options?: { short?: boolean }): string {
  const weekday = getWeekdayName(date, options);
  const dateStr = formatOnlyDate(date);
  if (!weekday) return dateStr;
  return `${weekday}, ${dateStr}`;
}

type SessionDateState = 'future' | 'today' | 'past';

function getSessionDateState(date: string, today: string): SessionDateState {
  const dateKey = date.slice(0, 10);
  if (dateKey > today) return 'future';
  if (dateKey === today) return 'today';
  return 'past';
}

export function getSessionDateMeta(date: string, today: string) {
  const state = getSessionDateState(date, today);

  if (state === 'future') {
    return {
      label: 'Sắp tới',
      rowClass: 'session-row-future',
      badgeClass: 'session-date-badge session-date-badge-future',
      markerClass: 'session-date-marker session-date-marker-future',
    };
  }

  if (state === 'today') {
    return {
      label: 'Hôm nay',
      rowClass: 'session-row-today',
      badgeClass: 'session-date-badge session-date-badge-today',
      markerClass: 'session-date-marker session-date-marker-today',
    };
  }

  return {
    label: 'Đã qua',
    rowClass: 'session-row-past',
    badgeClass: 'session-date-badge session-date-badge-past',
    markerClass: 'session-date-marker session-date-marker-past',
  };
}
