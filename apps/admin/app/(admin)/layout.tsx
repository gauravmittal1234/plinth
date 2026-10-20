import { Suspense } from "react";
import { AdminGate } from "@/src/shell/admin-gate";
import { AdminLoading } from "@/src/shell/admin-loading";

// Every page under /(admin) (/ops now; /queue, /disputes, /notices, /inbox as
// placeholders) renders through one gate. AdminGate reads cookies, so it needs this
// boundary (node_modules/next/dist/docs/01-app/02-guides/authentication-with-cache-
// components.md): without it, a page here would fail to build.
export default function AdminLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <AdminGate>{children}</AdminGate>
    </Suspense>
  );
}
