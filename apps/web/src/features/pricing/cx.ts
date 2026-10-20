/** Joins class names, skipping falsy parts. Every part is a literal so Tailwind sees it. */
export function cx(...parts: ReadonlyArray<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
