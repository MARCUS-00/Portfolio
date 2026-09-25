/*
 * Site-level copy and metadata. Page structure lives in src/templates.
 */
export default {
  /* Absolute origin of the deployed site, no trailing slash, e.g.
     "https://example.com". Defaults to the current Vercel deployment; set SITE_URL at build
     time to change it (an empty SITE_URL omits canonical URLs and the sitemap). */
  url: (process.env.SITE_URL ?? "https://portfolio-b2ub.vercel.app").replace(/\/+$/, ""),

  title: "Manoj Kumar G — Software Engineer",
  description: "Manoj Kumar G, software engineer in Bengaluru. ML systems, data platforms and applied ML.",

  /* Social preview, used when set: a 1200×630 PNG under src/static/, e.g. "/social.png". */
  socialImage: null,
  socialImageAlt: "",

  /* Search-engine ownership tokens (the content value of each meta tag), used when set. */
  verification: { google: null, bing: null },

  /* Home: the hero topology and the Work section show at most this many featured projects. */
  featuredLimit: 3,

  topology: {
    label: "Systems I have built",
    columns: ["Source", "Process", "Model / store", "Validation", "Output"],
    note: "Every system here runs the same five steps. Select one to follow its path.",
  },

  statement: {
    lead: "Anything can be made to look like it works. The validation step is where you find out.",
    sub: "Each of these systems has a validation step between the model and the thing people use. Twice it has told me my first number was wrong, and both corrections are on this site with the real figures.",
  },

  about: [
    "I have a B.Tech in Computer Science from PES University in Bengaluru, completed in July 2026, and spent January to May 2026 as a research intern at C3I, PES University.",
    "Half of the work is building the system. The other half is checking the result before believing it. Twice the interesting outcome of a project was that my first number was wrong: a leak across folds, and a model that lost to a plain baseline. Both are on this site with the real figures.",
  ],

  /* Extra rows on the contact page, after the profile links. */
  contactFacts: [
    { k: "Based in", v: "Bengaluru, India" },
    { k: "Education", v: "B.Tech, Computer Science, PES University — completed July 2026" },
    { k: "Most recent", v: "Research intern, C3I, PES University — January to May 2026" },
  ],
};
