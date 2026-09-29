# VELORNE verification — local preview

Scope: `/` on the local static production build, branch `demo/agency-os-v1`. The demo remains `noindex,nofollow`; no deployment.

## Delivered

- Replaced the burger concept with VELORNE / Study 01 in the Obsidian Atelier direction.
- Rendered one consistent, original fictional watch assembly in Blender. The editable scene has dark graphite surfaces, applied markers, faceted hands, small seconds, fluted crown, polished case edges and an articulated bracelet.
- Delivered hero, gallery, macros and a 60-frame 3D exploded film. Responsive still and mobile-frame derivatives bring the complete asset library to about 4.6 MiB.
- Added a native product-view gallery, keyboard-operable full-size image dialog, accessible component notes, desktop pinning, mobile sticky composition, reduced-motion still, static no-JS path, data-saving behavior and a bounded near-section frame cache.
- No paid generation, external product images, simulated commerce, fake product claims or real structured product data.

## Verification performed

- `pnpm check`: passed, 0 errors, 0 warnings, 0 hints.
- `pnpm build`: passed, static site built.
- Blender 4.5.14 LTS rendered the editable scene, eight stills and all 60 desktop animation frames. All 60 mobile derivatives generated. Desktop and mobile heroes, front/rear views, macro dial, movement, exploded anatomy and crystal composite were visually inspected.
- Playwright/Chrome passed 390, 768 and 1440 pixel viewports in normal and reduced motion. The suite checked navigation, focus order, no-JavaScript content, gallery, zoom-dialog Escape/focus return, component disclosures, mobile overflow, anchors, page metadata and HTTP/console errors.
- axe-core on the reduced-motion 390, 768 and 1440 views: **zero reported WCAG 2.0/2.1/2.2 A/AA violations**. This automated scan does not replace assistive-technology review.
- Lab mobile run in local Chrome at 390 × 844, DPR 2, 4× CPU slowdown, 1.6 Mbps down, 150 ms latency, cold cache: LCP **828 ms**, CLS **0**, initial transferred resources **199,592 bytes**. Script recorded 12 tested interaction events between 16 and 56 ms. This is a single local diagnostic, not field Core Web Vitals or a guarantee on physical devices.
- Demo noindex and robots protection remain present.

Evidence is saved under ignored local `artifacts/`: responsive captures, full pages, three axe reports, browser diagnostics, verification summary, render logs and the media-size report. `scripts/capture.mjs` and `scripts/performance.mjs` reproduce the browser checks.

## Scope and limits

The product is original CGI for a fictional design study; it is not photographed merchandise, manufacturing CAD or a validated mechanical caliber. The movement is an illustrative arrangement of wheels and bridges. Geometry uses arbitrary scene units. No real dimensions, manufacturing origin, grades, certifications, accuracy, water resistance, warranty, price, reviews or availability are asserted.

No commit, merge, deployment or removal of noindex/robots protection has occurred.
