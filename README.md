# Quest of the Harmony Knight (web)

A neuro-inclusive music theory quest for the browser. Short sessions, Figurenotes scaffolding, spaced-repetition note reading, and a duel with the Discord Sentinel.

This is the web remake of the Flutter game in [scomofo/harmony-knight](https://github.com/scomofo/harmony-knight). Progress lives in `localStorage` — no account required.

## Playable surface

- **Onboarding** — confidence slider, Figurenotes colors, wait-mode vs timed play
- **Hall** — daily quests, streak, harmony points, recommended next drill
- **Practice** — staff + Figurenotes, spaced repetition, weak-note focus, Fever Mode, Broken Blade recovery
- **Strike** — realtime named-lane highway
- **Duel** — first-species blends against the Discord Sentinel (ghost tone on clash)
- **Studies** — rhythm, scales / circle of fifths, intervals, triads (grade-gated)
- **Curriculum, heatmap, settings** — high contrast, reduced motion, volume, session length

## Stack

- React 19, TanStack Start / Router, Zustand, Tailwind v4
- Web Audio for synthesized tones (no sample pack required)
- Vite 8

## Commands

```bash
npm install
npm run dev
npm run typecheck
npm run build
```

Dev server binds `0.0.0.0:8080`. Production preview uses `npm run preview`.

## Accessibility

- Confidence slider never locks — color, shape, and ghost tone fade as it rises
- High-contrast and reduced-motion toggles in settings
- Touch-first layout; sessions stay short by design (ADHD-friendly)
