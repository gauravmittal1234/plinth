// The left column when `next` doesn't name a project (e.g. an account page
// such as /following opens sign-in without one): no risk card to show, so
// this just states what signing in is for.
import { COPY } from "./copy";

export function GenericIntro() {
  return (
    <div className="flex min-w-0 flex-1 basis-[32rem] flex-col gap-3.5 rounded-panel bg-track px-7 py-6.5">
      <h2 className="m-0 font-display text-h3 font-extrabold">{COPY.pageTitle}</h2>
      <p className="m-0 text-body">{COPY.genericIntro}</p>
      <p className="m-0 text-small text-ink2">{COPY.readingWithoutAccount}</p>
    </div>
  );
}
