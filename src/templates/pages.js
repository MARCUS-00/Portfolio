import { esc, join, routes, profileLinks, linkAttrs, linkNote, EXT_ATTRS, EXT_NOTE } from "./util.js";
import { projectCard, topology, instrument, skillSummaryRows, skillRows, backgroundGroups } from "./components.js";
import { featured } from "../content/index.js";

/* Case-study sections in reading order. Each renders only when its data exists. */
export const SECTIONS = [
  { key: "system", label: "System", has: (p) => p.stages && p.stages.length },
  { key: "decisions", label: "Decisions", has: (p) => p.decisions && p.decisions.length },
  { key: "validation", label: "Validation", has: (p) => p.validation || p.limits },
  { key: "evidence", label: "Evidence", has: (p) => p.evidence && ((p.evidence.links || []).length || p.evidence.missing) },
];
export const sectionsFor = (p) => SECTIONS.filter((s) => s.has(p));

/* "Research intern, [C3I, PES University, 2026]" → text with the bracketed part in <b>. */
const heroMeta = (s) => esc(s).replace(/\[(.+?)\]/g, "<b>$1</b>");

export function home(c, url) {
  const { profile, site, background, skills } = c;
  const feat = featured(c);
  const links = profileLinks(profile, url);
  const heroItems = ["education", "experience"]
    .map((k) => background.flatMap((g) => g.items).find((i) => i.hero === k))
    .filter((i) => i && i.heroText);

  return {
    nav: "home",
    canonical: routes.home,
    body: `<div class="view">
  <div class="hero">
    <div class="hero-top">
      <div class="hero-id">
        <h1 class="name">${esc(profile.name)}</h1>
        <p class="role">${esc(profile.role)}</p>
        <p class="role-sub">${esc(profile.focus)} — ${esc(profile.location)}</p>
        <p class="lede">${esc(profile.lede)}</p>
        <div class="actions">
          <a class="btn btn-primary" href="${url(routes.work)}">See the work</a>
          <a class="btn" href="${url(routes.contact)}">Get in touch</a>
        </div>
      </div>
      <div class="hero-meta">${join([
        ...heroItems.map((i) => `<span>${heroMeta(i.heroText)}</span>`),
        profile.availability && `<span><b>${esc(profile.availability)}</b></span>`,
        links.length && `<span class="hero-links">${links.map((l) => `<a href="${l.href}"${linkAttrs(l)}>${esc(l.short)}${linkNote(l)}</a>`).join(" · ")}</span>`,
      ], " ")}</div>
    </div>
    ${topology(feat, site.topology, url)}
  </div>

  <div class="statement">
    <p>${esc(site.statement.lead)}</p>
    <p class="sub">${esc(site.statement.sub)}</p>
  </div>

  <section class="section" aria-labelledby="home-work">
    <div class="section-head"><h2 id="home-work">Work</h2><a class="more" href="${url(routes.work)}">All work</a></div>
    <div class="projects">${feat.map((p) => projectCard(p, url, 3)).join("")}</div>
  </section>

  <section class="section" aria-labelledby="home-skills">
    <div class="section-head"><h2 id="home-skills">Skills</h2><a class="more" href="${url(routes.skills)}">Full breakdown</a></div>
    <div class="rows">${skillSummaryRows(skills)}</div>
  </section>
</div>`,
  };
}

export function work(c, url) {
  return {
    nav: "work",
    title: "Work",
    canonical: routes.work,
    body: `<div class="view">
  <div class="section">
    <div class="section-head"><h1>Work</h1><span class="cap">Open a system for the engineering detail.</span></div>
    <div class="projects">${c.projects.map((p) => projectCard(p, url, 2)).join("")}</div>
  </div>
</div>`,
  };
}

export function caseStudy(c, url, p, section = null) {
  /* Previous and next cycle through the projects in display order. With two projects both
     would point at the same one, so only "Next" is shown. */
  const n = c.projects.length, idx = c.projects.indexOf(p);
  const next = n > 1 ? c.projects[(idx + 1) % n] : null;
  const prev = n > 2 ? c.projects[(idx - 1 + n) % n] : null;
  const secs = sectionsFor(p);
  const base = routes.project(p.id);
  const chips = (p.stack || []).map((t) => `<span class="chip">${esc(t)}</span>`).join("");

  const inner = {
    system: () => {
      const first = p.stages[0].k, last = p.stages[p.stages.length - 1].k;
      return `<div class="sysfull"><div class="sysfull-h"><span class="lbl">${esc(p.name)} — system path</span> <span class="cap">${esc(first)} to ${esc(last)}</span></div>` +
        `<ol class="sysrows">${p.stages.map((s) =>
          `<li class="sysrow"${s.gate ? " data-gate" : ""}><span class="stage-k">${esc(s.k)}</span> <span class="stage-b">` +
          `<span class="stage-t">${esc(s.t)}</span>` +
          (s.d || s.metric ? ` <span class="stage-d">${esc(s.d || "")}${s.metric ? `${s.d ? " — " : ""}<span class="num">${esc(s.metric)}</span>` : ""}</span>` : "") +
          `</span></li>`).join("")}</ol></div>` +
        (chips ? `<div class="proj-foot">${chips}</div>` : "");
    },
    decisions: () => `<div>${p.decisions.map((d) => `<div class="dec"><h3 class="q">${esc(d.q)}</h3><p class="a">${esc(d.a)}</p></div>`).join("")}</div>`,
    validation: () => join([
      p.validation && p.validation.body && `<p class="body">${esc(p.validation.body)}</p>`,
      p.validation && instrument(p.validation),
      p.limits && `<div class="block"><h3>Limitations</h3><p class="body">${esc(p.limits)}</p></div>`,
    ]),
    evidence: () => {
      const ev = p.evidence;
      return join([
        (ev.links || []).length && `<div class="rows">${ev.links.map((l) =>
          `<div class="row"><div><h3 class="r-k">${esc(l.k)}</h3></div><div><a class="more ev-link" href="${esc(l.href)}"${EXT_ATTRS}>${esc(l.text)}${EXT_NOTE}</a>` +
          (l.note ? `<span class="r-m ev-note">${esc(l.note)}</span>` : "") + `</div></div>`).join("")}</div>`,
        ev.missing && `<div class="evidence-box"><span class="t">${esc(ev.missing.t)}</span>${ev.missing.d ? ` <span class="d">${esc(ev.missing.d)}</span>` : ""}</div>`,
      ]);
    },
  };

  const secTitle = section && secs.find((s) => s.key === section);
  return {
    nav: "work",
    title: secTitle ? `${secTitle.label} — ${p.name}` : p.name,
    description: p.lede,
    canonical: base,
    ogType: "article",
    body: `<div class="view" data-case="${p.id}" data-base="${url(base)}"${section ? ` data-section="${section}"` : ""}>
  <div class="case-top">
    <a class="back" href="${url(routes.work)}">Back to work</a>
    <p class="proj-kind">${esc(p.kind)}</p>
    <h1 class="case-title">${esc(p.title)}</h1>
    <p class="case-lede">${esc(p.lede)}</p>
    ${(p.facts || []).length ? `<dl class="case-facts">${p.facts.map((f) => `<div class="fact"${f.accent ? " data-brass" : ""}><dt class="k">${esc(f.k)}</dt><dd class="v">${esc(f.v)}</dd></div>`).join(" ")}</dl>` : ""}
  </div>
  <div class="case-body">
    ${secs.length > 1 ? `<nav class="toc" aria-label="On this page"><span class="lbl">On this page</span><ol>${secs.map((s) =>
      `<li><a href="${url(routes.section(p.id, s.key))}#s-${p.id}-${s.key}" data-sec="${s.key}">${s.label}</a></li>`).join("")}</ol></nav>` : ""}
    <div class="case-main">${secs.map((s) =>
      `<section class="case-sec" id="s-${p.id}-${s.key}" data-sec="${s.key}" aria-labelledby="h-${p.id}-${s.key}">` +
      `<h2 class="sec-h" id="h-${p.id}-${s.key}" tabindex="-1">${s.label}</h2>${inner[s.key]()}</section>`).join("")}</div>
  </div>
  <nav class="case-exit" aria-label="Continue">${join([
    prev && `<a class="btn" href="${url(routes.project(prev.id))}" rel="prev">Previous system: ${esc(prev.name)}</a>`,
    next ? `<a class="btn" href="${url(routes.project(next.id))}" rel="next">Next system: ${esc(next.name)}</a>` : `<a class="btn" href="${url(routes.work)}">Back to work</a>`,
    `<a class="btn" href="${url(routes.contact)}">Get in touch</a>`,
  ], " ")}</nav>
</div>`,
  };
}

export function experience(c, url) {
  return {
    nav: "experience",
    title: "Experience",
    canonical: routes.experience,
    body: `<div class="view">
  <div class="section">
    <div class="section-head"><h1>Experience</h1></div>
    <div class="groups">${backgroundGroups(c.background, c.projects, url)}</div>
  </div>
</div>`,
  };
}

export function skills(c, url) {
  return {
    nav: "skills",
    title: "Skills",
    canonical: routes.skills,
    body: `<div class="view">
  <div class="section">
    <div class="section-head"><h1>Skills</h1><span class="cap">Each one links to the system where it was used.</span></div>
    <div class="rows" id="skillRows">${skillRows(c.skills, c.projects, url)}</div>
  </div>
</div>`,
  };
}

export function about(c) {
  const [first, ...rest] = c.site.about;
  return {
    nav: "about",
    title: "About",
    canonical: routes.about,
    body: `<div class="view">
  <div class="section">
    <div class="section-head"><h1>About</h1></div>
    <p class="body body-lead">${esc(first)}</p>
    ${rest.map((t) => `<p class="body">${esc(t)}</p>`).join("\n    ")}
  </div>
</div>`,
  };
}

/* Approved content rule: a contact destination without a real value is absent everywhere else and
   stated plainly here, once, in the prototype's wording. */
function pendingNotes(profile) {
  return [["github", "A GitHub profile link"], ["linkedin", "A LinkedIn profile link"], ["resume", "A résumé file"]]
    .filter(([key]) => !profile[key])
    .map(([, what]) => `<p class="note">${what} has not been supplied, so it is not linked here.</p>`)
    .join("\n    ");
}

export function contact(c, url) {
  const { profile, site } = c;
  const links = profileLinks(profile, url);
  return {
    nav: "contact",
    title: "Contact",
    canonical: routes.contact,
    body: `<div class="view">
  <div class="section">
    <div class="section-head"><h1>Get in touch</h1></div>
    <p class="contact-lead">${esc(profile.contactLead)}</p>
    <div class="rows contact-rows">
      ${links.flatMap((l) => l.k === "Email" && profile.phone ? [l, { k: "Phone", href: "tel:" + profile.phone.replace(/[^\d+]/g, ""), text: profile.phone }] : [l]).map((l) => `<div class="contact-row"><span class="k">${esc(l.k)}</span> <a class="v" href="${l.href}"${linkAttrs(l)}>${esc(l.text)}${linkNote(l)}</a></div>`).join("\n      ")}
      ${site.contactFacts.map((f) => `<div class="contact-row"><span class="k">${esc(f.k)}</span> <span class="v">${esc(f.v)}</span></div>`).join("\n      ")}
    </div>
    ${pendingNotes(profile)}
  </div>
</div>`,
  };
}

export function notFound(c, url) {
  return {
    title: "Page not found",
    noindex: true,
    body: `<div class="view">
  <div class="section">
    <div class="section-head"><h1>Page not found</h1></div>
    <p class="body">There is no page at this address. The work, and every way to get in touch, are one click away.</p>
    <div class="actions">
      <a class="btn btn-primary" href="${url(routes.work)}">See the work</a>
      <a class="btn" href="${url(routes.home)}">Home</a>
    </div>
  </div>
</div>`,
  };
}
