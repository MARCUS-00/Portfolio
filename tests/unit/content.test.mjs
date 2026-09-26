import { test } from "node:test";
import assert from "node:assert/strict";
import { content, validate } from "../../src/content/index.js";

const clone = (o) => structuredClone(o);

test("shipped content passes validation", () => {
  assert.deepEqual(validate(content), []);
});

test("validation rejects broken content with a useful message", () => {
  const c = clone(content);
  c.projects[0].stages.pop(); // featured project with four stages
  c.skills[0].items.push({ name: "Rust", usedIn: ["olist"] });
  c.projects[1].id = c.projects[0].id;
  c.experience[0].project = "missing";
  delete c.education[0].institution;
  const errors = validate(c).join("\n");
  assert.match(errors, /exactly 5 stages/);
  assert.match(errors, /skills do not link to projects \("usedIn"\)/);
  assert.match(errors, /education\[0\]: missing "institution"/);
  assert.match(errors, /duplicate id/);
  assert.match(errors, /project "missing" is not a project id/);
});

test("evidence media needs alt text and dimensions; the old 'missing' field is refused", () => {
  const c = clone(content);
  c.projects[1].evidence.media = { src: "/x.png", alt: "" };
  c.projects[2].evidence.missing = { t: "x" };
  const errors = validate(c).join("\n");
  assert.match(errors, /evidence\.media: needs "src" and descriptive "alt"/);
  assert.match(errors, /evidence\.media: needs pixel "width" and "height"/);
  assert.match(errors, /"missing" was renamed "pending"/);
});

test("validation requires the gate in the Validation column for featured projects", () => {
  const c = clone(content);
  c.projects[0].stages[3].gate = false;
  c.projects[0].stages[4].gate = true;
  assert.match(validate(c).join("\n"), /gate as stage 4/);
});

test("skills are plain names: the inventory carries no project links", () => {
  for (const g of content.skills) for (const s of g.items) assert.deepEqual(Object.keys(s), ["name"], `${g.group}: ${s.name}`);
});

/* Facts that were corrected against the résumé and project repositories must not regress. */
test("factual guards", () => {
  const all = JSON.stringify(content);
  assert.doesNotMatch(all, /knee/i, "OsteoScan uses dental radiographs");
  assert.doesNotMatch(all, /single 28-day window/i, "Olist forecast was walk-forward validated");
  assert.doesNotMatch(all, /manojgopinath123|842072286/, "no superseded contact values");
  assert.equal(content.profile.email, "mailtomanojkumar07@gmail.com");
  assert.equal(content.profile.linkedin, "https://www.linkedin.com/in/manoj-kumar-analytics", "confirmed LinkedIn URL");
  assert.doesNotMatch(all, /JB Portals|PES C3I|statsmodels/, "unconfirmed organisation and tool claims stay out");
  /* The dashboard exists, but no capture or URL has been supplied: nothing may stand in for one. */
  const olist = content.projects.find((p) => p.id === "olist");
  assert.equal(olist.evidence.pending.t, "Power BI dashboard — evidence coming soon");
  assert.ok(!olist.evidence.media, "no dashboard image until the real capture is supplied");
  assert.ok(!(olist.evidence.links || []).some((l) => /powerbi|app\.powerbi/i.test(l.href)), "no invented report URL");
  assert.doesNotMatch(all, /0\.594/, "macro-F1 is reported as 0.59");
  assert.doesNotMatch(all, /graduating|student at/i, "degree is described as completed");
  assert.equal(content.profile.role, "Data Analyst");
  assert.doesNotMatch(all, /beat my own forecast|shipped instead|feeding views/, "superseded Olist wording");
  for (const kw of ["Python", "SQL", "Power BI"]) {
    assert.ok(content.skills.some((g) => g.items.some((s) => s.name === kw)), `${kw} is listed`);
  }
});
