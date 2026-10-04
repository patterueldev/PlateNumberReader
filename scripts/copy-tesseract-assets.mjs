import { access, copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const destination = path.join(root, 'public', 'tesseract');
const traineddataUrl = 'https://tessdata.projectnaptha.com/4.0.0_fast/eng.traineddata.gz';

const files = [
  ['node_modules/tesseract.js/dist/worker.min.js', 'worker.min.js'],
  ['node_modules/tesseract.js-core/tesseract-core-simd-lstm.wasm.js', 'tesseract-core-simd-lstm.wasm.js'],
  ['node_modules/tesseract.js-core/tesseract-core-lstm.wasm.js', 'tesseract-core-lstm.wasm.js'],
  ['node_modules/tesseract.js-core/tesseract-core-relaxedsimd-lstm.wasm.js', 'tesseract-core-relaxedsimd-lstm.wasm.js'],
];

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

await mkdir(destination, { recursive: true });

for (const [source, name] of files) {
  await copyFile(path.join(root, source), path.join(destination, name));
}

const traineddataPath = path.join(destination, 'eng.traineddata.gz');
if (!(await exists(traineddataPath))) {
  process.stdout.write(`Downloading eng.traineddata.gz ... `);
  const response = await fetch(traineddataUrl);
  if (!response.ok) {
    throw new Error(`Failed to download traineddata: ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(traineddataPath, buffer);
  console.log(`${(buffer.length / 1024 / 1024).toFixed(1)} MB`);
} else {
  console.log('eng.traineddata.gz already present');
}

const listing = await Promise.all(
  files.map(async ([, name]) => {
    const buffer = await readFile(path.join(destination, name));
    return `${name} (${(buffer.length / 1024 / 1024).toFixed(1)} MB)`;
  })
);
console.log(`Tesseract assets ready in public/tesseract:\n  ${listing.join('\n  ')}`);
