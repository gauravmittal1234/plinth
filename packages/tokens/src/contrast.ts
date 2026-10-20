// WCAG 2.x contrast helpers for token colours ("#RRGGBB", "transparent" or
// "rgba(r, g, b, a)"). Used by the token tests; component kits can use them in
// their own accessibility tests.

export interface Rgba {
  r: number;
  g: number;
  b: number;
  /** 0–1 */
  a: number;
}

export function parseColor(value: string): Rgba {
  const s = value.trim();
  const hex = /^#([0-9A-Fa-f]{6})$/.exec(s);
  if (hex?.[1]) {
    const n = parseInt(hex[1], 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 1 };
  }
  if (s === "transparent") return { r: 0, g: 0, b: 0, a: 0 };
  const rgba = /^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)$/.exec(s);
  if (rgba) return { r: +rgba[1]!, g: +rgba[2]!, b: +rgba[3]!, a: +rgba[4]! };
  throw new Error(`unsupported colour "${value}"`);
}

/** 0xAARRGGBB with the alpha rounded to 8 bits, as Flutter stores it. */
export function toArgb(value: string): number {
  const c = parseColor(value);
  return ((Math.round(c.a * 255) << 24) | (c.r << 16) | (c.g << 8) | c.b) >>> 0;
}

/** Paints `fg` (possibly translucent) over an opaque `bg`. */
export function compositeOver(fg: string, bg: string): Rgba {
  const f = parseColor(fg);
  const b = parseColor(bg);
  const mix = (x: number, y: number) => Math.round(y + (x - y) * f.a);
  return { r: mix(f.r, b.r), g: mix(f.g, b.g), b: mix(f.b, b.b), a: 1 };
}

function channel(c: number): number {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(c: Rgba): number {
  return 0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b);
}

/** WCAG contrast ratio (1–21). `fg` may be translucent; `bg` must be opaque. */
export function contrastRatio(fg: string, bg: string): number {
  const back = parseColor(bg);
  if (back.a !== 1) throw new Error(`background "${bg}" must be opaque`);
  const a = relativeLuminance(compositeOver(fg, bg));
  const b = relativeLuminance(back);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
