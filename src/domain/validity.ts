import type { ParsedPlate } from './plate';
import {
  daysUntil,
  earlyRenewalDate,
  endOfDay,
  nextRenewalWindow,
  renewalWindowFor,
  type RenewalWindow,
} from './schedule';
import type { ValidityYears } from './types';

export type RegistrationState = 'unknown' | 'upcoming' | 'due-soon' | 'due' | 'overdue';

export interface RegistrationStatus {
  state: RegistrationState;
  window: RenewalWindow | null;
  earlyDate: Date | null;
  expiry: Date | null;
  daysUntilWindowStart: number | null;
  daysUntilExpiry: number | null;
}

const EMPTY_STATUS: RegistrationStatus = {
  state: 'unknown',
  window: null,
  earlyDate: null,
  expiry: null,
  daysUntilWindowStart: null,
  daysUntilExpiry: null,
};

export function parseIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec((value || '').trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  if (month < 0 || month > 11 || day < 1) return null;
  const date = new Date(year, month, day, 12, 0, 0, 0);
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
    return null;
  }
  return date;
}

export function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function addYearsClamped(date: Date, years: number): Date {
  const year = date.getFullYear() + years;
  const month = date.getMonth();
  const day = Math.min(date.getDate(), new Date(year, month + 1, 0).getDate());
  return new Date(year, month, day, 12, 0, 0, 0);
}

export function computeExpiry(
  lastRegisteredAt: string | undefined,
  validityYears: ValidityYears
): Date | null {
  if (!lastRegisteredAt) return null;
  const last = parseIsoDate(lastRegisteredAt);
  if (!last) return null;
  return addYearsClamped(last, validityYears);
}

export function computeStatus(
  parsed: ParsedPlate,
  lastRegisteredAt: string | undefined,
  validityYears: ValidityYears,
  today: Date = new Date()
): RegistrationStatus {
  if (!parsed.valid) return EMPTY_STATUS;

  const expiry = computeExpiry(lastRegisteredAt, validityYears);
  const window = expiry
    ? renewalWindowFor(expiry.getFullYear(), parsed.lastDigit, parsed.secondToLastDigit)
    : nextRenewalWindow(parsed.lastDigit, parsed.secondToLastDigit, today);
  const early = earlyRenewalDate(window);
  const todayEnd = endOfDay(today);

  let state: RegistrationState;
  if (expiry && todayEnd > endOfDay(expiry)) {
    state = 'overdue';
  } else if (todayEnd >= window.start && todayEnd <= window.end) {
    state = expiry ? 'due' : 'due-soon';
  } else if (todayEnd >= early) {
    state = 'due-soon';
  } else {
    state = 'upcoming';
  }

  return {
    state,
    window,
    earlyDate: early,
    expiry,
    daysUntilWindowStart: daysUntil(window.start, today),
    daysUntilExpiry: expiry ? daysUntil(expiry, today) : null,
  };
}

export function stateLabel(state: RegistrationState): string {
  if (state === 'overdue') return 'Overdue';
  if (state === 'due') return 'Renewal window open';
  if (state === 'due-soon') return 'Due soon';
  if (state === 'upcoming') return 'Scheduled';
  return 'Set last registration';
}

export function stateTone(state: RegistrationState): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
  if (state === 'overdue') return 'danger';
  if (state === 'due') return 'warning';
  if (state === 'due-soon') return 'warning';
  if (state === 'upcoming') return 'success';
  return 'neutral';
}
