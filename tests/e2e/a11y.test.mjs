/* Automated WCAG 2.2 A/AA audit (axe-core) of every page, in the states a visitor can reach. */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { start } from "./browser.mjs";

const AXE = createRequire(import.meta.url).resolve("axe-core/axe.min.js");
const ROUTES = ["/", "/work/", "/experience/", "/skills/", "/about/", "/contact/", "/p/osteoscan/", "/p/olist/", "/p/c3i/", "/404.html"];

/* High contrast is permanent, so every reachable state (Dark, Light) must be clean, contrast included. */

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

test("the default Dark state has no accessibility violations at all", async () => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 375, height: 812 }]) {
    const found = await audit({ viewport }, async (page) => {
      if (viewport.width < 700 && (await page.isVisible(".menu-btn[data-js]"))) await page.click(".menu-btn[data-js]");
    });
    assert.deepEqual(found, {}, `viewport ${viewport.width}`);
  }
});

/* The stored Light mode choice is applied by the boot script, so set it once and reload. */
const inLight = (extra) => async (page) => {
  if (await page.evaluate(() => localStorage.getItem("mk-theme") !== "light")) {
    await page.evaluate(() => localStorage.setItem("mk-theme", "light"));
    await page.reload();
  }
  if (extra) await extra(page);
};

test("Light mode has no violations at all, contrast included", async () => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 375, height: 812 }]) {
    const found = await audit({ viewport }, inLight(async (page) => {
      if (viewport.width < 700 && (await page.isVisible(".menu-btn[data-js]"))) await page.click(".menu-btn[data-js]");
    }));
    assert.deepEqual(found, {}, `light @${viewport.width}`);
  }
});
