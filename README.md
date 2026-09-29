# VELORNE — Agency OS website demo

A fictional mechanical watch concept, Study 01. Approved direction: Obsidian Atelier with an ivory product-detail chapter. Replaces the former burger concept.

## Experience

- Original Blender-authored watch, consistent across studio portraits, gallery and macro views.
- Scroll-controlled 3D separation film with crystal, hands, indices, dial, movement, case, crown, caseback and bracelet.
- Desktop stage pinning, mobile sticky composition, reduced-motion stills and semantic component notes.
- Product-view gallery and full-size image inspection using a native accessible dialog.
- Static Astro content; no checkout, account, tracking or backend.

Finishes and internal architecture are fictional visual proposals, not manufacturing or performance claims. No prices, certifications, heritage, reviews or availability claims are invented.

## Run locally

Tools are isolated in the ignored `.tools` directory. From the repository root:

```sh
source .tools/env.sh
pnpm dev --host 127.0.0.1
```

Installed tools: Node.js 22.23.3, pnpm 10.17.1, Blender 4.5.14 LTS (Intel-compatible). Official binary downloads were SHA256-verified. The dependency lockfile is checked in as source and CI uses frozen resolution.

On another machine, install Node 22 and pnpm 10.17.1, then use `pnpm install --frozen-lockfile`. `.tools/env.sh` is local convenience, not required by the app or CI.

## Verification

```sh
source .tools/env.sh
pnpm check
pnpm build
pnpm preview --host 127.0.0.1 --port 4321
# Second terminal, using the installed Chrome browser:
source .tools/env.sh
BROWSER_CHANNEL=chrome pnpm capture
BROWSER_CHANNEL=chrome node scripts/performance.mjs
```

CI uses Playwright Chromium. Browser checks cover responsive widths, motion, reduced motion, keyboard controls, product gallery/dialog, no JavaScript, automated accessibility scans and runtime errors. See [QA evidence and limits](docs/VELORNE-QA.md) for actual results; do not infer a pass from the existence of a test script.

## Asset source

[Asset pipeline](docs/VELORNE-ASSETS.md) · [Model source](assets/source/README.md)

The editable `.blend` and reproducible Python scene script are included. `scripts/optimize-media.mjs` generates responsive WebP derivatives. Frames load after window load, the frame cache keeps a bounded number of decoded images with two requests in flight, and offscreen and background rendering pauses.

## Protection

`noindex,nofollow` and `robots.txt` disallow remain. No fake canonical or commercial structured data is emitted. Canonical/social URLs need a real authorized origin. No deployment or merge authorization is implied.

## Dependency audit exception

As of 2026-09-29, `pnpm audit --prod` reports 13 advisories (1 critical, 4 high), all through `astro` 5.x and its bundled `sharp`. Accepted for now because this is a static build (`output: 'static'`) with no server runtime, no SSR, islands, View Transitions or `astro:assets` image optimisation, which is where those advisories apply. Upgrading to Astro 7 is a major-version change that needs approval and a full QA re-run. Re-check this exception before any public deployment. Evidence: `docs/launch-hardening-2026-09-29.md`.

Read `AGENTS.md` for the Agency OS baseline. The old `QA-REPORT-2026-09-25.md` describes the superseded burger implementation, not this watch demo.
