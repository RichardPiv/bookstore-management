"use client";

import { useEffect, useRef } from "react";

import { getSimulationEngine } from "@/components/simulation-runtime/runtime-store";
import type { RenderAgent } from "@/simulation/types";

import { FloorScene } from "./FloorScene";

type FloorCanvasProps = {
  onSelect?: (agent: RenderAgent | null) => void;
};

export default function FloorCanvas({ onSelect }: FloorCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<FloorScene | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const scene = new FloorScene(canvas, () => {
      return getSimulationEngine()?.getRenderState() ?? [];
    });
    scene.onSelect = (agent) => onSelectRef.current?.(agent);
    sceneRef.current = scene;

    return () => {
      sceneRef.current = null;
      scene.destroy();
    };
  }, []);

  return (
    <div className="relative size-full">
      <canvas ref={canvasRef} className="size-full touch-none" />
    </div>
  );
}
