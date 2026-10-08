"use client";

import { useEffect, useRef } from "react";

import { composeCharacterCanvas } from "@/scripts/characters/compose-character";
import { warmDnaPoseAsync } from "@/scripts/characters/asset-cache";
import { parseDna, type CharacterDna } from "@/scripts/characters/dna";

type StaffPortraitProps = {
  appearance: string | CharacterDna;
  size?: number;
  className?: string;
};

export default function StaffPortrait({
  appearance,
  size = 64,
  className,
}: StaffPortraitProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const raw =
    typeof appearance === "string" ? appearance : JSON.stringify(appearance);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    const dna = parseDna(appearance);

    const paint = () => {
      if (cancelled || !canvasRef.current) return;
      const source = composeCharacterCanvas(dna, {
        facing: "down",
        anim: "idle",
        frame: 0,
      });
      canvas.width = source.width;
      canvas.height = source.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(source, 0, 0);
    };

    paint();
    void warmDnaPoseAsync(dna, "down", "idle", 0).then(() => {
      if (!cancelled) paint();
    });

    return () => {
      cancelled = true;
    };
  }, [appearance, raw]);

  return (
    <canvas
      ref={canvasRef}
      width={96}
      height={96}
      className={className}
      style={{ width: size, height: size, imageRendering: "pixelated" }}
      aria-hidden
    />
  );
}
