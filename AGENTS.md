# Project AI Instructions

This branch is a demo website used to test CGI by Sam Agency OS V1.

Canonical reusable standards:
- repository: `cgibysam/agency-os`
- branch: `main`
- local checkout: `~/Desktop/CGI` (read the rulebook from here; do not fetch it from GitHub)
- start: `AI-ENTRYPOINT.md`
- primary profile: `03-PROJECT-PROFILES/WEBSITE.md`
- benchmark: `06-QA-AND-DELIVERY/DEMO-WEBSITE-BENCHMARK.md`

For every website task, read the Agency OS entry point and website profile. Follow the profile's required reading and every Agency OS rule and playbook applicable to the task. Record why any check is not applicable. Before calling the site launch-ready, record results and evidence for relevant website QA, factual, brand, security, accessibility, performance, and deployment checks. Automated tests do not replace human review of design, claims, or approvals.

This repository remains authoritative for its implementation and demo-specific decisions.

Stack exception: this demo uses Astro, pnpm and npm-installed GSAP instead of the house no-build stack (`02-RULES-AND-STANDARDS/HOUSE-WEB-STACK.md`). Reason: it is the Agency OS V1 benchmark demo with a Blender-rendered scroll-controlled 3D frame sequence, media optimization scripts and Playwright/axe CI, built before the house stack standard existed. New client and demo sites use the house stack.

Do not deploy, merge to main, or remove the demo noindex protection without explicit approval.
