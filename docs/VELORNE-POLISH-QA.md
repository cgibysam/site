# Cinematic render polish — 2026-09-27

Status: local render polish integrated and checked in Chrome. Not launch approval.

## Scope and acceptance

Sam authorized continuing after the cinematic prototype and asked to prioritize smooth animation. This increment improves the existing fictional watch renders and verifies their integration, keeping the native scroll choreography. No paid generation, package installation, deployment, merge or indexing change is authorized by this increment.

Acceptance: remove distracting doubled dial lettering; reduce surface noise without losing the machined edges; keep the same watch identity and component continuity; retain reversible, eased assembly motion; preserve mobile, reduced-motion and unavailable-media behavior. Existing media is retained until candidate frames are inspected. Target local motion cadence: p95 rAF interval under 25 ms on the current desktop Chrome environment; this is not a real-device guarantee. Target throttled mobile LCP under 2.5 s and observed CLS under 0.1, with regressions investigated.

## Standards and environment

- Project branch: `demo/agency-os-v1`, existing dirty worktree preserved.
- Agency OS checkout: `main`, clean at `09a312f`. Requested `chore/cross-ai-foundation` also resolves to `09a312f`; no committed standards difference at this point. No branch switch performed.
- Read entry point, start page, Website profile and its required quality, AI, client-data, search and website-production standards. Applied interactive/3D web, creative engineering, CGI/VFX production, cost/approval/security rules, master/website/CGI/factual/brand/security QA, security audit workflow, demo benchmark, adaptive gates and definition of done.
- Source: reproducible local Blender assembly; supplied reference videos remain reference-only and are not embedded or uploaded. No external images, client data, product facts or claimed specifications added.
- Rendering experiment: non-refractive transparent crystal coating, subtler brushed bump, adaptive sampling and denoising. This is an artistic presentation approximation, not a sapphire optical simulation or validated watch mechanism.

## QA disposition

Results and evidence are recorded below. Human approval of final design remains separate from automated checks.

| Gate | Applicability |
| --- | --- |
| Creative / brand / CGI | Inspect assembled, exploded and macro renders; compare identity and geometry with the existing fictional design; inspect final browser composites. Final human taste approval remains pending Sam. |
| Facts | Fictional concept only. No new prices, origins, materials grades, dimensions, certification or technical performance claims. |
| Technical / accessibility | Build, render completeness, native scroll and frame continuity, desktop/mobile layout, keyboard, reduced motion, failure paths and scoped axe checks. Screen-reader and physical-device review must be recorded as unverified if unavailable. |
| Performance | Frame cadence, bytes, bounded decode cache and throttled mobile lab measurements; field Web Vitals N/A for an unpublished local preview. |
| Search | Preserve noindex and robots disallow. Inspect semantic text and metadata. Public canonical/sitemap submission and merchant schema N/A: unpublished fictional demo, no production domain or authoritative offers. |
| Security / privacy | Local changed-source review, asset provenance, dependency diff and browser requests. No new services, forms, accounts, payments, analytics or data collection; those integration/privacy flows N/A. This is not a comprehensive security audit. |
| Deployment / delivery | Local preview only. Domain, SSL, production headers, hosting rollback and live monitoring N/A for this increment because deployment is not authorized. No claim of launch readiness. Local recovery uses retained previous media and editable source. |

## Render review and integration

- Blender 4.5.14 LTS, Cycles CPU. Assembled proof: 800 px / 96 samples. Exploded proof and full 60-frame sequence: 800 px / 32 samples. Eight still assets: 1400 px / 48 samples (hero also reused as three-quarter). Adaptive threshold 0.015 with denoising; subtler surface bump and bounded indirect highlights.
- Inspected assembled, lifting, exploded and reassembly frames (000, 005, 015, 031, 045, 055), plus full-size hero, dial/case macros and anatomy still. The main dial lettering is much clearer and the crystal reflection is less noisy. Some reflection remains at shallow macro angles; these are still illustrative CGI assets, not a claim of finished photographic realism.
- Inspected old/new exploded renders composited on the site's dark background: `artifacts/render-polish/comparison.png`. All 60 sequence frames decode with alpha at 800 × 800; inventory: `artifacts/render-polish/sequence-manifest.json`.
- Replaced the sequence, 500 px mobile derivatives, all eight still assets, 640 px still derivatives and the silent assembly MP4. Updated the editable Blender source. The source script supports isolated candidate output and resumable candidate rendering. Retained previous media and scene in `artifacts/render-polish-before/`.
- Desktop sequence: 2,075,130 bytes, down 18.6%; mobile sequence: 1,086,318 bytes, down 17.1%. All still/sequence variants total 4,101,584 bytes; MP4 is 1,705,037 bytes. Evidence: `artifacts/media-sizes.json`, `artifacts/render-polish/size-comparison.json`.

## Verified results

- **Motion / responsive / accessibility: PASS in the tested Chrome scope.** Final matrix: 375 × 667, 390 × 900, 768 × 900 and 1440 × 900. All three chapter poses render; no horizontal overflow or runtime errors observed. Keyboard chapter navigation and changing reduced motion at runtime pass. Reduced-motion, save-data, no-JavaScript, short-view and failed-first-frame paths retain static content. Scoped axe checks report zero WCAG A/AA findings. Each 2.5-second reverse scroll visited 58 source poses with p95 rAF interval 16.7–16.8 ms. This measures callback cadence, not hardware paint timing. Evidence: `artifacts/cinematic-review.json` and chapter screenshots.
- **Visual integration: PASS as an agent-reviewed prototype.** Inspected desktop/tablet dark-chapter composites and the short-phone opening. Enlarged the watch on short phones while checking separation from the visible rendered pixels rather than transparent image margins. Product silhouette, dial identity and layer order remain consistent. Refreshed all four comparison thumbnails from the actual local routes. Human design acceptance remains NOT VERIFIED.
- **Shared interaction regression: PASS at 390 and 1440 px.** The regenerated eight-second film remains lazy-loaded, plays, and pauses/restores focus on Escape. The original assembly visits frames 6, 30 and 53; gallery/highlight checks report no tested axe findings or runtime errors. Save-data keeps the static assembly. Evidence: `artifacts/apple-interaction-review.json`, produced by `scripts/review-watch.mjs`.
- **Build / source: PASS.** Astro check reports 0 errors, warnings or hints. Production build generates five routes. `git diff --check` passes. No packages were added in this increment.
- **Scoped source security review: PASS with limits.** 18 Astro/TypeScript/render-source files checked for common private-key/token signatures, with no matches. Changed runtime requests target local sequence assets only; no external scripts or new data-collection services. Evidence: `artifacts/polish-source-security.json`. This excludes history, dependency vulnerability intelligence, hosting configuration and comprehensive security review; those are not claimed verified.
- **Facts / demo discoverability: PASS for this scope.** No factual sales copy changed; VELORNE remains explicitly fictional, with movement architecture described as illustrative. All five built routes retain noindex, titles and one H1; robots disallows crawling. Evidence: `artifacts/polish-static-review.json`. No Product/Offer markup, public canonical or fabricated commerce facts added.
- **Mobile performance: PASS in one local lab run.** Chrome 390 × 844, DPR 2, 4× CPU slowdown, 1.6 Mbps down / 150 ms latency, cold cache: LCP 1,216 ms; observed CLS 0; initial transferred resources 1,438,718 bytes; sampled interaction durations 16–56 ms. Evidence: `artifacts/cinematic-performance.json`. This is not field INP/Core Web Vitals or a physical-device guarantee. A first measurement overlapped rebuilding the preview, causing failed frame loads and a fallback layout change; discarded and repeated against the completed build.
- **Access / permissions:** initial sandboxed Blender startup crashed; rerunning the installed application with local sandbox escalation succeeded. A browser-comparison approval review timed out once; the permitted retry succeeded. Two browser runs encountered a stopped preview after session interruptions; restarting it restored access. No paid tools, external uploads or deployment used.

## Remaining review boundaries

Human creative acceptance belongs to Sam and has not been inferred from test results. Safari/Firefox, physical devices, screen-reader review, live deployment and field performance remain unverified or outside this local increment. Local Chrome evidence supports this preview only. Grain has been reduced, not asserted absent at every magnification.

Project-specific learning: dial clarity was chiefly limited by the crystal/reflection treatment, not missing animation controls. Increasing samples alone would not have corrected the doubled lettering. Keep that observation with this project until tested elsewhere; no reusable Agency OS policy was changed.
