// A component that writes its own words, so tokens-only.test.tsx can prove its
// "no copy in components" check sees them. Never imported by the kit.
export function Probe({ label }: { label: string }) {
  return (
    <button type="button">
      Close
      <span aria-label="Close evidence" className="sr-only">
        {label}
      </span>
      {"Delivery risk: "}
    </button>
  );
}
