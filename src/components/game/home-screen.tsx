import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { BookOpen, Crosshair, Flame, Map, Music2, Settings, Sparkles, Swords } from "lucide-react";
import { CURRICULUM, levelFor, studiesFor, type AppRoute } from "@/lib/game/curriculum";
import { lessonFor } from "@/lib/game/lessons";
import {
  gradeProgress,
  masteryStars,
  questRoute,
  useGameStore,
  type QuestMode,
} from "@/lib/game/store";
import { Button } from "@/components/ui/button";
import { ConfidenceSlider } from "./confidence-slider";
import { KnightCrest } from "./crest";
import { cn } from "@/lib/utils";
import { NoteReviewCard } from "./note-review-card";

function whyFor(mode: QuestMode, grade: number, broken: boolean) {
  if (broken) return "Five warm notes restore the streak. No clock.";
  if (mode === "practice") {
    if (grade === 0) return "C, E, and G — hear them, then name them.";
    return "The staff is the daily sword drill.";
  }
  if (mode === "realtime") return "Named lanes. Tap as they cross the steel line.";
  if (mode === "study") return lessonFor(grade).drill.why;
  if (grade <= 1) return "Glowing keys blend. Skip a white key for a third.";
  return "First species. Wait-mode. Prefer thirds and sixths.";
}

type Recommendation = {
  eyebrow: string;
  title: string;
  subtitle: string;
  why: string;
  to: AppRoute | "/lesson/$level";
  params?: { level: string };
  search?: { mode?: string };
  cta: string;
};

export function HomeScreen() {
  const progress = useGameStore();
  const level = levelFor(progress.gradeLevel);
  const lesson = lessonFor(progress.gradeLevel);
  const trial = gradeProgress(progress);
  const lessonRead = progress.lessonsRead.includes(progress.gradeLevel);
  const mastery = progress.mastery["note-reading-c4-b4"];
  const masteryLine =
    !mastery || mastery.attempts === 0
      ? "Note reading: start your first attempt"
      : `Note reading: ${masteryStars(mastery)}/3 stars`;

  let rec: Recommendation;
  if (progress.inBrokenBladeRecovery) {
    rec = {
      eyebrow: "Recommended",
      title: "Restore your blade",
      subtitle: "Five warm notes. No timer. Your streak returns.",
      why: whyFor("recovery", progress.gradeLevel, true),
      to: "/practice",
      search: { mode: "broken_blade" },
      cta: "Start warm-up →",
    };
  } else if (!lessonRead) {
    rec = {
      eyebrow: `Level ${level.level} · lesson`,
      title: level.title,
      subtitle: `${level.subtitle} · about 3 min to read`,
      why: lesson.intro,
      to: "/lesson/$level",
      params: { level: String(level.level) },
      cta: "Read the lesson →",
    };
  } else {
    rec = {
      eyebrow: trial.maxed ? "Masterwork" : `Grade ${trial.grade} trial`,
      title: lesson.drill.label,
      subtitle: trial.maxed
        ? "Every level open. Keep the blade sharp."
        : `${trial.answered}/${trial.needed} recent answers · need ${Math.round(trial.neededAccuracy * 100)}% right`,
      why: lesson.drill.why,
      to: lesson.drill.to,
      cta: "Train →",
    };
  }

  const studies = studiesFor(progress.gradeLevel);
  const nextLevel = CURRICULUM.find((l) => l.level === progress.gradeLevel + 1);

  return (
    <div
      className={cn(
        "min-h-dvh bg-[var(--color-ink)] text-[var(--color-parchment)]",
        progress.settings.highContrast && "high-contrast",
      )}
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6 pb-16">
        <header className="flex items-center justify-between">
          <div className="flex min-h-11 items-center gap-2 font-mono text-sm tabular-nums text-[var(--color-ember)]">
            <Flame className="size-4" />
            {progress.currentStreak}
          </div>
          <p className="font-[var(--font-display)] text-sm tracking-[0.18em] uppercase text-[var(--color-muted)]">
            Harmony Knight
          </p>
          <div className="flex items-center gap-1">
            <span className="inline-flex min-h-11 items-center gap-1 font-mono text-sm tabular-nums text-[var(--color-harmony)]">
              <Sparkles className="size-4" />
              {progress.harmonyPoints}
            </span>
            <Link
              to="/settings"
              aria-label="Settings"
              className="inline-flex size-11 items-center justify-center text-[var(--color-muted)] hover:text-[var(--color-parchment)]"
            >
              <Settings className="size-5" />
            </Link>
          </div>
        </header>

        <section className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-ink-2)] p-5">
          <div className="flex items-start gap-4">
            <KnightCrest size={72} />
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-harmony)]">
                Level {level.level} · {level.phase}
              </p>
              <h1 className="mt-1 font-[var(--font-display)] text-2xl leading-tight tracking-[-0.03em] text-balance">
                {level.title}
              </h1>
              <p className="mt-2 text-sm text-[var(--color-muted)] text-pretty">
                {level.narrativeTheme}
              </p>
            </div>
          </div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[var(--color-ink-3)]">
            <div
              className="h-full rounded-full bg-[var(--color-harmony)]"
              style={{ width: `${((progress.gradeLevel + 1) / CURRICULUM.length) * 100}%` }}
            />
          </div>
          {!trial.maxed ? (
            <div className="mt-4 rounded-[var(--radius-md)] bg-[var(--color-ink-3)] p-3">
              <div className="flex items-baseline justify-between">
                <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">
                  Grade trial ·{" "}
                  {level.topics.length > 1 ? level.drillLabel + " & more" : level.drillLabel}
                </p>
                <p className="font-mono text-xs tabular-nums text-[var(--color-parchment)]">
                  {trial.answered}/{trial.needed}
                  {trial.answered > 0 ? ` · ${Math.round(trial.accuracy * 100)}%` : ""}
                </p>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--color-ink)]">
                <div
                  className="h-full rounded-full bg-[var(--color-ember)]"
                  style={{ width: `${(trial.answered / trial.needed) * 100}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-[var(--color-muted)]">
                Your last {trial.needed} answers in{" "}
                {level.topics.map((t) => topicLabel(t)).join(", ")} must be{" "}
                {Math.round(trial.neededAccuracy * 100)}% right
                {nextLevel ? ` to open Level ${nextLevel.level}: ${nextLevel.title}.` : "."}
              </p>
            </div>
          ) : null}
        </section>

        <section>
          <p className="mb-2 text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
            Today’s path
          </p>
          <Link
            to={rec.to}
            params={rec.params}
            search={rec.search}
            className="block rounded-[calc(var(--radius-xl)+4px)] border border-[var(--color-border-strong)] bg-[var(--color-parchment)] p-5 text-[var(--color-ink)] transition-transform duration-[var(--motion-quick)] active:scale-[0.99]"
          >
            <p className="text-xs uppercase tracking-[0.16em] opacity-70">{rec.eyebrow}</p>
            <h2 className="mt-1 font-[var(--font-display)] text-2xl tracking-[-0.03em]">
              {rec.title}
            </h2>
            <p className="mt-1 text-sm opacity-75">{rec.subtitle}</p>
            <p className="mt-2 text-sm opacity-70 text-pretty">{rec.why}</p>
            {rec.to === "/practice" ? (
              <p className="mt-2 text-sm font-medium text-[var(--color-ink)]/80">{masteryLine}</p>
            ) : null}
            <p className="mt-4 text-sm font-medium">{rec.cta}</p>
          </Link>
        </section>

        <NoteReviewCard />

        <ul className="space-y-2">
          {progress.quests.map((q) => {
            const done = q.progressCount >= q.targetCount;
            return (
              <li
                key={q.id}
                className="flex items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-ink-2)] px-4 py-3"
              >
                <Link to={questRoute(q.mode, progress.gradeLevel)} className="min-w-0 flex-1">
                  <p className="truncate text-sm">{q.title}</p>
                  <p className="font-mono text-xs tabular-nums text-[var(--color-muted)]">
                    {q.progressCount}/{q.targetCount}
                  </p>
                </Link>
                {done && !q.claimed ? (
                  <Button size="sm" onClick={() => progress.claimQuest(q.id)}>
                    Claim {q.rewardHarmonyPoints}
                  </Button>
                ) : (
                  <div className="h-1.5 w-20 overflow-hidden rounded-full bg-[var(--color-ink-3)]">
                    <div
                      className="h-full bg-[var(--color-harmony)]"
                      style={{ width: `${(q.progressCount / q.targetCount) * 100}%` }}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <section>
          <p className="mb-2 text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
            Training hall
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <HallCard
              to="/practice"
              icon={<Music2 className="size-5" />}
              title={progress.inBrokenBladeRecovery ? "Warm-up" : "Practice"}
              copy="Read the staff. Hear the tone."
            />
            <HallCard
              to="/realtime"
              icon={<Crosshair className="size-5" />}
              title="Strike"
              copy="Tap the lane as notes cross."
            />
            <HallCard
              to="/duel"
              icon={<Swords className="size-5" />}
              title="Duel"
              copy="Answer above the Sentinel."
            />
          </div>
        </section>

        <section>
          <p className="mb-2 text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
            Studies
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/lesson/$level"
              params={{ level: String(progress.gradeLevel) }}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--color-harmony)] bg-[var(--color-ink-2)] px-4 text-sm hover:border-[var(--color-parchment)]"
            >
              <BookOpen className="size-4 text-[var(--color-harmony)]" />
              Lesson {progress.gradeLevel}
            </Link>
            {studies.map((s) => (
              <Link
                key={s.to}
                to={s.to}
                className="inline-flex min-h-11 items-center rounded-full border border-[var(--color-border)] bg-[var(--color-ink-2)] px-4 text-sm hover:border-[var(--color-border-strong)]"
              >
                {s.label}
              </Link>
            ))}
            {nextLevel && nextLevel.unlocks.length > 0 ? (
              <span className="inline-flex min-h-11 items-center rounded-full border border-dashed border-[var(--color-border)] px-4 text-sm text-[var(--color-subtle)]">
                {nextLevel.unlocks.map((u) => u.label).join(" · ")} at Level {nextLevel.level}
              </span>
            ) : null}
          </div>
        </section>

        <section>
          <p className="mb-2 text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
            Atlas
          </p>
          <div className="grid grid-cols-2 gap-3">
            <HallCard
              to="/curriculum"
              icon={<Map className="size-5" />}
              title="Curriculum"
              copy="Eleven levels. Eleven lessons."
            />
            <HallCard
              to="/heatmap"
              title="Note progress"
              copy="Review priorities and pitch accuracy."
            />
          </div>
        </section>

        <ConfidenceSlider />
      </div>
    </div>
  );
}

function topicLabel(topic: string): string {
  switch (topic) {
    case "sensory":
      return "Listening";
    case "note-reading-c4-b4":
      return "Practice";
    case "rhythm":
      return "Rhythm";
    case "keys":
      return "Key signatures";
    case "scales":
      return "Scales";
    case "intervals":
      return "Intervals";
    case "triads":
      return "Triads";
    case "harmony":
      return "Cadences";
    case "modulation":
      return "Related keys";
    case "duel":
      return "Duel";
    case "realtime":
      return "Strike";
    default:
      return topic;
  }
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
  icon?: ReactNode;
}) {
  return (
    <Link
      to={to}
      className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-ink-2)] p-4 transition-[border-color] duration-[var(--motion-quick)] hover:border-[var(--color-border-strong)]"
    >
      {icon ? <div className="mb-3 text-[var(--color-harmony)]">{icon}</div> : null}
      <h3 className="font-[var(--font-display)] text-lg tracking-[-0.02em]">{title}</h3>
      <p className="mt-1 text-sm text-[var(--color-muted)]">{copy}</p>
    </Link>
  );
}
