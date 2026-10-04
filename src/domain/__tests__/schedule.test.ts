import {
  earlyRenewalDate,
  formatWindow,
  monthFromLastDigit,
  nextRenewalWindow,
  renewalWindowFor,
  weekFromSecondToLastDigit,
} from '@/domain/schedule';

describe('monthFromLastDigit', () => {
  it('maps digits 1-9 to January-September', () => {
    expect(monthFromLastDigit(1)).toBe(0);
    expect(monthFromLastDigit(5)).toBe(4);
    expect(monthFromLastDigit(9)).toBe(8);
  });

  it('maps 0 to October', () => {
    expect(monthFromLastDigit(0)).toBe(9);
  });
});

describe('weekFromSecondToLastDigit', () => {
  it('maps digit bands to week windows', () => {
    expect(weekFromSecondToLastDigit(1).week).toBe(1);
    expect(weekFromSecondToLastDigit(3).week).toBe(1);
    expect(weekFromSecondToLastDigit(4).week).toBe(2);
    expect(weekFromSecondToLastDigit(6).week).toBe(2);
    expect(weekFromSecondToLastDigit(7).week).toBe(3);
    expect(weekFromSecondToLastDigit(8).week).toBe(3);
    expect(weekFromSecondToLastDigit(9).week).toBe(4);
    expect(weekFromSecondToLastDigit(0).week).toBe(4);
  });

  it('ends the fourth week at the end of the month', () => {
    expect(weekFromSecondToLastDigit(9).startDay).toBe(22);
    expect(weekFromSecondToLastDigit(9).endDay).toBeNull();
  });
});

describe('renewalWindowFor', () => {
  it('computes ABC 1395 as May 22-31', () => {
    const window = renewalWindowFor(2026, 5, 9);
    expect(window.month).toBe(4);
    expect(formatWindow(window)).toBe('May 22-31, 2026');
  });

  it('computes a plate ending in 40 as October 8-14', () => {
    const window = renewalWindowFor(2026, 0, 4);
    expect(formatWindow(window)).toBe('Oct 8-14, 2026');
  });

  it('computes ABC 1234 as April 1-7', () => {
    const window = renewalWindowFor(2026, 4, 3);
    expect(formatWindow(window)).toBe('Apr 1-7, 2026');
  });

  it('uses the whole month when only one digit is known', () => {
    const window = renewalWindowFor(2026, 4, null);
    expect(formatWindow(window)).toBe('Apr 1-30, 2026');
  });
});

describe('nextRenewalWindow', () => {
  it('stays in the current year before the window', () => {
    const window = nextRenewalWindow(5, 9, new Date(2026, 0, 5, 12));
    expect(window.year).toBe(2026);
    expect(window.month).toBe(4);
  });

  it('rolls to the next year after the window passed', () => {
    const window = nextRenewalWindow(3, 8, new Date(2026, 9, 5, 12));
    expect(window.year).toBe(2027);
    expect(window.month).toBe(2);
  });
});

describe('earlyRenewalDate', () => {
  it('opens 60 days before the window starts', () => {
    const window = renewalWindowFor(2026, 5, 9);
    const early = earlyRenewalDate(window);
    expect(early.getMonth()).toBe(2);
    expect(early.getDate()).toBe(23);
  });
});
