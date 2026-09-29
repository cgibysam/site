import sharp from 'sharp';
import { readdir, mkdir, stat, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve('public/media/velorne');
await mkdir(`${root}/sequence-mobile`, { recursive: true });
const stills = ['hero', 'three-quarter', 'front', 'rear', 'macro-case', 'macro-dial', 'macro-movement', 'anatomy-overview'];
for (const name of stills) {
  await sharp(`${root}/${name}.webp`).resize(640, 640).webp({ quality: 85, alphaQuality: 95 }).toFile(`${root}/${name}-640.webp`);
}
const frames = (await readdir(`${root}/sequence`)).filter((name) => /^\d{3}\.webp$/.test(name)).sort();
if (frames.length !== 60) throw new Error(`Expected 60 frames, received ${frames.length}`);
for (const name of frames) {
  await sharp(`${root}/sequence/${name}`).resize(500, 500).webp({ quality: 83, alphaQuality: 95 }).toFile(`${root}/sequence-mobile/${name}`);
}
const files = [
  ...stills.flatMap((name) => [`${name}.webp`, `${name}-640.webp`]),
  ...frames.flatMap((name) => [`sequence/${name}`, `sequence-mobile/${name}`]),
];
const report = await Promise.all(files.map(async (name) => ({ name, bytes: (await stat(`${root}/${name}`)).size })));
await mkdir('artifacts', { recursive: true });
await writeFile('artifacts/media-sizes.json', JSON.stringify(report, null, 2));
console.log(`Optimized ${stills.length} stills and ${frames.length} mobile frames. Total delivered asset set: ${(report.reduce((sum, file) => sum + file.bytes, 0) / 1024 / 1024).toFixed(2)} MiB.`);
