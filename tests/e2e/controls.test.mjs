/* Previous / Next case studies, the Light mode control, and permanent high contrast. */
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
const theme = (page) => page.evaluate(() => document.documentElement.getAttribute("data-theme"));
const token = (page, name) => page.evaluate((n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(), name);

test("case studies: Back to work at the top, Previous and Next case studies at the bottom", async () => {
  await withPage({ viewport: { width: 390, height: 844 }, hasTouch: true }, async (page) => {
    const order = ["olist", "osteoscan", "c3i"];
    for (const [i, id] of order.entries()) {
      await page.goto(u(`/p/${id}/`));
      assert.equal(await page.getAttribute(".back", "href"), "/work/");
      /* Sequential, in Work order: the first offers Back to work instead of Previous, the last instead of Next. */
      const expected = [i > 0 ? `/p/${order[i - 1]}/` : "/work/", i < order.length - 1 ? `/p/${order[i + 1]}/` : "/work/", "/contact/"];
      assert.deepEqual(await page.$$eval(".case-exit a", (as) => as.map((a) => a.getAttribute("href"))), expected, id);
      assert.equal(await page.$$eval('.case-exit a[rel="prev"]', (a) => a.length), i > 0 ? 1 : 0, `${id}: no wrap-around to the end`);
      assert.equal(await page.$$eval('.case-exit a[rel="next"]', (a) => a.length), i < order.length - 1 ? 1 : 0, `${id}: no wrap-around to the start`);
    }
    /* From a deep link, after a refresh, by touch; browser Back undoes it. */
    await page.goto(u("/p/osteoscan/validation/"));
    await page.reload();
    await page.tap('.case-exit a[rel="prev"]');
    await page.waitForURL(u("/p/olist/"));
    assert.equal((await page.textContent("h1")).trim(), "Olist revenue and retention analytics");
    await page.goBack();
    assert.equal(path(page), "/p/osteoscan/validation/");
    await page.tap(".back");
    await page.waitForURL(u("/work/"));
  });
  await withPage({ viewport: { width: 1440, height: 900 } }, async (page) => {
    await page.goto(u("/p/c3i/"));
    await page.focus('.case-exit a[rel="prev"]');
    assert.equal(await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle), "solid", "visible focus");
    await page.keyboard.press("Enter");
    await page.waitForURL(u("/p/osteoscan/"));
  });
});

test("the default is Dark with high contrast; Light mode by mouse and keyboard is remembered across pages", async () => {
  await withPage({ viewport: { width: 1440, height: 900 } }, async (page) => {
    await page.goto(u("/"));
    const light = '.display-ctl [data-pref="theme"]';
    assert.equal(await page.$$eval(".disp-btn", (b) => b.length), 2, "one control, in the header and in the menu");
    assert.equal(await theme(page), "dark");
    assert.equal(await page.evaluate(() => getComputedStyle(document.body).backgroundColor), "rgb(7, 10, 12)", "dark is the default");
    assert.equal(await token(page, "--text-3"), "#8A97A0", "high-contrast values");
    assert.equal(await page.getAttribute(light, "aria-pressed"), "false");
    assert.equal((await page.textContent(light)).trim(), "Light mode", "accessible name");
    assert.equal(await page.getAttribute(light, "title"), "Light mode", "tooltip for the icon");

    /* Keyboard: switch to Light. High contrast stays. */
    await page.focus(light);
    await page.keyboard.press("Space");
    assert.equal(await page.getAttribute(light, "aria-pressed"), "true");
    assert.equal(await page.evaluate(() => getComputedStyle(document.body).backgroundColor), "rgb(230, 233, 235)");
    assert.equal(await token(page, "--text-3"), "#2E3A42", "light, high contrast");
    assert.equal(await page.getAttribute('meta[name="theme-color"]', "content"), "#F4F5F6");

    await page.click('.nav a[href="/skills/"]');
    await page.waitForURL(u("/skills/"));
    assert.equal(await theme(page), "light", "applied on the next page before scripts run");
    await page.reload();
    assert.equal(await page.getAttribute(light, "aria-pressed"), "true");

    /* Back to Dark by mouse: nothing stored. */
    await page.click(light);
    await page.goto(u("/"));
    assert.equal(await theme(page), "dark");
    assert.equal(await page.evaluate(() => localStorage.length), 0);
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

test("on phones the control sits in the menu, labelled in full, with a comfortable target", async () => {
  await withPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }, async (page) => {
    await page.goto(u("/"));
    assert.ok(!(await page.isVisible(".display-ctl")), "header stays as approved");
    await page.tap(".menu-btn[data-js]");
    assert.deepEqual(await page.$$eval(".drawer-ctl .disp-btn", (b) => b.map((x) => x.textContent.trim())), ["Light mode"]);
    const [w, h] = await page.$eval(".drawer-ctl .disp-btn", (b) => { const r = b.getBoundingClientRect(); return [r.width, r.height]; });
    assert.ok(w >= 44 && h >= 44, `${w}×${h}`);
    await page.tap('.drawer-ctl [data-pref="theme"]');
    assert.equal(await page.getAttribute("html", "data-theme"), "light");
    assert.ok(await page.isVisible("#drawer"), "the menu stays open after changing display");
    await page.keyboard.press("Escape");
    assert.ok(!(await page.isVisible("#drawer")));
  });
});

test("high contrast is permanent: any OS setting, no JavaScript, and old saved preferences all give the same values", async () => {
  for (const contrast of ["no-preference", "more"]) {
    await withPage({ viewport: { width: 1440, height: 900 }, contrast }, async (page) => {
      await page.goto(u("/"));
      assert.equal(await token(page, "--text-3"), "#8A97A0", contrast);
    });
  }
  /* A visitor who switched it off on an earlier version of the site still gets high contrast. */
  await withPage({ viewport: { width: 1440, height: 900 } }, async (page) => {
    await page.goto(u("/"));
    await page.evaluate(() => localStorage.setItem("mk-contrast", "normal"));
    await page.reload();
    assert.equal(await page.getAttribute("html", "data-contrast"), null);
    assert.equal(await token(page, "--text-4"), "#7D8D99");
    assert.equal(await page.$$eval('[data-pref="contrast"]', (b) => b.length), 0, "no control to turn it off");
  });
  const ctx = await env.browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(u("/p/olist/"));
  assert.equal(await token(page, "--text-4"), "#7D8D99");
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

test("every page lays out without overflow in Light mode", async () => {
  await withPage({}, async (page) => {
    await page.goto(u("/"));
    await page.evaluate(() => localStorage.setItem("mk-theme", "light"));
    for (const width of [320, 390, 834, 1024, 1440, 2560]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of ["/", "/p/osteoscan/", "/skills/", "/experience/", "/about/", "/contact/"]) {
        await page.goto(u(route));
        assert.equal(await theme(page), "light");
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), 0, `${route} @${width}`);
      }
    }
  });
});

test("with motion on, the identity and page content are visible from the first paint (nothing waits on a fade)", async () => {
  await withPage({ viewport: { width: 390, height: 844 }, reducedMotion: "no-preference" }, async (page) => {
    const seen = [];
    await page.exposeFunction("__record", (v) => seen.push(v));
    await page.addInitScript(() => {
      document.addEventListener("DOMContentLoaded", () => requestAnimationFrame(() => {
        const o = (s) => { const el = document.querySelector(s); return el ? getComputedStyle(el).opacity : "missing"; };
        window.__record([o(".name"), o(".role"), o(".role-sub"), o(".lede"), o(".view")]);
      }));
    });
    await page.goto(u("/"));
    await page.waitForFunction(() => true);
    await page.waitForTimeout(100);
    assert.deepEqual(seen[0], ["1", "1", "1", "1", "1"]);
  });
});

test("the Olist headline figure keeps its bars proportional from phone to wide screens", async () => {
  for (const width of [320, 390, 1024, 1440]) {
    await withPage({ viewport: { width, height: 900 } }, async (page) => {
      await page.goto(u("/p/olist/findings/"));
      const [onTime, late] = await page.$$eval(".chart .bar", (bars) => bars.map((b) => b.getBoundingClientRect().width));
      const ratio = late / onTime;
      assert.ok(ratio > 4.5 && ratio < 7, `@${width}: late/on-time bar ratio ${ratio.toFixed(2)} should be near 54.1/9.2`);
    });
  }
});

test("short pages end with their content: no stretched gap above the footer on tall screens", async () => {
  await withPage({ viewport: { width: 1920, height: 2400 }, reducedMotion: "reduce" }, async (page) => {
    for (const route of ["/about/", "/experience/", "/contact/", "/404.html"]) {
      await page.goto(u(route));
      const gap = await page.evaluate(() => {
        const sec = document.querySelector("main .section:last-of-type") || document.querySelector("main");
        return document.querySelector(".foot").getBoundingClientRect().top - sec.getBoundingClientRect().bottom;
      });
      assert.ok(gap >= 0 && gap < 2, `${route}: footer follows the last section (gap ${gap}px)`);
    }
  });
});
