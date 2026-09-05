# Quest of the Harmony Knight (web)

A neuro-inclusive music theory quest for the browser. Short sessions, Figurenotes scaffolding, spaced-repetition note reading, and a duel with the Discord Sentinel.

This is the web remake of the Flutter game in [scomofo/harmony-knight](https://github.com/scomofo/harmony-knight). Progress lives in `localStorage` — no account required.

## Playable surface

- **Onboarding** — confidence slider, Figurenotes colors, wait-mode vs timed play
- **Hall** — today's path (lesson → current grade's drill), personal note reviews, daily quests, grade-trial progress, streak, harmony points
- **Lessons** — one per level at `/lesson/:level`: short teaching sections with playable examples, a three-question quick check, and a link to the level's drill. Readable ahead of your grade.
- **Practice** — treble and bass staff + Figurenotes, written sharps, landmark notes (Bass F, Middle C, Treble G), spaced repetition, saved weak-note focus, due-review rounds, pause/resume, Fever Mode, Broken Blade recovery
- **Strike** — realtime named-lane highway
- **Duel** — first-species blends against the Discord Sentinel (ghost tone on clash)
- **Studies** (unlock by level) — Listening (pitch, dynamics, four distinct timbres), Rhythm (name the bar, then tap it back and get scored on timing), Scales, Circle of Fifths with drawn key signatures, Intervals, Triads, Cadences & Roman numerals, closely related keys
- **Curriculum, heatmap, settings** — high contrast, reduced motion, volume, session length

## Personal note review

The hall and Note progress screen show notes that **need work**, are **due now**, or are
**not tried** within the current level's reading pool. Weak and due notes can overlap.

- A new mistake adds that exact note and octave to the review list. The last ten
  first-try answers determine recent accuracy; a note clears when its latest answer
  is correct and recent accuracy reaches 80%.
- **Practise weak notes** and **Due reviews** each run one round of the selected notes.
  Answer choices still use the full unlocked note pool, even if only one note needs work.
  When no reviews are available, the app offers free practice rather than substituting
  unrelated notes into the review round.
- Corrections stay visible until **Try again** or **Next note** (or the session timer ends).
  After an answer is revealed, retries update the review schedule without earning points,
  changing first-try accuracy, or advancing a grade. A failed review keeps its shorter
  interval after correction.
- Pause stops the session clock and answer input. Switching tabs pauses automatically;
  resume explicitly when ready. Keyboard shortcuts respect focused controls and results.
- Existing saves keep their lifetime totals, lessons, grades, and settings. Older heatmap
  entries without recent history use lifetime accuracy after at least three attempts;
  new first-try history takes over as you practise. Progress remains local to this browser.

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
npm run test:game
```

Dev server binds `0.0.0.0:8080`. Production preview uses `npm run preview`.

`npm run test:game` covers music theory, curriculum, note-review selection, saved history,
and correction scheduling. The inherited `npm test` also runs app-builder template checks;
on a standalone clone at `b608568`, 16 of those checks fail because workspace-only `.grok`
files are absent or template branding assertions no longer match this app. These failures
also reproduce before the note-review changes.

## Accessibility

- Confidence slider never locks — color, shape, and ghost tone fade as it rises
- High-contrast and reduced-motion toggles in settings
- Touch-first layout; sessions stay short by design (ADHD-friendly)
