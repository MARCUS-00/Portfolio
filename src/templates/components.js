import { esc, join, routes } from "./util.js";

/* Adjacent inline items are separated by a space so their text never runs together (in screen
   readers, reader modes, or without CSS). Flex and grid containers ignore it, so layout is unchanged. */
const chips = (stack) => stack.map((t) => `<span class="chip">${esc(t)}</span>`).join(" ");

/* ── project compositions: each project draws its system in its own shape ── */

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

/* A project on Home or Work. The whole surface is one link; its accessible name is the title plus "Open the system". */
export function projectCard(p, url, level = 3) {
  const h = `h${level}`;
  return `<a class="proj" href="${url(routes.project(p.id))}" aria-labelledby="pt-${p.id} po-${p.id}">` +
    `<div class="proj-body"><p class="proj-kind">${esc(p.kind)}</p>` +
    `<${h} class="proj-title" id="pt-${p.id}">${esc(p.name)}</${h}>` +
    `<p class="proj-line">${esc(p.line)}</p>` +
    (p.moment ? `<div class="moment"><span class="mv" data-count="${esc(p.moment.value)}">${esc(p.moment.value)}</span> <span class="mc">${esc(p.moment.caption)}</span></div>` : "") +
    `<div class="proj-foot">${chips(p.stack)} <span class="open" id="po-${p.id}">Open the system</span></div></div>` +
    `<div class="proj-viz">${vizHTML(p)}</div></a>`;
}

/* ── home topology: every featured system on the same five columns ── */
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
    `<div class="topo-bar"><span class="lbl">${esc(t.label)}</span> <span class="lane-btns" role="group" aria-label="Follow one system">${buttons}</span></div>` +
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

export function skillRows(skills, projects, url) {
  const byId = Object.fromEntries(projects.map((p) => [p.id, p]));
  return skills.map((g) =>
    `<div class="row"><div><h2 class="r-k">${esc(g.group)}</h2></div><ul class="skill-list">` +
      g.items.map((s) => {
        const proof = (s.proof || []).filter((id) => byId[id]);
        const links = proof.length
          ? proof.map((id) => `<a class="proof" href="${url(routes.project(id))}" data-p="${id}">${esc(byId[id].name)}</a>`).join(' <span class="skill-sep" aria-hidden="true">·</span> ')
          : `<span class="proof" data-t="listed">no system here</span>`;
        return `<li class="skill"${proof.length ? ` data-proj="${proof.join(" ")}"` : ""}>` +
          `<span class="s-n">${esc(s.name)}</span> <span class="skill-sep" aria-hidden="true">&#8212;</span> ${links}</li>`;
      }).join("") +
    `</ul></div>`).join("");
}

/* ── experience / education ── */
export function backgroundGroups(groups, projects, url) {
  const ids = new Set(projects.map((p) => p.id));
  return groups.map((g) =>
    `<h2 class="grp">${esc(g.group)}</h2><div class="rows">` +
      g.items.map((it) => {
        const link = it.link && (it.link.href || (it.link.project && ids.has(it.link.project) && url(routes.project(it.link.project))));
        return `<div class="row"><div><h3 class="r-k">${esc(it.title)}</h3><span class="r-m">${esc(it.dates)}</span><br><span class="r-m">${esc(it.org)}</span></div>` +
          `<div>${join([
            it.body && `<p class="r-b">${esc(it.body)}</p>`,
            link && `<a class="more" href="${link}">${esc(it.link.label)}</a>`,
          ])}</div></div>`;
      }).join("") +
    `</div>`).join("");
}
