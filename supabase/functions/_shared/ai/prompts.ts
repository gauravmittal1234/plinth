// Prompt files (T63; BUILD_PLAN §14). Owners: T69 (claims), T70 (money) for prompts/<task>/**.
//
// A task's prompt is supabase/functions/_shared/ai/prompts/<task id>/<prompt version>.md, for
// example prompts/extract.marketing_claims/a@1.md (reader A) and b@1.md (reader B), or v1.md for a
// task without readers. The whole file is the system instruction: everything the model is told
// lives there, and the document only ever arrives as fenced data (wrap.ts). A prompt change that
// changes answers needs a new version (a@2), because recorded responses are keyed by the version.
// A deployed function reads the files at run time, so it lists them in config.toml `static_files`.

import { AiError } from "./errors.ts";

export interface PromptSource {
  get(taskId: string, promptVersion: string): Promise<string>;
}

/** Reads prompts/<task id>/<version>.md under a folder (default: ./prompts/ next to this file). */
export function filePromptSource(base: URL = new URL("./prompts/", import.meta.url)): PromptSource {
  const cache = new Map<string, string>();
  return {
    async get(taskId, promptVersion) {
      const rel = `${taskId}/${promptVersion}.md`;
      if (!/^[a-z0-9_.]+\/[a-z0-9_-]+(@\d+)?\.md$/i.test(rel) || rel.includes("..")) {
        throw new AiError("config", `prompt path ${rel} is not a prompt file name`);
      }
      const hit = cache.get(rel);
      if (hit !== undefined) return hit;
      let text: string;
      try {
        text = (await Deno.readTextFile(new URL(rel, base))).trim();
      } catch (err) {
        throw new AiError("prompt_missing", `no prompt file prompts/${rel}`, { cause: err });
      }
      if (text === "") throw new AiError("prompt_missing", `prompt file prompts/${rel} is empty`);
      cache.set(rel, text);
      return text;
    },
  };
}

/** Prompts from a record of "<task id>/<version>" → text (tests). */
export function memoryPromptSource(prompts: Readonly<Record<string, string>>): PromptSource {
  return {
    get(taskId, promptVersion) {
      const text = prompts[`${taskId}/${promptVersion}`];
      return text
        ? Promise.resolve(text)
        : Promise.reject(new AiError("prompt_missing", `no prompt ${taskId}/${promptVersion}`));
    },
  };
}
