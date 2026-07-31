import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center border border-transparent font-label text-[10px] tracking-widest uppercase whitespace-nowrap transition-all duration-300 outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "border-primary text-primary hover:bg-primary hover:text-primary-foreground",
        outline:
          "border-outline-variant bg-transparent text-on-surface-variant hover:border-primary hover:text-primary",
        secondary:
          "border-burnished-gold/40 text-burnished-gold hover:bg-burnished-gold hover:text-ink-black",
        ghost:
          "border-transparent text-on-surface-variant hover:text-primary hover:bg-surface-container",
        destructive:
          "border-error/60 text-error hover:bg-error hover:text-on-error",
        link: "border-transparent text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "px-6 py-2 gap-1.5",
        xs: "px-3 py-1 text-[9px] gap-1 [&_svg:not([class*='size-'])]:size-3",
        sm: "px-4 py-1.5 gap-1 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "px-8 py-3 text-xs gap-2",
        icon: "size-8 p-0",
        "icon-xs": "size-6 p-0 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7 p-0",
        "icon-lg": "size-9 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
