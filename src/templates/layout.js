import { esc, routes, profileLinks, linkAttrs, linkNote } from "./util.js";

export const NAV = [
  { key: "work", label: "Work", route: routes.work },
  { key: "experience", label: "Experience", route: routes.experience },
  { key: "skills", label: "Skills", route: routes.skills },
  { key: "about", label: "About", route: routes.about },
  { key: "contact", label: "Contact", route: routes.contact },
];

/*
 * Runs before first paint, inline, so there is no flash of the wrong state:
 *  - redirects the prototype's hash routes (#/p/olist/validation) to real paths
 *  - applies the visitor's saved Light mode / High contrast choice
 *  - marks JS as available (.js) and motion as allowed (.motion)
 *  - .entry on arrival from outside the site (header entrance plays once per visit)
 *  - data-dir="back" when leaving a case study for a top-level page (view enters from above)
 */
function bootScript(base) {
  return `(function(d,w){var h=d.documentElement,l=w.location,m=/^#\\/(.*)$/.exec(l.hash);` +
    `if(m&&l.pathname===${JSON.stringify(base)}){var p=m[1].replace(/\\/+$/,"");l.replace(${JSON.stringify(base)}+(p?p+"/":""));return}` +
    `try{if(localStorage.getItem("mk-theme")==="light")h.setAttribute("data-theme","light");if(localStorage.getItem("mk-contrast")==="normal")h.setAttribute("data-contrast","normal")}catch(e){}` +
    `h.classList.add("js");try{if(!w.matchMedia("(prefers-reduced-motion: reduce)").matches)h.classList.add("motion")}catch(e){}` +
    `var r=null;try{r=d.referrer?new URL(d.referrer):null}catch(e){}` +
    `if(r&&r.origin===l.origin){if(/\\/p\\//.test(r.pathname)&&!/\\/p\\//.test(l.pathname))h.setAttribute("data-dir","back")}else h.classList.add("entry")` +
    `})(document,window);`;
}

/* A large preview card when a social image is configured (it needs the absolute site URL), else a plain one. */
function socialMeta(site, url) {
  if (!site.socialImage || !site.url) return [`<meta name="twitter:card" content="summary">`];
  const img = esc(site.url + url(site.socialImage));
  return [
    `<meta property="og:image" content="${img}">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    site.socialImageAlt ? `<meta property="og:image:alt" content="${esc(site.socialImageAlt)}">` : "",
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:image" content="${img}">`,
  ];
}

export function documentShell({ c, url, assets, page }) {
  const { site, profile } = c;
  const title = page.title ? `${page.title} — ${profile.name}` : site.title;
  const description = page.description || site.description;
  const canonical = site.url && page.canonical != null ? site.url + url(page.canonical) : "";

  const head = [
    `<meta charset="utf-8">`,
    `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`,
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}">`,
    page.noindex ? `<meta name="robots" content="noindex">` : "",
    canonical ? `<link rel="canonical" href="${esc(canonical)}">` : "",
    `<meta property="og:type" content="${page.ogType || "website"}">`,
    `<meta property="og:site_name" content="${esc(profile.name)}">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(description)}">`,
    canonical ? `<meta property="og:url" content="${esc(canonical)}">` : "",
    ...socialMeta(site, url),
    site.verification && site.verification.google ? `<meta name="google-site-verification" content="${esc(site.verification.google)}">` : "",
    site.verification && site.verification.bing ? `<meta name="msvalidate.01" content="${esc(site.verification.bing)}">` : "",
    `<meta name="theme-color" content="#0C1013">`,
    `<meta name="color-scheme" content="dark light">`,
    `<link rel="icon" href="${url("favicon.svg")}" type="image/svg+xml">`,
    `<link rel="preload" href="${assets.fontPreload}" as="font" type="font/woff2" crossorigin>`,
    `<script>${bootScript(url(""))}</script>`,
    `<link rel="stylesheet" href="${assets.css}">`,
    ...assets.modules.map((m) => `<link rel="modulepreload" href="${m}">`),
    `<script type="module" src="${assets.js}"></script>`,
  ].filter(Boolean).join("\n");

  return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
${head}
</head>
<body>
<div class="site">
<div class="ambient" aria-hidden="true"></div>
<a class="skip" href="#main">Skip to content</a>
${masthead(c, url, page.nav)}
<main id="main">
${page.body}
</main>
${footer(c, url)}
</div>
</body>
</html>
`;
}

/* Display controls: Light mode and High contrast, as toggle buttons. Icon-only in the header,
   where space is tight; labelled in full in the mobile menu. Hidden without JavaScript. */
const ICON = {
  theme: '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false"><circle cx="8" cy="8" r="3" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M8 1.2v1.9M8 12.9v1.9M1.2 8h1.9M12.9 8h1.9M3.2 3.2l1.35 1.35M11.45 11.45l1.35 1.35M3.2 12.8l1.35-1.35M11.45 4.55l1.35-1.35" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
  contrast: '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false"><circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M8 1.8a6.2 6.2 0 0 1 0 12.4z" fill="currentColor"/></svg>',
};
/* Pressed state as served matches the default (Dark, High contrast on); the script syncs saved choices. */
const PREFS = [{ key: "theme", label: "Light mode", on: false }, { key: "contrast", label: "High contrast", on: true }];
function displayControls(compact) {
  return PREFS.map((p) => compact
    ? `<button class="disp-btn" type="button" data-pref="${p.key}" aria-pressed="${p.on}" title="${p.label}">${ICON[p.key]}<span class="vh">${p.label}</span></button>`
    : `<button class="disp-btn" type="button" data-pref="${p.key}" aria-pressed="${p.on}">${ICON[p.key]}<span>${p.label}</span></button>`).join(" ");
}

function masthead({ profile }, url, current) {
  const links = profileLinks(profile, url);
  const cur = (key) => (key === current ? ' aria-current="page"' : "");
  const navLinks = NAV.map((n) => `<a href="${url(n.route)}"${cur(n.key)}>${n.label}</a>`).join(" ");
  return `<header class="masthead">
  <div class="masthead-in">
    <a class="wordmark" href="${url(routes.home)}"${current === "home" ? ' aria-current="page"' : ""}>${esc(profile.name)} <span class="loc">${esc(profile.city)}</span></a>
    <nav class="nav" aria-label="Sections">${navLinks}</nav>
    <div class="masthead-actions"><div class="display-ctl" role="group" aria-label="Display">${displayControls(true)}</div> <span class="hdr-more">${links.filter((l) => l.k !== "Email").map((l) =>
      `<a class="hdr-link" href="${l.href}"${linkAttrs(l)}>${esc(l.short)}${linkNote(l)}</a>`).join(" ")} <a class="btn btn-sm" href="${url(routes.contact)}">Get in touch</a></span></div>
    <button class="menu-btn" data-js type="button" aria-expanded="false" aria-controls="drawer">Menu</button>
    <a class="menu-btn" data-nojs href="#drawer">Menu</a>
  </div>
  <div class="drawer" id="drawer"><nav aria-label="Menu">${navLinks} ${links.map((l) =>
    `<a href="${l.href}"${linkAttrs(l)}>${esc(l.short)}${linkNote(l)}</a>`).join(" ")}</nav>
    <div class="drawer-ctl" role="group" aria-label="Display">${displayControls(false)}</div></div>
</header>`;
}

function footer({ profile }, url) {
  const links = profileLinks(profile, url);
  return `<footer class="foot">
  <p>${esc(profile.name)} — ${esc(profile.location)}</p>
  <p>${links.map((l) => `<a href="${l.href}"${linkAttrs(l)}>${esc(l.k === "Email" ? l.text : l.short)}${linkNote(l)}</a>`).join(" · ")}</p>
</footer>`;
}
