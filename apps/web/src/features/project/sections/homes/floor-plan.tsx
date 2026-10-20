// A schematic SVG floor plan drawn from the layout's own room list
// (fixpass-buyer.md §1 "What are the homes like?": "an SVG floor plan drawn
// by us... walls, door swings, windows... room names and sizes in feet, and a
// north arrow; it is plainly a plan, not a photo"). Boxes are packed by their
// stated size in feet, so a 22′ × 13′ living room reads bigger than a toilet;
// it is illustrative, not architectural. The exact room text — the real fact
// — is always printed below the drawing, never only inside the SVG.
const DIMENSION = /(\d+(?:\.\d+)?)\s*′\s*×\s*(\d+(?:\.\d+)?)\s*′/;

/** The leading name before any size or "with …" clause ("Master bedroom 14′ × 14′ with dress and toilet" → "Master bedroom"). */
function shortName(line: string): string {
  const cut = line.search(DIMENSION);
  const head = cut >= 0 ? line.slice(0, cut) : line;
  return head.replace(/\s+$/, "") || line;
}

type Box = { label: string; x: number; y: number; w: number; h: number };

const CANVAS_W = 440;
const PAD = 12;
const MIN_W = 46;
const MIN_H = 34;
const GAP = 6;

function pack(rooms: readonly string[]): { boxes: Box[]; height: number } {
  const sized = rooms.map((line) => {
    const m = DIMENSION.exec(line);
    return { line, wFt: m ? Number(m[1]) : 9, hFt: m ? Number(m[2]) : 8 };
  });
  const totalArea = sized.reduce((s, r) => s + r.wFt * r.hFt, 0) || 1;
  // Target interior roughly 2.1x the canvas width in area, a reasonable plan aspect.
  const targetArea = (CANVAS_W - PAD * 2) * (CANVAS_W * 0.6);
  const scale = Math.sqrt(targetArea / totalArea);

  const boxes: Box[] = [];
  let x = PAD;
  let y = PAD;
  let rowH = 0;
  for (const r of sized) {
    const w = Math.max(MIN_W, r.wFt * scale);
    const h = Math.max(MIN_H, r.hFt * scale);
    if (x > PAD && x + w > CANVAS_W - PAD) {
      x = PAD;
      y += rowH + GAP;
      rowH = 0;
    }
    boxes.push({ label: r.line, x, y, w, h });
    x += w + GAP;
    rowH = Math.max(rowH, h);
  }
  return { boxes, height: y + rowH + PAD };
}

export function FloorPlan({ rooms }: { rooms: readonly string[] }) {
  if (rooms.length === 0) return null;
  const { boxes, height } = pack(rooms);

  return (
    <figure className="m-0 flex flex-col gap-3">
      <svg
        viewBox={`0 0 ${CANVAS_W} ${height}`}
        role="img"
        aria-label="Illustrative floor plan, not to scale. The exact room sizes are listed below."
        className="h-auto w-full max-w-[26rem] text-ink2"
      >
        <rect
          x={3}
          y={3}
          width={CANVAS_W - 6}
          height={height - 6}
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
        />
        {boxes.map((b, i) => (
          <g key={`${b.label}-${i}`}>
            <rect
              x={b.x}
              y={b.y}
              width={b.w}
              height={b.h}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.2}
            />
            {/* A door swing on the first room, the usual plan entry. */}
            {i === 0 ? (
              <path
                d={`M ${b.x + 4} ${b.y + b.h} v -18 a 18 18 0 0 1 18 18`}
                fill="none"
                stroke="currentColor"
                strokeWidth={0.9}
              />
            ) : null}
            {/* A window tick on the box's top exterior edge. */}
            <path
              d={`M ${b.x + b.w * 0.3} ${b.y} h ${b.w * 0.25}`}
              stroke="currentColor"
              strokeWidth={2.2}
            />
            <text
              x={b.x + b.w / 2}
              y={b.y + b.h / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={Math.min(9, Math.max(6, b.w / 9))}
              fill="currentColor"
            >
              {shortName(b.label)}
            </text>
          </g>
        ))}
        {/* North arrow. */}
        <g transform={`translate(${CANVAS_W - 22}, 20)`}>
          <path
            d="M0 9 V-9 M-4 -4 L0 -9 L4 -4"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <text x={0} y={18} textAnchor="middle" fontSize={8} fill="currentColor">
            N
          </text>
        </g>
      </svg>
      <figcaption>
        <ul role="list" className="m-0 grid grid-cols-1 gap-1 p-0 text-small text-ink2 sm:grid-cols-2">
          {rooms.map((line, i) => (
            <li key={`${line}-${i}`}>{line}</li>
          ))}
        </ul>
      </figcaption>
    </figure>
  );
}
