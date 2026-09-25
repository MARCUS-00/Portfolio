/* Automated WCAG 2.2 A/AA audit (axe-core) of every page, in the states a visitor can reach. */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { start } from "./browser.mjs";

const AXE = createRequire(import.meta.url).resolve("axe-core/axe.min.js");
const ROUTES = ["/", "/work/", "/experience/", "/skills/", "/about/", "/contact/", "/p/osteoscan/", "/p/olist/", "/p/c3i/", "/404.html"];

/*
 * The default (Dark + High contrast) must be clean, contrast included. Only when a visitor
 * explicitly switches High contrast off do the prototype's softer greys return; that state
 * may fail colour contrast and nothing else.
 */
const PALETTE_CONTRAST = "color-contrast";

let env;
before(async () => { env = await start(); });
after(async () => { await env.stop(); });

async function audit(opts, setup) {
  const ctx = await env.browser.newContext({ reducedMotion: "reduce", ...opts });
  const page = await ctx.newPage();
  const found = {};
  for (const route of ROUTES) {
    await page.goto(env.origin + route);
    if (setup) await setup(page, route);
    await page.addScriptTag({ path: AXE });
    const res = await page.evaluate(() => window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"] } }));
    for (const v of res.violations) {
      (found[v.id] ||= { help: v.help, where: [] }).where.push(...v.nodes.slice(0, 3).map((n) => `${route} ${n.target.join(" ")}`));
    }
  }
  await ctx.close();
  return found;
}

test("the default Dark + High contrast state has no accessibility violations at all", async () => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 375, height: 812 }]) {
    const found = await audit({ viewport }, async (page) => {
      if (viewport.width < 700 && (await page.isVisible(".menu-btn[data-js]"))) await page.click(".menu-btn[data-js]");
    });
    assert.deepEqual(found, {}, `viewport ${viewport.width}`);
  }
});

/* Stored display choices are applied by the boot script, so set them once and reload. */
const withPrefs = (prefs, extra) => async (page) => {
  const want = JSON.stringify(prefs);
  if (await page.evaluate((w) => JSON.stringify({ theme: localStorage.getItem("mk-theme"), contrast: localStorage.getItem("mk-contrast") }) !== w, want)) {
    await page.evaluate((p) => { for (const [k, v] of Object.entries(p)) if (v) localStorage.setItem("mk-" + k, v); }, prefs);
    await page.reload();
  }
  if (extra) await extra(page);
};

test("Light mode, with High contrast on (default) and off, has no violations at all, contrast included", async () => {
  for (const prefs of [{ theme: "light", contrast: null }, { theme: "light", contrast: "normal" }]) {
    for (const viewport of [{ width: 1440, height: 900 }, { width: 375, height: 812 }]) {
      const found = await audit({ viewport }, withPrefs(prefs, async (page) => {
        if (viewport.width < 700 && (await page.isVisible(".menu-btn[data-js]"))) await page.click(".menu-btn[data-js]");
      }));
      assert.deepEqual(found, {}, `${JSON.stringify(prefs)} @${viewport.width}`);
    }
  }
});

test("with High contrast switched off, the only finding is the softer greys' contrast", async () => {
  const found = await audit({ viewport: { width: 1440, height: 900 } }, withPrefs({ theme: null, contrast: "normal" }));
  assert.deepEqual(Object.keys(found).filter((id) => id !== PALETTE_CONTRAST), []);
});
