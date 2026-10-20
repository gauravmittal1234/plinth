// The five-segment risk meter, drawn for next/og (whatsapp.md "a full-width
// 5-segment meter"; house rule: "The meter keeps a grey edge on its empty
// segments only... it is the one line left on the cards, and it encodes
// data."). A plain flex row: next/og (Satori) supports flexbox only, not the
// card's usual SVG riskometer.
import { ink } from "./colors";

export function Meter({ filled, fill }: { filled: number; fill: string }) {
  const segments = [1, 2, 3, 4, 5];
  return (
    <div style={{ display: "flex", width: "100%", gap: 8 }}>
      {segments.map((n) => {
        const on = n <= filled;
        return (
          <div
            key={n}
            style={{
              flex: 1,
              height: 20,
              borderRadius: 4,
              backgroundColor: on ? fill : ink.emptyCell,
              border: on ? "none" : `1px solid ${ink.emptyBorder}`,
            }}
          />
        );
      })}
    </div>
  );
}
