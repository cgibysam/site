# CGI by Sam — Agency OS V1 Website Demo

This branch is a **fictional website test**, not the production CGI by Sam website.

## Purpose

Test the Agency OS V1 candidate against a real build:
- visual quality;
- cinematic scroll interaction;
- responsive recomposition;
- reduced-motion behavior;
- accessibility;
- performance-aware motion;
- semantic/search structure;
- cross-AI project routing;
- verification workflow.

## Concept

**STACK** is a fictional burger house used purely as a creative/technical benchmark.

The hero and scroll story use generated CSS/SVG-like shapes rather than external image dependencies so the first test isolates layout, typography, motion and engineering.

## Stack

- Astro
- TypeScript
- GSAP + ScrollTrigger
- native CSS design tokens/layout

No smooth-scroll library or 3D engine is included in V1 because the concept does not need them yet.

## Local

```bash
pnpm install
pnpm check
pnpm dev
```

Production-like verification:

```bash
pnpm check
pnpm build
pnpm preview
```

## Safety

The demo ships with:
- `noindex,nofollow`
- `robots.txt` disallowing crawling
- no production deployment configuration
- no real business claims

Do not remove those protections or merge to `main` without explicit approval.

## Agency OS

Read `AGENTS.md`. The current demo points to `cgibysam/agency-os` branch `chore/cross-ai-foundation` while V1 is still a candidate.
