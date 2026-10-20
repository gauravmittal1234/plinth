// WebSignIn (T47; WORK_BREAKDOWN §4 T47, OWNERSHIP.md). `/sign-in?next=`:
// a project's Follow button links here with
// `?next=/gurugram/projects/<slug>` (src/features/project/sections/hero);
// an account page can link here with its own path.
//
// `searchParams` is a Cache Components request-time API: reading it at the
// top would make this whole route dynamic with no static shell, so it's
// pushed into a <Suspense>-wrapped child instead (WebCompare's page.tsx sets
// the precedent this follows).
import type { Metadata } from "next";
import { Suspense } from "react";
import { SignInPlaceholder } from "@/src/features/auth/sign-in-placeholder";
import { SignInScreen } from "@/src/features/auth/sign-in-screen";

export const metadata: Metadata = {
  title: "Sign in to Plinth",
  robots: { index: false },
};

export default function Page({ searchParams }: PageProps<"/sign-in">) {
  return (
    <Suspense fallback={<SignInPlaceholder />}>
      <SignInFromQuery searchParams={searchParams} />
    </Suspense>
  );
}

async function SignInFromQuery({ searchParams }: Pick<PageProps<"/sign-in">, "searchParams">) {
  const sp = await searchParams;
  return <SignInScreen next={sp.next} />;
}
