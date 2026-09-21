# Patty — premium smash burgers

A single-page site for an imaginary smash-burger restaurant, built as a scroll-driven
experience: full-bleed video backgrounds, an exploded burger that assembles as you scroll,
a pinned horizontal menu, counters and parallax. Plain HTML, CSS and JavaScript with
GSAP ScrollTrigger and Lenis (vendored), so there is no build step.

## Run it locally

```
npx serve .
```

Then open the printed URL (usually http://localhost:3000). Any static server works,
for example `python3 -m http.server 8000`.

## Layout

- `index.html` — the page (content, structure, inlined layer metadata)
- `css/styles.css` — design tokens, layout, responsive rules
- `js/main.js` — scroll choreography (hero, craft steps, burger build, menu track, counters)
- `js/vendor/` — GSAP 3.13, ScrollTrigger, Lenis 1.3
- `assets/img`, `assets/video` — optimized WebP stills and H.264 background clips
- `assets/manifest.json` + `scripts/fetch_assets.py` — rebuild the optimized assets
  from the source generations; `.github/workflows/assets.yml` runs it on GitHub Actions

## Assets

All photography and video were generated for this project with Higgsfield
(GPT Image 2.5 for stills, Kling 3.0 for the looping background clips). The
restaurant, its menu, address and contact details are fictional.
