import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { content } from "../src/content/index.js";
import { buildSite } from "./lib/build-site.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "dist");
const base = process.env.BASE_PATH || "/";

try {
  const t0 = Date.now();
  const { pages } = await buildSite({ content, outDir, base });
  console.log(`Built ${pages.length} pages into dist/ in ${Date.now() - t0} ms` +
    (content.site.url ? ` for ${content.site.url}${base}` : " (SITE_URL not set: no canonical URLs or sitemap)"));
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
