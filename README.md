# Quest of the Harmony Knight (web)

A neuro-inclusive music theory quest for the browser. Short sessions, Figurenotes scaffolding, spaced-repetition note reading, and a duel with the Discord Sentinel.

This is the web remake of the Flutter game in [scomofo/harmony-knight](https://github.com/scomofo/harmony-knight). Progress lives in `localStorage` — no account required.

## Playable surface

- **Onboarding** — confidence slider, Figurenotes colors, wait-mode vs timed play
- **Hall** — today's path (lesson → drill → quests), grade-trial progress, streak, harmony points
- **Lessons** — one per level at `/lesson/:level`: short teaching sections with playable examples, a three-question quick check, and a link to the level's drill. Readable ahead of your grade.
- **Practice** — treble and bass staff + Figurenotes, landmark notes (Bass F, Middle C, Treble G), spaced repetition, weak-note focus, Fever Mode, Broken Blade recovery
- **Strike** — realtime named-lane highway
- **Duel** — first-species blends against the Discord Sentinel (ghost tone on clash)
- **Studies** (unlock by level) — Listening (pitch, dynamics, four distinct timbres), Rhythm (name the bar, then tap it back and get scored on timing), Scales, Circle of Fifths with drawn key signatures, Intervals, Triads, Cadences & Roman numerals, closely related keys
- **Curriculum, heatmap, settings** — high contrast, reduced motion, volume, session length

## Course structure

Eleven levels in three phases. Each level defines the **topics** whose answers count toward its grade trial: a rolling window of recent answers (10–40 depending on level) that must reach 80–92 % accuracy. Answers on other topics still earn points and quests but do not advance the grade, so a knight cannot grind note-naming through the harmony levels.

| Level | Lesson                    | Drill            | Trial topics            |
| ----- | ------------------------- | ---------------- | ----------------------- |
| 0     | Sound before sight        | Listening        | sensory, note reading   |
| 1     | Figurenotes & landmarks   | Practice         | note reading            |
| 2     | Rhythm & the body         | Rhythm           | rhythm                  |
| 3     | Scales & key signatures   | Circle of Fifths | keys, scales            |
| 4     | Intervals & triads        | Intervals        | intervals, triads       |
| 5     | Cadences & Roman numerals | Cadences         | harmony                 |
| 6     | Part-writing              | Duel             | duel, harmony           |
| 7     | Modulation                | Related keys     | modulation, keys        |
| 8     | Sevenths & odd meters     | Rhythm           | rhythm, strike, harmony |
| 9     | Species counterpoint      | Duel             | duel                    |
| 10    | Fugue & modernism         | Duel             | — (max)                 |

Content lives in `src/lib/game/curriculum.ts` (levels, topics, unlocks), `src/lib/game/lessons.ts` (lesson text and examples) and `src/lib/game/exercises.ts` (generators with explanations).

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
node --experimental-strip-types --test src/lib/game/game.test.ts
```

Dev server binds `0.0.0.0:8080`. Production preview uses `npm run preview`.

## Accessibility

- Confidence slider never locks — color, shape, and ghost tone fade as it rises
- High-contrast and reduced-motion toggles in settings
- Touch-first layout; sessions stay short by design (ADHD-friendly)
