/* Every route at every width: no horizontal overflow, no header collisions, usable targets, no console errors. */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { start, openPage } from "./browser.mjs";

const ROUTES = ["/", "/work/", "/experience/", "/skills/", "/about/", "/contact/",
  "/p/osteoscan/", "/p/olist/", "/p/c3i/", "/p/olist/validation/", "/does-not-exist/"];
const WIDTHS = [320, 375, 390, 430, 768, 834, 1024, 1280, 1440, 1920, 2560, 3440];

let env;
before(async () => { env = await start(); });
after(async () => { await env.stop(); });

test("no overflow, clipping, collisions or undersized targets at any width", async () => {
  const errors = [];
  const problems = [];
  const ctx = await env.browser.newContext({ reducedMotion: "reduce" });
  const page = await openPage(ctx, errors);
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ROUTES) {
      await page.goto(env.origin + route, { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
      const r = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        const visible = (el) => {
          const cs = getComputedStyle(el);
          return cs.display !== "none" && cs.visibility !== "hidden" && el.getClientRects().length > 0 && !el.closest(".vh, .ambient, [hidden]");
        };
        const out = { overflow: document.documentElement.scrollWidth - vw, beyond: [], collide: [], small: [], clipped: [] };
        for (const el of document.querySelectorAll("body *")) {
          if (!visible(el)) continue;
          const b = el.getBoundingClientRect();
          if (b.width && b.right > vw + 0.5) out.beyond.push(`${el.tagName.toLowerCase()}.${el.className} right=${Math.round(b.right)}`);
          if (el.scrollWidth > el.clientWidth + 1 && ["hidden", "clip"].includes(getComputedStyle(el).overflowX)) out.clipped.push(el.className);
        }
        /* Scale labels are absolutely positioned, so nothing else stops them colliding. */
        for (const scale of document.querySelectorAll(".scale")) {
          if (!visible(scale)) continue;
          const labels = Array.from(scale.parentElement.querySelectorAll(".tick-label, .scale-ends span"));
          const ink = (el) => { const r = document.createRange(); r.selectNodeContents(el); return r.getBoundingClientRect(); };
          for (let i = 0; i < labels.length; i++) for (let j = i + 1; j < labels.length; j++) {
            const a = ink(labels[i]), b = ink(labels[j]);
            const dy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
            if (a.left < b.right && b.left < a.right && dy > 4) out.collide.push(`"${labels[i].textContent}" × "${labels[j].textContent}"`);
          }
          const sr = scale.getBoundingClientRect();
          for (const l of labels) { const r = ink(l); if (r.left < sr.left - 0.5 || r.right > sr.right + 0.5) out.beyond.push(`scale label "${l.textContent}"`); }
        }
        /* The header's parts must never overlap one another. */
        const parts = [".wordmark", ".nav", ".masthead-actions", ".menu-btn[data-js]"].map((s) => document.querySelector(s)).filter((el) => el && visible(el));
        for (let i = 0; i < parts.length; i++) for (let j = i + 1; j < parts.length; j++) {
          const a = parts[i].getBoundingClientRect(), b = parts[j].getBoundingClientRect();
          if (a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom && b.top < a.bottom) out.collide.push(`${parts[i].className} × ${parts[j].className}`);
        }
        /*
         * WCAG 2.5.8 target size (minimum): a target is at least 24×24, or a 24px circle centred on
         * it intersects no other target (nor another undersized target's circle). Links inline in
         * running text are exempt.
         */
        const targets = Array.from(document.querySelectorAll("a, button")).filter((el) => visible(el) && getComputedStyle(el).display !== "inline")
          .map((el) => ({ el, b: el.getBoundingClientRect() }));
        const small = (t) => t.b.width < 24 || t.b.height < 24;
        const centre = (b) => [b.left + b.width / 2, b.top + b.height / 2];
        const distToRect = ([x, y], b) => Math.hypot(Math.max(b.left - x, 0, x - b.right), Math.max(b.top - y, 0, y - b.bottom));
        for (const t of targets.filter(small)) {
          const c = centre(t.b);
          const clash = targets.find((o) => o !== t && !o.el.contains(t.el) && !t.el.contains(o.el) &&
            (small(o) ? Math.hypot(c[0] - centre(o.b)[0], c[1] - centre(o.b)[1]) < 24 : distToRect(c, o.b) < 12));
          if (clash) out.small.push(`${t.el.className || t.el.tagName} ${Math.round(t.b.width)}×${Math.round(t.b.height)} "${t.el.textContent.trim().slice(0, 24)}" crowds "${clash.el.textContent.trim().slice(0, 24)}"`);
        }
        return out;
      });
      const at = `${route} @${width}`;
      if (r.overflow > 0) problems.push(`${at}: horizontal overflow ${r.overflow}px`);
      if (r.beyond.length) problems.push(`${at}: beyond viewport ${r.beyond.slice(0, 4).join("; ")}`);
      if (r.clipped.length) problems.push(`${at}: clipped ${r.clipped.slice(0, 4).join("; ")}`);
      if (r.collide.length) problems.push(`${at}: collision ${r.collide.join("; ")}`);
      if (r.small.length) problems.push(`${at}: small targets ${r.small.slice(0, 4).join("; ")}`);
    }
  }
  await ctx.close();
  assert.deepEqual(problems, []);
  assert.deepEqual(errors.filter((e) => !/does-not-exist.*404/.test(e)), []);
});

test("fonts are self-hosted and load", async () => {
  const ctx = await env.browser.newContext();
  const page = await ctx.newPage();
  const external = [];
  page.on("request", (req) => { if (!req.url().startsWith(env.origin)) external.push(req.url()); });
  await page.goto(env.origin + "/", { waitUntil: "networkidle" });
  const ok = await page.evaluate(async () => { await document.fonts.ready; return [document.fonts.check('700 16px "Archivo"'), document.fonts.check('500 16px "IBM Plex Mono"')]; });
  assert.deepEqual(ok, [true, true]);
  assert.deepEqual(external, [], "the page makes no third-party requests");
  await ctx.close();
});
