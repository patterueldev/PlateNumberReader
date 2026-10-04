import { formatPlate, normalizePlate, parsePlate } from '@/domain/plate';

describe('parsePlate', () => {
  it('parses a car plate with three letters', () => {
    const parsed = parsePlate('abc 1395');
    expect(parsed.valid).toBe(true);
    expect(parsed.letters).toBe('ABC');
    expect(parsed.digits).toBe('1395');
    expect(parsed.lastDigit).toBe(5);
    expect(parsed.secondToLastDigit).toBe(9);
    expect(parsed.kind).toBe('car');
  });

  it('parses a motorcycle plate with two letters and five digits', () => {
    const parsed = parsePlate('AB 12345');
    expect(parsed.valid).toBe(true);
    expect(parsed.letters).toBe('AB');
    expect(parsed.digits).toBe('12345');
    expect(parsed.kind).toBe('motorcycle');
  });

  it('fixes common OCR confusions in the number part', () => {
    const parsed = parsePlate('ABC I234');
    expect(parsed.valid).toBe(true);
    expect(parsed.letters).toBe('ABC');
    expect(parsed.digits).toBe('1234');
  });

  it('handles letters accidentally read as the start of the number', () => {
    const parsed = parsePlate('ABC O8');
    expect(parsed.valid).toBe(true);
    expect(parsed.digits).toBe('08');
  });

  it('allows a plate with a single trailing digit', () => {
    const parsed = parsePlate('ABC 5');
    expect(parsed.valid).toBe(true);
    expect(parsed.lastDigit).toBe(5);
    expect(parsed.secondToLastDigit).toBeNull();
  });

  it('rejects input without digits', () => {
    const parsed = parsePlate('ABC');
    expect(parsed.valid).toBe(false);
    expect(parsed.issue).toBeDefined();
  });

  it('rejects empty input', () => {
    expect(parsePlate('').valid).toBe(false);
    expect(parsePlate('   ').valid).toBe(false);
  });

  it('normalizes and formats plates', () => {
    expect(normalizePlate(' ab-c 12 34 ')).toBe('ABC1234');
    expect(formatPlate('ab 1234')).toBe('AB 1234');
  });
});
