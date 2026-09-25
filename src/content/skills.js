/*
 * Skills, grouped. `proof` lists the project ids where the skill is actually
 * demonstrated; an empty list renders as "no system here" (claimed on the
 * résumé, not shown on this site). Only link a project that really uses it.
 */
export default [
  {
    group: "Languages",
    items: [
      { name: "Python", proof: ["osteoscan", "olist", "c3i"] },
      { name: "SQL", proof: ["olist"] },
    ],
  },
  {
    group: "Data engineering",
    items: [
      { name: "Python ETL", proof: ["olist"] },
      { name: "PostgreSQL 16", proof: ["olist"] },
      { name: "Docker", proof: ["olist", "osteoscan"] },
      { name: "Warehouse modelling", proof: ["olist"] },
      { name: "GitHub Actions CI", proof: ["olist", "osteoscan"] },
    ],
  },
  {
    group: "Machine learning",
    items: [
      { name: "TensorFlow", proof: ["osteoscan"] },
      { name: "EfficientNet-B0", proof: ["osteoscan"] },
      { name: "XGBoost", proof: ["c3i"] },
      { name: "PyTorch", proof: ["c3i"] },
      { name: "SHAP", proof: ["c3i"] },
      { name: "Bootstrap confidence intervals", proof: ["osteoscan"] },
      { name: "Patient-grouped cross-validation", proof: ["osteoscan"] },
    ],
  },
  {
    group: "Analytics and BI",
    items: [
      { name: "Power BI", proof: [] },
      { name: "DAX", proof: ["olist"] },
      { name: "Forecast benchmarking", proof: ["olist"] },
      { name: "Hypothesis testing", proof: ["olist"] },
      { name: "Excel", proof: ["olist"] },
      { name: "pandas", proof: [] },
    ],
  },
  {
    group: "Services and tooling",
    items: [
      { name: "Flask", proof: ["osteoscan"] },
      { name: "Streamlit", proof: ["c3i"] },
    ],
  },
];
