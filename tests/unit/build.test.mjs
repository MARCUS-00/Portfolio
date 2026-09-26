import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { content } from "../../src/content/index.js";
import { buildSite, minifyCss } from "../../scripts/lib/build-site.mjs";
import { htmlFiles, auditPage, resolves, exists } from "../helpers.mjs";

async function buildInto(c, base = "/") {
  const dir = await mkdtemp(join(tmpdir(), "portfolio-"));
  const result = await buildSite({ content: c, outDir: dir, base });
  return { dir, result };
}

async function auditSite(dir, base = "/") {
  const problems = [];
  for (const file of await htmlFiles(dir)) {
    const { problems: p, internalRefs } = await auditPage(file, dir);
    problems.push(...p);
    for (const ref of internalRefs) if (!(await resolves(dir, ref, base))) problems.push(`${file}: broken link ${ref}`);
  }
  return problems;
}

test("the real site builds, and every page passes the structural audit", async () => {
  const { dir, result } = await buildInto(content);
  try {
    assert.deepEqual(await auditSite(dir), []);
    const expected = ["", "work/", "experience/", "skills/", "about/", "contact/", "404.html",
      ...content.projects.map((p) => `p/${p.id}/`)];
    for (const p of expected) assert.ok(result.pages.includes(p), `route ${p || "/"} is generated`);
    for (const p of content.projects) {
      for (const s of ["overview", "findings", "method", "decisions", "validation", "evidence"]) assert.ok(result.pages.includes(`p/${p.id}/${s}/`), `${p.id}/${s}`);
    }
    assert.ok(await exists(join(dir, "Manoj_Kumar_Resume.pdf")), "résumé is published");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("core content is in the HTML itself, not injected by script", async () => {
  const { dir } = await buildInto(content);
  try {
    const home = await readFile(join(dir, "index.html"), "utf8");
    for (const s of ["Manoj Kumar", "Data Analyst", "Python", "SQL", "Power BI", "OsteoScan", "Olist", "C3I research",
      "mailto:mailtomanojkumar07@gmail.com", "https://github.com/MARCUS-00", "/Manoj_Kumar_Resume.pdf", "Open to data analyst opportunities"]) {
      assert.ok(home.includes(s), `home contains ${s}`);
    }
    const exp = await readFile(join(dir, "experience", "index.html"), "utf8");
    for (const s of ["Research intern", "C3I, PES University", "Jan — May 2026", "Completed July 2026", "Dayananda Sagar Institute of Technology"]) assert.ok(exp.replace(/\u00a0/g, " ").includes(s), s);
    const li = "https://www.linkedin.com/in/manoj-kumar-analytics";
    const contact = await readFile(join(dir, "contact", "index.html"), "utf8");
    for (const [name, html] of [["home", home], ["contact", contact]]) {
      assert.ok(html.includes(`href="${li}"`), `${name} links the confirmed LinkedIn URL`);
      assert.ok(!/linkedin\.com\/in\/(?!manoj-kumar-analytics)/.test(html), `${name} has no other LinkedIn URL`);
    }
    assert.ok(!/has not been (confirmed|supplied)/.test(contact), "no pending notes once every contact value exists");
    assert.ok(!contact.includes("A résumé file has not been supplied"), "no note for values that exist");
    const olist = await readFile(join(dir, "p", "olist", "index.html"), "utf8");
    for (const s of ["0.2308", "walk-forward", "github.com/MARCUS-00/ecommerce-retention-analytics", "Power BI dashboard"]) assert.ok(olist.includes(s), s);
    /* The dashboard exists; its evidence is a plain, non-clickable placeholder until supplied. */
    const box = olist.match(/<div class="evidence-box">([\s\S]*?)<\/div>/);
    assert.ok(box && box[1].includes("Power BI dashboard — evidence coming soon"), "placeholder in the evidence box");
    assert.ok(!/<a |<img /.test(box[1]), "placeholder is not a link or an image");
    assert.equal((olist.match(/evidence coming soon/g) || []).length, 1, "stated once");
    assert.ok(!/<img /.test(olist), "no stand-in screenshot");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("adjacent text never runs together when read as text (screen readers, reader mode, no CSS)", async () => {
  const { dir } = await buildInto(content);
  try {
    const text = async (p) => (await readFile(join(dir, p), "utf8")).replace(/<script[\s\S]*?<\/script>/g, "").replace(/<[^>]+>/g, "").replace(/ /g, " ");
    const home = await text("index.html");
    for (const s of ["Dental radiographs periapical", "PES University, completed July 2026 Research intern", "Work Experience Skills"]) assert.ok(home.includes(s), s);
    assert.ok((await text("work/index.html")).includes("SQL Python PostgreSQL 16"), "tool tags read as separate words");
    const skills = await text("skills/index.html");
    assert.ok(/SQL Python Power BI Excel/.test(skills), "skills read as separate words");
    const olist = await text("p/olist/index.html");
    assert.ok(olist.includes("Source 99,441 Olist orders nine relational tables"));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("the default production URL is the GitHub Pages user site; SITE_URL can replace or remove it", async () => {
  assert.equal(content.site.url, process.env.SITE_URL ?? "https://marcus-00.github.io");
  const c = structuredClone(content);
  c.site.url = "";
  const { dir } = await buildInto(c);
  try {
    assert.ok(!(await readFile(join(dir, "index.html"), "utf8")).includes('rel="canonical"'));
    assert.ok(!(await exists(join(dir, "sitemap.xml"))));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("a configured social image and verification tokens produce the right tags; a missing image fails the build", async () => {
  const c = structuredClone(content);
  c.site.socialImage = "/favicon.svg";
  c.site.socialImageAlt = "Preview";
  c.site.verification = { google: "g-token", bing: "b-token" };
  const { dir } = await buildInto(c);
  try {
    const home = await readFile(join(dir, "index.html"), "utf8");
    assert.ok(home.includes(`<meta property="og:image" content="${c.site.url}/favicon.svg">`));
    assert.ok(home.includes('<meta name="twitter:card" content="summary_large_image">'));
    assert.ok(home.includes('<meta name="google-site-verification" content="g-token">'));
    assert.ok(home.includes('<meta name="msvalidate.01" content="b-token">'));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
  c.site.socialImage = "/missing.png";
  await assert.rejects(buildInto(c), /socialImage/);
});

test("section addresses are canonical to their project and titled by section", async () => {
  const c = structuredClone(content);
  c.site.url = "https://example.test";
  const { dir } = await buildInto(c);
  try {
    const page = await readFile(join(dir, "p", "olist", "validation", "index.html"), "utf8");
    assert.match(page, /<link rel="canonical" href="https:\/\/example\.test\/p\/olist\/">/);
    assert.match(page, /<title>Validation — Olist case study — Manoj Kumar<\/title>/);
    assert.match(page, /data-section="validation"/);
    const sitemap = await readFile(join(dir, "sitemap.xml"), "utf8");
    assert.ok(sitemap.includes("https://example.test/p/olist/"));
    assert.ok(!sitemap.includes("/p/olist/validation/"), "section copies are not in the sitemap");
    assert.ok(!sitemap.includes("404"), "404 is not in the sitemap");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("a sub-path deployment keeps every link inside the base path", async () => {
  const { dir } = await buildInto(content, "/portfolio/");
  try {
    assert.deepEqual(await auditSite(dir, "/portfolio/"), []);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

/* The structure must not assume three projects, or that every optional field is present. */
function variant(n) {
  const base = content.projects;
  const projects = Array.from({ length: n }, (_, i) => {
    const p = structuredClone(base[i % base.length]);
    p.id = `sys-${i + 1}`;
    p.name = `System ${i + 1}`;
    delete p.shortName;
    if (i % 4 === 1) { delete p.decisions; delete p.moment; delete p.facts; }
    if (i % 4 === 2) { delete p.validation; delete p.evidence; delete p.note; p.stack = []; }
    if (i % 4 === 3) { delete p.limits; delete p.validation; delete p.decisions; delete p.evidence; }
    return p;
  });
  const ids = projects.map((p) => p.id);
  const skills = structuredClone(content.skills);
  const experience = structuredClone(content.experience).map((x) => ({ ...x, project: ids[0] }));
  return { ...content, projects, skills, experience };
}

for (const n of [1, 3, 5, 12]) {
  test(`builds cleanly with ${n} project${n > 1 ? "s" : ""}`, async () => {
    const { dir, result } = await buildInto(variant(n));
    try {
      assert.deepEqual(await auditSite(dir), []);
      const home = await readFile(join(dir, "index.html"), "utf8");
      const lanes = (home.match(/class="lane on"/g) || []).length;
      assert.equal(lanes, Math.min(n, 3), "home topology shows at most three featured systems");
      const work = await readFile(join(dir, "work", "index.html"), "utf8");
      assert.equal((work.match(/class="proj"/g) || []).length, n, "work lists every system");
      assert.ok(result.pages.includes(`p/sys-${n}/`));
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
}

test("the CSS minifier preserves values that depend on spaces", () => {
  const out = minifyCss("/* c */ .a { width: calc(100% - 2px); font: 12px \"A B\", sans-serif; }\n@container site (min-width:700px) { .b { c: d } }");
  assert.equal(out, '.a{width: calc(100% - 2px);font: 12px "A B",sans-serif}@container site (min-width:700px){.b{c: d}}');
});

/* ── content architecture: each section keeps its own meaning, and facts agree across pages ── */

const pageText = async (dir, p) => (await readFile(join(dir, p), "utf8"))
  .replace(/<script[\s\S]*?<\/script>|<svg[\s\S]*?<\/svg>/g, "").replace(/<[^>]+>/g, " ")
  .replace(/&#8212;/g, "—").replace(/&amp;/g, "&").replace(/\u00a0/g, " ").replace(/\s+/g, " ");

test("skills are an inventory with no project links", async () => {
  const { dir } = await buildInto(content);
  try {
    const html = await readFile(join(dir, "skills", "index.html"), "utf8");
    const list = html.slice(html.indexOf('id="skillRows"'), html.indexOf("</main>"));
    assert.ok(!/<a /.test(list), "no links inside the inventory");
    for (const p of content.projects) assert.ok(!list.includes(p.name), `no project name (${p.name}) under a skill`);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("skills are an inventory: no empty evidence state, no ratings, and SQL, Python and Power BI are present", async () => {
  const { dir } = await buildInto(content);
  try {
    const skills = await pageText(dir, "skills/index.html");
    assert.ok(!/no system here/i.test(skills));
    assert.ok(!/\d+\s*%|beginner|intermediate|expert|proficien/i.test(skills), "no proficiency claims");
    const home = await pageText(dir, "index.html");
    for (const s of ["Python", "SQL", "Power BI"]) assert.ok(home.includes(s) && skills.includes(s), s);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("experience states responsibility, not project results; education holds only academic facts", () => {
  /* Measured results: the headline moment, stage metrics and the validation reading. Scope (e.g. "40 stocks") may appear. */
  const results = content.projects.flatMap((p) => [p.moment && p.moment.value, p.validation && p.validation.value, ...p.stages.map((s) => s.metric)]).filter(Boolean);
  for (const x of content.experience) for (const r of results) assert.ok(![x.summary, ...(x.did || [])].join(" ").includes(r), `experience repeats project result "${r}"`);
  const allowed = new Set(["qualification", "field", "institution", "location", "dates", "year", "status"]);
  for (const e of content.education) for (const k of Object.keys(e)) assert.ok(allowed.has(k), `education field "${k}"`);
});

test("home, experience and contact state the same role dates and education status", async () => {
  const { dir } = await buildInto(content);
  try {
    const x = content.experience[0], e = content.education[0];
    for (const p of ["index.html", "experience/index.html", "contact/index.html"]) {
      const t = await pageText(dir, p);
      assert.ok(t.includes(x.dates), `${p} gives the role as ${x.dates}`);
      assert.ok(t.includes(e.institution), `${p} names ${e.institution}`);
    }
    assert.ok((await pageText(dir, "contact/index.html")).includes("completed July 2026"));
    assert.ok(!/currently|graduating/i.test(await pageText(dir, "about/index.html")));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("static output works on GitHub Pages and Vercel alike: root paths, .nojekyll, 404 page", async () => {
  const { dir } = await buildInto(content);
  try {
    assert.ok(await exists(join(dir, ".nojekyll")));
    assert.ok(await exists(join(dir, "404.html")));
    const home = await readFile(join(dir, "index.html"), "utf8");
    assert.ok(home.includes('href="/work/"') && home.includes('src="/assets/js/'));
    /* Vercel config may set the build, output, trailing slash and headers, but never rewrites or
       redirects: routes must stay the same plain static paths on every host. */
    const vercel = JSON.parse(await readFile(new URL("../../vercel.json", import.meta.url), "utf8"));
    assert.equal(vercel.outputDirectory, "dist");
    assert.equal(vercel.trailingSlash, true);
    assert.ok(!("rewrites" in vercel) && !("redirects" in vercel) && !("routes" in vercel), "no route rewriting");
    assert.match(vercel.buildCommand, /^SITE_URL=https:\/\/[a-z0-9.-]+ npm run build$/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

/* ── Data Analyst positioning, permanent high contrast, and the skills inventory's wording ── */

test("Data Analyst is the stated role on every surface; nothing stale remains in the output", async () => {
  const { dir } = await buildInto(content);
  try {
    const pages = [];
    const walk = async (d) => { for (const e of await readdir(d, { withFileTypes: true })) {
      if (e.isDirectory()) await walk(join(d, e.name)); else if (e.name.endsWith(".html")) pages.push(join(d, e.name)); } };
    await walk(dir);
    for (const f of pages) {
      const html = await readFile(f, "utf8");
      const text = html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<[^>]+>/g, " ");
      assert.ok(!/software engineer/i.test(html), `${f}: no Software Engineer positioning`);
      assert.ok(!/used in/i.test(text), `${f}: no "used in"`);
      assert.ok(!/data-pref="contrast"|mk-contrast|data-contrast/.test(html), `${f}: no high-contrast control or preference`);
      assert.ok(!/High contrast/.test(text), `${f}: no High contrast label`);
    }
    const home = await readFile(join(dir, "index.html"), "utf8");
    assert.match(home, /<title>Manoj Kumar — Data Analyst<\/title>/);
    assert.match(home, /<p class="role">Data Analyst<\/p>/);
    assert.match(home, /<meta name="description" content="Manoj Kumar, data analyst in Bengaluru\./);
    for (const p of ["about/index.html", "contact/index.html"]) assert.ok((await pageText(dir, p)).includes("data analyst opportunities"), p);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("analyst skills lead the inventory; ML and engineering follow", () => {
  const order = content.skills.map((g) => g.group);
  assert.equal(order[0], "Data analytics and BI");
  assert.deepEqual(content.skills[0].items.slice(0, 4).map((s) => s.name.replace(/ \(.*/, "")), ["SQL", "Python", "Power BI", "Excel"]);
  for (const later of ["Machine learning", "Engineering and tools", "Web"]) assert.ok(order.indexOf(later) > order.indexOf("Statistics and forecasting"), later);
  assert.equal(order.at(-1), "Web", "JavaScript, HTML and CSS do not compete with the analyst stack");
});

test("about has a lead and labelled sections; experience separates who/when from what was done", async () => {
  const { dir } = await buildInto(content);
  try {
    const about = await readFile(join(dir, "about", "index.html"), "utf8");
    assert.ok(about.includes('class="about-lead"'));
    for (const k of content.site.about.sections.map((s) => s.k)) assert.ok(about.includes(`<h2 class="r-k">${k}</h2>`), k);
    const exp = await readFile(join(dir, "experience", "index.html"), "utf8");
    assert.match(exp, /<div class="xp-meta"><h3 class="r-k">Research intern<\/h3>/);
    assert.match(exp, /<h4 class="lbl" id="xp-did-0">What I did<\/h4>/);
    assert.equal((exp.match(/<ul class="did"[^>]*>([\s\S]*?)<\/ul>/)[1].match(/<li>/g) || []).length, content.experience[0].did.length);
    for (const t of ["68-feature", "40 Indian large-cap equities", "10-day", "XGBoost", "LSTM", "FinBERT", "SHAP"]) assert.ok(exp.includes(t), t);
    assert.ok(exp.includes('<span class="chip edu-status">Completed July 2026</span>'));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

/* ── case studies: brief, typed findings, real evidence; structured data; project order ── */

test("Olist leads; every case study separates the brief, what was found, and what it means", async () => {
  assert.deepEqual(content.projects.map((p) => p.id), ["olist", "osteoscan", "c3i"], "the primary analytics project comes first");
  const { dir } = await buildInto(content);
  try {
    const home = await readFile(join(dir, "index.html"), "utf8");
    assert.ok(home.indexOf('id="pp-olist"') < home.indexOf('id="pp-osteoscan"') && home.indexOf('id="pp-osteoscan"') < home.indexOf('id="pp-c3i"'), "home work order");
    for (const p of content.projects) {
      const html = await readFile(join(dir, "p", p.id, "index.html"), "utf8");
      const toc = [...html.matchAll(/data-sec="([a-z]+)">/g)].map((m) => m[1]);
      assert.deepEqual(toc.slice(0, 3), ["overview", "findings", "method"], `${p.id}: brief and conclusions before the method`);
      for (const k of ["Context", "Problem", "Data", "What made it hard", "Approach"]) assert.ok(html.includes(`<dt>${k}</dt>`), `${p.id}: ${k}`);
      const types = [...html.matchAll(/<span class="f-type">([^<]+)<\/span>/g)].map((m) => m[1]);
      assert.ok(types.includes("Finding") && types.includes("Interpretation"), `${p.id}: findings are typed`);
      assert.ok(await exists(join(dir, "p", p.id, "findings", "index.html")), `${p.id}: findings deep link`);
    }
    const olist = await readFile(join(dir, "p", "olist", "index.html"), "utf8");
    assert.ok(/<span class="f-type">Recommendation<\/span>/.test(olist), "olist ends in a recommendation");
    assert.match(olist, /<pre><code class="lang" data-lang="SQL">-- QUESTION: What share of customers ever place more than one delivered order\?/);
    assert.ok(olist.includes("customer_unique_id") && olist.includes("FILTER (WHERE delivered_orders &gt;= 2)"), "the query is shown verbatim, escaped");
    assert.ok(olist.includes('href="https://github.com/MARCUS-00/ecommerce-retention-analytics/blob/main/sql/03_analysis/13_repeat_purchase_rate.sql"'));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("the About page carries ProfilePage structured data built from the same records", async () => {
  const { dir } = await buildInto(content);
  try {
    const about = await readFile(join(dir, "about", "index.html"), "utf8");
    const m = about.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    assert.ok(m, "JSON-LD present");
    const data = JSON.parse(m[1]);
    assert.equal(data["@type"], "ProfilePage");
    assert.equal(data.mainEntity.name, "Manoj Kumar");
    assert.equal(data.mainEntity.jobTitle, "Data Analyst");
    assert.deepEqual(data.mainEntity.sameAs, ["https://github.com/MARCUS-00", "https://www.linkedin.com/in/manoj-kumar-analytics"]);
    assert.equal(data.mainEntity.email, "mailto:mailtomanojkumar07@gmail.com");
    assert.ok(data.mainEntity.knowsAbout.includes("SQL") && data.mainEntity.knowsAbout.includes("Power BI"));
    const home = await readFile(join(dir, "index.html"), "utf8");
    assert.ok(!home.includes("application/ld+json"), "only where it applies");
    assert.match(home, /<section class="section home-contact"[\s\S]*mailto:mailtomanojkumar07@gmail\.com[\s\S]*<\/section>/, "home ends with a way to get in touch");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

/* ── name, Work as the project index, case-study language ── */

test("the site name is Manoj Kumar, and Work, projects and case studies are labelled as such", async () => {
  const { dir } = await buildInto(content);
  try {
    const pages = [];
    const walk = async (d) => { for (const e of await readdir(d, { withFileTypes: true })) {
      if (e.isDirectory()) await walk(join(d, e.name)); else if (e.name.endsWith(".html")) pages.push(join(d, e.name)); } };
    await walk(dir);
    for (const f of pages) {
      const html = await readFile(f, "utf8");
      assert.ok(!/Manoj Kumar G\b/.test(html), `${f}: name without the trailing G`);
      assert.ok(!/Open the system|Next system|Previous system|system path/.test(html), `${f}: no engineering-only labels`);
    }
    const home = await readFile(join(dir, "index.html"), "utf8");
    assert.match(home, /<h1 class="name">Manoj Kumar<\/h1>/);
    assert.match(home, /<h2 id="home-work">Selected work<\/h2>/);
    assert.equal((home.match(/class="prev-item"/g) || []).length, 3, "home previews the three projects");
    assert.ok(!home.includes('class="proj"'), "home does not repeat the Work page's full cards");
    assert.equal((home.match(/>View case study</g) || []).length, 3);
    const work = await readFile(join(dir, "work", "index.html"), "utf8");
    assert.ok(work.includes(`<p class="page-lead">${content.site.work.lead}</p>`));
    assert.deepEqual([...work.matchAll(/id="pt-([a-z0-9]+)"/g)].map((m) => m[1]), ["olist", "osteoscan", "c3i"]);
    assert.equal((work.match(/>View case study</g) || []).length, 3);
    const olist = await readFile(join(dir, "p", "olist", "index.html"), "utf8");
    assert.match(olist, /<title>Olist case study — Manoj Kumar<\/title>/);
    assert.match(olist, /<p class="proj-kind">Case study · Data analytics · BI · forecasting<\/p>/);
    assert.match(olist, /rel="next">Next case study: OsteoScan</);
    const exits = (html) => [...html.match(/<nav class="case-exit"[\s\S]*?<\/nav>/)[0].matchAll(/>([^<]+)<\/a>/g)].map((m) => m[1]);
    assert.deepEqual(exits(olist), ["Back to work", "Next case study: OsteoScan", "Get in touch"]);
    assert.deepEqual(exits(await readFile(join(dir, "p", "osteoscan", "index.html"), "utf8")), ["Previous case study: Olist", "Next case study: C3I research", "Get in touch"]);
    assert.deepEqual(exits(await readFile(join(dir, "p", "c3i", "index.html"), "utf8")), ["Previous case study: OsteoScan", "Back to work", "Get in touch"]);
    assert.ok(work.includes('<span class="cap">Each project opens to its full case study.</span>'));
    const skillsPage = await readFile(join(dir, "skills", "index.html"), "utf8");
    assert.ok(skillsPage.includes('<span class="cap">Tools and analytical methods, grouped by kind.</span>'));
    const exp = await readFile(join(dir, "experience", "index.html"), "utf8");
    assert.ok(exp.includes(">Read the C3I case study<"));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("every indexable page has its own description, and link previews carry the share image", async () => {
  const { dir } = await buildInto(content);
  try {
    const seen = new Map();
    for (const p of ["index.html", "work/index.html", "experience/index.html", "skills/index.html", "about/index.html", "contact/index.html",
      ...content.projects.map((x) => `p/${x.id}/index.html`)]) {
      const html = await readFile(join(dir, p), "utf8");
      const d = (html.match(/<meta name="description" content="([^"]+)">/) || [])[1];
      assert.ok(d && d.length >= 50 && d.length <= 200, `${p}: description length ${d && d.length}`);
      assert.ok(!seen.has(d), `${p} repeats the description of ${seen.get(d)}`);
      seen.set(d, p);
      assert.match(html, /<meta property="og:image" content="https:\/\/marcus-00\.github\.io\/social\.png">/);
      assert.match(html, /<meta name="twitter:card" content="summary_large_image">/);
    }
    assert.ok(await exists(join(dir, "social.png")));
    const exp = await readFile(join(dir, "experience", "index.html"), "utf8");
    assert.ok(exp.includes("(completed July 2026)"), "description keeps proper nouns");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("the Olist headline figure is a real table of documented values, with bars only as decoration", async () => {
  const { dir } = await buildInto(content);
  try {
    const olist = await readFile(join(dir, "p", "olist", "findings", "index.html"), "utf8");
    const fig = olist.match(/<figure class="chart">[\s\S]*?<\/figure>/)[0];
    assert.match(fig, /<th scope="col">Delivery<\/th><th scope="col">Rated 1–2 stars<\/th><th scope="col">Reviewed orders<\/th>/);
    assert.match(fig, /<th scope="row">On time<\/th>[\s\S]*?9\.2%[\s\S]*?88,163/);
    assert.match(fig, /<th scope="row">Late<\/th>[\s\S]*?54\.1%[\s\S]*?7,661/);
    assert.equal((fig.match(/<span class="bar" style="--w:[\d.]+" aria-hidden="true">/g) || []).length, 2);
    assert.ok(fig.indexOf("association, not proof of cause") > 0, "the caveat travels with the figure");
    assert.ok(fig.includes("Mann-Whitney U, one-sided, p &lt; 0.001"), "the p-value is the notebook's reported result, as a threshold");
    assert.ok(!/p ≈|p &asymp;/.test(olist), "no approximate p-value");
    const top = await readFile(join(dir, "p", "olist", "index.html"), "utf8");
    assert.match(top, /<p class="case-lede">[^<]*reported through Power BI\.<\/p>/);
    for (const id of ["osteoscan", "c3i"]) assert.ok(!(await readFile(join(dir, "p", id, "index.html"), "utf8")).includes('class="chart"'), `${id} has no chart`);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
