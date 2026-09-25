import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative } from "node:path";

export async function htmlFiles(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await htmlFiles(p)));
    else if (e.name.endsWith(".html")) out.push(p);
  }
  return out;
}

export async function exists(p) {
  return !!(await stat(p).catch(() => null));
}

/*
 * Structural audit of one generated page. The markup is our own and regular,
 * so attribute-level regexes are sufficient here; behaviour is covered by the
 * browser tests.
 */
export async function auditPage(file, root) {
  const html = await readFile(file, "utf8");
  const where = relative(root, file);
  const problems = [];
  const text = html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<[^>]+>/g, " ");

  const levels = [...html.matchAll(/<h([1-6])\b/g)].map((m) => Number(m[1]));
  const h1s = levels.filter((l) => l === 1).length;
  if (h1s !== 1) problems.push(`${where}: ${h1s} <h1> elements`);
  levels.reduce((prev, l) => { if (l > prev + 1) problems.push(`${where}: heading jumps from h${prev} to h${l}`); return l; }, 0);

  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dup.length) problems.push(`${where}: duplicate ids ${[...new Set(dup)].join(", ")}`);
  const idSet = new Set(ids);
  for (const m of html.matchAll(/\saria-(?:labelledby|controls|describedby)="([^"]+)"/g)) {
    for (const ref of m[1].split(/\s+/)) if (!idSet.has(ref)) problems.push(`${where}: aria reference to missing id "${ref}"`);
  }

  for (const m of html.matchAll(/<a\b([^>]*)>/g)) {
    const attrs = m[1];
    const href = (/\shref="([^"]*)"/.exec(attrs) || [])[1];
    if (href == null || href === "" || href === "#") problems.push(`${where}: link without a destination: <a${attrs}>`);
    if (/target="_blank"/.test(attrs) && !/rel="noopener noreferrer"/.test(attrs)) problems.push(`${where}: new-tab link without rel=noopener: ${href}`);
    if (/^https?:\/\//.test(href || "") && !/target="_blank"/.test(attrs)) problems.push(`${where}: external link opens in the same tab: ${href}`);
  }

  for (const bad of ["undefined", "NaN", "[object Object]", "null"]) {
    if (new RegExp(`(^|[\\s>])${bad.replace(/[[\]]/g, "\\$&")}([\\s<]|$)`).test(text)) problems.push(`${where}: renders "${bad}"`);
  }
  if (/\sstyle="(?![^"]*--)[^"]*"/.test(html)) problems.push(`${where}: inline style other than custom properties`);
  if (/PLACEHOLDER|TEST-ONLY/.test(html)) problems.push(`${where}: placeholder or test-only text in the deliverable`);

  return { html, problems, internalRefs: [...html.matchAll(/\s(?:href|src)="(\/[^"]*)"/g)].map((m) => m[1]) };
}

/* Resolve a root-relative URL to a file the static host would serve. */
export async function resolves(root, ref, base = "/") {
  const path = decodeURIComponent(ref.split("#")[0].split("?")[0]);
  if (!path.startsWith(base)) return false;
  const rel = path.slice(base.length);
  const target = join(root, rel);
  if (rel === "" || rel.endsWith("/")) return exists(join(target, "index.html"));
  return exists(target);
}
