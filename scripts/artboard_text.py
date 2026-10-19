#!/usr/bin/env python3
"""Print the human-visible copy of a .dc.html artboard: markup text in order, then notable
string literals from its logic script (data like reasons, answers, labels).
Usage: python3 scripts/artboard_text.py product/design/artboards/WebProject.dc.html"""
import html, re, sys

src = open(sys.argv[1]).read()
script = "\n".join(re.findall(r'<script type="text/x-dc"[^>]*>(.*?)</script>', src, re.S))
body = re.sub(r'<script.*?</script>|<style.*?</style>|<helmet>.*?</helmet>', ' ', src, flags=re.S)
body = re.sub(r'<(br|/p|/h[1-6]|/li|/div|/section|/button|/a|/dt|/dd)[^>]*>', '\n', body)
text = html.unescape(re.sub(r'<[^>]+>', ' ', body))
lines = [re.sub(r'\s+', ' ', l).strip() for l in text.split('\n')]
print("=== VISIBLE MARKUP TEXT ===")
print("\n".join(l for l in lines if l and l != '{{' ))
print("\n=== STRINGS IN LOGIC (data, states) ===")
seen = set()
for s in re.findall(r"'((?:[^'\\]|\\.){18,})'|\"((?:[^\"\\]|\\.){18,})\"", script):
    s = (s[0] or s[1]).strip()
    if s in seen or s.count(':') > 3 and ';' in s:  # skip style strings
        continue
    seen.add(s)
    print("-", s)
