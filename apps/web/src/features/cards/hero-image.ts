// Reads a project's hero photo for the risk card's masthead (whatsapp.md:
// "The cards use the existing heroAurelia image... with object-fit: cover.
// No new image requests."). Satori can't resolve a relative "/media/…" URL
// (there is no browser, no base URL), so the file is read once and inlined
// as a data URI — the same bytes `public/media/*.jpg` already serves the
// page itself.
import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const cache = new Map<string, Promise<string>>();

/** `imagePath` is a ProjectHero.image_url, e.g. "/media/heroAurelia.jpg". */
export function heroImageDataUrl(imagePath: string): Promise<string> {
  let pending = cache.get(imagePath);
  if (!pending) {
    pending = load(imagePath);
    cache.set(imagePath, pending);
  }
  return pending;
}

async function load(imagePath: string): Promise<string> {
  const file = await readFile(join(process.cwd(), "public", imagePath));
  const ext = imagePath.slice(imagePath.lastIndexOf(".") + 1).toLowerCase();
  const type = ext === "png" ? "image/png" : "image/jpeg";
  return `data:${type};base64,${file.toString("base64")}`;
}
