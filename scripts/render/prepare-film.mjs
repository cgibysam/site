import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
await mkdir('artifacts/film-frames', { recursive: true });
for (let index = 0; index < 60; index++) {
  const name = String(index).padStart(3, '0');
  await sharp(`public/media/velorne/sequence/${name}.webp`)
    .flatten({ background: '#0c0e10' }).png().toFile(`artifacts/film-frames/${name}.png`);
}
console.log('Prepared existing Blender frames. Encode with scripts/render/assembly-film.swift.');
