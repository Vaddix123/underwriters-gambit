# Underwriter's Gambit

A single-file roguelite deckbuilder where you run an MCA underwriting desk for 10 days. Survive without blowing the fund, navigate renewal-bosses of every deal you fund, and beat the final boss on Day 10.

**Play:** open `index.html` in any browser. No build step, no server required.
**Hosted version:** see GitHub Pages URL in the repo's About sidebar.

## Game shape

- **Choose an underwriter** — 6 classes (Branden / Brendan / Keith / Isaac / Alexander / Stanley), each with its own 25-card draft pool and signature card. Starting deck is 5× Push Rate + 3× Tighten Up + signature.
- **Underwrite a file each day** — read a merchant's file (FICO / TIB / UCC position / bank statements / ISO tier), play cards to reveal info and structure your offer, set term-sheet levers (Advance / Term / Holdback / Factor), submit.
- **Combat layer** — files have HP and abilities. Cards do damage. The file telegraphs an intent each turn (Stacking Surge, Cash Crisis DOT, Forged Docs, Broker Pressure, Smoke & Mirrors). End turn, file acts, draw new hand.
- **Renewal-bosses** — every cleared deal is pulled back as a boss-tier renewal on later days, with deterioration applied: position bumps, fresh anomalies, NSF spikes, FICO slips, possible Chapter 11.
- **Scam tip-offs** — 30% chance per intermission you'll get an optional fraud-flagged mini-boss for bonus commission and a guaranteed-rare card.
- **Final boss** — Day 10. The Pillow Tycoon, Sub-Prime Slumber Inc.: HP regen, DOT, BOGO anomaly amp, lawsuit-phase legal armor, charm cycle.
- **Outcomes are deterministic** — no d100 roll. Risk score + bounded volatility shock → outcome band (Clean Clear / Cleared / Stressed / Breach / Default / Collapse). Read the file, set the terms, the math holds or it doesn't.

## Real-world calibration

Math + thresholds ported from a production MCA underwriting platform:
- **Leverage cap by term band** — `<22w` 40%, `22–28w` 37%, `>28w` 35%
- **Holdback ceiling** — daily debit can't exceed `daily_revenue × holdback %` without taking risk
- **DSCR / cash-flow check** when bank reveals
- **State COJ blocks** — NY / NJ / CA flagged on the file
- **Concurrent MCA inference** from UCC position
- **Outcome band thresholds** — `<25` Clean Clear, `25–50` Cleared, `50–65` Stressed, `65–80` Breach, `80–95` Default, `95+` Collapse

## Tech

- React 18 + Tailwind CDN + Babel standalone, no build step
- `assets/` holds the start-screen image (`Start.png`) and audio tracks (`not-a-loan.mp3`, `select-screen-2.mp3`)
- Audio is wired to game state: `Not A Loan` plays on the start screen, `Select Screen 2` plays on character select

## Deploy

This repo deploys to GitHub Pages from the root directory of `main`. Any push to `main` republishes.

## Generating art (Nano Banana)

`scripts/genart.js` generates PNGs via Google's Gemini image model and writes them to `assets/`.

Setup (one-time):
1. Put your key in `.env.local` at the repo root: `GEMINI_API_KEY=...`
2. `.env.local` is gitignored — never commit it.
3. Image generation requires a billing-enabled Google AI Studio key. Free-tier keys return HTTP 429 with `RESOURCE_EXHAUSTED` for image models.

Usage:
```
node scripts/genart.js <output-filename> "<prompt>"
node scripts/genart.js boss-pillow-tycoon.png "pixel art portrait, bloated infomercial mogul in pinstripe pajamas, neon noir, 512x512"
```

Optional env overrides:
- `GEMINI_MODEL` — defaults to `gemini-2.5-flash-image`. Other accessible options: `gemini-3-pro-image-preview`, `gemini-3.1-flash-image-preview`.
- `GEMINI_OUT_DIR` — defaults to `assets/`.

## License

All rights reserved by the author.
