/* Build, then serve. Run through `npm run dev`, which restarts this on any change in src/ or scripts/. */
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { content } from "../src/content/index.js";
import { buildSite } from "./lib/build-site.mjs";
import { serve } from "./serve.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "dist");
const port = Number(process.env.PORT) || 4173;
try {
  await buildSite({ content, outDir: root, base: process.env.BASE_PATH || "/" });
} catch (err) {
  console.error(err.message);
}
await serve({ root, port });
console.log(`Dev server at http://127.0.0.1:${port}/ (rebuilds on change)`);
