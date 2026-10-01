"use client";

import dynamic from "next/dynamic";

import type { RenderAgent } from "@/simulation/types";

const FloorCanvas = dynamic(() => import("./FloorCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex size-full items-center justify-center bg-ink-black">
      <p className="font-label text-[10px] tracking-widest text-burnished-gold/70 uppercase">
        Ouverture de la caméra…
      </p>
    </div>
  ),
});

export default function FloorView({
  onSelect,
}: {
  onSelect?: (agent: RenderAgent | null) => void;
}) {
  return <FloorCanvas onSelect={onSelect} />;
}
