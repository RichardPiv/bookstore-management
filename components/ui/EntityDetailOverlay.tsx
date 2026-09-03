"use client";

import type { ReactNode } from "react";

import OrnamentalFrame from "@/components/ui/OrnamentalFrame";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EntityDetailOverlayProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  ariaLabel?: string;
};

export default function EntityDetailOverlay({
  open,
  onClose,
  children,
  ariaLabel = "Détail",
}: EntityDetailOverlayProps) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-ink-black/65 px-4 py-8 backdrop-blur-sm transition-opacity duration-200 sm:px-6",
        open ? "opacity-100" : "pointer-events-none opacity-0",
      )}
      aria-hidden={!open}
    >
      <div className="absolute inset-0" onClick={onClose} aria-hidden />

      <OrnamentalFrame
        className="relative z-10 flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden bg-surface-container-low shadow-2xl"
        role="dialog"
        aria-modal={open}
        aria-label={ariaLabel}
      >
        <div className="flex shrink-0 justify-end border-b border-outline-variant/40 bg-surface-container px-4 py-3 sm:px-6">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            className="shrink-0"
            aria-label="Fermer"
          >
            <span className="material-symbols-outlined">close</span>
          </Button>
        </div>

        <div className="custom-scroll flex-1 overflow-y-auto p-6 sm:p-8">
          {children}
        </div>
      </OrnamentalFrame>
    </div>
  );
}
