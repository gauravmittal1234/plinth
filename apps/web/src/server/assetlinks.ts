// Android App Links statement list for /.well-known/assetlinks.json (T05).
// The signing-key fingerprints are public but environment-specific: the founder
// sets ANDROID_SHA256_CERT_FINGERPRINTS (comma-separated, SETUP_FOR_FOUNDER §1.2)
// in Vercel. With none set the list is empty (no association), which is what
// fixture mode and CI serve.

export const ANDROID_PACKAGE = "in.plinth.app";

const FINGERPRINT = /^(?:[0-9A-F]{2}:){31}[0-9A-F]{2}$/;

/** SHA-256 fingerprints ("AA:BB:…", 32 bytes) from the env value; anything else is dropped. */
export function parseFingerprints(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter((s) => FINGERPRINT.test(s));
}

export type AssetLink = {
  relation: string[];
  target: { namespace: "android_app"; package_name: string; sha256_cert_fingerprints: string[] };
};

export function assetLinks(fingerprints: string[]): AssetLink[] {
  if (fingerprints.length === 0) return [];
  return [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: ANDROID_PACKAGE,
        sha256_cert_fingerprints: fingerprints,
      },
    },
  ];
}
