import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  Crosshair,
  Flame,
  Map,
  Music2,
  Settings,
  Sparkles,
  Swords,
} from "lucide-react";
import { CURRICULUM, levelFor } from "@/lib/game/curriculum";
import { masteryStars, questRoute, useGameStore, type QuestMode } from "@/lib/game/store";
import { Button } from "@/components/ui/button";
import { ConfidenceSlider } from "./confidence-slider";
import { KnightCrest } from "./crest";
import { cn } from "@/lib/utils";
import { noteName } from "@/lib/game/music";

function whyFor(mode: QuestMode, grade: number, broken: boolean) {
  if (broken) return "Five warm notes restore the streak. No clock.";
  if (mode === "practice") {
    if (grade === 0) return "C, E, and G — hear them, then name them.";
    return "The staff is the daily sword drill.";
  }
  if (mode === "realtime") return "Named lanes. Tap as they cross the steel line.";
  if (grade <= 1) return "Glowing keys blend. Skip a white key for a third.";
  return "First species. Wait-mode. Prefer thirds and sixths.";
}

export function HomeScreen() {
  const progress = useGameStore();
  const level = levelFor(progress.gradeLevel);
  const mastery = progress.mastery["note-reading-c4-b4"];
  const masteryLine =
    !mastery || mastery.attempts === 0
      ? "Note reading: start your first attempt"
      : `Note reading: ${masteryStars(mastery)}/3 stars`;

  const recommended = progress.inBrokenBladeRecovery
    ? {
        title: "Restore your blade",
        subtitle: "Five warm notes. No timer. Your streak returns.",
        why: whyFor("recovery", progress.gradeLevel, true),
        to: "/practice" as const,
        search: { mode: "broken_blade" },
        reward: 0,
      }
    : progress.quests.find((q) => q.progressCount < q.targetCount) ?? progress.quests[0]!;

  const rec =
    "to" in recommended
      ? recommended
      : {
          title: recommended.title,
          subtitle: `${recommended.progressCount}/${recommended.targetCount} · +${recommended.rewardHarmonyPoints} HP · about 2 min`,
          why: whyFor(recommended.mode, progress.gradeLevel, false),
          to: questRoute(recommended.mode),
          search: undefined as { mode?: string } | undefined,
          reward: recommended.rewardHarmonyPoints,
        };

  const studies = [
    { min: 1, to: "/rhythm" as const, label: "Rhythm" },
    { min: 2, to: "/scale" as const, label: "Scales" },
    { min: 3, to: "/interval" as const, label: "Intervals" },
    { min: 4, to: "/triad" as const, label: "Triads" },
  ].filter((s) => progress.gradeLevel >= s.min);

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
            <div className="min-w-0">
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
        </section>

        <section>
          <p className="mb-2 text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
            Today’s path
          </p>
          <Link
            to={rec.to}
            search={rec.search}
            className="block rounded-[calc(var(--radius-xl)+4px)] border border-[var(--color-border-strong)] bg-[var(--color-parchment)] p-5 text-[var(--color-ink)] transition-transform duration-[var(--motion-quick)] active:scale-[0.99]"
          >
            <p className="text-xs uppercase tracking-[0.16em] opacity-70">Recommended</p>
            <h2 className="mt-1 font-[var(--font-display)] text-2xl tracking-[-0.03em]">
              {rec.title}
            </h2>
            <p className="mt-1 text-sm opacity-75">{rec.subtitle}</p>
            <p className="mt-2 text-sm opacity-70">{rec.why}</p>
            <p className="mt-2 text-sm font-medium text-[var(--color-ink)]/80">{masteryLine}</p>
            <p className="mt-4 text-sm font-medium">Start quest →</p>
          </Link>
        </section>

        <ul className="space-y-2">
          {progress.quests.map((q) => {
            const done = q.progressCount >= q.targetCount;
            return (
              <li
                key={q.id}
                className="flex items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-ink-2)] px-4 py-3"
              >
                <Link to={questRoute(q.mode)} className="min-w-0 flex-1">
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
            Atlas
          </p>
          <div className="grid grid-cols-2 gap-3">
            <HallCard
              to="/curriculum"
              icon={<Map className="size-5" />}
              title="Curriculum"
              copy="Eleven levels. Three phases."
            />
            <HallCard
              to={progress.gradeLevel >= 3 ? "/circle" : "/curriculum"}
              icon={<Sparkles className="size-5" />}
              title="Circle of Fifths"
              copy={progress.gradeLevel >= 3 ? "Travel the key map." : "Unlocks at Grade 3."}
            />
          </div>
          <div className="mt-3">
            <HallCard to="/heatmap" title="Heatmap" copy="Where your ear still slips." />
          </div>
        </section>

        {studies.length > 0 ? (
          <section>
            <p className="mb-2 text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
              Studies
            </p>
            <div className="flex flex-wrap gap-2">
              {studies.map((s) => (
                <Link
                  key={s.to}
                  to={s.to}
                  className="inline-flex min-h-11 items-center rounded-full border border-[var(--color-border)] bg-[var(--color-ink-2)] px-4 text-sm hover:border-[var(--color-border-strong)]"
                >
                  {s.label}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {progress.weakNotesMidi.length > 0 ? (
          <p className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-ink-2)] px-4 py-3 text-sm text-[var(--color-muted)]">
            Weak notes: {progress.weakNotesMidi.map(noteName).join(", ")} ·{" "}
            <Link to="/practice" search={{ mode: "focus" }} className="text-[var(--color-parchment)] underline-offset-2 hover:underline">
              Drill them
            </Link>
          </p>
        ) : null}

        <ConfidenceSlider />
      </div>
    </div>
  );
}

function HallCard({
  to,
  title,
  copy,
  icon,
}: {
  to: "/practice" | "/realtime" | "/duel" | "/curriculum" | "/circle" | "/heatmap";
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
