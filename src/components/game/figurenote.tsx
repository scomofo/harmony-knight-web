import type { FigureNoteShape } from "@/lib/game/music";
import { cn } from "@/lib/utils";

export function FigureNoteGlyph({
  shape,
  color,
  size = 36,
  faded = false,
  className,
}: {
  shape: FigureNoteShape;
  color: string;
  size?: number;
  faded?: boolean;
  className?: string;
}) {
  const fill = faded ? "var(--color-parchment)" : color;
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 32 32",
    "aria-hidden": true as const,
    className,
  };
  if (shape === "circle") {
    return (
      <svg {...common}>
        <circle cx="16" cy="16" r="12" fill={fill} />
      </svg>
    );
  }
  if (shape === "square") {
    return (
      <svg {...common}>
        <rect x="5" y="5" width="22" height="22" rx="2" fill={fill} />
      </svg>
    );
  }
  if (shape === "triangle") {
    return (
      <svg {...common}>
        <polygon points="16,4 28,27 4,27" fill={fill} />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <polygon points="16,3 29,16 16,29 3,16" fill={fill} />
    </svg>
  );
}

export function FigureNoteKey({
  label,
  color,
  shape,
  selected,
  disabled,
  onClick,
  showLabel = true,
}: {
  label: string;
  color: string;
  shape: FigureNoteShape;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  showLabel?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex min-h-14 flex-col items-center justify-center gap-1.5 rounded-[var(--radius-md)] border px-2 py-2 transition-[transform,background-color,border-color] duration-[var(--motion-quick)]",
        selected
          ? "border-[var(--color-parchment)] bg-[var(--color-ink-3)]"
          : "border-[var(--color-border)] bg-[var(--color-ink-2)] hover:border-[var(--color-border-strong)]",
        disabled && "opacity-50",
      )}
    >
      <FigureNoteGlyph shape={shape} color={color} size={28} />
      {showLabel ? (
        <span className="font-mono text-xs tabular-nums text-[var(--color-parchment)]">
          {label}
        </span>
      ) : null}
    </button>
  );
}
