import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  Check,
  Crosshair,
  Headphones,
  Map,
  Music2,
  Settings,
  Swords,
} from "lucide-react";
import { levelFor, studiesFor, type AppRoute } from "@/lib/game/curriculum";
import { COURSE_UNITS, unitsForLevel } from "@/lib/game/course";
import { dueUnits, nextUnit, weekDays } from "@/lib/game/learning";
import { gradeProgress, questRoute, useGameStore } from "@/lib/game/store";
import { Button } from "@/components/ui/button";
import { ConfidenceSlider } from "./confidence-slider";
import { KnightCrest } from "./crest";
import { NoteReviewCard } from "./note-review-card";
import { cn } from "@/lib/utils";

export function HomeScreen() {
  const progress = useGameStore();
  const next = nextUnit(progress.unitProgress, progress.activeUnitId);
  const due = dueUnits(progress.unitProgress);
  const completed = COURSE_UNITS.filter((u) => progress.unitProgress[u.id]?.completedAt).length;
  const days = weekDays();
  const weekCount = days.filter((d) => progress.learningDays.includes(d.key)).length;
  const trial = gradeProgress(progress);
  const grade = levelFor(progress.gradeLevel);
  const focus = progress.settings.focusMode;
  const resume =
    next &&
    progress.unitProgress[next.id]?.step !== undefined &&
    progress.unitProgress[next.id]!.step < 4;
  const returning = Date.now() - new Date(progress.lastActiveAt).getTime() >= 48 * 36e5;
  const chapter = next ? unitsForLevel(next.level) : [];

  return (
    <div
      className={cn(
        "min-h-dvh bg-[var(--color-ink)] text-[var(--color-parchment)]",
        progress.settings.highContrast && "high-contrast",
        progress.settings.reducedMotion && "reduce-motion",
      )}
    >
      <main className="mx-auto max-w-3xl space-y-7 px-4 py-6 pb-16">
        <header className="flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-3">
            <KnightCrest size={40} />
            <span className="font-[var(--font-display)] text-xl">Harmony Knight</span>
          </Link>
          <Link
            to="/settings"
            aria-label="Settings"
            className="inline-flex size-11 items-center justify-center rounded-full border border-[var(--color-border)]"
          >
            <Settings className="size-5" />
          </Link>
        </header>

        <section aria-labelledby="welcome-title">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[var(--color-harmony)]">Your music practice, at your pace</p>
            <button
              type="button"
              aria-pressed={focus}
              onClick={() => progress.patchSettings({ focusMode: !focus })}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--color-border-strong)] px-4 text-sm"
            >
              <Headphones className="size-4" />
              Focus mode {focus ? "on" : "off"}
            </button>
          </div>
          <h1
            id="welcome-title"
            className="mt-3 font-[var(--font-display)] text-4xl leading-tight tracking-[-0.03em]"
          >
            {returning
              ? "Welcome back. Start small."
              : completed === 0
                ? "Make sense of music."
                : "One idea. A little more music."}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-[var(--color-muted)]">
            {returning
              ? "Your progress is right here. Pick up where you left off, or warm up with a familiar idea."
              : "Learn a little, try it, then recall it. One lesson is enough for today."}
          </p>
        </section>

        {next ? (
          <section
            aria-label="Your next lesson"
            className="rounded-[var(--radius-xl)] bg-[var(--color-parchment)] p-5 text-[var(--color-ink)] sm:p-6"
          >
            <p className="text-sm">
              {resume ? "Continue where you paused" : "Your next small step"} · about {next.minutes}{" "}
              min
            </p>
            <h2 className="mt-2 font-[var(--font-display)] text-3xl leading-tight tracking-[-0.03em]">
              {next.title}
            </h2>
            <p className="mt-3 text-base leading-relaxed">{next.goal}</p>
            <p className="mt-3 text-sm opacity-75">
              Chapter {next.level + 1} · {levelFor(next.level).subtitle}
              {resume
                ? ` · ${["Learn", "Try it", "Recall 1 of 2", "Recall 2 of 2"][progress.unitProgress[next.id]!.step]}`
                : ""}
            </p>
            <Button
              asChild
              size="lg"
              className="mt-5 w-full bg-[var(--color-ink)] text-[var(--color-parchment)] sm:w-auto"
            >
              <Link
                to="/lesson/$level"
                params={{ level: String(next.level) }}
                search={{ unit: next.id }}
              >
                {resume
                  ? "Continue lesson"
                  : completed === 0
                    ? "Start my first lesson"
                    : "Start this lesson"}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </section>
        ) : (
          <section className="rounded-[var(--radius-xl)] border border-[var(--color-harmony)] bg-[var(--color-ink-2)] p-5">
            <h2 className="font-[var(--font-display)] text-2xl">Every lesson explored.</h2>
            <p className="mt-2 text-base text-[var(--color-muted)]">
              Revisit a practical task, refresh an idea, or develop your own musical sketch.
            </p>
            <Button asChild className="mt-4">
              <Link to="/curriculum">Explore the learning path</Link>
            </Button>
          </section>
        )}

        <section
          aria-labelledby="progress-title"
          className="rounded-[var(--radius-xl)] border border-[var(--color-border)] p-5"
        >
          <div className="flex flex-wrap justify-between gap-3">
            <h2 id="progress-title" className="font-medium">
              Small sessions add up
            </h2>
            <span className="text-sm text-[var(--color-muted)]">
              {completed} of {COURSE_UNITS.length} lessons completed
            </span>
          </div>
          <progress
            aria-label="Lessons completed"
            value={completed}
            max={COURSE_UNITS.length}
            className="lesson-progress mt-4 h-2 w-full"
          />
          <div className="mt-4 grid grid-cols-7 gap-2" aria-label="Learning days this week">
            {days.map((d) => {
              const learned = progress.learningDays.includes(d.key);
              return (
                <div
                  key={d.key}
                  aria-label={`${d.label}: ${learned ? "learned" : "no completed lesson"}`}
                  className="flex flex-col items-center gap-2 text-sm text-[var(--color-muted)]"
                >
                  <span
                    className={cn(
                      "flex size-8 items-center justify-center rounded-full border",
                      learned
                        ? "border-[var(--color-harmony)] bg-[var(--color-harmony)] text-[var(--color-ink)]"
                        : "border-[var(--color-border)]",
                    )}
                  >
                    {learned ? <Check className="size-4" /> : <span aria-hidden="true">·</span>}
                  </span>
                  {d.label}
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-sm text-[var(--color-muted)]">
            {weekCount
              ? `${weekCount} learning ${weekCount === 1 ? "day" : "days"} this week.`
              : "Your first completed lesson will appear here."}{" "}
            There is no streak to lose.
          </p>
        </section>

        {due[0] ? (
          <section className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-ink-2)] p-5">
            <p className="text-sm text-[var(--color-harmony)]">
              Keep an idea familiar · about 1 min
            </p>
            <h2 className="mt-2 font-[var(--font-display)] text-2xl">{due[0].title}</h2>
            <p className="mt-2 text-base text-[var(--color-muted)]">
              Two recall questions.{" "}
              {due.length > 1
                ? `${due.length} lessons are ready to revisit; choose just one.`
                : "This lesson is ready to revisit."}
            </p>
            <Button asChild variant="secondary" className="mt-4">
              <Link
                to="/lesson/$level"
                params={{ level: String(due[0].level) }}
                search={{ unit: due[0].id }}
                onClick={() => progress.revisitUnit(due[0]!.id, true)}
              >
                Recall this idea
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </section>
        ) : null}

        <section>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-[var(--font-display)] text-2xl">
              {next ? "This chapter" : "Keep exploring"}
            </h2>
            <Link
              to="/curriculum"
              className="inline-flex min-h-11 items-center gap-2 text-sm text-[var(--color-harmony)]"
            >
              <Map className="size-4" />
              Full learning path
            </Link>
          </div>
          {next ? (
            <ol className="mt-3 divide-y divide-[var(--color-border)]">
              {chapter.map((u, i) => (
                <li key={u.id}>
                  <Link
                    to="/lesson/$level"
                    params={{ level: String(u.level) }}
                    search={{ unit: u.id }}
                    className="flex min-h-14 items-center gap-3 py-3"
                  >
                    <span className="w-7 shrink-0 text-sm text-[var(--color-harmony)]">
                      {progress.unitProgress[u.id]?.completedAt ? (
                        <Check aria-label="Completed" className="size-4" />
                      ) : (
                        String(i + 1).padStart(2, "0")
                      )}
                    </span>
                    <span className="flex-1 text-base">{u.title}</span>
                    <span className="shrink-0 text-sm text-[var(--color-muted)]">
                      {u.minutes} min
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          ) : null}
        </section>

        <nav aria-label="Practice and progress" className="grid gap-3 sm:grid-cols-2">
          <HallCard
            to="/practice"
            icon={<Music2 className="size-5" />}
            title="Play a few notes"
            copy="Staff reading and your personal note reviews."
          />
          <HallCard
            to="/heatmap"
            icon={<BookOpen className="size-5" />}
            title="Note progress"
            copy="See familiar notes and choose what to practise."
          />
        </nav>

        <details
          key={String(focus)}
          open={!focus}
          className="rounded-[var(--radius-xl)] border border-[var(--color-border)] p-5"
        >
          <summary className="cursor-pointer text-base font-medium">
            Training hall, game challenges and learning supports
          </summary>
          <div className="mt-5 space-y-6">
            <p className="text-sm text-[var(--color-muted)]">
              Lesson progress and game grades are separate. Explore any lesson; drills unlock
              through the game’s skill trials.
            </p>
            <NoteReviewCard />
            <div className="grid gap-3 sm:grid-cols-2">
              <HallCard
                to="/realtime"
                icon={<Crosshair className="size-5" />}
                title="Strike"
                copy="A timed note-reading challenge."
              />
              <HallCard
                to="/duel"
                icon={<Swords className="size-5" />}
                title="Duel"
                copy="Build consonant pairs in wait mode."
              />
            </div>
            <div>
              <h3 className="font-medium">
                Grade {grade.level}: {grade.title}
              </h3>
              <p className="mt-2 text-sm text-[var(--color-muted)]">
                {trial.maxed
                  ? "All game grades unlocked."
                  : `${trial.answered}/${trial.needed} recent answers · ${Math.round(trial.neededAccuracy * 100)}% accuracy to advance.`}
              </p>
              <Link
                to={grade.route}
                className="inline-flex min-h-11 items-center text-[var(--color-harmony)]"
              >
                Practise {grade.drillLabel.toLowerCase()} →
              </Link>
            </div>
            <div className="flex flex-wrap gap-2">
              {studiesFor(progress.gradeLevel).map((s) => (
                <Button key={s.to} variant="outline" asChild>
                  <Link to={s.to}>{s.label}</Link>
                </Button>
              ))}
            </div>
            <div>
              <h3 className="font-medium">Optional daily challenges</h3>
              <ul className="mt-3 space-y-3">
                {progress.quests.map((q) => (
                  <li
                    key={q.id}
                    className="flex flex-wrap items-center justify-between gap-2 text-sm"
                  >
                    <Link to={questRoute(q.mode, progress.gradeLevel)} className="py-2">
                      {q.title} · {q.progressCount}/{q.targetCount}
                    </Link>
                    {q.progressCount >= q.targetCount && !q.claimed ? (
                      <Button size="sm" onClick={() => progress.claimQuest(q.id)}>
                        Claim {q.rewardHarmonyPoints}
                      </Button>
                    ) : q.claimed ? (
                      <span>Claimed</span>
                    ) : null}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm text-[var(--color-muted)]">
                {progress.harmonyPoints} harmony points · {progress.currentStreak} correct-answer
                combo
              </p>
            </div>
            <ConfidenceSlider />
          </div>
        </details>
      </main>
    </div>
  );
}

function HallCard({
  to,
  title,
  copy,
  icon,
}: {
  to: AppRoute;
  title: string;
  copy: string;
  icon: ReactNode;
}) {
  return (
    <Link
      to={to}
      className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-ink-2)] p-4 hover:border-[var(--color-border-strong)]"
    >
      <span className="text-[var(--color-harmony)]">{icon}</span>
      <h3 className="mt-3 font-[var(--font-display)] text-xl">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">{copy}</p>
    </Link>
  );
}
