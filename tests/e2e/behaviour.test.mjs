/* Routing, history, deep links, keyboard, the topology, the menu, and failure modes. */
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
/* Top of an element relative to the bottom of the sticky header. */
const topBelowHeader = (page, sel) => page.$eval(sel, (el) => el.getBoundingClientRect().top - document.querySelector(".masthead").getBoundingClientRect().bottom);

test("every route responds, and unknown addresses get the 404 page", async () => {
  await withPage({}, async (page) => {
    for (const [route, h1] of [["/", "Manoj Kumar"], ["/work/", "Work"], ["/experience/", "Experience and education"], ["/skills/", "Skills"],
      ["/about/", "About"], ["/contact/", "Get in touch"], ["/p/osteoscan/", "OsteoScan"], ["/p/olist/", "Olist revenue and retention analytics"],
      ["/p/c3i/", "Explainable models on financial data"]]) {
      const res = await page.goto(u(route));
      assert.equal(res.status(), 200, route);
      assert.equal((await page.textContent("h1")).trim(), h1, route);
    }
    const work = await page.goto(u("/work"));
    assert.equal(path(page), "/work/", "missing trailing slash redirects");
    assert.equal(work.status(), 200);
  });
  const ctx = await env.browser.newContext();
  const page = await ctx.newPage();
  for (const bad of ["/nope/", "/p/unknown/", "/p/olist/nonsense/"]) {
    const res = await page.goto(u(bad));
    assert.equal(res.status(), 404, bad);
    assert.equal((await page.textContent("h1")).trim(), "Page not found");
    assert.ok(await page.isVisible('a[href="/work/"]'));
  }
  await ctx.close();
});

test("navigation marks the current section and survives back/forward and refresh", async () => {
  await withPage({ viewport: { width: 1440, height: 900 } }, async (page) => {
    await page.goto(u("/"));
    await page.click('.nav a[href="/work/"]');
    await page.waitForURL(u("/work/"));
    assert.equal(await page.getAttribute('.nav a[href="/work/"]', "aria-current"), "page");
    await page.click('.proj[href="/p/olist/"]');
    await page.waitForURL(u("/p/olist/"));
    assert.equal(await page.getAttribute('.nav a[href="/work/"]', "aria-current"), "page", "case studies sit under Work");
    assert.equal(await page.getAttribute("html", "data-dir"), null);
    await page.goBack();
    assert.equal(path(page), "/work/");
    await page.goForward();
    assert.equal(path(page), "/p/olist/");
    await page.click(".back");
    await page.waitForURL(u("/work/"));
    assert.equal(await page.getAttribute("html", "data-dir"), "back", "leaving a case study enters from above");
    await page.reload();
    assert.equal((await page.textContent("h1")).trim(), "Work");
  });
});

test("section deep links open at the section, with history per section", async () => {
  await withPage({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" }, async (page) => {
    await page.goto(u("/p/olist/validation/"));
    await page.waitForFunction(() => document.activeElement && document.activeElement.id === "h-olist-validation");
    const off = await topBelowHeader(page, "#s-olist-validation");
    assert.ok(off >= 0 && off < 40, `section starts just below the header (${off}px)`);
    await page.waitForSelector('.toc a[data-sec="validation"][aria-current="location"]');
    assert.equal(await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle), "none", "no focus ring drawn around the section heading");

    await page.reload();
    await page.waitForFunction(() => document.activeElement && document.activeElement.id === "h-olist-validation");
    assert.ok(Math.abs(await topBelowHeader(page, "#s-olist-validation")) < 40, "refresh keeps the section");

    await page.goto(u("/p/olist/"));
    await page.click('.toc a[data-sec="decisions"]');
    assert.equal(path(page), "/p/olist/decisions/");
    assert.equal(await page.evaluate(() => document.activeElement.id), "h-olist-decisions");
    await page.click('.toc a[data-sec="evidence"]');
    assert.equal(path(page), "/p/olist/evidence/");
    await page.goBack();
    assert.equal(path(page), "/p/olist/decisions/");
    await page.waitForFunction(() => document.activeElement.id === "h-olist-decisions");
    await page.goBack();
    assert.equal(path(page), "/p/olist/");
  });
});

test("prototype hash links redirect to the real addresses", async () => {
  await withPage({}, async (page) => {
    await page.goto(u("/#/p/osteoscan/validation"));
    await page.waitForURL(u("/p/osteoscan/validation/"));
    await page.goto(u("/#/contact"));
    await page.waitForURL(u("/contact/"));
  });
});

test("keyboard: skip link, visible focus, and the topology follows focus", async () => {
  await withPage({ viewport: { width: 1440, height: 900 } }, async (page) => {
    await page.goto(u("/"));
    await page.keyboard.press("Tab");
    assert.equal(await page.evaluate(() => document.activeElement.className), "skip");
    assert.ok(await page.evaluate(() => document.activeElement.getBoundingClientRect().left >= 0), "skip link is shown on focus");
    await page.keyboard.press("Enter");
    await page.keyboard.press("Tab");
    assert.ok(await page.evaluate(() => !!document.activeElement.closest("main")), "focus continues inside main");
    const outline = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
    assert.equal(outline, "solid", "focus is visible");

    await page.focus('.lane-btn[data-lane="olist"]');
    assert.equal(await page.getAttribute("#topo", "data-active"), "olist");
    assert.equal(await page.getAttribute('.lane-btn[data-lane="olist"]', "aria-pressed"), "true");
    assert.match(await page.textContent("#topoNote"), /99,441 orders cleaned/);
    await page.focus('.nav a[href="/work/"]');
    assert.equal(await page.getAttribute("#topo", "data-active"), null, "leaving the topology resets it");
  });
});

test("topology: hover follows a path on wide screens; one lane at a time on phones", async () => {
  await withPage({ viewport: { width: 1440, height: 900 } }, async (page) => {
    await page.goto(u("/"));
    assert.equal(await page.$$eval(".lane.on", (l) => l.length), 3);
    await page.hover('.lane[data-lane="c3i"] .node >> nth=2');
    assert.equal(await page.getAttribute("#topo", "data-active"), "c3i");
    await page.waitForFunction(() => getComputedStyle(document.querySelector('.lane[data-lane="osteoscan"]')).opacity === "0.26");
    await page.mouse.move(5, 5);
    assert.equal(await page.getAttribute("#topo", "data-active"), null);
    await page.click('.lane[data-lane="olist"] .lane-name');
    await page.waitForURL(u("/p/olist/"));
  });
  await withPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }, async (page) => {
    await page.goto(u("/"));
    assert.equal(await page.getAttribute("#topo", "data-active"), "olist", "the primary analytics project shows first");
    assert.deepEqual(await page.$$eval(".lane", (ls) => ls.map((l) => getComputedStyle(l).display)), ["grid", "none", "none"]);
    await page.tap('.lane-btn[data-lane="c3i"]');
    assert.deepEqual(await page.$$eval(".lane", (ls) => ls.map((l) => getComputedStyle(l).display)), ["none", "none", "grid"]);
    assert.equal(await page.$eval('.lane[data-lane="c3i"] .node-metric', (m) => getComputedStyle(m).opacity), "1");
    /* Rotating or resizing across the breakpoint re-applies the right default. */
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForFunction(() => !document.getElementById("topo").hasAttribute("data-active"));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForFunction(() => document.getElementById("topo").getAttribute("data-active") === "olist");
  });
});

test("menu: opens, closes on Escape with focus returned, and navigates", async () => {
  await withPage({ viewport: { width: 390, height: 844 } }, async (page) => {
    await page.goto(u("/"));
    const btn = ".menu-btn[data-js]";
    assert.ok(await page.isVisible(btn));
    assert.ok(!(await page.isVisible('.menu-btn[data-nojs]')));
    assert.ok(!(await page.isVisible("#drawer")));
    await page.click(btn);
    assert.equal(await page.getAttribute(btn, "aria-expanded"), "true");
    assert.ok(await page.isVisible("#drawer"));
    await page.focus('#drawer a[href="/skills/"]');
    await page.keyboard.press("Escape");
    assert.equal(await page.getAttribute(btn, "aria-expanded"), "false");
    assert.equal(await page.evaluate(() => document.activeElement.matches(".menu-btn[data-js]")), true);
    await page.click(btn);
    await page.click('#drawer a[href="/experience/"]');
    await page.waitForURL(u("/experience/"));
    assert.equal(await page.getAttribute("#drawer a[href=\"/experience/\"]", "aria-current"), "page");
    assert.ok(!(await page.isVisible("#drawer")), "drawer starts closed on the new page");
  });
});

test("skills: a plain inventory, with the analyst stack first and nothing to click", async () => {
  await withPage({ viewport: { width: 1440, height: 900 } }, async (page) => {
    await page.goto(u("/skills/"));
    assert.deepEqual((await page.$$eval("#skillRows .r-k", (h) => h.map((x) => x.textContent))).slice(0, 2), ["Data analytics and BI", "SQL and data engineering"]);
    assert.equal(await page.$$eval("#skillRows a", (a) => a.length), 0);
    await page.hover('.skill:has(.s-n:text-is("SQL"))');
    assert.equal(await page.$$eval(".skill", (els) => els.filter((e) => getComputedStyle(e).opacity !== "1").length), 0, "no dimming");
  });
});

test("contact and external links are real and safe", async () => {
  await withPage({}, async (page) => {
    await page.goto(u("/contact/"));
    const links = await page.$$eval(".contact-row a", (as) => as.map((a) => ({ href: a.getAttribute("href"), target: a.target, rel: a.rel, download: a.hasAttribute("download") })));
    assert.deepEqual(links.map((l) => l.href), ["mailto:mailtomanojkumar07@gmail.com", "tel:+919738027546", "https://github.com/MARCUS-00", "https://www.linkedin.com/in/manoj-kumar-analytics", "/Manoj_Kumar_Resume.pdf"]);
    for (const l of links.filter((x) => x.href.startsWith("https://"))) assert.deepEqual([l.target, l.rel], ["_blank", "noopener noreferrer"]);
    assert.ok(links[4].download);
    const pdf = await page.request.get(u("/Manoj_Kumar_Resume.pdf"));
    assert.equal(pdf.status(), 200);
    assert.equal(pdf.headers()["content-type"], "application/pdf");
    assert.ok((await pdf.body()).subarray(0, 5).toString() === "%PDF-");
  });
});

test("without JavaScript every piece of content and navigation still works", async () => {
  const ctx = await env.browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(u("/"));
  assert.equal(await page.$$eval(".lane", (ls) => ls.filter((l) => getComputedStyle(l).display !== "none").length), 3, "all systems visible");
  assert.equal(await page.$eval(".node-metric", (m) => getComputedStyle(m).opacity), "1", "metrics visible");
  assert.ok(!(await page.isVisible(".lane-btn")), "no dead buttons");
  assert.ok(!(await page.isVisible(".menu-btn[data-js]")));
  await page.click(".menu-btn[data-nojs]");
  assert.ok(await page.isVisible("#drawer"), "menu opens without script");
  await page.click('#drawer a[href="/work/"]');
  await page.waitForURL(u("/work/"));
  assert.equal(await page.$$eval(".proj", (p) => p.length), 3);
  await page.goto(u("/p/olist/"));
  await page.click('.toc a[data-sec="validation"]');
  await page.waitForURL(/\/p\/olist\/validation\/#s-olist-validation$/);
  const top = await topBelowHeader(page, "#s-olist-validation");
  assert.ok(Math.abs(top) < 40, `section anchor works without script (${top}px)`);
  for (const text of ["61.5%", "0.2308", "0.54"]) {
    await page.goto(u("/work/"));
    assert.ok((await page.textContent("main")).includes(text));
  }
  await ctx.close();
});

test("reduced motion: nothing animates and final values show immediately", async () => {
  await withPage({ reducedMotion: "reduce", viewport: { width: 1440, height: 900 } }, async (page) => {
    await page.goto(u("/"));
    assert.equal(await page.evaluate(() => document.documentElement.classList.contains("motion")), false);
    assert.equal(await page.evaluate(() => document.getAnimations().length), 0);
    assert.equal(await page.$$eval(".rv", (e) => e.length), 0);
    assert.equal((await page.textContent(".prev-moment .num")).trim(), "0.2308");
    assert.equal(await page.$eval(".ambient", (a) => getComputedStyle(a).display), "none");
    await page.hover('.lane[data-lane="olist"]');
    assert.equal(await page.evaluate(() => document.getAnimations().length), 0, "interaction without animation");
  });
});

test("with motion: reveals and count-ups end at the real values", async () => {
  await withPage({ viewport: { width: 1440, height: 900 } }, async (page) => {
    await page.goto(u("/work/"));
    await page.waitForTimeout(700);
    assert.ok((await page.$$eval(".rv", (e) => e.length)) > 0, "below-the-fold elements wait to reveal");
    /* Read the page the way a visitor does: a screen at a time. */
    for (let y = 0; y < (await page.evaluate(() => document.body.scrollHeight)); y += 450) {
      await page.evaluate((top) => window.scrollTo(0, top), y);
      await page.waitForTimeout(120);
    }
    await page.waitForTimeout(700);
    assert.deepEqual(await page.$$eval(".moment .mv", (els) => els.map((e) => e.textContent)), ["0.2308", "61.5%", "0.54"]);
    assert.equal(await page.$$eval(".rv", (e) => e.length), 0, "everything revealed once seen");
    assert.equal(await page.$$eval(".view .proj-viz, .view .moment", (els) => els.filter((e) => getComputedStyle(e).opacity !== "1").length), 0);
  });
});
