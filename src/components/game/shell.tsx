import { Link } from "@tanstack/react-router";
import { ArrowLeft, Flame, Settings, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { useGameStore } from "@/lib/game/store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function GameShell({
  title,
  children,
  backTo = "/",
  footer,
  wide,
}: {
  title: string;
  children: ReactNode;
  backTo?: string;
  footer?: ReactNode;
  wide?: boolean;
}) {
  const streak = useGameStore((s) => s.currentStreak);
  const points = useGameStore((s) => s.harmonyPoints);
  const highContrast = useGameStore((s) => s.settings.highContrast);
  const reducedMotion = useGameStore((s) => s.settings.reducedMotion);
  const focusMode = useGameStore((s) => s.settings.focusMode);

  return (
    <div
      className={cn(
        "min-h-dvh bg-[var(--color-ink)] text-[var(--color-parchment)]",
        highContrast && "high-contrast",
        reducedMotion && "reduce-motion",
      )}
    >
      <header className="sticky top-0 z-20 border-b border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-ink)_88%,transparent)] px-4 py-3 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <Button variant="ghost" size="icon" asChild aria-label="Back">
              <Link to={backTo as "/"}>
                <ArrowLeft className="size-5" />
              </Link>
            </Button>
            <h1 className="truncate font-[var(--font-display)] text-lg font-medium tracking-[-0.03em]">
              {title}
            </h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            {!focusMode ? (
              <span
                aria-label={`${streak} correct-answer combo`}
                className="hidden items-center gap-1 font-mono tabular-nums text-[var(--color-ember)] sm:inline-flex"
              >
                <Flame className="size-4" />
                {streak}
              </span>
            ) : null}
            {!focusMode ? (
              <span
                aria-label={`${points} harmony points`}
                className="hidden items-center gap-1 font-mono tabular-nums text-[var(--color-harmony)] sm:inline-flex"
              >
                <Sparkles className="size-4" />
                {points}
              </span>
            ) : null}
            <Button variant="ghost" size="icon" asChild aria-label="Settings">
              <Link to="/settings">
                <Settings className="size-5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>
      <main className={cn("mx-auto px-4 py-6", wide ? "max-w-5xl" : "max-w-3xl")}>{children}</main>
      {footer ? (
        <div className="sticky bottom-0 border-t border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-ink)_92%,transparent)] px-4 py-3 backdrop-blur-sm">
          <div className="mx-auto max-w-3xl">{footer}</div>
        </div>
      ) : null}
    </div>
  );
}
