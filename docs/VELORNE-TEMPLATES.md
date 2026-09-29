# VELORNE design previews

Four compositions for the same fictional watch concept. The user asked to preserve the clean Apple-style direction while offering more personalized options inspired by a supplied editorial/immersive website collage. The fourth preview prioritizes smooth scroll choreography inspired by the later video reference.

| Route | Direction | Composition |
| --- | --- | --- |
| `/templates/` | Comparison | Actual screenshots and links to each working template |
| `/` | Studio | Light, centered product hero; detail cards; restrained blue controls |
| `/atelier/` | Atelier | Cream and terracotta; expressive serif typography; arched watch portrait; editorial sections |
| `/nocturne/` | Nocturne | Dark film opening; full-width macro scene; cool tonal contrast |
| `/cinematic/` | Cinematic | Continuous light-to-dark-to-blue assembly journey; eased scroll, camera drift and coordinated text transitions |

Each watch page has the same accessible component notes, scroll-controlled assembly, product gallery and full-size image dialog. A native “Change design” disclosure links all previews. Templates share factual watch content and interaction components; their opening compositions, typography, navigation, material sections and endings differ.

## Boundaries

VELORNE remains fictional. No price, availability, product dimensions, performance, origin, heritage or certification is asserted. Existing Blender renders remain illustrative CGI, not photographed merchandise or a mechanically validated movement. No paid generation, deployment, commit, merge or removal of noindex protection is included.

## Source structure

- `src/pages/index.astro`: Studio.
- `src/pages/atelier.astro` and `nocturne.astro`: independent compositions.
- `src/pages/templates.astro`: comparison page.
- `src/components/WatchAnatomy.astro`, `WatchProduct.astro`, `WatchDialogs.astro`: shared watch interactions.
- `src/components/TemplateSwitcher.astro`: preview navigation.
- `src/layouts/WatchVariant.astro`: metadata and common page wiring for alternatives.
- `src/styles/global.css`: Studio and shared interactions.
- `src/styles/templates.css`: Atelier and Nocturne.
- `src/scripts/ambient.ts`: background-film behavior; no autoplay on mobile/reduced-motion/save-data.

The eight-second film comes from existing Blender frames. See VELORNE-ASSETS.md for reproduction.

## Verified locally — 2026-09-25

Environment: static Astro production preview at `http://127.0.0.1:4322`, local Google Chrome. This is not deployment or cross-browser certification.

- Astro check: 0 errors, warnings or hints. Production build: four routes generated. `git diff --check`: passed.
- All three watch templates at 390, 768 and 1440 px: no horizontal overflow or broken fragment links; one H1 and main; noindex present; zero reported axe WCAG A/AA findings in the tested reduced-motion states. Small-text contrast findings in Atelier and Nocturne were corrected and re-tested.
- The comparison page at 390 and 1440 px: all three screenshot previews load; links and design switching work; Escape closes the picker; zero reported axe findings.
- Studio at 390 and 1440 px: film is not fetched before user action; eight-second video plays; Escape pauses it and restores trigger focus; gallery highlights and film dialog pass the tested axe checks. Scroll produced distinct frames 6, 30 and 53. Save-data mode retains a still assembly.
- Nocturne at desktop normal/reduced motion and mobile: background film plays, pauses, resumes and stops offscreen. Mobile and reduced motion make no MP4 request until explicitly played. No runtime errors were observed in these paths.
- Local throttled Studio mobile lab: 390 × 844, DPR 2, 4× CPU, 1.6 Mbps down, 150 ms latency, cold cache. LCP 1,400 ms; observed CLS 0; initial transferred resource bytes 518,998; recorded interaction samples 24–152 ms. These are one local diagnostic run, not field Core Web Vitals.

Evidence: `artifacts/templates-review.json`, `template-controls-review.json`, `apple-interaction-review.json`, `performance.json`, the per-template axe reports and screenshots. Reproduce with `BASE_URL=http://127.0.0.1:4322 BROWSER_CHANNEL=chrome node scripts/review-templates.mjs`, `review-watch.mjs`, `review-template-controls.mjs` and `performance.mjs` while the preview server is running.

Remaining limits: the watch source renders are still illustrative CGI; the film blends adjacent existing frames. Safari/Firefox, physical devices and assistive-technology manual review were not covered in this pass. No paid generation or external reference media was added.

## Cinematic motion experiment — 2026-09-27

The new `/cinematic/` route uses the existing 60 transparent assembly renders. Native scrolling drives a requestAnimationFrame timeline with time-based exponential damping (95 ms), adjacent-frame blending, subtle camera scale/rotation, continuous background interpolation and staggered copy exits/entrances. Chapter controls are understated text links. Scrolling remains native; there is no wheel interception.

Compressed frames are prefetched after the first successful render (approximately 2.6 MB desktop / 1.4 MB mobile on disk). Decoded images are capped at 14; foreground loading uses two concurrent requests and directional lookahead. The loop stops when settled or the document is hidden. Reduced motion, save-data, short viewports, missing required frames and JavaScript-free browsing retain three readable static scenes.

Verified with `node scripts/review-cinematic.mjs` against a production preview in local Chrome:

- Desktop 1440 × 900 and mobile-sized 390 × 900: assembly frames 0, 31 and 59 correspond to all three chapters; no horizontal overflow or runtime errors; zero axe WCAG A/AA findings in the tested chapter states.
- A 2.5-second reverse scroll exercised 57–58 distinct rendered frames. The 95th-percentile requestAnimationFrame interval was 16.7–16.8 ms on this local machine. This measures local scheduling cadence, not guaranteed physical-device performance or paint timing.
- Reduced-motion, save-data and short-viewport modes fetched no animated sequence frames. Their static scenes passed the tested axe checks. A forced first-frame failure restored the complete static story; JavaScript-disabled browsing also retained all three scenes.
- Screenshots reviewed at desktop and mobile sizes. Evidence: `artifacts/cinematic-review.json` and `artifacts/cinematic-*.png`.

Source: `src/pages/cinematic.astro`, `src/scripts/cinematic.ts`, `src/styles/cinematic.css`. Existing render grain and reflected dial lettering remain asset-quality limitations; no new paid media was generated. This does not establish cross-browser or real-device performance.

The subsequent local render-polish pass supersedes those asset-quality observations: the crystal treatment and higher sampling improved dial clarity, all stills/sequence/video were regenerated, and the short-phone watch was enlarged. See [the scoped polish QA record](VELORNE-POLISH-QA.md) for current evidence, performance measurements, review boundaries and checks marked N/A. This remains a non-indexable local prototype, not a launch-ready claim.
