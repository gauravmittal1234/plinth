#!/usr/bin/env python3
"""Replace empty `<div data-slot="NAME" ...></div>` placeholders in canvas artboards
with real `<img>` elements pointing at uploaded asset URLs.

Usage: python3 scripts/swap_slots.py <artboard_dir> <slot_urls.json>
slot_urls.json: {"heroAurelia": "/_blob/abc...", ...}
Keeps the original style (size, position, radius, background as a fallback),
adds object-fit: cover, and turns aria-label into alt text.
"""
import glob
import json
import os
import re
import sys

PAT = re.compile(r'<div\b([^>]*?\bdata-slot="([A-Za-z0-9]+)"[^>]*)>(\s*)</div>')


def attr(attrs, name):
    m = re.search(r'\b' + name + r'="([^"]*)"', attrs)
    return m.group(1) if m else None


def build(attrs, slot, url):
    style = attr(attrs, "style") or ""
    alt = attr(attrs, "aria-label") or "Illustrative image"
    keep = []
    for a in ("class", "id", "aria-hidden"):
        v = attr(attrs, a)
        if v is not None:
            keep.append(f'{a}="{v}"')
    style = style.rstrip().rstrip(";")
    style += "; object-fit: cover; display: block"
    extra = (" " + " ".join(keep)) if keep else ""
    return f'<img data-slot="{slot}" src="{url}" alt="{alt}"{extra} style="{style}">'


def main():
    folder, mapping = sys.argv[1], json.load(open(sys.argv[2]))
    changed = []
    for path in sorted(glob.glob(os.path.join(folder, "*.dc.html"))):
        src = open(path).read()
        count = 0

        def rep(m):
            nonlocal count
            slot = m.group(2)
            if slot not in mapping:
                return m.group(0)
            count += 1
            return build(m.group(1), slot, mapping[slot])

        out = PAT.sub(rep, src)
        if count:
            open(path, "w").write(out)
            changed.append(os.path.basename(path))
            print(f"{os.path.basename(path)}: {count} slots filled")
    print("CHANGED", json.dumps(changed))


if __name__ == "__main__":
    main()
