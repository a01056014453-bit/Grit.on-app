import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * 통계 N분할 카드 래퍼. 자식으로 `StatsCard`(src/components/app/stats-card.tsx)를 나열한다.
 * Figma: 🧩 StatGroup — Style=Glass|Solid
 *
 * @example
 * <StatGroup>
 *   <StatsCard value={48} unit="시간" label="총 연습" />
 *   <StatsCard value={12} unit="세션" label="이번 주" />
 *   <StatsCard value={7} unit="일" label="연속" />
 * </StatGroup>
 */
const statGroupVariants = cva("grid divide-x", {
  variants: {
    variant: {
      glass:
        "bg-surface-glass-bg/40 backdrop-blur-xl rounded-3xl border border-surface-glass-border/50 shadow-soft divide-surface-glass-border/60",
      solid: "bg-surface-card rounded-2xl border border-line-default divide-line-subtle",
    },
    columns: {
      2: "grid-cols-2",
      3: "grid-cols-3",
      4: "grid-cols-4",
    },
  },
  defaultVariants: {
    variant: "glass",
    columns: 3,
  },
});

export interface StatGroupProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statGroupVariants> {}

const StatGroup = React.forwardRef<HTMLDivElement, StatGroupProps>(
  ({ className, variant, columns, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(statGroupVariants({ variant, columns, className }))}
      {...props}
    />
  )
);
StatGroup.displayName = "StatGroup";

export { StatGroup, statGroupVariants };
