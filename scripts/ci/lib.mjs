// Shared helpers for the repo-level CI scripts (owner: T00, then the lead).
// Plain Node (>= 20.11), no dependencies, so ci-guard runs without `npm ci`.
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

/** Tracked files plus untracked files that are not ignored (so local runs see new files). */
export function repoFiles() {
  const out = execFileSync(
    "git",
    ["ls-files", "-z", "--cached", "--others", "--exclude-standard"],
    {
      cwd: ROOT,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    },
  );
  return [...new Set(out.split("\0").filter(Boolean))].sort();
}

/** Converts a glob (`**`, `*`, `?`, `{a,b}`) to an anchored RegExp over POSIX paths. */
export function globToRegExp(glob) {
  let re = "";
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === "*") {
      if (glob[i + 1] === "*") {
        const slashAfter = glob[i + 2] === "/";
        re += slashAfter ? "(?:.*/)?" : ".*";
        i += slashAfter ? 2 : 1;
      } else {
        re += "[^/]*";
      }
    } else if (c === "?") {
      re += "[^/]";
    } else if (c === "{") {
      const end = glob.indexOf("}", i);
      if (end === -1) {
        re += "\\{";
        continue;
      }
      const alts = glob.slice(i + 1, end).split(",");
      re += "(?:" + alts.map((a) => globToRegExp(a).source.slice(1, -1)).join("|") + ")";
      i = end;
    } else if ("\\^$+.()|[]".includes(c)) {
      re += "\\" + c;
    } else {
      re += c;
    }
  }
  return new RegExp("^" + re + "$");
}

/** True when the module at `metaUrl` is the script node was asked to run. */
export function isMain(metaUrl) {
  return process.argv[1] ? fileURLToPath(metaUrl) === resolve(process.argv[1]) : false;
}

export const isGitHubActions = process.env.GITHUB_ACTIONS === "true";

/** Prints a finding, as a GitHub annotation when running in Actions. */
export function report(level, file, line, message) {
  if (isGitHubActions) {
    const loc = file ? ` file=${file}${line ? `,line=${line}` : ""}` : "";
    console.log(`::${level}${loc}::${message}`);
  } else {
    const where = file ? `${file}${line ? `:${line}` : ""}: ` : "";
    console.log(`${level === "error" ? "error" : "warning"}  ${where}${message}`);
  }
}

export const BINARY_EXT = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  ".ico",
  ".pdf",
  ".jar",
  ".ttf",
  ".otf",
  ".woff",
  ".woff2",
  ".zip",
  ".apk",
  ".aab",
  ".mp3",
  ".mp4",
  ".wav",
  ".ogg",
  ".avif",
]);
