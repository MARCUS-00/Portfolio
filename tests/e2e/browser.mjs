/*
 * Shared browser setup: a fresh production build in a temporary folder (so a
 * running dev server can't change files mid-test), served locally, driven
 * through an installed Edge or Chrome.
 */
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright-core";
import { content } from "../../src/content/index.js";
import { buildSite } from "../../scripts/lib/build-site.mjs";
import { serve } from "../../scripts/serve.mjs";

export async function start() {
  const dist = await mkdtemp(join(tmpdir(), "portfolio-e2e-"));
  await buildSite({ content, outDir: dist });
  const server = await serve({ root: dist, port: 0 });
  const origin = `http://127.0.0.1:${server.address().port}`;
  let browser;
  for (const channel of [process.env.BROWSER_CHANNEL, "msedge", "chrome"].filter(Boolean)) {
    try { browser = await chromium.launch({ channel }); break; } catch { /* try the next installed browser */ }
  }
  if (!browser) throw new Error("No Chromium-based browser found. Set BROWSER_CHANNEL (msedge, chrome) or install one.");
  return {
    origin,
    browser,
    async stop() {
      await browser.close();
      await new Promise((r) => server.close(r));
      await rm(dist, { recursive: true, force: true });
    },
  };
}

/* A page that records console errors and uncaught exceptions. */
export async function openPage(ctx, errors) {
  const page = await ctx.newPage();
  page.on("console", (m) => { if (m.type() === "error") errors.push(`${page.url()}: ${m.text()}`); });
  page.on("pageerror", (e) => errors.push(`${page.url()}: ${e.message}`));
  return page;
}
