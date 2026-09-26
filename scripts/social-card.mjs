/*
 * Renders the 1200×630 link-preview image (Open Graph) from the profile, in the site's own
 * type and colours: name, role, core skills, location, and the five-step path every project
 * on the site follows. Text only; no invented figures, and no web address, so the same image
 * works on any host. Run after changing the profile:
 *
 *   npm run social
 *
 * Writes src/static/social.png. Needs a local Edge or Chrome (BROWSER_CHANNEL to choose).
 */
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import { content } from "../src/content/index.js";

const root = (p) => fileURLToPath(new URL("../" + p, import.meta.url));
const font = async (f) => (await readFile(root("src/static/fonts/" + f))).toString("base64");
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const { profile, site } = content;
const steps = site.topology.columns;
const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
@font-face{font-family:A;src:url(data:font/woff2;base64,${await font("archivo-latin.woff2")}) format("woff2");font-weight:300 800;font-stretch:62% 125%}
@font-face{font-family:M;src:url(data:font/woff2;base64,${await font("ibm-plex-mono-400-latin.woff2")}) format("woff2")}
html,body{margin:0;width:1200px;height:630px;background:#0C1013;color:#EDF1F3;font-family:A,sans-serif}
.c{box-sizing:border-box;height:630px;padding:64px 72px;display:grid;grid-template-rows:auto auto 1fr auto;border:1px solid #232E36}
.name{font-size:112px;line-height:.95;letter-spacing:-.035em;font-variation-settings:"wdth" 118,"wght" 760;margin:0}
.role{margin:26px 0 0;font-size:40px;font-variation-settings:"wdth" 104,"wght" 600;color:#D2B172}
.focus{margin:14px 0 0;font-size:25px;color:#A6B2BB;font-variation-settings:"wdth" 96,"wght" 450}
.path{align-self:end;display:grid;grid-template-columns:repeat(${steps.length},1fr);gap:10px;margin-top:40px}
.step{border:1px solid #36444E;padding:12px 14px;font-family:M,monospace;font-size:17px;color:#8A97A0}
.step.gate{border-color:#6B5A33;color:#D2B172;background:#1A1F22}
.foot{display:flex;justify-content:space-between;margin-top:26px;font-family:M,monospace;font-size:19px;color:#8A97A0}
</style></head><body><div class="c">
<h1 class="name">${esc(profile.name)}</h1>
<div><p class="role">${esc(profile.role)}</p><p class="focus">${esc(profile.focus)}</p></div>
<div class="path">${steps.map((s, i) => `<div class="step${i === 3 ? " gate" : ""}">${esc(s)}</div>`).join("")}</div>
<div class="foot"><span>${esc(profile.location)}</span></div>
</div></body></html>`;

const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || "msedge" });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: root("src/static/social.png"), type: "png" });
await browser.close();
console.log("Wrote src/static/social.png");
