/*
 * Static site generator. Content modules in, a deployable folder of plain
 * HTML/CSS/JS out. No framework, no runtime dependencies.
 */
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, rm, writeFile, cp } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { validate } from "../../src/content/index.js";
import { makeUrl, routes } from "../../src/templates/util.js";
import { documentShell } from "../../src/templates/layout.js";
import * as P from "../../src/templates/pages.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const SRC = join(ROOT, "src");

const hash = (buf) => createHash("sha256").update(buf).digest("hex").slice(0, 10);

/* Conservative: drops comments and insignificant whitespace, never touches values. */
export function minifyCss(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ").replace(/\s*([{};,])\s*/g, "$1").replace(/;}/g, "}").trim();
}

/* Every route the site serves, as [output path, page]. Output path "" is the root index. */
export function pagesFor(c, url) {
  const list = [
    [routes.home, P.home(c, url)],
    [routes.work, P.work(c, url)],
    [routes.experience, P.experience(c, url)],
    [routes.skills, P.skills(c, url)],
    [routes.about, P.about(c, url)],
    [routes.contact, P.contact(c, url)],
  ];
  for (const p of c.projects) {
    list.push([routes.project(p.id), P.caseStudy(c, url, p)]);
    /* Section addresses are the same document opened at that section, canonical to the project. */
    for (const s of P.sectionsFor(p)) list.push([routes.section(p.id, s.key), P.caseStudy(c, url, p, s.key)]);
  }
  list.push(["404.html", P.notFound(c, url)]);
  return list;
}

export async function buildSite({ content, outDir, base = "/" }) {
  const errors = validate(content);
  if (errors.length) throw new Error("Content has problems:\n  " + errors.join("\n  "));

  const url = makeUrl(base);
  const social = content.site.socialImage;
  if (social && !(await readFile(join(SRC, "static", social.replace(/^\/+/, ""))).catch(() => null))) {
    throw new Error(`Content has problems:
  site.socialImage "${social}" is not a file in src/static/`);
  }
  await rm(outDir, { recursive: true, force: true });
  await mkdir(join(outDir, "assets", "fonts"), { recursive: true });

  /* Static files: fonts into assets/, everything else at the site root. */
  for (const entry of await readdir(join(SRC, "static"), { withFileTypes: true })) {
    const from = join(SRC, "static", entry.name);
    if (entry.name === "fonts") await cp(from, join(outDir, "assets", "fonts"), { recursive: true });
    else await cp(from, join(outDir, entry.name), { recursive: true });
  }

  /* Stylesheet, content-hashed so it can be cached indefinitely. */
  const css = minifyCss(await readFile(join(SRC, "styles", "site.css"), "utf8"));
  const cssName = `site.${hash(css)}.css`;
  await writeFile(join(outDir, "assets", cssName), css);

  /* Scripts: ES modules importing each other relatively, so the folder is hashed as a unit. */
  const jsFiles = (await readdir(join(SRC, "scripts"))).filter((f) => f.endsWith(".js")).sort();
  const jsSources = await Promise.all(jsFiles.map((f) => readFile(join(SRC, "scripts", f), "utf8")));
  const jsDir = `assets/js/${hash(jsSources.join("\0"))}`;
  await mkdir(join(outDir, jsDir), { recursive: true });
  await Promise.all(jsFiles.map((f, i) => writeFile(join(outDir, jsDir, f), jsSources[i])));

  const assets = {
    css: url(`assets/${cssName}`),
    js: url(`${jsDir}/main.js`),
    modules: jsFiles.filter((f) => f !== "main.js").map((f) => url(`${jsDir}/${f}`)),
    fontPreload: url("assets/fonts/archivo-latin.woff2"),
  };

  const pages = pagesFor(content, url);
  for (const [path, page] of pages) {
    const file = path.endsWith(".html") ? join(outDir, path) : join(outDir, path, "index.html");
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, documentShell({ c: content, url, assets, page }));
  }

  /* Search engines: only canonical pages, and only when the real origin is known. */
  const origin = content.site.url;
  const canonical = pages.filter(([path, pg]) => !pg.noindex && pg.canonical === path).map(([path]) => path);
  if (origin) {
    await writeFile(join(outDir, "sitemap.xml"),
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      canonical.map((p) => `  <url><loc>${origin}${url(p)}</loc></url>`).join("\n") + `\n</urlset>\n`);
  }
  await writeFile(join(outDir, "robots.txt"), `User-agent: *\nAllow: /\n` + (origin ? `Sitemap: ${origin}${url("sitemap.xml")}\n` : ""));

  return { pages: pages.map(([p]) => p), assets };
}
