import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-[opacity,transform,background-color,color,border-color] duration-[var(--motion-quick)] ease-[var(--ease-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-harmony)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-ink)] disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98] select-none",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--color-parchment)] text-[var(--color-ink)] hover:opacity-90",
        secondary:
          "bg-[var(--color-ink-3)] text-[var(--color-parchment)] border border-[var(--color-border)] hover:bg-[var(--color-ink-2)]",
        outline:
          "border border-[var(--color-border-strong)] bg-transparent text-[var(--color-parchment)] hover:bg-[var(--color-ink-3)]",
        ghost: "bg-transparent text-[var(--color-muted)] hover:text-[var(--color-parchment)] hover:bg-[var(--color-ink-3)]",
        ember:
          "bg-[var(--color-ember)] text-[var(--color-ink)] hover:opacity-90",
      },
      size: {
        default: "h-11 rounded-[var(--radius-md)] px-4 text-sm",
        sm: "h-9 rounded-[var(--radius-sm)] px-3 text-sm",
        lg: "h-12 rounded-[var(--radius-lg)] px-5 text-base",
        xl: "h-14 rounded-[var(--radius-lg)] px-6 text-base",
        icon: "size-11 rounded-[var(--radius-md)]",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export function Button({
  className,
  variant,
  size,
  asChild,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}
