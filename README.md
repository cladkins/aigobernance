# AIShield — AI Governance Survey

A static clone of the [aishield365.ai](https://www.aishield365.ai/) "AI Governance
in 10 minutes" experience by BlueVoyant, re-themed to match
[defenderxdr.com](https://defenderxdr.com/) (BlueVoyant DefenderXDR) for embedding
into that site.

It includes a fully working survey: instead of emailing results, it collects the
user's name and email and generates a NIST AI RMF 1.0-aligned governance package
for **direct download** — built entirely client-side.

## Structure

```
index.html              # Landing page (hero, feature cards, "Why this matters", footer)
survey/index.html       # The survey app (persona questions, control catalog, download flow)
survey/survey.js        # Survey logic + client-side package generation
survey/data.js          # Control catalog (30 controls + Microsoft set) and NIST defs
survey/vendor/jszip.*   # Vendored JSZip (client-side ZIP creation)
assets/styles.css       # DefenderXDR theme tokens, gradient accents, animations
assets/vendor/tailwind.js  # Vendored Tailwind runtime (self-contained, no runtime CDN)
```

## Theme

Matched to defenderxdr.com: near-black `#0d0d0d` background, `#141414` cards,
Inter typography, primary blue `#0558ff`, and the signature blue→mint accent
gradient (`linear-gradient(135deg,#3a7cff,#8dedc7)`) used on hero accent words,
the logo, and the footer CTA banner. The theme is applied by remapping Tailwind's
`slate`/`blue` palettes (see the `tailwind.config` in each HTML file) plus
`assets/styles.css`, so all markup — including the survey's JS-generated controls —
adopts it automatically.

## The survey

1. **CISO persona / strategy** — posture, regulations, certifications/frameworks,
   AI technologies, operating systems, and data-governance maturity. Posture sets
   smart BLOCK/ALLOW defaults; AI-tech and OS selections filter the catalog.
2. **Control catalog** — an authentic 30-control catalog (Anthropic, OpenAI,
   Enterprise-wide) plus the Microsoft control set, each a `BLOCK`/`ALLOW` toggle
   with NIST alignment, rationale, and consultant notes. Audit frameworks trigger
   a compliance lock that forces AI Auditing controls on. A live risk meter
   tracks coverage.
3. **Global AI operating instructions** — free-text guidance bundled into the
   package.
4. **Download** — enter name + email, and the app builds and downloads
   `AIShield-Governance-Package-<date>.zip` containing a tailored policy
   (`policy/AI-Governance-Policy.md`), `selections.json`, and
   Intune / Jamf / PowerShell / Bash config skeletons.

## Running locally

Serve the folder so paths resolve (the survey lives at `/survey/`):

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Notes

- The control catalog, copy, statistics, source links, and contact details are
  derived from the public live site for fidelity.
- Config skeletons are generated from your selections as a deployment starting
  point. The original generates these server-side.
- The page is self-contained (Tailwind and JSZip are vendored); only web fonts
  load from Google Fonts, with a system-font fallback.
