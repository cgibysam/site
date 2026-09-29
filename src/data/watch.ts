import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

// All stills and animation frames derive from scripts/render/watch.py.
// Missing files are deliberately not requested by the browser.
export const asset = (name: string) => {
  const path = `/media/velorne/${name}.webp`;
  return existsSync(resolve(process.cwd(), `public${path}`)) ? path : undefined;
};
export const views = [
  { id: 'three-quarter', label: 'Three-quarter', alt: 'VELORNE Study 01, with a graphite dial and articulated metal bracelet, seen at a three-quarter angle' },
  { id: 'front', label: 'Dial', alt: 'Study 01 dial with applied hour markers, faceted hands and a small seconds display' },
  { id: 'rear', label: 'Caseback', alt: 'The rear of the Study 01 concept, with its circular caseback and bracelet links' },
];
export const components = [
  { id: 'crystal', name: 'Crystal', description: 'A transparent plane catches the light above the dial.' },
  { id: 'hands', name: 'Hands', description: 'Intersecting, faceted lines give the face its expression.' },
  { id: 'indices', name: 'Indices', description: 'A rhythm of applied markers around the dial.' },
  { id: 'dial', name: 'Dial', description: 'A graphite surface gives the hands room to register.' },
  { id: 'movement', name: 'Movement', description: 'An illustrative arrangement of wheels, bridges and bearings. Not a validated caliber.' },
  { id: 'case', name: 'Case', description: 'A sculpted outline frames the layers within.' },
  { id: 'crown', name: 'Crown', description: 'A fluted detail at the edge of the case.' },
  { id: 'caseback', name: 'Caseback', description: 'The rear surface closes the assembly.' },
  { id: 'strap', name: 'Bracelet', description: 'Articulated links continue the line of the case around the wrist.' },
];
export const sequence = Array.from({ length: 60 }, (_, index) => asset(`sequence/${String(index).padStart(3, '0')}`));
export const anatomyReady = sequence.every(Boolean);
// Version the force-cached sequence so a new render cannot reuse old frames.
const sequenceHash = createHash('sha256');
for (const path of sequence) if (path) sequenceHash.update(readFileSync(resolve(process.cwd(), `public${path}`)));
export const sequenceVersion = sequenceHash.digest('hex').slice(0,12);
export const mobileSequenceReady = Array.from({ length: 60 }, (_, index) => asset(`sequence-mobile/${String(index).padStart(3, '0')}`)).every(Boolean);
