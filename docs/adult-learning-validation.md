# Adult learning curriculum pass

Designed for an adult learner who benefits from short tasks, an obvious next action, optional detail, and recoverable progress. This is a software and editorial pass, not clinical validation or certification of instrumental skill.

## Harmony Knight

- Corrected the C-augmented staff spelling while retaining minor/diminished flats; bundled an OFL-licensed music font so clefs render on systems without music fonts.
- Supplied the starting pitch in major-key listening questions; no absolute-pitch skill is silently assumed.
- Added ten bounded practical activities, bringing activity coverage to all 44 units. Early note-building tasks have compact palettes and omit irrelevant bass-reference labels.
- Retained source definitions and caveats behind an optional detail expander.
- Keys/scales and intervals/triads advancement now requires three correct answers in each strand alongside the existing accuracy window. Session summaries show the missing strands; drill rank is explicitly distinct from lesson completion.
- Preserved topic evidence in progress backups. Fixed two pre-existing lint errors and made startup resolve the repository directory.

Validation: npm test passes (191 template checks, four existing skips; 129 unit tests; 36 UI tests), typecheck and production build pass. Lint has no errors and eight existing warnings. The production browser regression covers mixed triad accidentals, the new staff practice, and a supplied tonic in the scale quiz with no uncaught runtime errors. Fresh reviews are checked for valid worked solutions. Real instrument or clinical efficacy was not assessed.

## Shared phrase follow-up

Added an optional Hear / Try / Use study, “A pulse with room to breathe”: four bars of 4/4 at 72 bpm (48 bpm slower option), with paired eighth-note attacks in bars 2 and 4 and a final quarter rest. Both apps use the same onset pattern. Harmony includes it in the pulse lesson; SparkSuite offers it on the Learn overview with instructions for all ten instruments. Listening, one-bar practice, and hidden-count attempts are valid choices; there is no timed requirement.

Selected step and a 240-character optional observation save locally in each app. They do not sync between apps or record audio, and do not award mastery. Stop, collapse, tab hiding and unmount cancel playback. Unavailable storage/audio produces a readable recovery message.

Early exact recall tasks now move by octaves and preserve authored pitch spellings and named keys. Advancement text includes the strand requirement on grades 3 and 4.

Follow-up validation: 130 unit tests and 39 UI tests pass, alongside template checks. Component tests cover saved notes/steps and instrument slots, 17 onsets across 16 beats, one-bar/slower options, collapse stop, mute and unavailable storage. Typecheck and build pass; lint has eight existing warnings and no errors. Desktop and mobile dev/production render checks show content without overflow or uncaught page errors; external resource loading errors and the existing share-card note remain in this sandbox. The interactive regression now uses agent-browser; running it here is blocked by daemon socket binding (Operation not permitted). No successful CLI interaction run is claimed.
