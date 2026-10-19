#!/usr/bin/env python3
"""Generate UI imagery with Google's Gemini image model ("Nano Banana").

Reads GEMINI_API_KEY from the environment or from `.env.local` in the project
root. The key is sent in a request header and is never printed or logged.

Usage:
  python3 scripts/gen_images.py --list-models          # show image-capable models
  python3 scripts/gen_images.py                         # generate all missing images
  python3 scripts/gen_images.py --only roomBare roomMinimal --force
  python3 scripts/gen_images.py --model gemini-2.5-flash-image

Output: product/design/assets/<slot>.png plus a compressed <slot>.jpg (via macOS `sips`).
"""
import argparse
import base64
import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, "product", "design", "assets")
SPEC = os.path.join(ASSETS, "prompts.json")
API = "https://generativelanguage.googleapis.com/v1beta"
DEFAULT_MODEL = "gemini-2.5-flash-image"


def load_key():
    key = os.environ.get("GEMINI_API_KEY", "").strip()
    if key:
        return key
    for name in (".env.local", ".env"):
        path = os.path.join(ROOT, name)
        if os.path.exists(path):
            with open(path) as fh:
                for line in fh:
                    line = line.strip()
                    if line.startswith("GEMINI_API_KEY="):
                        return line.split("=", 1)[1].strip().strip('"').strip("'")
    sys.exit("GEMINI_API_KEY not found. Add it to .env.local in the project root (see instructions).")


def call(method, path, key, body=None, timeout=180):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(API + path, data=data, method=method)
    req.add_header("x-goog-api-key", key)
    if data is not None:
        req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as err:
        detail = err.read().decode(errors="replace")[:600]
        raise RuntimeError(f"HTTP {err.code}: {detail}") from None


def list_models(key):
    out, token = [], None
    while True:
        q = "/models?pageSize=200" + (f"&pageToken={token}" if token else "")
        res = call("GET", q, key)
        out += res.get("models", [])
        token = res.get("nextPageToken")
        if not token:
            return out


def generate(key, model, prompt, aspect, ref_png=None):
    parts = [{"text": prompt}]
    if ref_png:
        with open(ref_png, "rb") as fh:
            parts.insert(0, {"inlineData": {"mimeType": "image/png", "data": base64.b64encode(fh.read()).decode()}})
    body = {
        "contents": [{"role": "user", "parts": parts}],
        "generationConfig": {"responseModalities": ["IMAGE"], "imageConfig": {"aspectRatio": aspect}},
    }
    res = call("POST", f"/models/{model}:generateContent", key, body)
    for cand in res.get("candidates", []):
        for part in cand.get("content", {}).get("parts", []):
            inline = part.get("inlineData") or part.get("inline_data")
            if inline and inline.get("data"):
                return base64.b64decode(inline["data"])
    reason = json.dumps(res.get("promptFeedback") or res.get("candidates", [{}])[0].get("finishReason"))
    raise RuntimeError(f"No image returned ({reason})")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", default=DEFAULT_MODEL)
    ap.add_argument("--only", nargs="*")
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--list-models", action="store_true")
    args = ap.parse_args()
    key = load_key()

    if args.list_models:
        for m in list_models(key):
            name = m.get("name", "")
            if "image" in name or "imagen" in name:
                print(name, "|", m.get("displayName", ""), "|", ",".join(m.get("supportedGenerationMethods", [])))
        return

    spec = json.load(open(SPEC))
    suffix = spec.get("style_suffix", "")
    items = spec["images"]
    if args.only:
        items = [i for i in items if i["slot"] in args.only]
    # bases first so edits can reference them
    items.sort(key=lambda i: 1 if i.get("edit_of") else 0)
    os.makedirs(ASSETS, exist_ok=True)
    for item in items:
        slot = item["slot"]
        png = os.path.join(ASSETS, f"{slot}.png")
        if os.path.exists(png) and not args.force:
            print(f"skip {slot} (exists)")
            continue
        ref = os.path.join(ASSETS, f"{item['edit_of']}.png") if item.get("edit_of") else None
        if ref and not os.path.exists(ref):
            print(f"skip {slot}: base image {item['edit_of']} missing")
            continue
        prompt = item["prompt"] if (ref or item.get("raw")) else f"{item['prompt']} {suffix}"
        for attempt in range(3):
            try:
                t0 = time.time()
                data = generate(key, args.model, prompt, item.get("aspect", "4:3"), ref)
                with open(png, "wb") as fh:
                    fh.write(data)
                jpg = os.path.join(ASSETS, f"{slot}.jpg")
                subprocess.run(["sips", "-s", "format", "jpeg", "-s", "formatOptions", "82", png, "--out", jpg],
                               check=False, capture_output=True)
                print(f"ok   {slot} ({len(data)//1024} KB, {time.time()-t0:.1f}s)")
                break
            except Exception as exc:  # noqa: BLE001
                print(f"warn {slot} attempt {attempt+1}: {exc}")
                time.sleep(4 * (attempt + 1))
        else:
            print(f"FAIL {slot}")


if __name__ == "__main__":
    main()
