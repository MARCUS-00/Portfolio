/* Shared helpers for templates. Templates are pure: content in, HTML string out. */

export function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

/* Join the truthy parts of an HTML list. */
export const join = (parts, sep = "") => parts.filter(Boolean).join(sep);

/* Root-relative URL, honouring a deploy base path such as "/portfolio/". */
export function makeUrl(base = "/") {
  const b = base.endsWith("/") ? base : base + "/";
  return (path = "") => b + String(path).replace(/^\/+/, "");
}

export const routes = {
  home: "",
  work: "work/",
  experience: "experience/",
  skills: "skills/",
  about: "about/",
  contact: "contact/",
  project: (id) => `p/${id}/`,
  section: (id, sec) => `p/${id}/${sec}/`,
};

/* Attributes for links that leave the site. The hidden suffix tells screen-reader users about the new tab. */
export const EXT_ATTRS = ' target="_blank" rel="noopener noreferrer"';
export const EXT_NOTE = '<span class="vh"> (opens in a new tab)</span>';

/*
 * Identity links in display order. Each surface (header, drawer, hero, footer,
 * contact) picks the fields it needs, so adding or removing one here updates
 * every surface.
 */
export function profileLinks(profile, url) {
  const L = [];
  if (profile.email) L.push({ k: "Email", short: "Email", href: "mailto:" + profile.email, text: profile.email, ext: false });
  if (profile.github) L.push({ k: "GitHub", short: "GitHub", href: profile.github, text: profile.github.replace(/^https?:\/\/(www\.)?/, ""), ext: true });
  if (profile.linkedin) L.push({ k: "LinkedIn", short: "LinkedIn", href: profile.linkedin, text: profile.linkedin.replace(/^https?:\/\/(www\.)?/, ""), ext: true });
  if (profile.resume) L.push({ k: "Résumé", short: "Résumé", href: url(profile.resume), text: "Download résumé", ext: false, download: true });
  return L;
}

export function linkAttrs(l) {
  return (l.ext ? EXT_ATTRS : "") + (l.download ? " download" : "");
}
export function linkNote(l) {
  return l.ext ? EXT_NOTE : l.download ? '<span class="vh"> (PDF)</span>' : "";
}
