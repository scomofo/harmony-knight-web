import { COURSE_UNITS } from "@/lib/game/course";
import { useGameStore } from "@/lib/game/store";
import { Award, BookOpen, Calendar, Flame, Music, Sparkles, Swords, Trophy } from "lucide-react";

type Badge = {
  id: string;
  title: string;
  description: string;
  icon: typeof Award;
  earned: boolean;
  progressText: string;
};

export function KnightBadges() {
  const store = useGameStore();

  const completedLessons = COURSE_UNITS.filter((u) => store.unitProgress[u.id]?.completedAt).length;

  // Check if any level has all 4 units completed
  const hasCompletedChapter = Array.from({ length: 11 }, (_, level) =>
    COURSE_UNITS.filter((u) => u.level === level).every((u) => store.unitProgress[u.id]?.completedAt),
  ).some(Boolean);

  const badges: Badge[] = [
    {
      id: "first-lesson",
      title: "Harmony Apprentice",
      description: "Complete your first lesson",
      icon: BookOpen,
      earned: completedLessons >= 1,
      progressText: `${completedLessons}/1 lessons`,
    },
    {
      id: "chapter-champ",
      title: "Chapter Champion",
      description: "Complete all 4 lessons in any chapter",
      icon: Trophy,
      earned: hasCompletedChapter,
      progressText: hasCompletedChapter ? "Unlocked" : "4 lessons needed",
    },
    {
      id: "sentinel-slayer",
      title: "Sentinel Slayer",
      description: "Win a Counterpoint Duel against the Discord Sentinel",
      icon: Swords,
      earned: store.duelWins > 0,
      progressText: `${store.duelWins} duel wins`,
    },
    {
      id: "composer",
      title: "Master Composer",
      description: "Save a musical piece in Creative Projects",
      icon: Music,
      earned: store.creations.length > 0,
      progressText: `${store.creations.length} saved pieces`,
    },
    {
      id: "theory-scholar",
      title: "Theory Scholar",
      description: "Earn 100 Harmony Points",
      icon: Sparkles,
      earned: store.harmonyPoints >= 100,
      progressText: `${store.harmonyPoints}/100 XP`,
    },
    {
      id: "note-master",
      title: "Note Master",
      description: "Play 50 notes in practice or drills",
      icon: Award,
      earned: store.totalNotesPlayed >= 50,
      progressText: `${Math.min(store.totalNotesPlayed, 50)}/50 notes`,
    },
    {
      id: "combo-knight",
      title: "Combo Knight",
      description: "Achieve a 10-note answer streak",
      icon: Flame,
      earned: store.bestStreak >= 10,
      progressText: `${Math.min(store.bestStreak, 10)}/10 streak`,
    },
    {
      id: "dedicated-knight",
      title: "Dedicated Knight",
      description: "Complete lessons across 3 different days",
      icon: Calendar,
      earned: store.learningDays.length >= 3,
      progressText: `${Math.min(store.learningDays.length, 3)}/3 days`,
    },
  ];

  const earnedCount = badges.filter((b) => b.earned).length;

  return (
    <section
      aria-label="Knight Trophies and Badges"
      className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-ink-2)] p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-[var(--font-display)] text-2xl flex items-center gap-2">
          <Trophy className="size-6 text-[var(--color-harmony)]" />
          Knight’s Trophies
        </h2>
        <span className="text-sm text-[var(--color-muted)] font-mono">
          {earnedCount} of {badges.length} unlocked
        </span>
      </div>

      <div className="mt-4 grid gap-3 grid-cols-1 sm:grid-cols-2">
        {badges.map((badge) => {
          const Icon = badge.icon;
          return (
            <div
              key={badge.id}
              className={`flex items-center gap-3 rounded-[var(--radius-lg)] border p-3 transition-colors ${
                badge.earned
                  ? "border-[var(--color-harmony)]/50 bg-[var(--color-ink-3)] text-[var(--color-parchment)]"
                  : "border-[var(--color-border)] opacity-60 text-[var(--color-muted)]"
              }`}
            >
              <div
                className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
                  badge.earned
                    ? "bg-[var(--color-harmony)] text-[var(--color-ink)]"
                    : "bg-[var(--color-border)] text-[var(--color-muted)]"
                }`}
              >
                <Icon className="size-5" />
              </div>
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-medium leading-snug">{badge.title}</p>
                <p className="text-xs text-[var(--color-muted)] leading-tight mt-0.5">
                  {badge.description}
                </p>
                <p className="text-[11px] font-mono text-[var(--color-harmony)] mt-1">
                  {badge.progressText}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
