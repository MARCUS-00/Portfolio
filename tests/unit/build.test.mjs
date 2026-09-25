import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
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
      for (const s of ["system", "decisions", "validation", "evidence"]) assert.ok(result.pages.includes(`p/${p.id}/${s}/`), `${p.id}/${s}`);
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
    for (const s of ["Manoj Kumar G", "Software Engineer", "Python", "SQL", "Power BI", "OsteoScan", "Olist", "C3I research",
      "mailto:mailtomanojkumar07@gmail.com", "https://github.com/MARCUS-00", "/Manoj_Kumar_Resume.pdf", "Open to software engineering roles"]) {
      assert.ok(home.includes(s), `home contains ${s}`);
    }
    const exp = await readFile(join(dir, "experience", "index.html"), "utf8");
    for (const s of ["Research intern", "C3I, PES University", "completed in July 2026", "Dayananda Sagar Institute of Technology"]) assert.ok(exp.includes(s), s);
    assert.ok(!/linkedin/i.test(home), "no LinkedIn link while the URL is unconfirmed");
    const contact = await readFile(join(dir, "contact", "index.html"), "utf8");
    assert.ok(contact.includes("A LinkedIn profile link has not been supplied, so it is not linked here."), "pending LinkedIn stated once, on /contact");
    assert.ok(!contact.includes("A résumé file has not been supplied"), "no note for values that exist");
    const olist = await readFile(join(dir, "p", "olist", "index.html"), "utf8");
    for (const s of ["0.2308", "walk-forward", "github.com/MARCUS-00/ecommerce-retention-analytics"]) assert.ok(olist.includes(s), s);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("adjacent text never runs together when read as text (screen readers, reader mode, no CSS)", async () => {
  const { dir } = await buildInto(content);
  try {
    const text = async (p) => (await readFile(join(dir, p), "utf8")).replace(/<script[\s\S]*?<\/script>/g, "").replace(/<[^>]+>/g, "");
    const home = await text("index.html");
    for (const s of ["Dental radiographs periapical", "PES University, 2026 Research intern", "Python TensorFlow", "Work Experience Skills"]) assert.ok(home.includes(s), s);
    const skills = await text("skills/index.html");
    assert.ok(/SQL\s+(—|&#8212;)\s+Olist/.test(skills), "skills");
    const olist = await text("p/olist/index.html");
    assert.ok(olist.includes("Source 99,441 Olist orders nine relational tables"));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("the default production URL is the Vercel deployment; SITE_URL can replace or remove it", async () => {
  assert.equal(content.site.url, process.env.SITE_URL ?? "https://portfolio-b2ub.vercel.app");
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
    assert.match(page, /<title>Validation — Olist — Manoj Kumar G<\/title>/);
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
  const skills = structuredClone(content.skills).map((g) => ({
    ...g, items: g.items.map((s, j) => ({ ...s, proof: s.proof.length ? [ids[j % ids.length]] : [] })),
  }));
  const background = structuredClone(content.background);
  background[0].items[0].link = { project: ids[0], label: "Open the system" };
  return { ...content, projects, skills, background };
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
