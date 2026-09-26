import { esc, join, routes, profileLinks, linkAttrs, linkNote, EXT_ATTRS, EXT_NOTE, keepTogether } from "./util.js";
import { projectCard, projectPreview, topology, instrument, skillSummaryRows, skillRows, experienceRows, educationRows } from "./components.js";
import { featured } from "../content/index.js";

/* Case-study sections in reading order: the brief and the conclusions first, then how the
   method works, the decisions, how it was validated, and the evidence. Each renders only when
   its data exists. */
export const SECTIONS = [
  { key: "overview", label: "Overview", has: (p) => p.overview && p.overview.length },
  { key: "findings", label: "Findings", has: (p) => p.findings && p.findings.length },
  { key: "method", label: "Method", has: (p) => p.stages && p.stages.length },
  { key: "decisions", label: "Decisions", has: (p) => p.decisions && p.decisions.length },
  { key: "validation", label: "Validation", has: (p) => p.validation || p.limits },
  { key: "evidence", label: "Evidence", has: (p) => p.evidence && ((p.evidence.links || []).length || p.evidence.code || p.evidence.media || p.evidence.pending) },
];
export const sectionsFor = (p) => SECTIONS.filter((s) => s.has(p));

/*
 * Short summaries of the latest education and experience, derived from their records so
 * Home and Contact can never disagree with the Experience page. Both keep full dates or the
 * completion status: a bare first-screen "2026" would read as current.
 */
const lowerFirst = (s) => s.charAt(0).toLowerCase() + s.slice(1);
const eduTitle = (e) => `${e.qualification}, ${e.field}`;
const expTitle = (x) => `${x.role}, ${x.org}`;
function heroFacts({ education, experience }) {
  const e = education[0], x = experience[0];
  return [
    e && `<span>${esc(eduTitle(e))}, <b>${esc(e.institution)}, ${esc(keepTogether(e.status ? lowerFirst(e.status) : e.year))}</b></span>`,
    x && `<span>${esc(x.role)}, <b>${esc(x.org)}, ${esc(keepTogether(x.dates))}</b></span>`,
  ];
}

export function home(c, url) {
  const { profile, site, skills } = c;
  const feat = featured(c);
  const links = profileLinks(profile, url);

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
        ...heroFacts(c),
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
    <div class="section-head"><h2 id="home-work">${esc(site.work.home)}</h2><a class="more" href="${url(routes.work)}">All work</a></div>
    <ol class="previews">${feat.map((p) => projectPreview(p, url)).join("")}</ol>
  </section>

  <section class="section" aria-labelledby="home-skills">
    <div class="section-head"><h2 id="home-skills">Skills</h2><a class="more" href="${url(routes.skills)}">Full breakdown</a></div>
    <div class="rows">${skillSummaryRows(skills)}</div>
  </section>

  <section class="section home-contact" aria-labelledby="home-contact">
    <div class="section-head"><h2 id="home-contact">Contact</h2><a class="more" href="${url(routes.contact)}">All contact details</a></div>
    <p class="contact-lead">${esc(profile.contactLead)}</p>
    <div class="actions">${links.filter((l) => l.k !== "GitHub").map((l, i) =>
      `<a class="btn${i === 0 ? " btn-primary" : ""}" href="${l.href}"${linkAttrs(l)}>${esc(l.k === "Email" ? "Email " + l.text : l.text === "Download résumé" ? l.text : l.k)}${linkNote(l)}</a>`).join(" ")}</div>
  </section>
</div>`,
  };
}

/* Page descriptions (search snippets), built from the records so they cannot go stale. */
const listOf = (xs) => xs.length > 1 ? `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}` : xs.join("");
const describe = {
  work: ({ profile, projects }) => `Selected analytical work by ${profile.name}: ${listOf(projects.map((p) => p.name))}, each with its data, method, findings, validation and evidence.`,
  experience: ({ profile, experience, education }) => [
    experience[0] && `${profile.name}'s experience: ${experience[0].role}, ${experience[0].org}, ${experience[0].dates.replace(/ — /g, " to ")}.`,
    education[0] && `Education: ${education[0].qualification}, ${education[0].field}, ${education[0].institution}${education[0].status ? ` (${lowerFirst(education[0].status)})` : ""}.`,
  ].filter(Boolean).join(" "),
  skills: ({ profile, skills }) => `Tools and methods ${profile.name} works with, from ${listOf(skills[0].items.slice(0, 4).map((s) => s.name.replace(/ \(.*/, "")))} to statistics, forecasting and machine learning.`,
  about: ({ profile, education }) => `About ${profile.name}, ${profile.role.toLowerCase()} in ${profile.city}` +
    (education[0] ? ` with a ${education[0].qualification} in ${education[0].field} from ${education[0].institution}` : "") +
    `: the tools, the approach to data quality and validation, and what comes next.`,
  contact: ({ profile }) => `Contact ${profile.name}, ${profile.role.toLowerCase()} in ${profile.location}: email, phone, LinkedIn, GitHub and résumé.`,
};

export function work(c, url) {
  return {
    nav: "work",
    title: "Work",
    description: describe.work(c),
    canonical: routes.work,
    body: `<div class="view">
  <div class="section">
    <div class="section-head"><h1>Work</h1><span class="cap">Each project opens to its full case study.</span></div>
    <p class="page-lead">${esc(c.site.work.lead)}</p>
    <div class="projects">${c.projects.map((p) => projectCard(p, url, 2)).join("")}</div>
  </div>
</div>`,
  };
}

/* A headline figure: a data table whose value cells carry a proportional bar. The numbers are
   text, so nothing depends on seeing the bars. */
function chartHTML(ch) {
  const [c1, c2, c3] = ch.cols;
  return `<figure class="chart"><figcaption class="chart-h"><span class="chart-t">${esc(ch.head)}</span>` +
    (ch.note ? ` <span class="cap">${esc(ch.note)}</span>` : "") + `</figcaption>` +
    `<table class="bars"><thead><tr><th scope="col">${esc(c1)}</th><th scope="col">${esc(c2)}</th>${c3 ? `<th scope="col">${esc(c3)}</th>` : ""}</tr></thead><tbody>` +
    ch.rows.map((r) => `<tr${r.accent ? " data-accent" : ""}><th scope="row">${esc(r.k)}</th>` +
      `<td><span class="bar-cell"><span class="bar" style="--w:${Number(r.v)}" aria-hidden="true"></span> <span class="num">${esc(r.label)}</span></span></td>` +
      (c3 ? `<td class="n">${esc(r.n || "")}</td>` : "") + `</tr>`).join("") +
    `</tbody></table></figure>`;
}

export function caseStudy(c, url, p, section = null) {
  /* Previous and next follow the Work order without wrapping, so the sequence has a clear
     start and end: the first case study offers "Back to work" in place of Previous, the last
     in place of Next. */
  const n = c.projects.length, idx = c.projects.indexOf(p);
  const next = idx < n - 1 ? c.projects[idx + 1] : null;
  const prev = idx > 0 ? c.projects[idx - 1] : null;
  const secs = sectionsFor(p);
  const base = routes.project(p.id);
  const chips = (p.stack || []).map((t) => `<span class="chip">${esc(t)}</span>`).join("");

  const inner = {
    overview: () => `<dl class="brief">${p.overview.map((o) =>
      `<div class="brief-row"><dt>${esc(o.k)}</dt> <dd>${esc(o.v)}</dd></div>`).join("")}</dl>`,
    findings: () => (p.chart ? chartHTML(p.chart) : "") + `<ul class="findings">${p.findings.map((f) =>
      `<li class="finding" data-type="${esc(f.type.toLowerCase().replace(/\s+/g, "-"))}"><span class="f-type">${esc(f.type)}</span> <p class="f-t">${esc(f.t)}</p></li>`).join("")}</ul>`,
    method: () => {
      const first = p.stages[0].k, last = p.stages[p.stages.length - 1].k;
      return `<div class="sysfull"><div class="sysfull-h"><span class="lbl">${esc(p.name)} — pipeline</span> <span class="cap">${esc(first)} to ${esc(last)}</span></div>` +
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
        ev.code && `<figure class="ev-code"><figcaption class="ev-code-h"><span class="cap">${esc(ev.code.caption)}</span> <a class="more" href="${esc(ev.code.href)}"${EXT_ATTRS}>${esc(ev.code.text)}${EXT_NOTE}</a></figcaption>` +
          `<pre><code class="lang" data-lang="${esc(ev.code.lang)}">${esc(ev.code.code)}</code></pre></figure>`,
        ev.media && `<figure class="ev-media"><img src="${url(ev.media.src)}" alt="${esc(ev.media.alt)}" width="${Number(ev.media.width)}" height="${Number(ev.media.height)}" loading="lazy" decoding="async">` +
          (ev.media.caption ? `<figcaption class="cap">${esc(ev.media.caption)}</figcaption>` : "") + `</figure>`,
        ev.pending && `<div class="evidence-box"><span class="t">${esc(ev.pending.t)}</span>${ev.pending.d ? ` <span class="d">${esc(ev.pending.d)}</span>` : ""}</div>`,
      ]);
    },
  };

  const secTitle = section && secs.find((s) => s.key === section);
  return {
    nav: "work",
    title: secTitle ? `${secTitle.label} — ${p.name} case study` : `${p.name} case study`,
    description: p.lede,
    canonical: base,
    ogType: "article",
    body: `<div class="view" data-case="${p.id}" data-base="${url(base)}"${section ? ` data-section="${section}"` : ""}>
  <div class="case-top">
    <a class="back" href="${url(routes.work)}">Back to work</a>
    <p class="proj-kind">Case study · ${esc(p.kind)}</p>
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
    prev ? `<a class="btn" href="${url(routes.project(prev.id))}" rel="prev">Previous case study: ${esc(prev.name)}</a>` : `<a class="btn" href="${url(routes.work)}">Back to work</a>`,
    next ? `<a class="btn" href="${url(routes.project(next.id))}" rel="next">Next case study: ${esc(next.name)}</a>` : (prev ? `<a class="btn" href="${url(routes.work)}">Back to work</a>` : ""),
    `<a class="btn" href="${url(routes.contact)}">Get in touch</a>`,
  ], " ")}</nav>
</div>`,
  };
}

export function experience(c, url) {
  return {
    nav: "experience",
    title: "Experience and education",
    description: describe.experience(c),
    canonical: routes.experience,
    /* One page, two separate records: the heading says so, so visitors looking for
       education find it here, and neither list borrows the other's content. */
    body: `<div class="view">
  <div class="section">
    <div class="section-head"><h1>Experience and education</h1></div>
    <div class="groups">${join([
      c.experience.length && `<h2 class="grp">Experience</h2>${experienceRows(c.experience, c.projects, url)}`,
      c.education.length && `<h2 class="grp">Education</h2>${educationRows(c.education)}`,
    ])}</div>
  </div>
</div>`,
  };
}

export function skills(c, url) {
  return {
    nav: "skills",
    title: "Skills",
    description: describe.skills(c),
    canonical: routes.skills,
    body: `<div class="view">
  <div class="section">
    <div class="section-head"><h1>Skills</h1><span class="cap">Tools and analytical methods, grouped by kind.</span></div>
    <div class="rows" id="skillRows">${skillRows(c.skills)}</div>
  </div>
</div>`,
  };
}

/*
 * ProfilePage structured data for the About page (Google lists "About me" pages as a valid
 * use). Built only from the same records the pages show.
 */
function profileJsonLd({ profile, education, skills, site }, url) {
  const person = {
    "@type": "Person",
    name: profile.name,
    jobTitle: profile.role,
    address: { "@type": "PostalAddress", addressLocality: profile.city, addressCountry: "IN" },
    email: profile.email ? "mailto:" + profile.email : undefined,
    sameAs: [profile.github, profile.linkedin].filter(Boolean),
    alumniOf: [...new Set(education.map((e) => e.institution))].map((name) => ({ "@type": "CollegeOrUniversity", name })),
    knowsAbout: skills.slice(0, 2).flatMap((g) => g.items.map((s) => s.name.replace(/\s*\(.*\)$/, ""))),
  };
  if (site.url) person.url = site.url + url(routes.home);
  return { "@context": "https://schema.org", "@type": "ProfilePage", mainEntity: person };
}

/* About: identity first, then labelled sections in the same two-column rows as the other pages. */
export function about(c, url) {
  const { lead, sections = [] } = c.site.about;
  return {
    nav: "about",
    title: "About",
    description: describe.about(c),
    jsonLd: profileJsonLd(c, url),
    canonical: routes.about,
    body: `<div class="view">
  <div class="section">
    <div class="section-head"><h1>About</h1></div>
    <p class="about-lead">${esc(lead)}</p>
    <div class="rows about-rows">${sections.map((s) =>
      `<div class="row"><div><h2 class="r-k">${esc(s.k)}</h2></div><div>${s.body.map((t) => `<p class="r-b">${esc(t)}</p>`).join(" ")}</div></div>`).join("")}</div>
    <div class="actions">
      <a class="btn btn-primary" href="${url(routes.work)}">See the work</a>
      <a class="btn" href="${url(routes.experience)}">Experience and education</a>
      <a class="btn" href="${url(routes.contact)}">Get in touch</a>
    </div>
  </div>
</div>`,
  };
}

/* Approved content rule: a contact destination without a real value is absent everywhere else and
   stated plainly here, once. With every value set, nothing renders. */
function pendingNotes(profile) {
  return [["github", "A GitHub profile link has not been supplied"], ["linkedin", "A LinkedIn profile link has not been supplied"], ["resume", "A résumé file has not been supplied"]]
    .filter(([key]) => !profile[key])
    .map(([, what]) => `<p class="note">${what}, so it is not linked here.</p>`)
    .join("\n    ");
}

/* Location, latest education and latest role, from the same records the other pages use. */
function contactFacts({ profile, education, experience }) {
  const e = education[0], x = experience[0];
  const status = e && e.status ? ` — ${e.status.charAt(0).toLowerCase()}${e.status.slice(1)}` : "";
  return [
    profile.location && { k: "Based in", v: profile.location },
    e && { k: "Education", v: `${eduTitle(e)}, ${e.institution}${status && keepTogether(status)}` },
    x && { k: x.current ? "Currently" : "Most recent", v: `${expTitle(x)}, ${keepTogether(x.dates)}` },
  ].filter(Boolean);
}

export function contact(c, url) {
  const { profile } = c;
  const links = profileLinks(profile, url);
  return {
    nav: "contact",
    title: "Contact",
    description: describe.contact(c),
    canonical: routes.contact,
    body: `<div class="view">
  <div class="section">
    <div class="section-head"><h1>Get in touch</h1></div>
    <p class="contact-lead">${esc(profile.contactLead)}</p>
    <div class="rows contact-rows">
      ${links.flatMap((l) => l.k === "Email" && profile.phone ? [l, { k: "Phone", href: "tel:" + profile.phone.replace(/[^\d+]/g, ""), text: profile.phone }] : [l]).map((l) => `<div class="contact-row"><span class="k">${esc(l.k)}</span> <a class="v" href="${l.href}"${linkAttrs(l)}>${esc(l.text)}${linkNote(l)}</a></div>`).join("\n      ")}
      ${contactFacts(c).map((f) => `<div class="contact-row"><span class="k">${esc(f.k)}</span> <span class="v">${esc(f.v)}</span></div>`).join("\n      ")}
    </div>
    ${pendingNotes(profile)}
  </div>
</div>`,
  };
}

export function notFound(c, url) {
  return {
    title: "Page not found",
    description: "There is no page at this address.",
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
