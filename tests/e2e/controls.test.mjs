/* Previous / Next systems and the display controls (Light mode, High contrast). */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { start, openPage } from "./browser.mjs";

let env;
before(async () => { env = await start(); });
after(async () => { await env.stop(); });

async function withPage(opts, fn) {
  const errors = [];
  const ctx = await env.browser.newContext(opts);
  const page = await openPage(ctx, errors);
  try { await fn(page); } finally { await ctx.close(); }
  assert.deepEqual(errors, [], "no console errors");
}
const u = (p) => env.origin + p;
const path = (page) => new URL(page.url()).pathname;
const attrs = (page) => page.evaluate(() => [document.documentElement.getAttribute("data-theme"), document.documentElement.getAttribute("data-contrast")]);

test("case studies: Back to work at the top, Previous and Next systems at the bottom", async () => {
  await withPage({ viewport: { width: 390, height: 844 }, hasTouch: true }, async (page) => {
    const order = ["osteoscan", "olist", "c3i"];
    for (const [i, id] of order.entries()) {
      await page.goto(u(`/p/${id}/`));
      assert.equal(await page.getAttribute(".back", "href"), "/work/");
      assert.deepEqual(await page.$$eval(".case-exit a", (as) => as.map((a) => a.getAttribute("href"))),
        [`/p/${order[(i + 2) % 3]}/`, `/p/${order[(i + 1) % 3]}/`, "/contact/"]);
    }
    /* From a deep link, after a refresh, by touch; browser Back undoes it. */
    await page.goto(u("/p/olist/validation/"));
    await page.reload();
    await page.tap('.case-exit a[rel="prev"]');
    await page.waitForURL(u("/p/osteoscan/"));
    assert.equal((await page.textContent("h1")).trim(), "OsteoScan");
    await page.goBack();
    assert.equal(path(page), "/p/olist/validation/");
    await page.tap(".back");
    await page.waitForURL(u("/work/"));
  });
  await withPage({ viewport: { width: 1440, height: 900 } }, async (page) => {
    await page.goto(u("/p/c3i/"));
    await page.focus('.case-exit a[rel="prev"]');
    assert.equal(await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle), "solid", "visible focus");
    await page.keyboard.press("Enter");
    await page.waitForURL(u("/p/olist/"));
  });
});

test("the default is Dark + High contrast; changes by mouse and keyboard are remembered across pages", async () => {
  await withPage({ viewport: { width: 1440, height: 900 } }, async (page) => {
    await page.goto(u("/"));
    const light = '.display-ctl [data-pref="theme"]', hc = '.display-ctl [data-pref="contrast"]';
    const t3 = () => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--text-3").trim());
    assert.deepEqual(await attrs(page), ["dark", null]);
    assert.equal(await page.evaluate(() => getComputedStyle(document.body).backgroundColor), "rgb(7, 10, 12)", "dark is the default");
    assert.equal(await t3(), "#8A97A0", "high-contrast values are the default");
    assert.equal(await page.getAttribute(light, "aria-pressed"), "false");
    assert.equal(await page.getAttribute(hc, "aria-pressed"), "true");
    assert.equal((await page.textContent(light)).trim(), "Light mode", "accessible name");
    assert.equal(await page.getAttribute(light, "title"), "Light mode", "tooltip for the icon");

    /* Keyboard: switch High contrast off. */
    await page.focus(hc);
    await page.keyboard.press("Space");
    assert.equal(await page.getAttribute(hc, "aria-pressed"), "false");
    assert.equal(await t3(), "#74828C", "softer greys only after an explicit choice");

    /* Light mode keeps that High contrast choice. */
    await page.click(light);
    assert.equal(await page.getAttribute(light, "aria-pressed"), "true");
    assert.equal(await page.getAttribute(hc, "aria-pressed"), "false");
    assert.equal(await page.evaluate(() => getComputedStyle(document.body).backgroundColor), "rgb(230, 233, 235)");
    assert.equal(await t3(), "#4F5C66", "light, high contrast off");
    assert.equal(await page.getAttribute('meta[name="theme-color"]', "content"), "#F4F5F6");

    await page.click('.nav a[href="/skills/"]');
    await page.waitForURL(u("/skills/"));
    assert.deepEqual(await attrs(page), ["light", "normal"], "applied on the next page before scripts run");
    await page.reload();
    assert.equal(await page.getAttribute(light, "aria-pressed"), "true");
    assert.equal(await page.getAttribute(hc, "aria-pressed"), "false");

    /* High contrast back on, in light mode. */
    await page.click(hc);
    assert.equal(await t3(), "#2E3A42", "light, high contrast on");
    await page.click(light);
    await page.goto(u("/"));
    assert.deepEqual(await attrs(page), ["dark", null], "back to the default: nothing stored");
    assert.equal(await page.evaluate(() => localStorage.length), 0);
    assert.equal(await t3(), "#8A97A0");
  });
});

test("the choice is applied before first paint, so there is no flash of the other theme", async () => {
  await withPage({ viewport: { width: 1440, height: 900 } }, async (page) => {
    await page.goto(u("/"));
    await page.evaluate(() => localStorage.setItem("mk-theme", "light"));
    const seen = [];
    await page.exposeFunction("__record", (v) => seen.push(v));
    await page.addInitScript(() => {
      document.addEventListener("readystatechange", () => {
        if (document.readyState === "interactive") window.__record(getComputedStyle(document.body).backgroundColor);
      });
    });
    await page.goto(u("/work/"));
    assert.deepEqual(seen, ["rgb(230, 233, 235)"]);
  });
});

test("on phones the controls sit in the menu, labelled in full, with comfortable targets", async () => {
  await withPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }, async (page) => {
    await page.goto(u("/"));
    assert.ok(!(await page.isVisible(".display-ctl")), "header stays as approved");
    await page.tap(".menu-btn[data-js]");
    for (const [pref, label] of [["theme", "Light mode"], ["contrast", "High contrast"]]) {
      const btn = `.drawer-ctl [data-pref="${pref}"]`;
      assert.equal((await page.textContent(btn)).trim(), label);
      const [w, h] = await page.$eval(btn, (b) => { const r = b.getBoundingClientRect(); return [r.width, r.height]; });
      assert.ok(w >= 44 && h >= 44, `${label} ${w}×${h}`);
    }
    await page.tap('.drawer-ctl [data-pref="theme"]');
    assert.equal(await page.getAttribute("html", "data-theme"), "light");
    assert.ok(await page.isVisible("#drawer"), "the menu stays open after changing display");
    await page.keyboard.press("Escape");
    assert.ok(!(await page.isVisible("#drawer")));
  });
});

test("the default is high contrast regardless of OS setting, and without JavaScript", async () => {
  for (const contrast of ["no-preference", "more"]) {
    await withPage({ viewport: { width: 1440, height: 900 }, contrast }, async (page) => {
      await page.goto(u("/"));
      assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--text-3").trim()), "#8A97A0", contrast);
    });
  }
  const ctx = await env.browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(u("/p/olist/"));
  assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--text-4").trim()), "#7D8D99");
  await ctx.close();
});

test("without JavaScript there are no dead controls; with reduced motion switching is instant", async () => {
  const ctx = await env.browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(u("/"));
  assert.ok(!(await page.isVisible(".disp-btn")));
  assert.ok(await page.isVisible(".hdr-link"), "header links remain");
  await page.setViewportSize({ width: 820, height: 900 });
  assert.ok(!(await page.isVisible(".masthead-actions")), "no empty control area at tablet width");
  await ctx.close();
  await withPage({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" }, async (p) => {
    await p.goto(u("/"));
    await p.click('.display-ctl [data-pref="theme"]');
    assert.equal(await p.evaluate(() => document.getAnimations().length), 0);
  });
});

test("every page lays out without overflow or collisions in Light mode and High contrast", async () => {
  await withPage({}, async (page) => {
    await page.goto(u("/"));
    await page.evaluate(() => localStorage.setItem("mk-theme", "light"));
    for (const width of [320, 390, 834, 1024, 1440, 2560]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of ["/", "/p/osteoscan/", "/skills/", "/contact/"]) {
        await page.goto(u(route));
        assert.deepEqual(await attrs(page), ["light", null]);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), 0, `${route} @${width}`);
      }
    }
  });
});
