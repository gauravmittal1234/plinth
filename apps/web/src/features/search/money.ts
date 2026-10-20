// A tile label only ("under ₹2.5 Cr all-in"): every project's own price comes
// verbatim from its `price_line` / `pin_label` (the server's words, never
// reformatted here). DESIGN §6: money as ₹2.74 Cr / ₹24.1 L.
export function formatCroreLabel(inr: number): string {
  const cr = inr / 1e7;
  const rounded = Math.round(cr * 100) / 100;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/0$/, "");
  return `₹${text} Cr`;
}
