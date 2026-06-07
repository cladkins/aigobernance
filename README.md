# AIShield365 — Website Clone

A faithful static clone of the [aishield365.ai](https://www.aishield365.ai/) landing
page — the "AI Governance in 10 minutes" survey site by Patriot Consulting.

The original is a Next.js app; this clone reproduces the same markup, copy, dark
navy + blue theme, red Patriot Consulting footer, and entrance animations as a
self-contained static site.

## Structure

```
index.html          # Landing page (hero, feature cards, "Why this matters", footer)
survey/index.html   # Placeholder for the survey CTA target
assets/styles.css   # Gradient background, fonts, fade-in animations
```

Styling uses the Tailwind CDN plus a small custom stylesheet for the
radial-gradient backdrop and the fade-in-up entrance animation (replacing the
original's framer-motion).

## Running locally

Open `index.html` directly, or serve the folder so absolute paths resolve:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Notes

- Content, statistics, source links, and contact details are copied from the
  live site for fidelity.
- The survey flow is a placeholder; the original generates a NIST AI RMF policy
  and deployment configs server-side.
