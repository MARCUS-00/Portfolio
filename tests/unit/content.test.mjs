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
  c.skills[0].items.push({ name: "Rust", proof: ["no-such-project"] });
  c.projects[1].id = c.projects[0].id;
  c.background[0].items[0].link = { project: "missing", label: "x" };
  const errors = validate(c).join("\n");
  assert.match(errors, /exactly 5 stages/);
  assert.match(errors, /proof "no-such-project" is not a project id/);
  assert.match(errors, /duplicate id/);
  assert.match(errors, /link project "missing"/);
});

test("validation requires the gate in the Validation column for featured projects", () => {
  const c = clone(content);
  c.projects[0].stages[3].gate = false;
  c.projects[0].stages[4].gate = true;
  assert.match(validate(c).join("\n"), /gate as stage 4/);
});

test("every skill that claims a system points at one that exists and lists it", () => {
  const ids = new Set(content.projects.map((p) => p.id));
  for (const g of content.skills) for (const s of g.items) for (const id of s.proof) assert.ok(ids.has(id), `${s.name} → ${id}`);
});

/* Facts that were corrected against the résumé and project repositories must not regress. */
test("factual guards", () => {
  const all = JSON.stringify(content);
  assert.doesNotMatch(all, /knee/i, "OsteoScan uses dental radiographs");
  assert.doesNotMatch(all, /single 28-day window/i, "Olist forecast was walk-forward validated");
  assert.doesNotMatch(all, /manojgopinath123|842072286|manoj-kumar-analytics/, "no unconfirmed contact URLs");
  assert.equal(content.profile.email, "mailtomanojkumar07@gmail.com");
  assert.equal(content.profile.linkedin, null, "LinkedIn stays off until a URL is confirmed");
  assert.doesNotMatch(all, /JB Portals|PES C3I|statsmodels/, "unconfirmed organisation and tool claims stay out");
  assert.doesNotMatch(all, /read (in|through) Power BI|Power BI report"/, "no claim of a built Power BI report");
  assert.doesNotMatch(all, /graduating|student at/i, "degree is described as completed");
  assert.equal(content.profile.role, "Software Engineer");
  for (const kw of ["Python", "SQL", "Power BI"]) {
    assert.ok(content.skills.some((g) => g.items.some((s) => s.name === kw)), `${kw} is listed`);
  }
});
