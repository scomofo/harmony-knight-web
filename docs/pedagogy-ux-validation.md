# Lesson support, recall feedback and path navigation

Reviewed baseline: `main` at `1be2ee64f82303a06867eff71db08e09045d3ef5` (PR #27 merged).
That exact baseline has successful CI run [39276300866](https://github.com/scomofo/harmony-knight-web/actions/runs/39276300866).

## What changed

- Desktop lessons place the current lesson title, goal and next action beside the task.
  The step indicator is an ordered list with the current step exposed to assistive technology.
- Original teaching pictures no longer appear automatically above fresh review tasks, where
  the task can use a different key or register. The explanation, picture and playback remain
  available through a deliberate refresher in both Try it and Recall.
- Opening the refresher or hearing a worked task example records supported practice without
  modifying the answer. It cannot earn an independent first-check outcome. Changing task or
  lesson step closes the refresher and stops its playback.
- Completion reports practical first checks separately from written recall, with an optional
  explanation list for missed questions. A finished generated review retains its question
  round so remounting the summary cannot silently compare answers against the original pair.
- Progress backups validate answers against their actual served questions, including active
  and completed generated reviews. The new round field is optional for older saves.
- Learning-path search finds lesson titles, goals and chapter names/numbers. Chapter jumps,
  explicit in-progress steps, an empty-search explanation and a focus-preserving clear action
  make the existing course easier to navigate. Search never mutates lesson progress.
- Home describes due review as a practical task plus two questions, without a one-minute
  promise. README inventory now matches the current 45 lessons and 81 practical tasks.

## Automated evidence

`npm test` passes: 170 template tests (four existing skips for absent authoring documents),
131 game tests and 64 UI tests. Type checking and production build pass. Lint has zero errors
and five existing warnings.

Focused coverage checks:

- original diagrams are available only after opening help during practice/recall;
- help preserves drafts, prevents independent practice credit and closes at the next step;
- a completed generated review restores its actual question pair and single practical task
  after storage rehydration;
- generated answers survive backup validation before and after early and due reviews;
- searches and clearing retain the checkpoint, chapter totals and keyboard focus.

`scripts/learning-flow-browser.mjs` runs a clean-context Chromium journey at 1440 × 1000.
It starts from onboarding and completes learning and review using user-visible controls.
It exercises a wrong written answer, correction feedback, search/clear, a persisted review
draft, keyboard opening of support, generated recall, summary reload and non-duplicated points.
It also checks side-by-side desktop placement and page overflow. Screenshots and `verdict.json`
go under the explicitly supplied `/workspace/screenshots` directory. No completed lessons or
answers are seeded into browser storage.

The journey passed against both the Vite development server and the built production preview,
with zero uncaught page errors. Desktop captures of completion, filtered path, fresh review and
supported review were inspected for layout and readability.

## Boundaries

This is automated software and layout evidence. Scripted answers use the authored answer keys;
the run does not evaluate a learner's knowledge, hearing, musical expression or learning gains.
It does not establish instrument, clinical or real-person accessibility acceptance. Work here
targets desktop. Existing checkpoints, optional study access, correction flow and review timing
remain in place.

Previously completed generated reviews did not save their served round. This change preserves
rounds for new completions; it does not invent missing historical results.
