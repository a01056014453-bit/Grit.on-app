import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * 글래스모피즘 카드 (`bg-white/40 backdrop-blur-xl border border-white/50` 패턴의 토큰화).
 * Figma: 🧩 GlassCard — Radius=2xl|3xl × Padding=16|20
 */
const glassCardVariants = cva(
  "bg-surface-glass-bg/40 backdrop-blur-xl border border-surface-glass-border/50 shadow-soft",
  {
    variants: {
      radius: {
        "2xl": "rounded-2xl",
        "3xl": "rounded-3xl",
      },
      padding: {
        0: "p-0",
        4: "p-4",
        5: "p-5",
      },
      interactive: {
        true: "transition-all hover:bg-surface-glass-bg/60 hover:shadow-sm",
        false: "",
      },
    },
    defaultVariants: {
      radius: "2xl",
      padding: 4,
      interactive: false,
    },
  }
);

type GlassCardElement = "div" | "section" | "article";

export interface GlassCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Omit<VariantProps<typeof glassCardVariants>, "interactive"> {
  as?: GlassCardElement;
  /** 클릭 가능한 카드(hover 강조) */
  interactive?: boolean;
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, radius, padding, interactive = false, as: Tag = "div", ...props }, ref) => (
    <Tag
      ref={ref}
      className={cn(glassCardVariants({ radius, padding, interactive, className }))}
      {...props}
    />
  )
);
GlassCard.displayName = "GlassCard";

export { GlassCard, glassCardVariants };
