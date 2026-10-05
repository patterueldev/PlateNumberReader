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

describe('digits-first and mixed motorcycle formats', () => {
  it('parses 123 ABC (current motorcycle and tricycle format)', () => {
    const parsed = parsePlate('123 ABC');
    expect(parsed.valid).toBe(true);
    expect(parsed.letters).toBe('ABC');
    expect(parsed.digits).toBe('123');
    expect(parsed.lastDigit).toBe(3);
    expect(parsed.secondToLastDigit).toBe(2);
    expect(parsed.kind).toBe('motorcycle');
  });

  it('parses mixed LTO formats', () => {
    const first = parsePlate('A 123 BC');
    expect(first.valid).toBe(true);
    expect(first.digits).toBe('123');
    expect(first.letters).toBe('ABC');

    const second = parsePlate('AB 123 C');
    expect(second.valid).toBe(true);
    expect(second.digits).toBe('123');
    expect(second.letters).toBe('ABC');

    const third = parsePlate('A1C234');
    expect(third.valid).toBe(true);
    expect(third.digits).toBe('1234');
    expect(third.letters).toBe('AC');

    const fourth = parsePlate('A 12C 34');
    expect(fourth.valid).toBe(true);
    expect(fourth.digits).toBe('1234');
  });

  it('keeps the original arrangement when formatting', () => {
    expect(formatPlate('123abc')).toBe('123 ABC');
    expect(formatPlate('a123bc')).toBe('A 123 BC');
    expect(formatPlate('A 123 BC')).toBe('A 123 BC');
  });
});
