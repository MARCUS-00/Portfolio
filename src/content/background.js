/*
 * Experience page, grouped. New groups (certifications, publications, awards,
 * open source, testimonials) are new entries here; the page renders any number
 * of groups and items without layout changes.
 *
 * Item fields: title, org, dates (required); body, link {href, label} (optional).
 * `hero` marks the item summarised in the home hero; heroText is that summary,
 * with the part inside [brackets] set in the stronger weight.
 */
export default [
  {
    group: "Professional",
    items: [
      {
        title: "Research intern",
        org: "C3I, PES University",
        dates: "Jan — May 2026",
        hero: "experience",
        heroText: "Research intern, [C3I, PES University, 2026]",
        body: "Built and evaluated an explainable machine-learning pipeline on multimodal financial data for 40 Indian large-cap stocks. Used SHAP to attribute predictions back to inputs, and reported a 0.54 AUC as measured rather than tuning toward a better-looking number.",
        link: { project: "c3i", label: "Open the system" },
      },
    ],
  },
  {
    group: "Education",
    items: [
      {
        title: "B.Tech, Computer Science",
        org: "PES University",
        dates: "2023 — July 2026",
        hero: "education",
        heroText: "B.Tech Computer Science, [PES University, 2026]",
        body: "Undergraduate degree in Bengaluru, completed in July 2026. The systems on this site were built alongside it.",
      },
      {
        title: "Diploma, Computer Science",
        org: "Dayananda Sagar Institute of Technology",
        dates: "2020 — 2023",
      },
    ],
  },
];
