import { cn } from "@/lib/utils";

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
  showCorners = true,
}: ReliquaryFrameProps) {
  const cornerClass = variant === "error" ? "border-error/50" : undefined;

  return (
    <div
      className={cn(
        "reliquary-border relative",
        parchment && "parchment-texture",
        variant === "error" && "border-error/40",
        className,
      )}
    >
      {showCorners && (
        <>
          <div className={cn("corner-ornament corner-tl", cornerClass)} />
          <div className={cn("corner-ornament corner-tr", cornerClass)} />
          <div className={cn("corner-ornament corner-bl", cornerClass)} />
          <div className={cn("corner-ornament corner-br", cornerClass)} />
        </>
      )}
      {children}
    </div>
  );
}
