import site from "./site.js";
import profile from "./profile.js";
import projects from "./projects.js";
import background from "./background.js";
import skills from "./skills.js";

export const content = { site, profile, projects, background, skills };

/* Five columns in the home topology; a featured project must fill them. */
export const TOPOLOGY_STAGES = 5;
export const GATE_INDEX = 3;
const VIZ = new Set(["pipeline", "strata", "research"]);
const TICK_KINDS = new Set(["ref", "ghost", "value"]);
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

    for (const [j, l] of ((p.evidence && p.evidence.links) || []).entries()) {
      if (!str(l.k) || !str(l.text) || !/^https:\/\//.test(l.href || "")) err(`${at}.evidence.links[${j}]`, `needs k, text and an https href`);
    }
  }

  for (const g of c.skills || []) {
    if (!str(g.group)) err("skills", "group without a name");
    for (const s of g.items || []) {
      if (!str(s.name)) err(`skills (${g.group})`, "item without a name");
      for (const id of s.proof || []) if (!ids.has(id)) err(`skills (${g.group}) ${s.name}`, `proof "${id}" is not a project id`);
    }
  }

  for (const g of c.background || []) {
    if (!str(g.group)) err("background", "group without a name");
    for (const it of g.items || []) {
      const at = `background (${g.group}) ${it.title || "?"}`;
      for (const f of ["title", "org", "dates"]) if (!str(it[f])) err(at, `missing "${f}"`);
      if (it.link && it.link.project && !ids.has(it.link.project)) err(at, `link project "${it.link.project}" is not a project id`);
    }
  }

  const pr = c.profile || {};
  for (const f of ["name", "role"]) if (!str(pr[f])) err("profile", `missing "${f}"`);
  for (const f of ["github", "linkedin"]) if (pr[f] && !/^https:\/\//.test(pr[f])) err("profile", `"${f}" must be an https URL`);
  if (pr.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pr.email)) err("profile", `"email" is not an address`);

  return errors;
}
