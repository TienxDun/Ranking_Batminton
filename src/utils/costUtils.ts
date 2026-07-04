import { format, parseISO } from 'date-fns';
import { CostLineItem, Match, SessionCostBreakdown } from '../types';

export function getLineTotal(item: CostLineItem): number {
  return item.unitPrice * item.quantity;
}

export function normalizeLineItem(value: unknown): CostLineItem {
  if (typeof value === 'number') {
    return { unitPrice: value, quantity: value > 0 ? 1 : 0 };
  }
  if (value && typeof value === 'object') {
    const v = value as Partial<CostLineItem>;
    return {
      unitPrice: typeof v.unitPrice === 'number' ? v.unitPrice : 0,
      quantity: typeof v.quantity === 'number' ? v.quantity : 0,
    };
  }
  return { unitPrice: 0, quantity: 0 };
}

export function normalizeCostBreakdown(costs: unknown): SessionCostBreakdown {
  const c = (costs && typeof costs === 'object' ? costs : {}) as Record<string, unknown>;
  return {
    court: normalizeLineItem(c.court),
    water: normalizeLineItem(c.water),
    shuttlecock: normalizeLineItem(c.shuttlecock),
    other: normalizeLineItem(c.other),
    otherNote: typeof c.otherNote === 'string' ? c.otherNote : undefined,
  };
}

export function emptyCostBreakdown(): SessionCostBreakdown {
  return {
    court: { unitPrice: 0, quantity: 1 },
    water: { unitPrice: 0, quantity: 1 },
    shuttlecock: { unitPrice: 0, quantity: 1 },
    other: { unitPrice: 0, quantity: 0 },
    otherNote: '',
  };
}

export function getTotalCost(costs: SessionCostBreakdown): number {
  return getLineTotal(costs.court)
    + getLineTotal(costs.water)
    + getLineTotal(costs.shuttlecock)
    + getLineTotal(costs.other);
}

export function getMatchDateKey(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'yyyy-MM-dd');
  } catch {
    return dateStr.slice(0, 10);
  }
}

export function getPlayersFromMatchesOnDate(matches: Match[], date: string): string[] {
  const ids = new Set<string>();
  matches.forEach(m => {
    if (getMatchDateKey(m.date) !== date) return;
    m.team1.forEach(id => ids.add(id));
    m.team2.forEach(id => ids.add(id));
  });
  return Array.from(ids);
}

export type CostSplit = {
  playerId: string;
  amount: number;
};

export function splitCostEqually(total: number, participantIds: string[]): CostSplit[] {
  if (participantIds.length === 0 || total <= 0) {
    return participantIds.map(playerId => ({ playerId, amount: 0 }));
  }

  const base = Math.floor(total / participantIds.length);
  const remainder = total - base * participantIds.length;

  return participantIds.map((playerId, index) => ({
    playerId,
    amount: base + (index < remainder ? 1 : 0),
  }));
}

export function formatVND(amount: number): string {
  return `${amount.toLocaleString('vi-VN')}\u00A0₫`;
}

export function parseCostInput(value: string): number {
  const parsed = parseInt(value.replace(/\D/g, ''), 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function parseQuantityInput(value: string): number {
  const parsed = parseInt(value.replace(/\D/g, ''), 10);
  return Number.isNaN(parsed) ? 0 : Math.max(0, parsed);
}

export function isValidMapUrl(url: string): boolean {
  try {
    const u = new URL(url.trim());
    const host = u.hostname.toLowerCase();
    return host.includes('google')
      || host.includes('goo.gl')
      || host.includes('maps.app');
  } catch {
    return false;
  }
}

export type CostLineKey = 'court' | 'water' | 'shuttlecock' | 'other';

export const COST_LINE_LABELS: Record<CostLineKey, string> = {
  court: 'Tiền sân',
  water: 'Tiền nước',
  shuttlecock: 'Tiền cầu',
  other: 'Tiền khác',
};

export const COST_LINE_UNITS: Record<CostLineKey, string> = {
  court: 'giờ',
  water: 'suất',
  shuttlecock: 'quả',
  other: 'khoản',
};
