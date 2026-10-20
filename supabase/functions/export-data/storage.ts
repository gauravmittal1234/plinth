// Private Storage at the edge for the DPDP functions (T53; BUILD_PLAN §12.7). Shared by
// export-data, delete-account and retention-sweep (each imports it from here).
//
// The buckets (exports, uploads, voice-tmp; migration 20261125000100) have no client policy:
// only the secret-key client below reads or writes them, and a buyer gets a file only through a
// signed URL that lives SIGNED_URL_MAX_TTL_S seconds. Removal goes through the Storage API
// because Supabase Storage refuses a direct DELETE on storage.objects. Tests inject a fake.

import type { ApiClient } from "../_shared/core/supabase.ts";

/** A signed download URL never lives longer than this (5 minutes). */
export const SIGNED_URL_MAX_TTL_S = 300;

/** The Storage API's batch size for remove(). */
export const REMOVE_BATCH = 100;

export interface StorageAdapter {
  upload(bucket: string, key: string, bytes: Uint8Array, contentType: string): Promise<void>;
  signedUrl(bucket: string, key: string, ttlSeconds: number, downloadName: string): Promise<string>;
  /** Removes the objects; removing one that is already gone is not an error. */
  remove(bucket: string, keys: readonly string[]): Promise<void>;
}

export interface StorageObject {
  bucket: string;
  key: string;
}

/** Groups objects by bucket, in batches the Storage API accepts. */
export function batchesByBucket(
  objects: readonly StorageObject[],
  size = REMOVE_BATCH,
): Array<{ bucket: string; keys: string[] }> {
  const byBucket = new Map<string, string[]>();
  for (const o of objects) {
    const keys = byBucket.get(o.bucket) ?? [];
    if (!keys.includes(o.key)) keys.push(o.key);
    byBucket.set(o.bucket, keys);
  }
  const out: Array<{ bucket: string; keys: string[] }> = [];
  for (const [bucket, keys] of byBucket) {
    for (let i = 0; i < keys.length; i += size) out.push({ bucket, keys: keys.slice(i, i + size) });
  }
  return out;
}

class StorageError extends Error {
  constructor(op: string, cause: unknown) {
    const message = (cause as { message?: unknown })?.message;
    super(`storage ${op} failed${typeof message === "string" ? `: ${message}` : ""}`);
    this.name = "StorageError";
  }
}

/** The Storage API through a secret-key client (secretClient in _shared/core/supabase.ts). */
export function supabaseStorage(client: ApiClient): StorageAdapter {
  return {
    async upload(bucket, key, bytes, contentType) {
      const { error } = await client.storage.from(bucket).upload(
        key,
        new Blob([bytes as Uint8Array<ArrayBuffer>], { type: contentType }),
        { contentType, upsert: true },
      );
      if (error) throw new StorageError("upload", error);
    },
    async signedUrl(bucket, key, ttlSeconds, downloadName) {
      const ttl = Math.max(1, Math.min(SIGNED_URL_MAX_TTL_S, Math.floor(ttlSeconds)));
      const { data, error } = await client.storage.from(bucket).createSignedUrl(key, ttl, {
        download: downloadName,
      });
      if (error || !data?.signedUrl) throw new StorageError("sign", error);
      return data.signedUrl;
    },
    async remove(bucket, keys) {
      if (!keys.length) return;
      const { error } = await client.storage.from(bucket).remove([...keys]);
      if (error) throw new StorageError("remove", error);
    },
  };
}
