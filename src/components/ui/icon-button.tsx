import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * 원형 아이콘 버튼 (뒤로가기·설정·알림 등).
 * Figma: 🧩 IconButton — Style=Glass|Solid × Size=32|36|40
 */
const iconButtonVariants = cva(
  "inline-flex items-center justify-center rounded-full shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        glass:
          "bg-surface-glass-bg/40 backdrop-blur-sm border border-surface-glass-border/50 text-fg-primary hover:bg-surface-glass-bg/60",
        solid: "bg-secondary text-fg-primary hover:bg-secondary/80",
      },
      size: {
        32: "w-8 h-8 [&_svg]:size-4",
        36: "w-9 h-9 [&_svg]:size-[18px]",
        40: "w-10 h-10 [&_svg]:size-5",
      },
    },
    defaultVariants: {
      variant: "glass",
      size: 40,
    },
  }
);

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {
  /** 아이콘만 있는 버튼이므로 접근성 라벨 필수 */
  "aria-label": string;
  asChild?: boolean;
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant, size, asChild = false, type = "button", ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(iconButtonVariants({ variant, size, className }))}
        ref={ref}
        type={asChild ? undefined : type}
        {...props}
      />
    );
  }
);
IconButton.displayName = "IconButton";

export { IconButton, iconButtonVariants };
