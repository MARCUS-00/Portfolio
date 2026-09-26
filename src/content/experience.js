/*
 * Professional experience: where Manoj worked, in what role, when, and what he was
 * responsible for. Newest first; the first entry is the one summarised on Home and
 * Contact.
 *
 * Keep project results (metrics, validation, findings) in projects.js. An entry can
 * point to the system it produced with `project`, so the two link to each other
 * instead of repeating each other.
 *
 * Fields: role, org, dates (display text), current (boolean) required; location,
 * summary (one line), did (what the role involved, as short bullets), tools, project
 * (a project id) optional. Source: the résumé's work-experience bullets.
 */
export default [
  {
    role: "Research intern",
    org: "C3I, PES University",
    location: "Bengaluru",
    dates: "Jan — May 2026",
    current: false,
    summary: "Research under faculty supervision: an explainable, multimodal machine-learning pipeline predicting 10-day price direction for 40 Indian large-cap equities.",
    did: [
      "Prepared a 68-feature dataset from price and technical indicators, fundamentals, news sentiment and macroeconomic events.",
      "Engineered a per-stock sentiment-decay feature, tuned by correlation analysis on training data only to avoid lookahead bias.",
      "Applied leakage-prevention and split-integrity checks throughout the pipeline, and evaluated an XGBoost and LSTM ensemble on time-based splits.",
      "Backtested the model's signals against realistic transaction costs and a regime-adaptive confidence threshold, producing a ranked daily watchlist.",
      "Translated SHAP attributions into plain-English, per-prediction explanations for non-technical users.",
    ],
    tools: ["Python", "XGBoost", "LSTM", "PyTorch", "FinBERT", "SHAP"],
    project: "c3i",
  },
];
