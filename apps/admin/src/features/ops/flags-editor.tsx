"use client";
// The flags editor (this task's Build line: "flags editor through admin_flag_set").
// One row per ops.feature_flags row, a toggle button per row. Optimistic, rolled back
// on a server error — the row it shows after a toggle is always what the database
// actually holds, never a guess (AGENTS.md §7 "No confirmation without a record").
import { useState, useTransition } from "react";
import { Pill } from "@plinth/web-ui";
import type { AdminFlag } from "@/src/data/types";
import { setFlagAction } from "./actions";

export function FlagsEditor({ flags }: { readonly flags: readonly AdminFlag[] }) {
  const [rows, setRows] = useState(flags);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState<{ key: string; message: string } | null>(null);
  const [, startTransition] = useTransition();

  function toggle(flag: AdminFlag) {
    const next = !flag.enabled;
    setRows((prev) => prev.map((f) => (f.key === flag.key ? { ...f, enabled: next } : f)));
    setPendingKey(flag.key);
    setErrorKey(null);
    startTransition(async () => {
      const result = await setFlagAction(flag.key, next);
      setPendingKey(null);
      if (!result.ok) {
        setRows((prev) => prev.map((f) => (f.key === flag.key ? { ...f, enabled: flag.enabled } : f)));
        setErrorKey({ key: flag.key, message: result.error });
        return;
      }
      setRows((prev) => prev.map((f) => (f.key === flag.key ? { ...f, enabled: result.enabled } : f)));
    });
  }

  return (
    <section aria-labelledby="flags-heading">
      <h2 id="flags-heading" className="text-h3 font-display font-semibold">
        Flags
      </h2>
      <ul className="mt-3 flex flex-col gap-2">
        {rows.map((flag) => (
          <li key={flag.key} className="flex items-center gap-3 bg-slab px-4 py-3">
            <Pill
              as="button"
              pressed={flag.enabled}
              aria-label={`${flag.key}: ${flag.enabled ? "on" : "off"}`}
              disabled={pendingKey === flag.key}
              onClick={() => toggle(flag)}
            >
              {flag.enabled ? "On" : "Off"}
            </Pill>
            <div className="min-w-0">
              <p className="text-body font-semibold">{flag.key}</p>
              {flag.note ? <p className="text-small">{flag.note}</p> : null}
              {errorKey?.key === flag.key ? (
                <p className="text-small" role="alert">
                  {errorKey.message}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
