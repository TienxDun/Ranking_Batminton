import { format, parseISO } from 'date-fns';

export function todayKey(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function formatSessionDate(date: string): string {
  try {
    return format(parseISO(date), 'dd/MM/yyyy');
  } catch {
    return date;
  }
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
