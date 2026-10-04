import { preprocessForOcr } from './preprocess.web';
import type { OcrProgress, OcrResult } from './types';
import { formatPlate, normalizePlate, parsePlate } from '@/domain/plate';

interface WorkerLike {
  recognize: (image: string) => Promise<{ data: { text: string; confidence: number } }>;
  setParameters: (params: Record<string, string>) => Promise<unknown>;
  terminate: () => Promise<unknown>;
}

let workerPromise: Promise<WorkerLike> | null = null;
let progressListener: ((progress: OcrProgress) => void) | null = null;

async function getWorker(): Promise<WorkerLike> {
  if (!workerPromise) {
    workerPromise = (async () => {
      const { createWorker, PSM } = await import('tesseract.js');
      const worker = await createWorker('eng', 1, {
        workerPath: '/tesseract/worker.min.js',
        corePath: '/tesseract',
        langPath: '/tesseract',
        logger: (message) => {
          if (progressListener && typeof message.progress === 'number') {
            progressListener({ status: message.status ?? 'Working', progress: message.progress });
          }
        },
      });
      await worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
        tessedit_pageseg_mode: PSM.SINGLE_LINE,
      });
      return worker as unknown as WorkerLike;
    })().catch((error) => {
      workerPromise = null;
      throw error;
    });
  }
  return workerPromise;
}

function bestCandidate(text: string, confidence: number): OcrResult {
  const joined = normalizePlate(text);
  if (parsePlate(joined).valid) {
    return { text, cleaned: formatPlate(joined), confidence };
  }

  const tokens = text
    .toUpperCase()
    .split(/[^A-Z0-9]+/)
    .filter((token) => token.length >= 2);

  let best = '';
  let bestScore = 0;
  for (const token of tokens) {
    const parsed = parsePlate(token);
    const score = parsed.valid ? 100 + parsed.digits.length : /\d/.test(token) ? 10 : 0;
    if (score > bestScore) {
      best = token;
      bestScore = score;
    }
  }

  if (best) {
    return { text, cleaned: formatPlate(best), confidence };
  }
  return { text, cleaned: '', confidence };
}

export async function recognizePlate(
  imageUri: string,
  onProgress?: (progress: OcrProgress) => void
): Promise<OcrResult> {
  progressListener = onProgress ?? null;
  try {
    const prepared = await preprocessForOcr(imageUri);
    const worker = await getWorker();
    const { data } = await worker.recognize(prepared);
    return bestCandidate(data.text ?? '', data.confidence ?? 0);
  } finally {
    progressListener = null;
  }
}

export async function disposeOcr(): Promise<void> {
  if (workerPromise) {
    const pending = workerPromise;
    workerPromise = null;
    try {
      const worker = await pending;
      await worker.terminate();
    } catch {
      // worker already gone
    }
  }
}
