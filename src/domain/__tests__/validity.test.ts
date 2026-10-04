import { parsePlate } from '@/domain/plate';
import { computeExpiry, computeStatus, addYearsClamped, parseIsoDate, toIsoDate } from '@/domain/validity';

const plate = parsePlate('ABC 1395');

describe('date helpers', () => {
  it('parses and formats ISO dates', () => {
    const date = parseIsoDate('2026-05-31');
    expect(date).not.toBeNull();
    expect(toIsoDate(date as Date)).toBe('2026-05-31');
    expect(parseIsoDate('2026-13-01')).toBeNull();
    expect(parseIsoDate('2026-02-30')).toBeNull();
    expect(parseIsoDate('')).toBeNull();
  });

  it('clamps leap day when adding years', () => {
    const leap = parseIsoDate('2024-02-29') as Date;
    expect(toIsoDate(addYearsClamped(leap, 1))).toBe('2025-02-28');
    expect(toIsoDate(addYearsClamped(leap, 4))).toBe('2028-02-29');
  });
});

describe('computeExpiry', () => {
  it('adds annual validity', () => {
    const expiry = computeExpiry('2025-05-10', 1);
    expect(expiry && toIsoDate(expiry)).toBe('2026-05-10');
  });

  it('supports the five-year brand-new validity', () => {
    const expiry = computeExpiry('2026-03-01', 5);
    expect(expiry && toIsoDate(expiry)).toBe('2031-03-01');
  });

  it('returns null without a last registration date', () => {
    expect(computeExpiry(undefined, 1)).toBeNull();
  });
});

describe('computeStatus', () => {
  it('is overdue after the expiry date', () => {
    const status = computeStatus(plate, '2025-05-31', 1, new Date(2026, 5, 15, 12));
    expect(status.state).toBe('overdue');
    expect(status.expiry && toIsoDate(status.expiry)).toBe('2026-05-31');
  });

  it('is due while inside the assigned window before expiry', () => {
    const status = computeStatus(plate, '2025-05-31', 1, new Date(2026, 4, 25, 12));
    expect(status.state).toBe('due');
    expect(status.window && status.window.year).toBe(2026);
  });

  it('is due soon within 60 days before the window', () => {
    const status = computeStatus(plate, '2025-05-31', 1, new Date(2026, 3, 1, 12));
    expect(status.state).toBe('due-soon');
  });

  it('is upcoming before the early window', () => {
    const status = computeStatus(plate, '2025-05-31', 1, new Date(2026, 1, 1, 12));
    expect(status.state).toBe('upcoming');
  });

  it('uses the next assigned window when expiry is unknown', () => {
    const status = computeStatus(plate, undefined, 1, new Date(2026, 9, 5, 12));
    expect(status.state).toBe('upcoming');
    expect(status.expiry).toBeNull();
    expect(status.window && status.window.year).toBe(2027);
  });

  it('caps unknown expiry at due-soon during the window', () => {
    const status = computeStatus(plate, undefined, 1, new Date(2026, 4, 25, 12));
    expect(status.state).toBe('due-soon');
  });

  it('returns unknown for an invalid plate', () => {
    const status = computeStatus(parsePlate('ABC'), '2025-05-31', 1, new Date(2026, 4, 25, 12));
    expect(status.state).toBe('unknown');
  });
});
