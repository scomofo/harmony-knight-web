# Harmony Knight — fresh app or merge into harmony-knight-web?

**Date:** 2026-09-23
**Baseline:** the hardened local release — 11 chapters, 44 lessons, Strike/Duel/practice games, 197/197 tests green, production build done.
**Staged branch:** `scout/harmony-knight-decision` in scomofo/harmony-knight-web (this document lives there; main untouched, no PR opened).

---

## Option A — Fresh app (the local release)

The app in `~/workspace/harmony-knight`: React 19 + Vite + Zustand + Tailwind v4 + Web Audio. 50 source files, 12 commits, no remote yet.

- Curriculum system: 11 chapters, 44 lessons, grades that never lock lessons
- Learner state with versioned migrations (schema v2), unload durability, interruption handling
- Practice keyboard, Strike and Duel games, studies, creations, VFX effect bus, accessibility pass
- Validation: **197/197 tests across 13 files**, production `dist/` built
- Deployment: pure static files — any static host, or wrapped as a desktop app like your other music apps

## Option B — Merge into scomofo/harmony-knight-web

A TanStack Start app (server rendering) with 180 files, 129 of them in `src/`. It already contains its own parallel Harmony Knight implementation — its own curriculum file plus a 43 KB lessons file, lesson/duel/curriculum screens — plus template machinery: sign-in, a database layer, install-page and PWA scaffolding. Its package is still named "app-builder-workspace" (the template default). CI is green on main.

8 branches are in flight there right now: game-content-playability, focused-learning-path, interactive-learning-and-scoring, learning-experience, pitch-comparison-playback, practice-review, web-quest, and one more content branch.

## Side by side

| | Fresh app | Merge into web |
|---|---|---|
| Effort to release | Low — already hardened | High — reconcile two divergent versions of the same curriculum, plus 8 in-flight branches |
| Risk | Low — self-contained, fully tested | High — duplicate implementations, merge conflicts, dead-ends either way |
| CI | Needs a small new workflow | Exists and green, but built for the template's shape |
| Release readiness | Now | Weeks of dedupe and re-testing |
| What it costs to run | Static files, works offline | Needs a server (or Vercel) for the server-rendered pages, plus auth/database upkeep |

## Recommendation: ship the fresh app

The local release is the finished article your roadmap described. The web repo is a heavier, parallel implementation with active work in flight — merging means picking a winner between two curricula and untangling 8 branches, all to end up with an app that needs a server for no good reason. The music teaching itself is all client-side; it deserves the simple static build.

---

## Staged sequence — runs only after you confirm fresh or merge

### If fresh (recommended)

1. Create the repo (public or private — your call):
   `gh repo create scomofo/harmony-knight --public --source .` — or create it on github.com
2. Push the local release:
   `git remote add origin git@github.com:scomofo/harmony-knight.git`
   `git branch -M main && git push -u origin main`
3. Add a CI workflow (Node 22): install, tests, typecheck, production build
4. Deploy `dist/` to static hosting, or wrap as a desktop app

### If merge

1. Cut `scout/harmony-knight-merge` from `main` of harmony-knight-web
2. Decide per file which implementation wins (local curriculum + games vs web versions) — do not keep both
3. Port the local `src/` in, replacing the web `src/lib/game` and `src/routes` equivalents; delete the template's auth/database/sign-in surface if the app stays client-side
4. Reconcile or close the 8 in-flight content branches against the merged tree
5. Rename the package from "app-builder-workspace", run the full test suite plus the template's checks, fix fallout
6. CI must be green on the branch before any PR

Say "fresh" or "merge" and I run the matching sequence.
