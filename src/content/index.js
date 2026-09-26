import site from "./site.js";
import profile from "./profile.js";
import projects from "./projects.js";
import experience from "./experience.js";
import education from "./education.js";
import skills from "./skills.js";

/* Separate models for separate meanings: who (profile), where worked (experience),
   what was studied (education), what was built (projects), what is known (skills). */
export const content = { site, profile, projects, experience, education, skills };

/* Five columns in the home topology; a featured project must fill them. */
export const TOPOLOGY_STAGES = 5;
export const GATE_INDEX = 3;
const VIZ = new Set(["pipeline", "strata", "research"]);
const TICK_KINDS = new Set(["ref", "ghost", "value"]);
/* What a finding is: measured, what it means, what to do, or what should come next. */
export const FINDING_TYPES = ["Finding", "Interpretation", "Recommendation", "Next step"];
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/* Featured projects in data order, capped. Hero topology and home Work share this set. */
export function featured(c) {
  return c.projects.filter((p) => p.featured !== false).slice(0, c.site.featuredLimit ?? 3);
}

/*
 * Structural checks. Returns a list of problems; the build refuses to run
 * when it is non-empty, so bad data fails loudly instead of rendering a
 * broken layout.
 */
export function validate(c) {
  const errors = [];
  const err = (where, msg) => errors.push(`${where}: ${msg}`);
  const str = (v) => typeof v === "string" && v.trim() !== "";

  if (!Array.isArray(c.projects) || c.projects.length === 0) err("projects", "at least one project is required");
  const ids = new Set();
  const feat = new Set(featured(c).map((p) => p.id));

  for (const [i, p] of (c.projects || []).entries()) {
    const at = `projects[${i}]${p && p.id ? ` (${p.id})` : ""}`;
    for (const f of ["id", "name", "kind", "title", "lede", "line"]) if (!str(p[f])) err(at, `missing "${f}"`);
    if (str(p.id) && !ID.test(p.id)) err(at, `id "${p.id}" must be lowercase letters, digits and hyphens`);
    if (ids.has(p.id)) err(at, `duplicate id "${p.id}"`);
    ids.add(p.id);
    if (!Array.isArray(p.stack)) err(at, `"stack" must be an array`);
    if (p.viz && !VIZ.has(p.viz)) err(at, `unknown viz "${p.viz}"`);

    const st = p.stages;
    if (!Array.isArray(st) || st.length < 2) {
      err(at, `"stages" needs at least two entries`);
    } else {
      st.forEach((s, j) => { if (!str(s.k) || !str(s.t)) err(`${at}.stages[${j}]`, `needs "k" and "t"`); });
      const gates = st.filter((s) => s.gate).length;
      if (gates > 1) err(at, `only one stage can be the gate`);
      if (p.viz === "research" && (gates !== 1 || !st[st.length - 2].gate)) err(at, `"research" viz branches into two nodes at the gate, so the gate must be the second-to-last stage`);
      if (feat.has(p.id)) {
        if (st.length !== TOPOLOGY_STAGES) err(at, `featured projects need exactly ${TOPOLOGY_STAGES} stages (the home topology has ${TOPOLOGY_STAGES} columns)`);
        else if (!st[GATE_INDEX].gate) err(at, `featured projects need the gate as stage ${GATE_INDEX + 1} (the Validation column)`);
      }
    }

    if (p.moment && (!str(p.moment.value) || !str(p.moment.caption))) err(at, `"moment" needs value and caption`);
    (p.facts || []).forEach((f, j) => { if (!str(f.k) || !str(f.v)) err(`${at}.facts[${j}]`, `needs "k" and "v"`); });
    (p.decisions || []).forEach((d, j) => { if (!str(d.q) || !str(d.a)) err(`${at}.decisions[${j}]`, `needs "q" and "a"`); });
    (p.overview || []).forEach((o, j) => { if (!str(o.k) || !str(o.v)) err(`${at}.overview[${j}]`, `needs "k" and "v"`); });
    if (p.chart) {
      const ch = p.chart;
      if (!str(ch.head) || !Array.isArray(ch.cols) || ch.cols.length < 2 || !Array.isArray(ch.rows) || !ch.rows.length) err(`${at}.chart`, `needs "head", "cols" and "rows"`);
      (ch.rows || []).forEach((r, j) => { if (!str(r.k) || !str(r.label) || !(r.v >= 0 && r.v <= 100)) err(`${at}.chart.rows[${j}]`, `needs "k", "label" and "v" between 0 and 100`); });
    }
    (p.findings || []).forEach((f, j) => {
      if (!FINDING_TYPES.includes(f.type)) err(`${at}.findings[${j}]`, `type must be one of ${FINDING_TYPES.join(", ")}`);
      if (!str(f.t)) err(`${at}.findings[${j}]`, `needs "t"`);
    });

    const v = p.validation;
    if (v) {
      for (const f of ["head", "value", "name"]) if (!str(v[f])) err(`${at}.validation`, `missing "${f}"`);
      if (!Array.isArray(v.ticks) || !v.ticks.length) err(`${at}.validation`, `needs at least one tick`);
      (v.ticks || []).forEach((t, j) => {
        if (!TICK_KINDS.has(t.kind)) err(`${at}.validation.ticks[${j}]`, `unknown kind "${t.kind}"`);
        if (!(t.at >= 0 && t.at <= 100)) err(`${at}.validation.ticks[${j}]`, `"at" is a percentage of the axis, 0–100`);
      });
      if (v.band && !(v.band[0] >= 0 && v.band[1] <= 100 && v.band[0] < v.band[1])) err(`${at}.validation`, `band must be [from, to] within 0–100`);
      if (!Array.isArray(v.ends) || v.ends.length !== 2) err(`${at}.validation`, `"ends" must be [min, max] labels`);
    }

    const ev = p.evidence || {};
    for (const [j, l] of (ev.links || []).entries()) {
      if (!str(l.k) || !str(l.text) || !/^https:\/\//.test(l.href || "")) err(`${at}.evidence.links[${j}]`, `needs k, text and an https href`);
    }
    if ("missing" in ev) err(`${at}.evidence`, `"missing" was renamed "pending"`);
    if (ev.media) {
      const m = ev.media;
      if (!str(m.src) || !str(m.alt)) err(`${at}.evidence.media`, `needs "src" and descriptive "alt" text`);
      if (!(m.width > 0 && m.height > 0)) err(`${at}.evidence.media`, `needs pixel "width" and "height" so the page does not shift while it loads`);
    }
    if (ev.pending && !str(ev.pending.t)) err(`${at}.evidence.pending`, `needs "t"`);
    if (ev.code) {
      for (const f of ["caption", "lang", "code", "text"]) if (!str(ev.code[f])) err(`${at}.evidence.code`, `missing "${f}"`);
      if (!/^https:\/\//.test(ev.code.href || "")) err(`${at}.evidence.code`, `needs an https "href" to the source file`);
    }
  }

  for (const g of c.skills || []) {
    if (!str(g.group)) err("skills", "group without a name");
    for (const s of g.items || []) {
      if (!str(s.name)) err(`skills (${g.group})`, "item without a name");
      /* Skills are an inventory; the case studies carry the evidence. */
      for (const f of ["proof", "usedIn"]) if (f in s) err(`skills (${g.group}) ${s.name}`, `skills do not link to projects ("${f}")`);
    }
  }

  for (const [i, x] of (c.experience || []).entries()) {
    const at = `experience[${i}]`;
    for (const f of ["role", "org", "dates"]) if (!str(x[f])) err(at, `missing "${f}"`);
    if (typeof x.current !== "boolean") err(at, `"current" must be true or false`);
    if (x.project && !ids.has(x.project)) err(at, `project "${x.project}" is not a project id`);
    for (const f of ["did", "tools"]) if (x[f] && (!Array.isArray(x[f]) || !x[f].every(str))) err(at, `"${f}" must be a list of text`);
  }
  for (const [i, e] of (c.education || []).entries()) {
    const at = `education[${i}]`;
    for (const f of ["qualification", "field", "institution", "dates", "year"]) if (!str(e[f])) err(at, `missing "${f}"`);
  }

  const ab = c.site && c.site.about;
  if (ab) {
    if (!str(ab.lead)) err("site.about", `missing "lead"`);
    (ab.sections || []).forEach((s, j) => { if (!str(s.k) || !Array.isArray(s.body) || !s.body.every(str)) err(`site.about.sections[${j}]`, `needs "k" and a "body" list of paragraphs`); });
  }

  const pr = c.profile || {};
  for (const f of ["name", "role"]) if (!str(pr[f])) err("profile", `missing "${f}"`);
  for (const f of ["github", "linkedin"]) if (pr[f] && !/^https:\/\//.test(pr[f])) err("profile", `"${f}" must be an https URL`);
  if (pr.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pr.email)) err("profile", `"email" is not an address`);

  return errors;
}
