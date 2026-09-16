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

The course covers Western music-theory foundations through advanced concepts. **31 lessons
include 52 interactive tasks**, alongside the 88 conceptual recall checks. Notation reflection
and open composition prompts outside these exercise families remain self-guided.

| Interactive family                  | What learners do                                                                                                                                                                                                           |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Listening · 10 tasks                | Compare pitch direction, equal pitches and relative loudness; match four timbres against replayable references. Written clues support guided completion while muted and do not count as independent listening success.     |
| Chords · 19 tasks                   | Select spelled notes and registers for triads, inversions, chord functions, cadences, pivots, secondary dominants, sevenths and borrowed chords. Hear their voicing on its own or after a chord context.                   |
| Rhythm · 11 tasks                   | Toggle attacks or accents on an untimed subdivision grid. Build durations, dotted rhythms, tied offbeat entries, meter groupings and both parts of 3:2; hear the result together.                                          |
| Melody and voice leading · 12 tasks | Edit a phrase above a bass or reference line. Repair parallels, create contrary motion, close a cadence, prepare a suspension, control a passing tone, shape a line, transpose/invert a subject and write a Dorian phrase. |

Each task provides written feedback, playback of the learner's answer and an example,
and progressive help: a clue, highlighted places to inspect, then an optional worked answer.
Corrections preserve the prior draft for before/after listening. Using help marks the attempt
assisted. Drafts, task position, feedback, first-check outcomes and
assistance are saved across reloads. Correct all tasks (with help if needed) before recall;
retries preserve the original first-check result and award no extra XP. Existing saves
already in Recall or Done keep their place. Note palettes and native selects work with
keyboard or pointer; rhythm buttons support native Space activation. Audio is optional.

Voice-leading judgments match the stated task: a fourth over the bass is dissonant in
first species, but a stepwise weak passing fourth and a prepared 4–3 suspension are valid
in their respective exercises. Repeating a stationary fifth or octave is not parallel
motion. Open-ended tasks accept alternative answers satisfying their rules. These short
fragments do not assess complete SATB scores, full species compositions or musical style.

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

The duel practises a simplified first-species fragment. Its first attempted answer per turn
determines accuracy, answer points and grade credit; corrections still complete the phrase.
The 40-point phrase-win reward appears in both saved points and the session summary.
Rhythm naming and the first completed tap run each count once per bar; Tap again is practice.
Interrupted tap runs are discarded without a mistake. Quiz feedback stays until Continue.
Quiz and rhythm sessions have explicit pause/resume/end controls; changing tabs pauses them.
Strike resumes the same chart and score after a pause and reports the harmony points saved.
End, restart and navigation cancel pending session work and scheduled audio.

Content lives in `src/lib/game/course.ts` (focused lessons and checks),
`src/lib/game/lessons.ts` (retained overview teaching and examples), and
`src/lib/game/curriculum.ts` (game levels, topics, unlocks).
`src/lib/game/learning.ts` owns lesson state transitions and review scheduling;
`src/lib/game/store.ts` persists progress alongside the existing save.
`src/lib/game/activity-catalog.ts` authors the interactive tasks; `activities.ts` owns
their judgments and progress transitions. `lesson-activity.tsx` renders the three editors.

## Design and editorial references

The clear-step, visible-progress and resumable-task decisions are informed by
[W3C cognitive accessibility guidance](https://www.w3.org/WAI/WCAG2/supplemental/patterns/o1p04-clear-steps/).
These are product design choices, not a claim of clinical efficacy or a substitute for
usability research with adults with ADHD.

Terminology checks include [Open Music Theory's harmony and cadence explanation](https://viva.pressbooks.pub/openmusictheory/chapter/intro-to-harmony/)
and [species-counterpoint rules](https://viva.pressbooks.pub/openmusictheory/chapter/species-counterpoint/),
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
npm ci
npm run dev
npm test
npm run typecheck
npm run build
```

Dev server binds `0.0.0.0:8080`. Production preview uses `npm run preview`.

Use Node 24. GitHub Actions runs a clean `npm ci`, `npm test`, type checking and a production
build on pull requests and pushes to main, with read-only repository permissions and no
deployment or database credentials.

`npm test` runs the script tests (`test:template`), game/app-data/auth tests (`test:unit`),
then React interaction tests in jsdom (`test:ui`). `test:game` runs just the game logic.
The inherited script tests use isolated app-env and branding fixtures instead of assuming
this clone has an app-builder workspace. Four authoring-document checks skip with an
explicit reason when those unpublished instruction files are absent; runtime assertions
still run. Regression coverage includes first-attempt credit, canceled timers, pause/resume,
native keyboard controls, interactive judgments, saved drafts, assisted answers and audio
scheduling. Component tests do not replace real-browser visual and audio QA: check narrow
screens, actual keyboard/touch timing, sound envelopes and the full lesson return flow.

## Playback, practical recall and creative projects

Teaching audio and visual highlights share one score and the AudioContext clock. Playback
supports normal, three-quarter and half speed without changing pitch. Voice-leading tasks
can play the upper voice, bass/accompaniment, or both. Notes/cells/positions highlight as
they sound; no moving animation or automatic scrolling is required. Stopping, editing,
muting, switching tasks and hiding the tab cancel playback. Listening questions label their
sounds neutrally so the playback display does not reveal the answer.

Reviews for the 31 interactive lessons now start with a fresh practical task before the two
written checks. Listening rounds vary pitch/register, rhythm rounds vary patterns or grouping,
chord rounds transfer voicings while preserving their quality and bass position, and
voice-leading rounds vary register while retaining their stated rules. Each round is
deterministic and persisted, so reloading does not change the answer or clear a mistake.
Original lesson drafts remain separate. A wrong or assisted practical review prevents a
longer recall interval. Early repeats and retries add no extra XP or duplicate first-check
evidence. The learning path shows up to eight recent practical outcomes for each concept.

Every chapter has a creative payoff at `/create/:chapter` (zero-based): call/response,
a musical postcard, a groove, a tonal melody, chord colours, phrase endings, a dialogue
between voices, changing key, seventh-chord grooves, a tiny duet, and theme/answer.
Learners edit notes, rests, rhythm cells, chords and tempo as appropriate, save named pieces,
and replay or reopen their collection. Drafts save during editing. These open creations
earn no grade or mastery credit and do not claim to validate a complete composition.
They are available from each chapter in the learning path and after finishing its lessons.

Settings includes JSON progress export/import covering lessons, practical reviews, concept
history, settings, draft creations and saved music. Import validates file format, size, field
ranges and lesson/task compatibility, then shows a summary. The learner explicitly confirms
replacement, with a download of their current progress first. Invalid files and storage
quota failures do not replace the live store. Backups are portable files; no account or
cross-device service is needed. Keep downloaded backups somewhere durable.

## Accessibility

- Confidence slider never locks — color, shape, and ghost tone fade as it rises
- High-contrast and reduced-motion toggles in settings
- Touch-first layout; untimed teaching, visible steps, persistent checkpoints, explicit stopping points
- Focus mode and user-controlled audio with stop/replay; mistakes show written explanations
