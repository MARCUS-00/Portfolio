# Manoj Kumar — portfolio

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
npm run social       # re-render the link-preview image (src/static/social.png) from the profile
```

Build options (environment variables):

| Variable    | Effect |
| ----------- | ------ |
| `SITE_URL`  | Absolute origin for canonical URLs, `og:url`, `sitemap.xml` and `robots.txt`. Defaults to `https://marcus-00.github.io`; set it to a custom domain later, or to an empty string to omit them. |
| `BASE_PATH` | Deploy under a sub-path, e.g. `/portfolio/` for a GitHub Pages project site. Default `/`. |

## Deploying

**Live now (Vercel):** https://portfolio-b2ub.vercel.app, built from `MARCUS-00/Portfolio` on every
push to `main`. `vercel.json` sets the build (`SITE_URL=https://portfolio-b2ub.vercel.app npm run
build`), serves `dist/`, adds trailing slashes, and sets cache and security headers. It has no
rewrites, so routes are the same plain static paths as on any other host.

**Planned (GitHub Pages):** the setup below. The Pages workflow runs only in the
`MARCUS-00/marcus-00.github.io` repository, so it stays idle in `MARCUS-00/Portfolio`.


Target: the GitHub Pages user site **https://marcus-00.github.io/** (repository
`MARCUS-00/marcus-00.github.io`), served from the root, so `BASE_PATH` is `/`.

`.github/workflows/pages.yml` installs, runs the unit tests, builds, and publishes **only
`dist/`** as a Pages artifact. It commits nothing back, so unrelated files in the
repository are untouched. One-time setup: repository Settings → Pages → Source:
**GitHub Actions**. The build writes `.nojekyll`, and `404.html` handles unknown paths. Pages
serves `dir/index.html` for `dir/` and redirects `/work` to `/work/`, so `/p/<slug>/` and
section links load directly.

### Moving the source to `MARCUS-00/marcus-00.github.io` (prepared, not executed)

State checked on 2026-09-26: no repository named `marcus-00.github.io` exists (the name
currently redirects to `MARCUS-00/sample-personal-site`, a 2022 project site), and
`https://marcus-00.github.io/` returns 404. This project's earlier version lives in
`MARCUS-00/Portfolio`, deployed on Vercel. `MARCUS-00/MARCUS-00` is the profile README and must
not be renamed. The steps, in order, once approved:

1. Rename `MARCUS-00/Portfolio` to `marcus-00.github.io` (Settings → General). This keeps its
   history and avoids a duplicate repository; GitHub redirects the old name.
2. In the local checkout:
   `git remote set-url origin https://github.com/MARCUS-00/marcus-00.github.io.git`
3. Commit this source (not `dist/`, which `.gitignore` excludes) and push to `main`.
4. Settings → Pages → Source: **GitHub Actions**. The workflow already builds with
   `SITE_URL=https://marcus-00.github.io` and `BASE_PATH=/`, so canonical URLs, the sitemap and
   asset paths need no change.
5. Disconnect the Vercel project from the repository, or it keeps deploying the old site.
6. Update the repository's website field to `https://marcus-00.github.io/`.

Nothing else in the account needs to change: the other repositories' project sites stay at
`/<repo>/`, and none of their paths collides with this site's routes.

Any other static host works the same way: upload `dist/`. Files under `assets/` have content
hashes in their names, so they can be cached forever.

## Editing content

All content lives in `src/content/`. Pages are rendered from it, so editing
content never means editing markup.

| File            | What it holds |
| --------------- | ------------- |
| `profile.js`    | Name, role, contact links, résumé path. Links appear on every surface automatically. |
| `projects.js`   | Projects in display order. Any number works: the first three featured ones appear in the home topology, and `/work/` lists all. Optional fields simply drop their block. Each case study can carry an `overview` (context, problem, data, what made it hard, approach) and typed `findings` (Finding, Interpretation, Recommendation, Next step). Evidence takes links, a verbatim `code` excerpt from the repository, a supplied `media` capture (image in `src/static/`, with alt text and pixel size), or a plain `pending` note; the Olist Power BI capture goes in `media` when it arrives, replacing its `pending` note. |
| `experience.js` | Professional roles: role, organisation, dates, a one-line summary, what the role involved (`did`, short bullets), tools, and an optional link to the project it produced. No project results here. |
| `education.js`  | Academic records only: qualification, field, institution, dates, completion status. |
| `skills.js`     | The competency inventory, grouped by kind with the data-analysis stack first. Plain names: skills do not link to projects (each case study lists its own tools). No ratings. |
| `site.js`       | Site copy: statement, About (a lead paragraph and labelled sections), topology labels, metadata, `socialImage` (the 1200×630 link-preview PNG, rendered by `npm run social`), and `verification` (Google/Bing meta-tag tokens, unset). |

`npm run build` validates content first, and refuses to build if a project is
missing required fields, or a
featured project doesn't fit the five-column topology.

Every factual claim is sourced from the résumé or the project READMEs on
github.com/MARCUS-00. Keep it that way. `tests/unit/content.test.mjs` guards the
corrections already made.

## Routes

| Path | Page |
| ---- | ---- |
| `/` | Home: hero, project topology, statement, selected work (previews), skills summary, contact |
| `/work/` | Work: the curated project index |
| `/p/<id>/` | A project's case study |
| `/p/<id>/<section>/` | Case study opened at a section (`overview`, `findings`, `method`, `decisions`, `validation`, `evidence`); canonical to `/p/<id>/` |
| `/experience/`, `/skills/`, `/about/`, `/contact/` | Section pages |

The prototype's hash links (`/#/p/olist/validation`) redirect to these paths.

## Display

High contrast is permanent: the colour tokens are the high-contrast set, so secondary text meets
WCAG AA in both themes, with or without JavaScript. There is no control to turn it off.

The default is **Dark**. One toggle, **Light mode**, sits in the header (as an icon, from 700px up)
and in the mobile menu (labelled). A switch to Light is saved in `localStorage` (`mk-theme`) and
applied by the inline boot script before first paint.

## Layout

```
src/content/     data
src/templates/   pure functions: data → HTML (layout, pages, components)
src/styles/      the stylesheet (visual system from the approved prototype)
src/scripts/     progressive enhancement: display, menu, topology, motion, case navigation
src/static/      fonts (self-hosted, OFL), favicon, résumé PDF
scripts/         build, dev and static server
tests/           unit/ (node:test) and e2e/ (playwright-core + axe-core)
```
