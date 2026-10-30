# In Their World (ITW) — Baseline System & Architecture Audit

**Date:** 2026-10-29  
**Branch:** `main` (tracking `origin/main`)  
**Commit:** `8aed8e6` (*Merge branch 'autism-media-safety'*)  
**Location:** `web/` within `~/work/vaakbot`  
**Runtime:** Next.js 16.4.3 (Turbopack), React 19.3.0, TypeScript 5, Tailwind CSS v4, Node.js

---

## 1. Executive Summary & Verification State

The *In Their World* experience is embedded inside Manas Learning's web application at route `/experience`. The application is an interactive educational simulation designed for parents and educators to experience limited sensory, attentional, decoding, and communicative analogies of autism, ADHD, dyslexia, and speech differences.

### Baseline Health Checklist
- **Git Status**: Clean working tree (`0` uncommitted changes prior to test artifact creation).
- **TypeScript (`npx tsc --noEmit`)**: **PASS (0 errors)**.
- **ESLint (`npx eslint components/itw app/experience`)**: 50 problems (33 errors, 17 warnings).
  - *Key violations*: React hook purity (`performance.now()` in component render), unescaped quotes in JSX (`react/no-unescaped-entities`), and synchronous `setState` in `ItwLeaves.tsx` (`react-hooks/set-state-in-effect`).
- **Dev Server**: Starts cleanly under Turbopack in ~470ms on `http://localhost:3000`.
- **Baseline Screenshots Captured**:
  - `web/docs/itw/screenshots/baseline-desktop-1440x900.png`
  - `web/docs/itw/screenshots/baseline-mobile-390x844.png`
  - `web/docs/itw/screenshots/baseline-home-desktop-1440x900.png`

---

## 2. Architecture & File Inventory

### Routing & Shell
- `web/app/experience/page.tsx`: Injects Google Fonts (`Nunito`, `Libre Franklin`, `JetBrains Mono`) and renders `<ItwClient />`.
- `web/components/itw/ItwClient.tsx`: Lazy client component loader. Has an active 12-second timeout watchdog, an Error Boundary, and an iframe fallback to the legacy deployed domain (`https://intheirworld.vercel.app`). Renders `<ItwLeaves />` + `<InTheirWorld />`.
- `web/components/itw/ItwLeaves.tsx`: Portaled ambient falling leaf layer (14 fixed leaf SVG elements) with light/dark adaptive CSS variables and `@media (prefers-reduced-motion: reduce)` suppression.

### Core Experience Engine
- `web/components/itw/InTheirWorld.jsx` (3,291 lines, currently marked `// @ts-nocheck`):
  - **`AudioEngine`**: Manages Web Audio API `AudioContext`, synthetic gain nodes, drones, tones, sweeps, and audio file buffers with volume capping.
  - **`Landing`**: Editorial hero, subtitle, module selection cards (Autism, ADHD, Dyslexia, Speech), and "Coming Soon" conceptual cards.
  - **`SettingsBar`**: Sound toggle and Dark Mode switcher (`itw-dark-mode` in `localStorage`).
  - **`AutismSim` & `AutismModule`**: Sensory filtering challenge in 3 settings (School, Grocery, Mall). Integrates visual noise, sound effects, target finding, volume control, effects toggle, and `QuietCorner`.
  - **`AdhdSim` & `AdhdModule`**: Target sequencing (1–10) with distractors popping up; tracks elapsed time and misses.
  - **`DyslexiaSim` & `DyslexiaModule`**: Reading passage with animated/swapping letters, comprehension questions, strategy tabs, and prevalence facts.
  - **`SpeechSim` & `SpeechModule`**: Conversational block simulator with rhythm push bar and turn-taking delay.

### Design System & Media Components
- `web/components/itw/InTheirWorld.css` (1,213 lines): Design tokens, theme variables (`--bg`, `--card`, `--accent`, `--ink`), typography, animations, responsive breakpoints.
- `web/components/itw/media/CueIcon.jsx` (239 lines): Accessible SVG icons (headphones, schedule, timer, break, card, quiet).
- `web/components/itw/media/EffectsToggle.jsx` (49 lines): Accessible toggle to disable flicker/noise/motion.
- `web/components/itw/media/QuietCorner.jsx` (228 lines): Sensory calm room component.
- `web/components/itw/media/media.css` (221 lines): Supporting styles for media and quiet components.

### Asset Pipeline
- `web/scripts/fetch-itw-assets.mjs` (85 lines): Downloads sound and video files from Hugging Face dataset `anabaena/autism-profile-assets`.
- `web/scripts/compress-itw-assets.mjs` (96 lines): Compresses audio via `ffmpeg-static` to ~96kbps MP3 and video to <3MB H.264.
- All 19 sound files are compressed and saved in `web/public/sounds/*.mp3`.
- All 6 scenario videos are compressed and saved in `web/public/videos/`.

---

## 3. Discovered Vulnerabilities & Deficits

1. **Asset Fetch Startup Bottleneck**:
   - `fetch-itw-assets.mjs` was unconditionally issuing `curl` downloads for 25 files on every `npm run dev` and `npm run build`, causing slow startups or network hangs if Hugging Face throttles.
2. **Audio Mute Consistency**:
   - Toggling sound in settings does not immediately cancel active sound scheduled ramps in `AudioEngine` if an unmount or rapid restart occurs.
3. **Reduced Motion Leakage**:
   - Leaf animation selector `.itw-leaves` is suppressed under `prefers-reduced-motion`, but individual `.itw-leaf` animations can still run on older browser cascades if not scoped strictly.
4. **Interactive Accessibility (WCAG 2.2 AA)**:
   - Multiple interactive cards and simulation targets use `div onClick` without explicit `onKeyDown` handlers or native `<button>` markup.
   - Screen reader announcement for round changes and score updates is missing `aria-live="polite"` regions.
5. **ADHD Journey Parity**:
   - ADHD module currently lacks the unified 8-step flow stepper (`FlowCrumbs`, `FlowStepper`, `FlowQuestions`, supportive retry) present in Dyslexia.
