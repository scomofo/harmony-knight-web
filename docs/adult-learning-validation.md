# Adult learning curriculum pass

Designed for an adult learner who benefits from short tasks, an obvious next action, optional detail, and recoverable progress. This is a software and editorial pass, not clinical validation or certification of instrumental skill.

## Harmony Knight

- Corrected the C-augmented staff spelling while retaining minor/diminished flats; bundled an OFL-licensed music font so clefs render on systems without music fonts.
- Supplied the starting pitch in major-key listening questions; no absolute-pitch skill is silently assumed.
- Added bounded practical activities across the course. The current source contains 45 units, 81 interactive tasks and 90 authored conceptual checks; every unit has practical coverage. Early note-building tasks have compact palettes and omit irrelevant bass-reference labels.
- Retained source definitions and caveats behind an optional detail expander.
- Keys/scales and intervals/triads advancement now requires three correct answers in each strand alongside the existing accuracy window. Session summaries show the missing strands; drill rank is explicitly distinct from lesson completion.
- Preserved topic evidence in progress backups. Fixed two pre-existing lint errors and made startup resolve the repository directory.

## Mastery, return flow and transfer follow-up

- Completion remains available after mistakes and help. Per-unit status now distinguishes supported completion, independent initial completion, and independent security from a later fresh unaided practical-review round plus correct unaided recall. Secure evidence survives rereading and backup/restore; legacy saves receive conservative null defaults rather than retrospective security.
- Due-review copy is derived from the actual practical and recall route. After 48 hours away, one oldest-due review is recommended while the full queue remains optional. Triaging does not mutate schedules or award review credit.
- The existing fixed 1 → 3 → 7 → 15 → 30-day scheduling policy is isolated and pinned by boundary tests. No adaptive scheduler, latency proxy or confidence-based mastery rule was introduced.
- Every Chapter 7–11 unit has a prerequisite runway. Helped learners retain their original work and can choose a fresh unsupported practical attempt without losing future help or forward navigation.
- Twenty units generate deterministic, scope-capped written-recall pairs, including new odd-meter, 3:2 polyrhythm and mode families. Twenty-five units retain authored checks; the exact fallback list is documented in `src/lib/game/recall-gen.ts`.
- Every chapter offers an optional real-world transfer prompt, small rubric, accessible alternative and locally saved reflection. These are unscored and do not award independent security or certify performance, composition or instrumental skill.
- Backup status explicitly describes browser-local storage, records the last explicit export creation, and includes mastery evidence and transfer reflections. No account, cloud sync, analytics or notification permission was added.

These are software and editorial checks, not learner-outcome evidence. Clinical efficacy and real instrumental transfer were not assessed.

## Shared phrase follow-up

Added an optional Hear / Try / Use study, “A pulse with room to breathe”: four bars of 4/4 at 72 bpm (48 bpm slower option), with paired eighth-note attacks in bars 2 and 4 and a final quarter rest. Both apps use the same onset pattern. Harmony includes it in the pulse lesson; SparkSuite offers it on the Learn overview with instructions for all ten instruments. Listening, one-bar practice, and hidden-count attempts are valid choices; there is no timed requirement.

Selected step and a 240-character optional observation save locally in each app. They do not sync between apps or record audio, and do not award mastery. Stop, collapse, tab hiding and unmount cancel playback. Unavailable storage/audio produces a readable recovery message.

Early exact recall tasks now move by octaves and preserve authored pitch spellings and named keys. Advancement text includes the strand requirement on grades 3 and 4.

Follow-up validation: 130 unit tests and 39 UI tests pass, alongside template checks. Component tests cover saved notes/steps and instrument slots, 17 onsets across 16 beats, one-bar/slower options, collapse stop, mute and unavailable storage. Typecheck and build pass; lint has eight existing warnings and no errors. Desktop and mobile dev/production render checks show content without overflow or uncaught page errors; external resource loading errors and the existing share-card note remain in this sandbox. The interactive regression now uses agent-browser; running it here is blocked by daemon socket binding (Operation not permitted). No successful CLI interaction run is claimed.
