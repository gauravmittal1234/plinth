"use client";

// The 3D tower (DESIGN §4b, WebProject.dc.html "How much is built?"): one slab
// per floor, stacked in CSS 3D (perspective 1000 px; rotateX 58°, rotateZ −42°;
// slab k lifted k × 7 px). Built slabs are solid accent, the rest a dashed
// wireframe, and the slab at the sold level carries a 2 px outline in the band
// ink. Slabs fill in with a 45 ms stagger on first paint and whenever the data
// changes; with reduced motion they are simply there.
//
// The drawing is aria-hidden: always pair it with Built / Sold / Time used
// tiles (FactTiles). On the story's dark stage, wrap it in data-theme="night"
// so every token (accent, wire, band inks) takes its Night value.
import type { BandCode } from "@plinth/contracts";
import type { CSSProperties } from "react";
import { bandStyle } from "../lib/band";
import { cx } from "../lib/cx";
import { useReducedMotion } from "../lib/motion";

export type TowerStackProps = {
  /** Floors in the tower (ProjectProgress.floors_per_tower); 20 when the records don't say. */
  floors?: number | null;
  /** Slabs built: a tower's slab on the QPR, or slabsFromPct(built_pct). */
  built: number;
  /** The slab at the sold level (slabsFromPct(sold_pct)); null draws no outline. */
  sold?: number | null;
  /** The band whose ink outlines the sold slab; null uses ink. */
  band?: BandCode | null;
  /** Slab side in px (default 140). */
  size?: number;
  className?: string;
};

const STEP_PX = 7;
const STAGGER_MS = 45;

/** Slabs for a percentage of a tower's floors (Phase-level QPRs report a percentage). */
export function slabsFromPct(pct: number | null | undefined, floors = 20): number {
  if (pct == null || Number.isNaN(pct)) return 0;
  return Math.max(0, Math.min(floors, Math.round((pct / 100) * floors)));
}

export function TowerStack({
  floors,
  built,
  sold = null,
  band = null,
  size = 140,
  className,
}: TowerStackProps) {
  const reduced = useReducedMotion();
  const n = Math.max(1, Math.round(floors ?? 20));
  const builtSlabs = Math.max(0, Math.min(n, Math.round(built)));
  const soldSlab = sold == null ? null : Math.max(0, Math.min(n, Math.round(sold)));
  const height = size + n * STEP_PX + 48;
  return (
    <div
      aria-hidden="true"
      data-tower=""
      data-floors={n}
      data-built={builtSlabs}
      data-sold={soldSlab ?? undefined}
      className={cx("flex items-end justify-center [perspective:1000px]", className)}
      style={{ height, ...(band ? bandStyle(band) : null) }}
    >
      <div
        className="relative [transform-style:preserve-3d]"
        style={{ width: size, height: size, transform: "rotateX(58deg) rotateZ(-42deg)" }}
      >
        {Array.from({ length: n }, (_, k) => {
          const isBuilt = k < builtSlabs;
          const isSold = soldSlab !== null && soldSlab > 0 && k === soldSlab - 1;
          const style: CSSProperties & { "--ui-slab-delay": string } = {
            transform: `translateZ(${k * STEP_PX}px)`,
            "--ui-slab-delay": reduced ? "0ms" : `${k * STAGGER_MS}ms`,
          };
          return (
            <div
              key={k}
              data-slab={k + 1}
              data-built={isBuilt ? "true" : undefined}
              data-sold-level={isSold ? "true" : undefined}
              className={cx(
                "absolute inset-0 box-border rounded-segment-lg border",
                "transition-[background-color,border-color] duration-(--pl-motion-duration-sheet) ease-out delay-(--ui-slab-delay)",
                isBuilt
                  ? "border-accent-strong bg-accent"
                  : "border-dashed border-line-strong bg-transparent",
                isBuilt && !reduced && "ui-slab-build",
                isSold &&
                  (band
                    ? "outline-2 outline-offset-3 outline-(--ui-band-ink)"
                    : "outline-2 outline-offset-3 outline-ink"),
              )}
              style={style}
            />
          );
        })}
      </div>
    </div>
  );
}
