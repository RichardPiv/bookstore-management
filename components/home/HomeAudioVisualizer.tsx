import { cn } from "@/lib/utils";

const bars = [2, 4, 3, 6, 8, 4, 2, 5, 7, 4, 3];

export default function HomeAudioVisualizer() {
  return (
    <div
      className="pointer-events-none fixed bottom-0 left-0 flex h-1 w-full items-end gap-1 px-12 opacity-20"
      aria-hidden
    >
      {bars.map((height, index) => (
        <div
          key={`bar-${height}-${index}`}
          className={cn("w-1 bg-primary", height === 8 && "animate-pulse")}
          style={{ height: `${height * 4}px` }}
        />
      ))}
    </div>
  );
}
