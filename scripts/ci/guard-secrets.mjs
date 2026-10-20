#!/usr/bin/env node
// Secret guard (BUILD_PLAN §8 ci-guard, §12.5; SETUP_FOR_FOUNDER "rules for keys").
// gitleaks is the main scanner in CI. This script adds Plinth-specific rules and
// gives the same feedback locally, where gitleaks may not be installed:
//
//   1. No env or key files are tracked (.env*, except .env.example; .env.json,
//      google-services.json, keystores, key.properties, *.pem, service accounts).
//   2. Client code (apps/**, packages/{web-ui,tokens,calc}/**) never names the
//      Supabase secret or service-role key.
//   3. No high-confidence secret literal anywhere (Supabase secret keys, Google
//      API keys, private keys, GitHub/Slack tokens, live payment keys, JWTs).
//
// Usage: node scripts/ci/guard-secrets.mjs
import { readFileSync } from "node:fs";
import { basename, extname, join } from "node:path";
import { BINARY_EXT, ROOT, globToRegExp, isMain, repoFiles, report } from "./lib.mjs";

const FORBIDDEN_FILES = [
  {
    re: /(^|\/)\.env(\.[^/]*)?$/,
    allow: /(^|\/)\.env\.example$/,
    why: "env file (only .env.example is committed)",
  },
  { re: /(^|\/)\.env\.json$/, why: "app env file (apps/mobile/.env.json stays local)" },
  {
    re: /(^|\/)google-services\.json$/,
    why: "Firebase config (kept local + GOOGLE_SERVICES_JSON_BASE64 secret)",
  },
  { re: /\.(jks|keystore|p12|pfx)$/, why: "signing keystore" },
  { re: /(^|\/)key\.properties$/, why: "Android signing properties" },
  { re: /\.pem$/, why: "PEM key or certificate" },
  { re: /(^|\/)[^/]*service[-_]?account[^/]*\.json$/i, why: "service-account key" },
];

const CLIENT_SCOPE = [
  "apps/**",
  "packages/web-ui/**",
  "packages/tokens/**",
  "packages/calc/**",
].map(globToRegExp);
// Built from parts so this file never matches its own rule.
const CLIENT_BANNED = [
  {
    re: new RegExp(["sb", "secret", ""].join("_")),
    why: "Supabase secret key prefix in client code",
  },
  {
    re: new RegExp(["SUPABASE", "SECRET"].join("_")),
    why: "Supabase secret key name in client code",
  },
  {
    re: new RegExp(["SUPABASE", "SERVICE", "ROLE"].join("_")),
    why: "Supabase service-role key name in client code",
  },
  {
    re: new RegExp(["service", "role", "key"].join("_"), "i"),
    why: "service-role key in client code",
  },
];

const SECRET_LITERALS = [
  { re: /sb_secret_[A-Za-z0-9_-]{16,}/, why: "Supabase secret key" },
  { re: /AIza[0-9A-Za-z_-]{35}/, why: "Google API key" },
  { re: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |ENCRYPTED )?PRIVATE KEY-----/, why: "private key" },
  {
    re: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36}\b|\bgithub_pat_[A-Za-z0-9_]{60,}/,
    why: "GitHub token",
  },
  { re: /\bxox[abprs]-[A-Za-z0-9-]{10,}/, why: "Slack token" },
  { re: /\b(?:sk|rk)_live_[A-Za-z0-9]{16,}|\brzp_live_[A-Za-z0-9]{10,}/, why: "live payment key" },
  {
    re: /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,
    why: "JWT (legacy Supabase keys are JWTs)",
  },
];

const SKIP_CONTENT = [
  /^package-lock\.json$/,
  /(^|\/)pubspec\.lock$/,
  /(^|\/)uv\.lock$/,
  /^product\/design\/artboards\//,
];

export function checkFile(rel, src) {
  const findings = [];
  const inClient = CLIENT_SCOPE.some((r) => r.test(rel)) && extname(rel) !== ".md";
  const lines = src.split("\n");
  lines.forEach((text, idx) => {
    if (inClient) {
      for (const b of CLIENT_BANNED)
        if (b.re.test(text)) findings.push({ rel, line: idx + 1, why: b.why });
    }
    for (const s of SECRET_LITERALS)
      if (s.re.test(text)) findings.push({ rel, line: idx + 1, why: s.why });
  });
  return findings;
}

function main() {
  const files = repoFiles();
  const findings = [];
  for (const rel of files) {
    for (const f of FORBIDDEN_FILES) {
      if (f.re.test(rel) && !(f.allow && f.allow.test(rel)))
        findings.push({ rel, line: 0, why: `${f.why} must not be committed` });
    }
    if (BINARY_EXT.has(extname(rel)) || SKIP_CONTENT.some((r) => r.test(rel))) continue;
    if (basename(rel) === "guard-secrets.mjs") continue;
    let src;
    try {
      src = readFileSync(join(ROOT, rel), "utf8");
    } catch {
      continue; // deleted in the working tree
    }
    findings.push(...checkFile(rel, src));
  }
  for (const f of findings) report("error", f.rel, f.line, f.why);
  console.log(`guard-secrets: ${files.length} file(s) checked, ${findings.length} finding(s)`);
  process.exit(findings.length ? 1 : 0);
}

if (isMain(import.meta.url)) main();
