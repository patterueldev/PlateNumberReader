import { formatDate, formatWindow, type RenewalWindow } from '@/domain/schedule';
import type { Vehicle } from '@/domain/types';

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function toIcsDate(date: Date): string {
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function escapeIcs(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

function event(lines: string[]): string[] {
  return ['BEGIN:VEVENT', ...lines, 'END:VEVENT'];
}

export function buildRenewalIcs(vehicle: Vehicle, window: RenewalWindow, early: Date): string {
  const stamp = `${toIcsDate(new Date())}T000000Z`;
  const plate = vehicle.plate;
  const windowText = formatWindow(window);
  const description = [
    `LTO registration renewal window for ${plate}: ${windowText}.`,
    `Renew as early as ${formatDate(early)}.`,
    'Dates follow the LTO plate schedule (last digit = month, second-to-last digit = week of working days) and are shown as calendar days for planning.',
    'Verify details with LTMS (portal.lto.gov.ph) or your LTO office.',
  ].join('\\n');

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PlateNumberReader//LTO Renewal//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...event([
      `UID:${vehicle.id}-window@platenumberreader`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${toIcsDate(window.start)}`,
      `DTEND;VALUE=DATE:${toIcsDate(addDays(window.end, 1))}`,
      `SUMMARY:${escapeIcs(`LTO renewal window — ${plate}`)}`,
      `DESCRIPTION:${escapeIcs(description)}`,
      'BEGIN:VALARM',
      'TRIGGER:-P7D',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeIcs(`LTO renewal week for ${plate} starts soon`)}`,
      'END:VALARM',
    ]),
    ...event([
      `UID:${vehicle.id}-early@platenumberreader`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${toIcsDate(early)}`,
      `DTEND;VALUE=DATE:${toIcsDate(addDays(early, 1))}`,
      `SUMMARY:${escapeIcs(`You can renew early — ${plate}`)}`,
      `DESCRIPTION:${escapeIcs(`Early renewal opens for ${plate}. Assigned window: ${windowText}.`)}`,
    ]),
    'END:VCALENDAR',
  ];

  return lines.join('\r\n');
}
