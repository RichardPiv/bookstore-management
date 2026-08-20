import { cn } from "@/lib/utils";

import OrnamentalFrame from "@/components/ui/OrnamentalFrame";

type ReliquaryFrameProps = {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "error";
  parchment?: boolean;
  showCorners?: boolean;
};

export default function ReliquaryFrame({
  children,
  className,
  variant = "default",
  parchment = false,
}: ReliquaryFrameProps) {
  return (
    <OrnamentalFrame
      className={cn(
        parchment && "parchment-texture",
        variant === "error" && "border-error/40",
        className,
      )}
    >
      {children}
    </OrnamentalFrame>
  );
}
