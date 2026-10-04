import type { VehicleKind } from './types';

export interface ParsedPlate {
  raw: string;
  normalized: string;
  letters: string;
  digits: string;
  lastDigit: number;
  secondToLastDigit: number | null;
  kind: VehicleKind;
  valid: boolean;
  issue?: string;
}

const DIGIT_FIXES: Record<string, string> = {
  O: '0',
  Q: '0',
  D: '0',
  I: '1',
  L: '1',
  Z: '2',
  S: '5',
  B: '8',
  G: '6',
};

const LETTER_FIXES: Record<string, string> = {
  '0': 'O',
  '1': 'I',
  '2': 'Z',
  '5': 'S',
  '6': 'G',
  '8': 'B',
};

export function normalizePlate(input: string): string {
  return (input || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function guessKind(letters: string): VehicleKind {
  if (letters.length === 2) return 'motorcycle';
  if (letters.length === 3) return 'car';
  return 'other';
}

function splitPlate(normalized: string): { letters: string; digits: string } {
  const simple = /^([A-Z]*)(\d+)$/.exec(normalized);
  if (simple) {
    let letters = simple[1];
    let digits = simple[2];
    while (letters.length > 3) {
      const last = letters[letters.length - 1];
      const fixed = DIGIT_FIXES[last];
      if (!fixed) break;
      digits = fixed + digits;
      letters = letters.slice(0, -1);
    }
    return { letters, digits };
  }

  let split = normalized.length;
  while (split > 0) {
    const ch = normalized[split - 1];
    if (/[0-9]/.test(ch) || DIGIT_FIXES[ch]) {
      split -= 1;
    } else {
      break;
    }
  }
  const head = normalized.slice(0, split);
  const tail = normalized.slice(split);
  const letters = head.replace(/[0-9]/g, (c) => LETTER_FIXES[c] ?? c);
  const digits = tail.replace(/[A-Z]/g, (c) => DIGIT_FIXES[c] ?? c);
  return { letters, digits };
}

export function parsePlate(input: string): ParsedPlate {
  const raw = (input || '').trim();
  const normalized = normalizePlate(raw);
  const base: ParsedPlate = {
    raw,
    normalized,
    letters: '',
    digits: '',
    lastDigit: -1,
    secondToLastDigit: null,
    kind: 'other',
    valid: false,
  };

  if (!normalized) {
    return { ...base, issue: 'Enter a plate number.' };
  }

  const { letters, digits } = splitPlate(normalized);

  if (!digits) {
    return { ...base, letters, digits, issue: 'Could not find the number part of the plate.' };
  }

  const lettersOk = /^[A-Z]{0,3}$/.test(letters);
  const digitsOk = /^[0-9]{1,6}$/.test(digits);

  if (!lettersOk || !digitsOk) {
    return { ...base, letters, digits, issue: 'Unexpected characters — check the plate.' };
  }

  const lastDigit = Number(digits[digits.length - 1]);
  const secondToLastDigit = digits.length >= 2 ? Number(digits[digits.length - 2]) : null;

  return {
    raw,
    normalized,
    letters,
    digits,
    lastDigit,
    secondToLastDigit,
    kind: guessKind(letters),
    valid: true,
  };
}

export function formatPlate(input: string): string {
  const parsed = parsePlate(input);
  if (!parsed.valid) return normalizePlate(input);
  return parsed.letters ? `${parsed.letters} ${parsed.digits}` : parsed.digits;
}
