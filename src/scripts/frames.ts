// Shared by the anatomy scrub (sequence.ts) and the cinematic hero (cinematic.ts).
export const FRAME_COUNT = 60;

/** Rendered frame width: desktop 1200 px, mobile 720 px (derived by scripts/optimize-media.mjs). */
export const frameSize = (mobile: boolean) => mobile ? 720 : 1200;

/** Coarse-to-fine load order: both ends, then every 16th, 8th, 4th, 2nd frame and the rest,
 * so a fast scroll always has a nearby frame to show while the sequence fills in. */
export const progressiveOrder = () => {
  const order = [0, FRAME_COUNT - 1];
  for (const step of [16, 8, 4, 2, 1]) {
    for (let frame = 0; frame < FRAME_COUNT; frame += step) if (!order.includes(frame)) order.push(frame);
  }
  return order;
};

/** The decoded frame closest to `index`, searching outwards; undefined when nothing is decoded. */
export const nearestFrame = (cache: Map<number, ImageBitmap>, index: number) => {
  for (let distance = 0; distance < FRAME_COUNT; distance++) {
    for (const frame of [index - distance, index + distance]) {
      const bitmap = cache.get(frame);
      if (bitmap) return { frame, bitmap };
    }
  }
  return undefined;
};

/** Size the backing store to the displayed size × DPR (capped at 2), never above the source frames.
 * Returns true when the size changed, which clears the canvas and needs a repaint. */
export const fitCanvas = (canvas: HTMLCanvasElement, max: number) => {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const size = Math.min(max, Math.ceil((canvas.clientWidth || max) * dpr));
  if (canvas.width === size && canvas.height === size) return false;
  canvas.width = canvas.height = size;
  return true;
};

/** Resolves once the page has loaded, so frame fetches never compete with first paint. */
export const afterLoad = () => document.readyState === 'complete'
  ? Promise.resolve()
  : new Promise<void>((resolve) => window.addEventListener('load', () => resolve(), { once: true }));
