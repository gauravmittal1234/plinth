// Document text as data (T63; BUILD_PLAN §14 hard rule 4 "Injection-safe").
//
// Instructions travel only in the system instruction (the task's prompt file). The user turn
// carries the document and nothing else: one fenced block, opened and closed by a fence longer
// than any backtick run inside the text, so no line of the document can close it early. Each line
// is "<line id>\t<text>". Small structured params (labels, a page number) go in a second fenced
// block of JSON, also data. Nothing in the user turn tells the model what to do, and extractors
// are sent no tools: gemini.ts never adds `tools` or `toolConfig` to a request.

import type { NormalisedInput } from "./input.ts";

/** The fence for a text: at least 3 backticks, and one more than its longest backtick run. */
export function fenceFor(text: string): string {
  let longest = 0;
  for (const run of text.match(/`+/g) ?? []) longest = Math.max(longest, run.length);
  return "`".repeat(Math.max(3, longest + 1));
}

/** One fenced block with an info string ("document", "params"). */
export function fenced(info: "document" | "params", body: string): string {
  const fence = fenceFor(body);
  return `${fence}${info}\n${body}\n${fence}`;
}

/** The document body: lines as "<id>\t<text>", or the plain text. */
export function documentBody(input: NormalisedInput): string | null {
  const parts: string[] = [];
  if (input.lines?.length) parts.push(input.lines.map((l) => `${l.id}\t${l.text}`).join("\n"));
  if (input.text) parts.push(input.text);
  return parts.length ? parts.join("\n") : null;
}

/**
 * The user turn's text parts: the fenced document, then the fenced params (if any). Media goes
 * alongside as inline data (gemini.ts). Returns [] for a media-only input.
 */
export function wrapInput(input: NormalisedInput): string[] {
  const out: string[] = [];
  const body = documentBody(input);
  if (body !== null) out.push(fenced("document", body));
  if (input.params && Object.keys(input.params).length) {
    out.push(fenced("params", JSON.stringify(input.params)));
  }
  return out;
}
