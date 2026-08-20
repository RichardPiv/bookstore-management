import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

import { cn } from "@/lib/utils";

type OrnamentalFrameProps<T extends ElementType = "div"> = {
  as?: T;
  className?: string;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className" | "children">;

/**
 * Cadre unifié (style HomeFeatureCard) :
 * bordure outline-variant + coins en L primary.
 */
export default function OrnamentalFrame<T extends ElementType = "div">({
  as,
  className,
  children,
  ...props
}: OrnamentalFrameProps<T>) {
  const Comp = as ?? "div";

  return (
    <Comp className={cn("ornamental-frame", className)} {...props}>
      <div className="ornamental-corner-bl" aria-hidden />
      <div className="ornamental-corner-br" aria-hidden />
      {children}
    </Comp>
  );
}
