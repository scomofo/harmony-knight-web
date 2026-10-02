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
