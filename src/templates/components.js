import { esc, join, routes, keepTogether } from "./util.js";

/* Adjacent inline items are separated by a space so their text never runs together (in screen
   readers, reader modes, or without CSS). Flex and grid containers ignore it, so layout is unchanged. */
const chips = (stack) => stack.map((t) => `<span class="chip">${esc(t)}</span>`).join(" ");

/* ── project compositions: each project draws its pipeline in its own shape ── */

function vizPipeline(p) {
  return `<div><div class="pipe-head"><span class="lbl">Deployment pipeline</span> <span class="cap">${esc(p.stages[0].k.toLowerCase())} to ${esc(p.stages[p.stages.length - 1].k.toLowerCase())}</span></div>` +
    `<div class="pipeline">${p.stages.map((s) =>
      `<div class="stepbox"${s.gate ? " data-gate" : ""}><span class="sk">${esc(s.k)}</span> <span class="st">${esc(s.t)}</span></div>`).join("")}</div></div>`;
}

function vizStrata(p) {
  return `<div><div class="strata-head"><span class="lbl">Platform layers</span> <span class="cap">source at the top, output at the base</span></div>` +
    `<div class="strata">${p.stages.map((s) =>
      `<div class="stratum"${s.gate ? " data-gate" : ""}><span class="zt">${esc(s.t)}</span> <span class="zk">${esc(s.k)}</span></div>`).join("")}</div></div>`;
}

function vizResearch(p) {
  const node = (s) => `<div class="rnode"${s.gate ? " data-gate" : ""}><span class="rk">${esc(s.k)}</span> <span class="rt">${esc(s.t)}</span></div>`;
  const g = p.stages.findIndex((s) => s.gate);
  return `<div><div class="research-head"><span class="lbl">Research path</span> <span class="cap">inputs to finding</span></div>` +
    `<div class="research">${p.stages.slice(0, g).map(node).join("")}` +
    `<div class="rbranch">${p.stages.slice(g).map(node).join("")}</div></div></div>`;
}

const VIZ = { pipeline: vizPipeline, strata: vizStrata, research: vizResearch };
export const vizHTML = (p) => (VIZ[p.viz] || vizPipeline)(p);

/* A project on the Work page. The whole surface is one link; its accessible name is the title plus "View case study". */
export function projectCard(p, url, level = 3) {
  const h = `h${level}`;
  return `<a class="proj" href="${url(routes.project(p.id))}" aria-labelledby="pt-${p.id} po-${p.id}">` +
    `<div class="proj-body"><p class="proj-kind">${esc(p.kind)}</p>` +
    `<${h} class="proj-title" id="pt-${p.id}">${esc(p.name)}</${h}>` +
    `<p class="proj-line">${esc(p.line)}</p>` +
    (p.moment ? `<div class="moment"><span class="mv" data-count="${esc(p.moment.value)}">${esc(p.moment.value)}</span> <span class="mc">${esc(p.moment.caption)}</span></div>` : "") +
    `<div class="proj-foot">${chips(p.stack)} <span class="open" id="po-${p.id}">View case study</span></div></div>` +
    `<div class="proj-viz">${vizHTML(p)}</div></a>`;
}

/* A compact preview on Home: what it is, its headline number, and the way in. The full card,
   with its diagram and tools, lives on the Work page. */
export function projectPreview(p, url) {
  return `<li class="prev-item"><a class="prev-link" href="${url(routes.project(p.id))}" aria-labelledby="pp-${p.id} ppo-${p.id}">` +
    `<p class="proj-kind">${esc(p.kind)}</p> <h3 class="prev-title" id="pp-${p.id}">${esc(p.name)}</h3> ` +
    (p.moment ? `<p class="prev-moment"><span class="num">${esc(p.moment.value)}</span> <span class="mc">${esc(p.moment.caption)}</span></p> ` : "") +
    `<span class="open" id="ppo-${p.id}">View case study</span></a></li>`;
}

/* ── home topology: every featured project on the same five columns ── */
export function topology(projects, t, url) {
  const lanes = projects.map((p) =>
    `<div class="lane on" id="lane-${p.id}" data-lane="${p.id}">` +
      `<a class="lane-name" href="${url(routes.project(p.id))}">${esc(p.name)}</a>` +
      p.stages.map((s, i) =>
        `<div class="node"${s.gate ? " data-gate" : ""}${i === 0 ? " data-first" : ""} style="--n:${i}">` +
          `<span class="vh">${esc(t.columns[i] || s.k)}: </span>` +
          `<span class="nt">${esc(s.t)}</span>` +
          (s.d ? ` <span class="ns">${esc(s.d)}</span>` : "") +
          (s.metric ? ` <span class="node-metric">${esc(s.metric)}</span>` : "") +
        `</div>`).join("") +
    `</div>`).join("");

  const buttons = projects.map((p) =>
    `<button class="lane-btn" type="button" data-lane="${p.id}" aria-pressed="false" aria-controls="lane-${p.id}"${p.note ? ` data-note="${esc(p.note)}"` : ""}>${esc(p.shortName || p.name)}</button>`).join(" ");

  return `<div class="topo" id="topo">` +
    `<div class="topo-bar"><span class="lbl">${esc(t.label)}</span> <span class="lane-btns" role="group" aria-label="Follow one project">${buttons}</span></div>` +
    `<div class="topo-cols" aria-hidden="true">${t.columns.map((c) => `<span>${esc(c)}</span>`).join("")}</div>` +
    `<div class="lanes">${lanes}</div>` +
    `<div class="topo-foot"><p id="topoNote" aria-live="polite">${esc(t.note)}</p></div>` +
  `</div>`;
}

/* ── validation instrument: a value on a labelled scale ── */
export function instrument(v) {
  return `<figure class="instrument">` +
    `<figcaption class="instrument-h"><span class="lbl">${esc(v.head)}</span>${v.hint ? ` <span class="hint">${esc(v.hint)}</span>` : ""}</figcaption>` +
    `<div class="reading"><div class="reading-top">` +
      `<span class="reading-value" data-count="${esc(v.value)}">${esc(v.value)}${v.suffix ? `<small>${esc(v.suffix)}</small>` : ""}</span>` +
      ` <span class="reading-name">${esc(v.name)}${v.sub ? ` <em>${esc(v.sub)}</em>` : ""}</span></div>` +
      `<div class="scale" role="img" aria-label="${esc(scaleLabel(v))}"><div class="scale-track"></div>` +
        (v.band ? `<div class="scale-band" style="--from:${v.band[0]};--to:${v.band[1]}"></div>` : "") +
        v.ticks.map((t, i) => `<div class="tick" data-kind="${t.kind}"${t.edge ? ` data-edge="${t.edge}"` : ""} style="--at:${t.at};--i:${i}"><span class="tick-label">${esc(t.label)}</span></div>`).join("") +
      `</div><div class="scale-ends" aria-hidden="true"><span>${esc(v.ends[0])}</span> <span>${esc(v.ends[1])}</span></div>` +
      (v.note ? `<p class="reading-note">${esc(v.note)}</p>` : "") +
    `</div></figure>`;
}

/* The scale is drawn with positioned boxes; this is the same information as a sentence. */
function scaleLabel(v) {
  return `Scale from ${v.ends[0]} to ${v.ends[1]}: ` + v.ticks.map((t) => t.label).join(", ") + (v.band ? `; shaded interval ${v.band[0]} to ${v.band[1]}` : "");
}

/* ── skills ── */
export function skillSummaryRows(skills) {
  return skills.map((g) =>
    `<div class="row"><div><h3 class="r-k">${esc(g.group)}</h3></div><p class="r-b">${g.items.map((i) => esc(i.name)).join(", ")}</p></div>`).join("");
}

/* The full inventory: each group's skills as plain names. Skills do not link to projects;
   the case studies show where each was used. */
export function skillRows(skills) {
  return skills.map((g) =>
    `<div class="row"><div><h2 class="r-k">${esc(g.group)}</h2></div><ul class="skill-list">` +
      g.items.map((s) => `<li class="skill"><span class="s-n">${esc(s.name)}</span></li>`).join(" ") +
    `</ul></div>`).join("");
}

/*
 * Experience: who, where and when on the left; what the role involved on the right, as
 * short bullets. Project results stay on the project page, which the entry links to.
 */
export function experienceRows(experience, projects, url) {
  const byId = Object.fromEntries(projects.map((p) => [p.id, p]));
  return `<div class="rows">` + experience.map((x, i) => {
    const p = x.project && byId[x.project];
    const did = x.did && x.did.length;
    return `<div class="row xp-row"><div class="xp-meta"><h3 class="r-k">${esc(x.role)}</h3> <span class="r-org">${esc(x.org)}</span> ` +
      `<span class="r-m">${esc(keepTogether(x.dates))}${x.location ? ` · ${esc(x.location)}` : ""}</span></div>` +
      `<div class="xp-body">${join([
        x.summary && `<p class="r-b">${esc(x.summary)}</p>`,
        did && `<h4 class="lbl" id="xp-did-${i}">What I did</h4> <ul class="did" aria-labelledby="xp-did-${i}">${x.did.map((d) => `<li>${esc(d)}</li>`).join("")}</ul>`,
        x.tools && x.tools.length && `<div class="proj-foot">${chips(x.tools)}</div>`,
        p && `<a class="more" href="${url(routes.project(p.id))}">Read the ${esc(p.shortName || p.name)} case study</a>`,
      ], " ")}</div></div>`;
  }).join("") + `</div>`;
}

/* Education: qualification on the left; institution, dates and status on the right. Academic facts only. */
export function educationRows(education) {
  return `<div class="rows">` + education.map((e) =>
    `<div class="row edu-row"><div><h3 class="r-k">${esc(e.qualification)}, ${esc(e.field)}</h3></div>` +
    `<div class="edu-body"><span class="r-org">${esc(e.institution)}${e.location ? `, ${esc(e.location)}` : ""}</span> ` +
    `<span class="r-m">${esc(keepTogether(e.dates))}</span>` +
    (e.status ? ` <span class="chip edu-status">${esc(e.status)}</span>` : "") + `</div></div>`).join("") + `</div>`;
}
