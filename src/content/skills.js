/*
 * Skills: a competency inventory, answering "what can he work with?". Where each skill was
 * demonstrated is the job of the Work case studies, which list their own tools, so skills do
 * not link to projects.
 *
 * Grouped by kind and ordered for a data-analyst reader: the analytics and BI stack first,
 * then SQL and data engineering, analysis, statistics, and the supporting ML, engineering and
 * web skills last. Within a group, the most role-relevant items come first.
 *
 * Source: the résumé's key and technical skills (Aug 2026), plus methods shown in the case
 * studies. No proficiency levels, ratings or bars. Do not add: REST endpoints, A/B testing,
 * statsmodels (no current source).
 */
export default [
  {
    group: "Data analytics and BI",
    items: ["SQL", "Python", "Power BI", "Excel (pivot tables, VLOOKUP/XLOOKUP)", "DAX", "Tableau", "pandas", "NumPy"],
  },
  {
    group: "SQL and data engineering",
    items: ["PostgreSQL", "MySQL", "Joins, CTEs and window functions", "Python ETL", "Warehouse modelling (star schema)", "Data-quality testing"],
  },
  {
    group: "Analysis and reporting",
    items: ["Data analysis", "Data cleaning", "Data visualisation and dashboarding", "KPI and business reporting", "Cohort and RFM analysis", "Root-cause analysis"],
  },
  {
    group: "Statistics and forecasting",
    items: ["Hypothesis testing (Mann-Whitney U)", "Time-series forecasting (Holt-Winters, SARIMA)", "Forecast benchmarking", "Bootstrap confidence intervals", "Patient-grouped cross-validation"],
  },
  {
    group: "Machine learning",
    items: ["scikit-learn", "XGBoost", "TensorFlow", "Keras", "PyTorch", "Deep learning", "SHAP", "FinBERT", "OpenCV", "Optuna"],
  },
  {
    group: "Engineering and tools",
    items: ["Git", "GitHub", "GitHub Actions CI", "Docker", "Jupyter", "Flask", "Streamlit", "Jira"],
  },
  {
    group: "Web",
    items: ["JavaScript", "HTML", "CSS"],
  },
].map((g) => ({ group: g.group, items: g.items.map((name) => ({ name })) }));
