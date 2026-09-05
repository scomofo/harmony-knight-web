# Quest of the Harmony Knight (web)

A music theory learning app designed around short, focused sessions for adults, including adults with ADHD. Learn one idea, try it, recall it, and return to your saved place. Optional note-reading games and a duel with the Discord Sentinel build fluency alongside the learning path.

This is the web remake of the Flutter game in [scomofo/harmony-knight](https://github.com/scomofo/harmony-knight). Progress lives in `localStorage` — no account required.

## Playable surface

- **Onboarding** — one screen, an optional low/high listening example, and a direct start into the first lesson
- **Home** — one recommended next or unfinished lesson, weekly learning days without a daily streak, lesson recall when due, and access to note practice. Focus mode collapses optional game challenges and hides score counters.
- **Learning path** — 44 focused lessons across 11 chapters, with 88 recall questions. Each lesson has Learn → Try it → Recall → Done steps, user-controlled audio where relevant, practical tasks, and explanations after each answer. All teaching is open regardless of game grade. `/lesson/:level?unit=<stable-id>` links to an exact lesson; level remains zero-based for existing links.
- **Practice** — treble and bass staff + Figurenotes, written sharps, landmark notes (Bass F, Middle C, Treble G), spaced repetition, saved weak-note focus, due-review rounds, pause/resume and optional Fever Mode
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

## Learning path and return flow

The course covers Western music-theory foundations through advanced concepts. Practical
singing, writing, rhythm and composition tasks are self-guided; the app checks conceptual
recall, not a submitted score or full composition.

| Chapter               | Four focused lessons                                                        |
| --------------------- | --------------------------------------------------------------------------- |
| 1 · Sound             | Pitch, dynamics, timbre, steady pulse                                       |
| 2 · Notation          | Note alphabet, staff, landmarks, semitones and accidentals                  |
| 3 · Rhythm            | Durations, simple/compound meter, dots, rests/ties/syncopation              |
| 4 · Tonality          | Major scales, signatures, circle of fifths, natural/harmonic/melodic minor  |
| 5 · Building chords   | Intervals, consonance/tension, triad qualities, inversions                  |
| 6 · Musical phrases   | Roman numerals, authentic/plagal cadences, open endings, melody over chords |
| 7 · Voice leading     | First-species voices, parallels, motion/SATB, melodic decoration            |
| 8 · Changing key      | Related keys, pivot chords, tonicization/modulation, secondary dominants    |
| 9 · Colour and rhythm | Sevenths/extensions, borrowed chords, odd meters, 3:2 polyrhythm            |
| 10 · Counterpoint     | Melodic shape, closing gestures, second/third species, fourth/fifth species |
| 11 · Development      | Fugue subject/answer, development/form, modes, pitch-class transformations  |

- New learners can begin a roughly three-minute lesson immediately. Advanced lessons are
  estimated at five minutes; all lesson steps are untimed.
- Each action saves the exact step and original answer. Returning or reloading does not
  clear the checkpoint. Opening another chapter cannot carry answers into it.
- Both checks must be answered and their feedback continued before finishing. A wrong
  answer offers an explanation and permits progress; it is retained as a mistake for recall
  scheduling. Opening the refresher records assisted recall.
- First completion earns 25 harmony points once. Repeating a lesson cannot farm completion
  points or advance a game grade.
- Completed concepts come back for recall after one day. Successful due recalls increase
  spacing to 3, 7, 15, then at most 30 days. Wrong or assisted due recalls return after one
  day. Early repeats do not lengthen the interval or add due-review credit.
- Learning days use the device's local calendar and a Monday-based week. A break creates no
  recovery debt, resets no learning, and removes no earned points.
- Focus mode defaults on. Existing saves keep grades, points, confidence, note history,
  overview-read markers and settings (including the user's chosen session length). Missing
  new settings receive defaults. New users' note-practice sessions default to three minutes.
- Course progress is device-local. It has no account, cross-device sync or push notifications.

## Optional game progression

Game grades remain separate from lesson completion. The existing 11 grades (0–10) unlock
skill drills through rolling windows of relevant answers at 80–92% accuracy. Teaching can
be explored without grinding those trials. Grades, note reviews, daily challenges and games
remain accessible in the home screen's expandable training hall.

The existing duel practises first species; later-species and composition lessons currently
use self-guided tasks. Broader assessed score-writing and composition feedback are future
work, not capabilities implied by completing the last chapter.

Content lives in `src/lib/game/course.ts` (focused lessons and checks),
`src/lib/game/lessons.ts` (retained overview teaching and examples), and
`src/lib/game/curriculum.ts` (game levels, topics, unlocks).
`src/lib/game/learning.ts` owns lesson state transitions and review scheduling;
`src/lib/game/store.ts` persists progress alongside the existing save.

## Design and editorial references

The clear-step, visible-progress and resumable-task decisions are informed by
[W3C cognitive accessibility guidance](https://www.w3.org/WAI/WCAG2/supplemental/patterns/o1p04-clear-steps/).
These are product design choices, not a claim of clinical efficacy or a substitute for
usability research with adults with ADHD.

Terminology checks include [Open Music Theory's harmony and cadence explanation](https://viva.pressbooks.pub/openmusictheory/chapter/intro-to-harmony/)
and [University of Puget Sound's fugue analysis](https://musictheory.pugetsound.edu/mt21c/FugueAnalysis.html).
The new teaching and exercises are authored for this app. Cadences distinguish an authentic
V–I ending from the specific perfect-authentic criteria; fugue teaching distinguishes real
and tonal answers. Playback now gives the dynamics example actual differing volumes, honours
saved mute/volume before the first tone, and lets learners stop scheduled examples.

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

`npm run test:game` covers 48 cases for music theory, curriculum completeness, lesson checkpoints,
recall scheduling, one-time rewards, old-save compatibility, note review and correction scheduling.
Type checking and the production build also pass. Browser, keyboard and visual QA should include
the home/lesson return path, mobile text wrapping, reduced motion and muted audio. The inherited `npm test` also runs app-builder template checks;
on a standalone clone at `b608568`, 16 of those checks fail because workspace-only `.grok`
files are absent or template branding assertions no longer match this app. These failures
also reproduce before the note-review changes.

## Accessibility

- Confidence slider never locks — color, shape, and ghost tone fade as it rises
- High-contrast and reduced-motion toggles in settings
- Touch-first layout; untimed teaching, visible steps, persistent checkpoints, explicit stopping points
- Focus mode and user-controlled audio with stop/replay; mistakes show written explanations
