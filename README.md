# Sites

One folder per website. Each folder is a self-contained static site (HTML, CSS, JS, assets)
that runs on its own; the pipeline in `scripts/` and `.github/` is shared.

| Folder | Site |
| --- | --- |
| `patty/` | Patty, premium smash burgers |
| `inerg/` | INER-G, lubricants from Lebanon (light and dark themes) |

Run everything locally from the repo root and open the folder you want:

```
python3 -m http.server 8000
```

http://localhost:8000/ lists the sites; http://localhost:8000/patty/ and http://localhost:8000/inerg/ open them.

To add a site: create a folder with `index.html`, `css/`, `js/` and `assets/manifest.json`,
push, and the workflow fetches and optimizes the assets listed in the manifest into that folder.

---

# Patty — premium smash burgers

A single-page site for an imaginary smash-burger restaurant, built as a scroll-driven
experience: full-bleed video backgrounds, an exploded burger that assembles as you scroll,
a pinned horizontal menu, counters and parallax. Plain HTML, CSS and JavaScript with
GSAP ScrollTrigger and Lenis (vendored), so there is no build step.

## Layout

- `patty/index.html` — the page (content, structure, inlined layer metadata)
- `patty/css/styles.css` — design tokens, layout, responsive rules
- `patty/js/main.js` — scroll choreography (hero, craft steps, burger build, menu track, counters)
- `patty/js/vendor/` — GSAP 3.13, ScrollTrigger, Lenis 1.3
- `patty/assets/img`, `patty/assets/video` — optimized WebP stills and H.264 background clips
- `patty/assets/manifest.json` + `scripts/fetch_assets.py` — rebuild the optimized assets
  from the source generations; `.github/workflows/assets.yml` runs it on GitHub Actions

## Assets

All photography and video were generated for this project with Higgsfield
(GPT Image 2.5 for stills, Kling 3.0 for the looping background clips). The
restaurant, its menu, address and contact details are fictional.
