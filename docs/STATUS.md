# Status

## 2026-09-29 — launch hardening

**State**

- Launch-hardening report written: `docs/launch-hardening-2026-09-29.md` (checklist results, hero-vs-recipe
  comparison, and an Outcome section recording what was fixed, with evidence).
- Branch `docs/launch-hardening-2026-09-29` (commit `df26af2`) holds the report only.
- Branch `fix/launch-hardening-2026-09-29` (commit `a3d2fa6`, built on the report branch) holds the fixes:
  - stray `*.sb-*` files removed and ignored; Astro audit exception recorded in `README.md`
  - scroll sequence re-rendered at 1200 px (mobile 720 px); DPR-sized canvas; frames load after `load`, coarse to
    fine, with a nearest-frame fallback (`src/scripts/frames.ts`)
  - `/cinematic` picks its film layout before first paint (CLS 0); lazy, versioned film poster; lead-plus-two cards;
    text-style `▶`
  - cinematic and template review scripts added to CI
- Verified on that build: `pnpm check` and `pnpm build` pass. All five browser QA scripts exit 0, with 0 runtime
  errors and 0 axe violations. Throttled mobile lab: `/` LCP 856 ms, CLS 0; `/cinematic/` LCP 948 ms, CLS 0.
- Local-only evidence (gitignored): `artifacts/launch-hardening-2026-09-29/` (probe scripts, screenshots, logs,
  perf JSON) and `artifacts/render-candidate-1200/` (the raw 1200 px Blender render).
- Neither branch has been pushed. Nothing is deployed. No Cloudflare Workers exist, and Railway only has Revv.

**Next action**

1. Review `git diff demo/agency-os-v1..fix/launch-hardening-2026-09-29`, then decide whether to push the branch and
   open a PR into `demo/agency-os-v1` (not `main`; merging to `main` is a production release and needs explicit
   approval).
2. Answer the report's open ❓ items: hosting target, analytics/error logging, privacy notice, and whether phones
   keep the frame sequence.
3. Run Lighthouse and a real-iPhone check (scrub smoothness, `▶` glyph) before any public launch.

**Blocked / waiting**

- `og:image`, `twitter:card`, canonical and sitemap: waiting on an approved real origin.
- Astro 5 → 7 upgrade (clears the audit exception): waiting on Sam's approval.
