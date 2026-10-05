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

function guessKind(letters: string, normalized: string): VehicleKind {
  if (letters.length === 0) return 'other';
  if (/^\d/.test(normalized)) return letters.length <= 3 ? 'motorcycle' : 'other';
  if (letters.length === 2) return 'motorcycle';
  if (letters.length === 3) return 'car';
  return 'other';
}

interface Token {
  value: string;
  isDigit: boolean;
}

function splitPlate(normalized: string): { letters: string; digits: string } {
  const allFixableToDigits = normalized
    .split('')
    .every((ch) => /[0-9]/.test(ch) || DIGIT_FIXES[ch]);

  const tokens: Token[] = normalized.split('').map((ch) => ({
    value: ch,
    isDigit: /[0-9]/.test(ch),
  }));

  if (!tokens.some((token) => token.isDigit)) {
    if (allFixableToDigits) {
      return {
        letters: '',
        digits: tokens.map((token) => DIGIT_FIXES[token.value] ?? token.value).join(''),
      };
    }
    return { letters: normalized, digits: '' };
  }

  const recompute = () => {
    let letters = '';
    let digits = '';
    for (const token of tokens) {
      if (token.isDigit) {
        digits += token.value;
      } else {
        letters += token.value;
      }
    }
    return { letters, digits };
  };

  let result = recompute();
  while (result.letters.length > 3) {
    let peeled = false;
    for (let i = tokens.length - 1; i >= 0; i -= 1) {
      const token = tokens[i];
      if (token.isDigit) continue;
      const fixed = DIGIT_FIXES[token.value];
      if (!fixed) continue;
      const leftIsDigit = i > 0 && tokens[i - 1].isDigit;
      const rightIsDigit = i < tokens.length - 1 && tokens[i + 1].isDigit;
      if (!leftIsDigit && !rightIsDigit) continue;
      token.value = fixed;
      token.isDigit = true;
      peeled = true;
      break;
    }
    if (!peeled) break;
    result = recompute();
  }

  const letters = result.letters.replace(/[0-9]/g, (c) => LETTER_FIXES[c] ?? c);
  return { letters, digits: result.digits };
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
    kind: guessKind(letters, normalized),
    valid: true,
  };
}

export function formatPlate(input: string): string {
  const parsed = parsePlate(input);
  if (!parsed.valid) return normalizePlate(input);
  const trimmed = (input || '').trim().toUpperCase();
  if (/[^A-Z0-9]/.test(trimmed)) {
    return trimmed.replace(/[^A-Z0-9]+/g, ' ').trim();
  }
  const groups = parsed.normalized.match(/[A-Z]+|\d+/g);
  return groups ? groups.join(' ') : parsed.normalized;
}
