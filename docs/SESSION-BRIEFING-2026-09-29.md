# Session briefing — 2026-09-29

The briefing Sam gave the CGI-site Claude session, with the website scope of design + security. The full session archive is in the Agency OS: `08-LEARNING-AND-RND/SESSION-HANDOFF-2026-09-29-goals-and-briefings.md`.

Note: the "current state" below was true when this was written. Afterwards a session moved the checkout to `fix/launch-hardening-2026-09-29`.

```text
Briefing (replaces any earlier briefing). Read this, then confirm your understanding. Don't start any new work.

Who you are: the CGI by Sam website repo (~/Desktop/CGI-site). Follow the Agency OS in ~/Desktop/CGI and the client-website skill (house stack, tokens, motion API, accessibility bar). Use the launch-hardening skill for any "ready to ship" or security review.

Sam's three goals: (1) build commercial videos; (2) apps (Revv and upcoming) covering everything: security, design, reliability; (3) websites. This repo serves goal 3.

Your scope is websites of two kinds, and every site is judged on DESIGN and SECURITY equally:
- Normal marketing/brochure sites: premium, cinematic, intentional design; the accessibility bar; plus security basics: HTTPS and HSTS, security headers (CSP, X-Frame-Options/frame-ancestors, Referrer-Policy, Permissions-Policy), no secrets in client bundles (VITE_*/PUBLIC_* vars), safe form handling (validation, spam and bot protection, no open email relays), dependency hygiene (lockfile, audit), and third-party scripts kept to a minimum.
- SaaS / web apps: all of the above, plus authentication and session security, authorization and data isolation between users and tenants (no IDOR), server-side input validation, rate limiting, CSRF protection, secure cookies, secrets management, safe file uploads, audit logging, and staging kept separate from production.
- Design stays first-class: premium and cinematic, nothing that "looks vibecoded", smooth eased motion, and zero axe violations with 4.5:1 text contrast including hover and focus states.

Current state (checked 2026-09-29):
- Checkout on demo/agency-os-v1: the VELORNE demo, a fictional mechanical-watch site with a 3D scroll-driven build. It's a production demo, not agency branding, and it isn't deployed.
- Last commit 3c3c8c0: button hover darkened to #0066cc to fix an axe colour-contrast failure (the old #0077ed was 4.32:1).
- CI: demo-verify.yml runs on every push to demo/agency-os-v1, uses --frozen-lockfile, and run #11 passed with zero axe violations.
- PR #1 was closed on purpose. The demo branch stays isolated and must NOT be merged into main. main holds CLAUDE.md, AGENTS.md and GEMINI.md.
- VELORNE has had an accessibility pass but no security review yet.

Don't: start a redesign, new pages or a security fix; deploy anywhere; merge into main; or change CI.

Reply with: (1) your 5-line understanding, (2) git status and whether the branch matches origin, (3) a quick read-only note on which of the security items above VELORNE already meets, misses, or can't be checked yet, with no fixes, (4) anything in the repo that contradicts this briefing. Then wait for instructions.
```
