import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * 필터/카테고리 칩(pill).
 * Figma: 🧩 Chip — State=Active|Inactive × Style=Solid|Glass
 */
const chipVariants = cva(
  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-3.5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        solid: "",
        glass: "",
      },
      active: {
        true: "bg-primary text-fg-on-brand shadow-sm",
        false: "",
      },
    },
    compoundVariants: [
      {
        variant: "solid",
        active: false,
        className:
          "bg-surface-card text-fg-secondary border border-line-default hover:bg-secondary",
      },
      {
        variant: "glass",
        active: false,
        className:
          "bg-surface-glass-bg/50 backdrop-blur-sm text-fg-secondary border border-surface-glass-border/60 hover:bg-surface-glass-bg/70",
      },
    ],
    defaultVariants: {
      variant: "glass",
      active: false,
    },
  }
);

export interface ChipProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type">,
    Omit<VariantProps<typeof chipVariants>, "active"> {
  active?: boolean;
}

const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  ({ className, variant, active = false, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      aria-pressed={active}
      className={cn(chipVariants({ variant, active, className }))}
      {...props}
    />
  )
);
Chip.displayName = "Chip";

export { Chip, chipVariants };
