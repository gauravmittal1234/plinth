// The two non-page routes T05 owns: /api/health and /.well-known/assetlinks.json.
import { afterEach, describe, expect, it, vi } from "vitest";
import { assetLinks, parseFingerprints } from "@/src/server/assetlinks";

// Outside a Next request there is no request scope for connection().
vi.mock("next/server", () => ({ connection: async () => {} }));

const FP = Array.from({ length: 32 }, (_, i) => i.toString(16).padStart(2, "0"))
  .join(":")
  .toUpperCase();

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("GET /api/health", () => {
  it("answers ok, uncached, with the data mode", async () => {
    const { GET } = await import("@/app/api/health/route");
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(await res.json()).toEqual({ status: "ok", service: "plinth-web", data: "fixtures" });
  });
});

describe("GET /.well-known/assetlinks.json", () => {
  it("is an empty statement list when no fingerprints are set", async () => {
    vi.stubEnv("ANDROID_SHA256_CERT_FINGERPRINTS", "");
    const { GET } = await import("@/app/.well-known/assetlinks.json/route");
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it("links in.plinth.app to the configured signing keys", async () => {
    vi.stubEnv("ANDROID_SHA256_CERT_FINGERPRINTS", ` ${FP.toLowerCase()} , not-a-fingerprint,`);
    const { GET } = await import("@/app/.well-known/assetlinks.json/route");
    const body = await (await GET()).json();
    expect(body).toEqual([
      {
        relation: ["delegate_permission/common.handle_all_urls"],
        target: {
          namespace: "android_app",
          package_name: "in.plinth.app",
          sha256_cert_fingerprints: [FP],
        },
      },
    ]);
  });

  it("drops malformed fingerprints", () => {
    expect(parseFingerprints("AA:BB, , 12")).toEqual([]);
    expect(assetLinks([])).toEqual([]);
  });
});
