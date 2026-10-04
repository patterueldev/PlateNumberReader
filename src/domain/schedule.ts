export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export interface WeekBand {
  week: 1 | 2 | 3 | 4;
  startDay: number;
  endDay: number | null;
  label: string;
}

export interface RenewalWindow {
  year: number;
  month: number;
  week: number | null;
  start: Date;
  end: Date;
}

function atNoon(year: number, month: number, day: number): Date {
  return new Date(year, month, day, 12, 0, 0, 0);
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function monthFromLastDigit(digit: number): number {
  return digit === 0 ? 9 : digit - 1;
}

export function monthNameFromLastDigit(digit: number): string {
  return MONTH_NAMES[monthFromLastDigit(digit)];
}

export function weekFromSecondToLastDigit(digit: number): WeekBand {
  if (digit >= 1 && digit <= 3) {
    return { week: 1, startDay: 1, endDay: 7, label: '1st week (days 1-7)' };
  }
  if (digit >= 4 && digit <= 6) {
    return { week: 2, startDay: 8, endDay: 14, label: '2nd week (days 8-14)' };
  }
  if (digit === 7 || digit === 8) {
    return { week: 3, startDay: 15, endDay: 21, label: '3rd week (days 15-21)' };
  }
  return { week: 4, startDay: 22, endDay: null, label: '4th week (days 22 to end of month)' };
}

export function renewalWindowFor(
  year: number,
  lastDigit: number,
  secondToLastDigit: number | null
): RenewalWindow {
  const month = monthFromLastDigit(lastDigit);
  if (secondToLastDigit === null) {
    return {
      year,
      month,
      week: null,
      start: atNoon(year, month, 1),
      end: atNoon(year, month, daysInMonth(year, month)),
    };
  }
  const band = weekFromSecondToLastDigit(secondToLastDigit);
  const endDay = band.endDay ?? daysInMonth(year, month);
  return {
    year,
    month,
    week: band.week,
    start: atNoon(year, month, band.startDay),
    end: atNoon(year, month, endDay),
  };
}

export function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

export function daysUntil(target: Date, from: Date = new Date()): number {
  const a = atNoon(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  const b = atNoon(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  return Math.round((a - b) / 86400000);
}

export function nextRenewalWindow(
  lastDigit: number,
  secondToLastDigit: number | null,
  from: Date = new Date()
): RenewalWindow {
  const today = endOfDay(from);
  let window = renewalWindowFor(from.getFullYear(), lastDigit, secondToLastDigit);
  if (window.end < today) {
    window = renewalWindowFor(from.getFullYear() + 1, lastDigit, secondToLastDigit);
  }
  return window;
}

export function earlyRenewalDate(window: RenewalWindow): Date {
  const date = new Date(window.start);
  date.setDate(date.getDate() - 60);
  return date;
}

export function formatDate(date: Date, withYear = true): string {
  const label = `${MONTH_SHORT[date.getMonth()]} ${date.getDate()}`;
  return withYear ? `${label}, ${date.getFullYear()}` : label;
}

export function formatWindow(window: RenewalWindow): string {
  const month = MONTH_SHORT[window.month];
  if (window.start.getDate() === window.end.getDate()) {
    return `${month} ${window.start.getDate()}, ${window.year}`;
  }
  return `${month} ${window.start.getDate()}-${window.end.getDate()}, ${window.year}`;
}

export function scheduleSummary(
  lastDigit: number,
  secondToLastDigit: number | null
): { month: string; week: string | null } {
  return {
    month: monthNameFromLastDigit(lastDigit),
    week:
      secondToLastDigit === null ? null : weekFromSecondToLastDigit(secondToLastDigit).label,
  };
}
