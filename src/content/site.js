/*
 * Site-level copy and metadata. Page structure lives in src/templates.
 */
export default {
  /* Absolute origin of the deployed site, no trailing slash, e.g.
     "https://example.com". Defaults to the GitHub Pages user site; set SITE_URL at build
     time to change it (an empty SITE_URL omits canonical URLs and the sitemap). */
  url: (process.env.SITE_URL ?? "https://marcus-00.github.io").replace(/\/+$/, ""),

  title: "Manoj Kumar — Data Analyst",
  description: "Manoj Kumar, data analyst in Bengaluru. SQL, Python, Power BI, statistical analysis and forecasting, with applied machine learning.",

  /* Social preview, used when set: a 1200×630 PNG under src/static/, e.g. "/social.png". */
  socialImage: "/social.png",
  socialImageAlt: "Manoj Kumar, Data Analyst, Bengaluru, India. SQL, Python, Power BI, Excel, statistics and forecasting.",

  /* Search-engine ownership tokens (the content value of each meta tag), used when set. */
  verification: { google: null, bing: null },

  /* Home: the hero topology and the Work section show at most this many featured projects. */
  featuredLimit: 3,

  topology: {
    label: "From source data to result",
    columns: ["Source", "Process", "Model / store", "Validation", "Output"],
    note: "Every project here runs the same five steps. Select one to follow its path.",
  },

  work: {
    home: "Selected work",
    lead: "Selected analytical work, from data preparation and SQL analysis to reporting, forecasting and applied ML.",
  },

  statement: {
    lead: "Anything can be made to look like it works. The validation step is where you find out.",
    sub: "Each of these projects has a validation step before its result is used. Twice it has told me my first number was wrong, and both corrections are on this site with the real figures.",
  },

  /* About: a short identity paragraph, then labelled sections. Facts only from the résumé and
     project READMEs; no personality claims that Manoj has not made himself. */
  about: {
    lead: "I'm a data analyst in Bengaluru with a B.Tech in Computer Science from PES University, completed in July 2026. My work covers the whole path of a dataset: cleaning and loading it, querying it, testing what it appears to show, and reporting it so other people can use it.",
    sections: [
      { k: "What I work with", body: [
        "SQL and Python for most of it, Power BI and Excel for reporting, and statistics and forecasting when a question needs more than a summary.",
        "The clearest example is the Olist project: a Python ETL with automated cleaning and data-quality tests, a PostgreSQL star-schema warehouse, eighteen SQL analyses and a Power BI dashboard with DAX measures. Machine learning is a supporting skill, applied in an X-ray screening model and in explainable models on financial data.",
      ] },
      { k: "How I check results", body: [
        "I check a result before I report it. Two findings on this site correct my own first numbers. OsteoScan's first 97.28% accuracy came from the same patients appearing on both sides of the split; the corrected figure is 61.5%. On Olist, my demand forecast lost to a plain seasonal baseline by 0.0002 WAPE, so the baseline was recommended.",
        "Findings from observational data are reported as associations, not causes.",
      ] },
      { k: "Now", body: [
        "I completed my degree in July 2026, after a research internship at C3I, PES University, from January to May 2026. I'm open to data analyst opportunities.",
      ] },
    ],
  },
};
