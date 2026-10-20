#!/usr/bin/env node
// HTTP/2 in front of `next start`, for the Lighthouse CI run only (T39 M1 gate;
// DECISIONS E-11). Production serves the site over HTTP/2 (Vercel). `next
// start` speaks HTTP/1.1, which Lighthouse's simulated throttling models as up
// to six connections with a round trip per request: about 0.5–0.8 s of extra
// LCP on throttled 4G that no visitor sees (PR #50 measured it). This puts a
// small TLS + h2 proxy on the Lighthouse port so the measured protocol is the
// served one. Same bytes: the proxy passes requests and responses through
// unchanged, compression included.
//
//   node scripts/lhci-h2-server.mjs [--port 3200] [--upstream 3201]
//
// Prints "h2 proxy ready" once `next start` is up and the proxy listens
// (lighthouserc.cjs `startServerReadyPattern`). The certificate is a throwaway
// self-signed one made with `openssl` in a temp folder for this run; Chrome
// runs with --ignore-certificate-errors. Nothing here is a secret.
import { spawn, execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import http from "node:http";
import http2 from "node:http2";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const APP = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const arg = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i >= 0 ? Number(process.argv[i + 1]) : fallback;
};
const PORT = arg("--port", 3200);
const UPSTREAM = arg("--upstream", PORT + 1);
const HOST = "127.0.0.1";

// Hop-by-hop and HTTP/1-only headers: never valid on an HTTP/2 response.
const HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-connection",
  "transfer-encoding",
  "upgrade",
  "host",
]);

const certDir = mkdtempSync(join(tmpdir(), "plinth-lhci-h2-"));
execFileSync(
  "openssl",
  [
    ...["req", "-x509", "-newkey", "rsa:2048", "-nodes", "-days", "1"],
    ...["-keyout", join(certDir, "key.pem"), "-out", join(certDir, "cert.pem")],
    ...["-subj", `/CN=${HOST}`],
  ],
  { stdio: "ignore" },
);
const tls = {
  key: readFileSync(join(certDir, "key.pem")),
  cert: readFileSync(join(certDir, "cert.pem")),
};
rmSync(certDir, { recursive: true, force: true });

const nextBin = createRequire(join(APP, "package.json")).resolve("next/dist/bin/next");
const next = spawn(
  process.execPath,
  [nextBin, "start", "--port", String(UPSTREAM), "--hostname", HOST],
  { cwd: APP, env: process.env, stdio: ["ignore", "pipe", "inherit"] },
);
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  next.kill("SIGTERM");
  process.exit(code);
}
next.on("exit", (code) => {
  if (!stopping) {
    console.error(`h2 proxy: next start exited (${code})`);
    process.exit(code ?? 1);
  }
});
for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"]) process.on(sig, () => stop(0));
// lhci stops the server by killing the shell that started it; follow it.
const parent = process.ppid;
setInterval(() => {
  if (process.ppid !== parent) stop(0);
}, 1000).unref();

const agent = new http.Agent({ keepAlive: true, maxSockets: 64 });

function proxy(req, res) {
  const headers = {};
  for (const [k, v] of Object.entries(req.headers)) {
    if (!k.startsWith(":") && !HOP.has(k)) headers[k] = v;
  }
  headers.host = req.headers[":authority"] ?? req.headers.host ?? `${HOST}:${PORT}`;
  headers["x-forwarded-proto"] = "https";
  const up = http.request(
    { host: HOST, port: UPSTREAM, method: req.method, path: req.url, headers, agent },
    (upRes) => {
      const out = {};
      for (const [k, v] of Object.entries(upRes.headers)) if (!HOP.has(k)) out[k] = v;
      res.writeHead(upRes.statusCode ?? 502, out);
      upRes.pipe(res);
    },
  );
  up.on("error", (e) => {
    if (!res.headersSent) res.writeHead(502, { "content-type": "text/plain" });
    res.end(`h2 proxy: ${e.message}`);
  });
  req.pipe(up);
}

let seen = "";
let listening = false;
next.stdout.on("data", (chunk) => {
  const text = chunk.toString();
  // Pass next's log through, minus the word "Ready": lighthouserc's
  // startServerReadyPattern must match only once the proxy listens.
  process.stdout.write(text.replace(/Ready/g, "up"));
  if (listening) return;
  seen += text;
  if (!seen.includes("Ready")) return;
  listening = true;
  http2
    .createSecureServer({ ...tls, allowHTTP1: true }, proxy)
    .listen(PORT, HOST, () =>
      console.log(`h2 proxy ready: https://${HOST}:${PORT} -> http://${HOST}:${UPSTREAM}`),
    );
});
