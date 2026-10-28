import { Check, Circle, ShieldCheck, Sparkles } from "lucide-react";
import { learningStatus } from "@/lib/game/mastery";
import type { UnitProgress } from "@/lib/game/learning";
import { cn } from "@/lib/utils";

const labels = {
  "in-progress": "In progress",
  supported: "Completed with support",
  independent: "Completed independently",
  secure: "Secure independently",
} as const;

export function LearningStatus({
  progress,
  className,
  showDate = false,
}: {
  progress: UnitProgress | undefined;
  className?: string;
  showDate?: boolean;
}) {
  const status = learningStatus(progress);
  const Icon =
    status === "secure"
      ? ShieldCheck
      : status === "independent"
        ? Sparkles
        : status === "supported"
          ? Check
          : Circle;
  const date = status === "secure" ? progress?.securedAt : progress?.independentAt;
  return (
    <span
      className={cn("inline-flex items-start gap-1.5 text-sm", className)}
      aria-label={`Learning status: ${labels[status]}`}
    >
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <span>
        {labels[status]}
        {showDate && date ? ` · ${new Date(date).toLocaleDateString()}` : null}
      </span>
    </span>
  );
}
