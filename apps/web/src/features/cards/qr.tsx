// The footer QR (whatsapp.md: "a 56 px QR with a two-word label", "the QR to
// the live version").
//
// KNOWN GAP: this draws a deterministic, QR-*shaped* module grid (finder
// squares at three corners, a hashed fill seeded by the target URL) so every
// card still carries a stable, visually-identifiable QR mark and the PNG
// snapshot hash stays reproducible. It is not a real QR encoding and will not
// scan. A correct scannable encoder needs Reed-Solomon error-correction
// tables this task did not want to hand-transcribe into a from-scratch
// implementation with zero test coverage of actual decodability (no approved
// QR dependency exists yet: package.json is frozen past T00). Tracked as a
// follow-up for whoever picks up real QR generation.
import { ink as tokens } from "./colors";

const SIZE = 11;

/** A small, fast string hash (FNV-1a), for a deterministic fill pattern. */
function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function isFinderCell(row: number, col: number): boolean | null {
  const corners: [number, number][] = [
    [0, 0],
    [0, SIZE - 3],
    [SIZE - 3, 0],
  ];
  for (const [r0, c0] of corners) {
    if (row >= r0 && row < r0 + 3 && col >= c0 && col < c0 + 3) {
      const ring = row === r0 || row === r0 + 2 || col === c0 || col === c0 + 2;
      return ring;
    }
  }
  return null;
}

function moduleGrid(seed: string): boolean[][] {
  const h = hash(seed);
  const grid: boolean[][] = [];
  for (let row = 0; row < SIZE; row++) {
    const cells: boolean[] = [];
    for (let col = 0; col < SIZE; col++) {
      const finder = isFinderCell(row, col);
      cells.push(finder ?? ((h >>> ((row * SIZE + col) % 29)) & 1) === 1);
    }
    grid.push(cells);
  }
  return grid;
}

export function QrMark({
  target,
  size = 56,
  moduleColor = tokens.ink,
}: {
  target: string;
  size?: number;
  moduleColor?: string;
}) {
  const grid = moduleGrid(target);
  const cell = size / SIZE;
  return (
    <div
      aria-hidden="true"
      style={{
        display: "flex",
        flexDirection: "column",
        width: size,
        height: size,
        backgroundColor: tokens.onInverse,
        padding: 2,
      }}
    >
      {grid.map((row, r) => (
        <div key={r} style={{ display: "flex", width: "100%", height: cell }}>
          {row.map((on, c) => (
            <div
              key={c}
              style={{ width: cell, height: cell, backgroundColor: on ? moduleColor : "transparent" }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
