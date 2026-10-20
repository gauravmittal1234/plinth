// "What's free, for good?" (layout copy; FREE_GROUPS are feature names, never
// a price or a band — those come from the payload elsewhere on the product).
import { FREE_GROUPS } from "../copy";

export function FreeSection() {
  return (
    <section aria-labelledby="free-h" className="bg-track py-18 text-ink md:py-30">
      <div className="mx-auto flex w-full max-w-[79rem] flex-col gap-6 px-4 sm:px-8">
        <h2 id="free-h" className="m-0 font-display text-h2 font-extrabold">
          What stays free?
        </h2>
        <p className="m-0 max-w-measure text-body text-ink2">
          If it&rsquo;s free today, it stays free. We never move it behind Pro.
        </p>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {FREE_GROUPS.map((group) => (
            <div key={group.title} className="flex flex-col gap-3">
              <p className="m-0 font-semibold">{group.title}</p>
              <ul role="list" className="m-0 flex flex-col gap-2 p-0 text-body text-ink2">
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="m-0 max-w-measure text-small text-ink2">
          No account is needed to read any of it. You sign in only to follow projects and get
          alerts, with a WhatsApp code and no password.
        </p>
      </div>
    </section>
  );
}
