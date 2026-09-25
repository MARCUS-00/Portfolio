# Manoj Kumar G — portfolio

A static site generated from content data. Plain HTML, CSS and a few small ES
modules. There are no runtime dependencies and no framework. Every page is
complete without JavaScript, and scripts only enhance it.

## Commands

```bash
npm install          # dev tooling only (browser tests)
npm run dev          # build + serve at http://127.0.0.1:4173, rebuilds on change
npm run build        # production build into dist/
npm test             # content validation + build/structure tests (no browser)
npm run test:e2e     # browser tests via installed Edge/Chrome (BROWSER_CHANNEL=chrome to choose)
npm run check        # both
```

Build options (environment variables):

| Variable    | Effect |
| ----------- | ------ |
| `SITE_URL`  | Absolute origin for canonical URLs, `og:url`, `sitemap.xml` and `robots.txt`. Defaults to `https://portfolio-b2ub.vercel.app`; set it to a custom domain later, or to an empty string to omit them. |
| `BASE_PATH` | Deploy under a sub-path, e.g. `/portfolio/` for a GitHub Pages project site. Default `/`. |

## Deploying

The site deploys to the existing Vercel project (`portfolio-b2ub.vercel.app`). `vercel.json` sets
the build command (`npm run build`), the output folder (`dist`), trailing-slash URLs, long-lived
caching for `assets/` and basic security headers. For any other host, upload `dist/` to any static host (Netlify, Vercel, Cloudflare Pages, GitHub Pages, S3).
The host needs two things, and all of those do both by default:

- serve `dir/index.html` for `dir/`
- serve `404.html` for unknown paths

Files under `assets/` have content hashes in their names, so they can be cached forever.

## Editing content

All content lives in `src/content/`. Pages are rendered from it, so editing
content never means editing markup.

| File            | What it holds |
| --------------- | ------------- |
| `profile.js`    | Name, role, contact links, résumé path. Links appear on every surface automatically. |
| `projects.js`   | Projects in display order. Any number works: the first three featured ones appear in the home topology, and `/work/` lists all. Optional fields simply drop their block. |
| `background.js` | Experience page groups (add certifications, publications, awards etc. as new groups). |
| `skills.js`     | Skills, each linked to the projects that demonstrate it (`proof: []` = listed only). |
| `site.js`       | Site copy: statement, about text, topology labels, metadata, and two ready-but-unset hooks: `socialImage` (a 1200×630 PNG placed in `src/static/`) and `verification` (Google/Bing meta-tag tokens). |

`npm run build` validates content first, and refuses to build if a project is
missing required fields, a skill points at a project that doesn't exist, or a
featured project doesn't fit the five-column topology.

Every factual claim is sourced from the résumé or the project READMEs on
github.com/MARCUS-00. Keep it that way. `tests/unit/content.test.mjs` guards the
corrections already made.

## Routes

| Path | Page |
| ---- | ---- |
| `/` | Home: hero, system topology, statement, featured work, skills summary |
| `/work/` | All projects |
| `/p/<id>/` | Case study |
| `/p/<id>/<section>/` | Case study opened at a section (`system`, `decisions`, `validation`, `evidence`); canonical to `/p/<id>/` |
| `/experience/`, `/skills/`, `/about/`, `/contact/` | Section pages |

The prototype's hash links (`/#/p/olist/validation`) redirect to these paths.

## Display controls

The default is **Dark with High contrast on**: secondary text meets WCAG AA without any setting,
and without JavaScript. Two toggles, **Light mode** and **High contrast**, sit in the header
(as icons, from 700px up) and in the mobile menu (labelled). An explicit change (Light mode on,
High contrast off) is saved in `localStorage` (`mk-theme`, `mk-contrast`) and applied by the
inline boot script before first paint. The two settings are independent, so Light mode keeps the
visitor's High contrast choice. Switching High contrast off restores the prototype's softer greys.

## Layout

```
src/content/     data
src/templates/   pure functions: data → HTML (layout, pages, components)
src/styles/      the stylesheet (visual system from the approved prototype)
src/scripts/     progressive enhancement: menu, topology, skills map, motion, case navigation
src/static/      fonts (self-hosted, OFL), favicon, résumé PDF
scripts/         build, dev and static server
tests/           unit/ (node:test) and e2e/ (playwright-core + axe-core)
```
