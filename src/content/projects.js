/*
 * Projects ("systems"). Order here is display order: the primary analytics project first.
 *
 * Sources for every figure: the résumé (Aug 2026) and each project's public repository
 * on github.com/MARCUS-00 (README, docs/findings.md, sql/). Do not add a number that is not
 * in one of those, and do not write a "why" that the sources do not document.
 *
 * Required: id, name, kind, title, lede, line, stack, stages.
 * Optional: shortName, featured, viz, note, moment, facts, overview, findings, decisions,
 *           validation, limits, evidence. A missing optional field removes its block or
 *           section; nothing is replaced with filler.
 *
 * overview: [{ k, v }], the brief: context, problem, data, what made it hard, approach.
 * findings: [{ type, t }], type one of FINDING_TYPES in index.js. Keeps what was measured
 *           apart from what it means, what to do about it, and what should come next.
 * chart: optional headline figure shown above the findings, as a small bar table:
 *        { head, note?, cols: [label, value, count], rows: [{ k, v (0–100), label, n?, accent? }] }.
 *        Only measured values from the project's own documentation.
 *
 * stages: the project's path from source to output. Featured projects appear in the home topology, which
 * reads as five columns (Source, Process, Model/store, Validation, Output), so a
 * featured project needs exactly five stages with the gate (validation) fourth.
 *
 * evidence: { links?, code?, media?, pending? }.
 *   links: [{ k, href, text, note? }].
 *   code: a verbatim excerpt from the repository, { caption, lang, code, href, text }.
 *   media: a supplied capture, { src (path under src/static/), alt, caption?, width, height }.
 *   pending: { t, d? }, a plain, non-clickable note for evidence that exists but is not shown
 *   yet. Never put a stand-in image in media.
 *
 * viz: "pipeline" (vertical steps), "strata" (stacked layers) or "research"
 * (linear steps that branch at the validation gate). Defaults to "pipeline".
 */

/* Verbatim from sql/03_analysis/13_repeat_purchase_rate.sql in the Olist repository. */
const REPEAT_PURCHASE_SQL = `-- QUESTION: What share of customers ever place more than one delivered order?
WITH orders_per_customer AS (
    SELECT
        c.customer_unique_id,
        COUNT(DISTINCT o.order_id) AS delivered_orders
    FROM analytics.fact_orders o
    JOIN analytics.dim_customers c USING (customer_id)
    WHERE o.order_status = 'delivered'
    GROUP BY 1
)
SELECT
    COUNT(*) AS total_customers,
    COUNT(*) FILTER (WHERE delivered_orders >= 2) AS repeat_customers,
    ROUND(100.0 * COUNT(*) FILTER (WHERE delivered_orders >= 2) / COUNT(*), 2) AS repeat_pct
FROM orders_per_customer;`;

export default [
  {
    id: "olist",
    name: "Olist",
    kind: "Data analytics · BI · forecasting",
    viz: "strata",
    note: "99,441 orders cleaned into a PostgreSQL warehouse, analysed in SQL, tested statistically, forecast, and reported through Power BI. The validation step is a seasonal baseline, which beat the forecast model and was recommended instead.",
    title: "Olist revenue and retention analytics",
    lede: "99,441 e-commerce orders cleaned into a PostgreSQL warehouse, examined through eighteen SQL analyses, tested statistically, forecast, and reported through Power BI.",
    line: "A Python ETL into a PostgreSQL warehouse, eighteen SQL analyses using joins, CTEs and window functions, retention and delivery findings, and a 28-day demand forecast benchmarked before anyone trusted it.",
    stack: ["SQL", "Python", "PostgreSQL 16", "Power BI", "DAX", "Excel", "Docker", "GitHub Actions"],
    moment: { value: "0.2308", caption: "WAPE of the seasonal baseline, which beat the model by 0.0002 and was recommended instead." },
    stages: [
      { k: "Source", t: "99,441 Olist orders", d: "nine relational tables" },
      { k: "Process", t: "Python ETL", d: "automated cleaning, 10 data-quality tests" },
      { k: "Store", t: "PostgreSQL 16 in Docker", d: "star-schema warehouse" },
      { k: "Validation", t: "SQL analysis and forecast benchmark", d: "18 analyses, 28-day WAPE", gate: true, metric: "0.2308" },
      { k: "Output", t: "Power BI dashboard", d: "reporting views and DAX measures" },
    ],
    facts: [
      { k: "Orders", v: "99,441" },
      { k: "SQL analyses", v: "18" },
      { k: "Repeat purchase", v: "3.0%" },
      { k: "Late delivery", v: "8.11%" },
      { k: "Baseline WAPE", v: "0.2308", accent: true },
      { k: "Model WAPE", v: "0.2310" },
    ],
    overview: [
      { k: "Context", v: "A personal analytics project, 2026, built on a public dataset." },
      { k: "Problem", v: "Three planning questions, framed as a marketplace's leadership would ask them: what drives revenue and where is it concentrated; what share of customers ever return; and does late delivery measurably affect satisfaction?" },
      { k: "Data", v: "The public Olist Brazilian e-commerce dataset: 99,441 orders across nine relational tables, from 2016 to 2018." },
      { k: "What made it hard", v: "customer_id identifies an order, not a person, so a naive repeat-purchase rate reads as roughly zero. Item totals and payments disagree on 303 orders. Revenue and demand need different populations of orders." },
      { k: "Approach", v: "A validated Python ETL into a PostgreSQL 16 star schema; eighteen SQL analyses using joins, CTEs and window functions; a Mann-Whitney U test; cohort and RFM analysis; a walk-forward demand forecast; reporting views and DAX measures for Power BI; and an Excel pivot summary." },
    ],
    /* The repository's headline finding, from docs/findings.md #2 (percentages rounded to one place).
       notebooks/03_delivery_reviews.ipynb records the one-sided p-value as 0.000e+00 (below
       floating-point precision), reported here as the threshold p < 0.001. */
    chart: {
      head: "Reviews rated one or two stars, by delivery",
      note: "Mann-Whitney U, one-sided, p < 0.001. An association, not proof of cause.",
      cols: ["Delivery", "Rated 1–2 stars", "Reviewed orders"],
      rows: [
        { k: "On time", v: 9.2, label: "9.2%", n: "88,163" },
        { k: "Late", v: 54.1, label: "54.1%", n: "7,661", accent: true },
      ],
    },
    findings: [
      { type: "Finding", t: "3.0% of customers ever place a second delivered order: 2,801 of 93,358, counted by person." },
      { type: "Interpretation", t: "The marketplace depends on acquiring new customers rather than retaining them." },
      { type: "Finding", t: "8.11% of delivered orders arrive late (7,826 of 96,478). Late orders have a median review of 2/5, with 54.1% rated one or two stars; on-time orders have a median of 5/5 and 9.2%. A Mann-Whitney U test finds the difference significant." },
      { type: "Interpretation", t: "Delivery reliability is associated with satisfaction. It is an association, not proof of cause: lateness also tracks distance, seller and freight cost." },
      { type: "Finding", t: "The top 5 of 74 product categories generate 39.25% of delivered revenue." },
      { type: "Recommendation", t: "Aim retention effort at turning the recent one-time segment (38.71% of customers) into second-time buyers: it is large, and still recent enough to reach." },
      { type: "Recommendation", t: "Plan 28-day capacity with the seasonal baseline, and treat its wide interval as real demand volatility." },
    ],
    decisions: [
      { q: "Counting customers, not orders", a: "In this dataset customer_id is unique per order, not per person, so every retention figure joins through customer_unique_id. Done the other way, the repeat-purchase rate reads as roughly zero; done this way it is 3.0%." },
      { q: "One revenue definition, reconciled", a: "Revenue is item price plus freight on delivered orders, and it ties out exactly to the raw data. The 303 orders (0.30%) where items and payments differ by more than R$0.01 are explained by vouchers, instalments and cancellations, not by an ETL error." },
      { q: "Two populations, kept apart", a: "Revenue and retention use delivered orders only. The demand forecast uses all placed orders, because capacity has to be planned whatever an order's eventual outcome." },
      { q: "Scoring the forecast against a baseline", a: "The Holt-Winters forecast and a seasonal-naive baseline were scored on WAPE in a walk-forward backtest. The baseline scored 0.2308 and the model 0.2310; with the two effectively tied, the simpler baseline became the recommendation." },
    ],
    validation: {
      body: "A six-fold walk-forward backtest over a 28-day horizon scored the Holt-Winters model and a seasonal-naive baseline on WAPE. Under the project's acceptance rule, a tie goes to the simpler model.",
      head: "WAPE over 28 days, lower is better",
      hint: "axis is zoomed to 0.2300 – 0.2315",
      value: "0.2308",
      name: "Seasonal baseline",
      sub: "recommended",
      ticks: [
        { kind: "value", at: 53.3, label: "0.2308 baseline" },
        { kind: "ghost", at: 66.7, label: "0.2310 model" },
      ],
      ends: ["0.2300", "0.2315"],
      note: "Zoomed hard so the gap is visible at all. On a 0-to-1 axis the two marks would sit on top of each other.",
    },
    limits: "The data covers 2016 to 2018 from one Brazilian marketplace, so the findings are observational rather than causal. Only about 20 months of history inform the forecast, which is a single annual cycle.",
    evidence: {
      links: [
        { k: "Repository", href: "https://github.com/MARCUS-00/ecommerce-retention-analytics", text: "github.com/MARCUS-00/ecommerce-retention-analytics" },
      ],
      code: {
        caption: "One of the eighteen analyses: the repeat-purchase rate, counted by person rather than by order.",
        lang: "SQL",
        code: REPEAT_PURCHASE_SQL,
        href: "https://github.com/MARCUS-00/ecommerce-retention-analytics/blob/main/sql/03_analysis/13_repeat_purchase_rate.sql",
        text: "13_repeat_purchase_rate.sql on GitHub",
      },
      /* Replace with `media: { src, alt, caption, width, height }` once the dashboard capture is supplied. */
      pending: { t: "Power BI dashboard — evidence coming soon" },
    },
  },

  {
    id: "osteoscan",
    name: "OsteoScan",
    kind: "Applied ML · analytical validation",
    viz: "pipeline",
    note: "Dental radiographs in, a three-class prediction out over HTTP. The validation step is patient-grouped cross-validation, because the first split let the model recognise patients instead of bone density.",
    title: "OsteoScan",
    lede: "Early detection of osteoporosis using dental X-rays: a three-class bone-density classifier, checked against patient leakage and served over HTTP.",
    line: "A convolutional classifier on dental radiographs, served behind a Flask endpoint. The first evaluation leaked patients across folds; the figure shown is the corrected one.",
    stack: ["Python", "TensorFlow", "Keras", "EfficientNet-B0", "Flask", "SQLite", "Docker", "GitHub Actions"],
    moment: { value: "61.5%", caption: "accuracy under patient-grouped cross-validation, where chance for three classes is 33.3%" },
    stages: [
      { k: "Input", t: "Dental radiographs", d: "periapical X-rays, 13 patients" },
      { k: "Process", t: "Preprocessing pipeline", d: "contrast enhancement, 100×100 patches" },
      { k: "Model", t: "EfficientNet-B0", d: "three bone-density classes" },
      { k: "Validation", t: "Patient-grouped cross-validation", d: "bootstrap confidence interval", gate: true, metric: "61.5%" },
      { k: "Service", t: "Flask service", d: "image in, class out over HTTP" },
    ],
    facts: [
      { k: "Accuracy", v: "61.5%", accent: true },
      { k: "Interval", v: "30.8 – 84.6%" },
      { k: "Chance level", v: "33.3%" },
      { k: "Macro-F1", v: "0.59" },
      { k: "Patients", v: "13" },
    ],
    overview: [
      { k: "Context", v: "A project at PES University, 2025 to 2026, built on a public dataset." },
      { k: "Problem", v: "Dental X-rays are taken routinely; bone-density scans are not. Can a periapical radiograph flag patients who should be sent for one?" },
      { k: "Data", v: "A public Mendeley dataset of dental periapical radiographs: 13 of its 31 subjects (3 normal, 6 osteopenia, 4 osteoporosis), cut into 75,075 augmented 100×100 patches." },
      { k: "What made it hard", v: "Patches from one patient are alike, so a split made at patch level leaks patients into the test set. With 13 patients, and only 3 in the normal class, every result carries a wide interval." },
      { k: "Approach", v: "An EfficientNet-B0 classifier with a frozen ImageNet backbone, evaluated by holding out one patient at a time, bootstrapped, and compared with a brightness-only baseline; then served in a Flask app with Grad-CAM heatmaps and PDF reports." },
    ],
    findings: [
      { type: "Finding", t: "61.5% accuracy (8 of 13 patients) and macro-F1 0.59 under patient-grouped cross-validation, against 53.8% and 0.533 for a brightness-only baseline." },
      { type: "Finding", t: "The first evaluation's 97.28% came from patient-level leakage: patches from the same patient sat on both sides of the train/test divide." },
      { type: "Interpretation", t: "The model beats the baseline on both measures, but the bootstrap interval (30.8% to 84.6%) overlaps it, so the result is suggestive rather than decisive." },
      { type: "Next step", t: "Collect more patient sources, the change most likely to narrow the interval, and validate on an independent dataset." },
    ],
    decisions: [
      { q: "Discarding the first 97.28%", a: "The first split put images from the same patient on both sides of the train/test divide, so the model could recognise patients instead of bone density. Corrected patient-grouped cross-validation gives 61.5%." },
      { q: "Freezing the backbone", a: "With only 13 patients, fine-tuning overfit: training accuracy approached 100% while held-out accuracy collapsed. Freezing the ImageNet backbone and training only the classification head generalised better." },
      { q: "Serving the model", a: "The trained model runs behind a Flask service, deployed on Hugging Face Spaces, so a radiograph can be sent over HTTP and a predicted class comes back with a PDF report. A 14-test suite runs in GitHub Actions CI." },
    ],
    validation: {
      body: "Each of 13 folds trains on 12 patients and tests on the one held out, so no patient appears on both sides. Bootstrapping the test predictions puts an interval around the accuracy, and a brightness-only baseline sets the bar the model has to clear.",
      head: "Accuracy, three classes",
      hint: "shaded band is the bootstrap interval",
      value: "61.5",
      suffix: "%",
      name: "Patient-grouped cross-validation",
      sub: "the figure I stand behind",
      band: [30.8, 84.6],
      ticks: [
        { kind: "ref", at: 33.3, label: "33.3 chance" },
        { kind: "ghost", at: 97.28, label: "97.28 leaked", edge: "right" },
        { kind: "value", at: 61.5, label: "61.5" },
      ],
      ends: ["0", "100%"],
      note: "The interval runs from 30.8% to 84.6%. At the low end that is chance. The dataset is small and the interval says so.",
    },
    limits: "The interval is too wide to support a clinical claim, and narrowing it would need more patients rather than more tuning. The model has not been tested on a second dataset. It is a research prototype, not a diagnostic tool.",
    evidence: {
      links: [
        { k: "Repository", href: "https://github.com/MARCUS-00/Early-Detection-of-Osteoporosis-using-Dental-X-rays", text: "github.com/MARCUS-00/Early-Detection-of-Osteoporosis-using-Dental-X-rays" },
        { k: "Live app", href: "https://manojkumar724-osteoscan.hf.space", text: "manojkumar724-osteoscan.hf.space", note: "sign-in required; accounts can be created on the page" },
      ],
    },
  },

  {
    id: "c3i",
    name: "C3I research",
    shortName: "C3I",
    kind: "Research · applied ML evaluation",
    viz: "research",
    note: "Multimodal inputs through feature engineering into an ensemble model, with SHAP explaining what it leaned on. The validation step is AUC against chance, and the answer was 0.54 against 0.50.",
    title: "Explainable models on financial data",
    lede: "Research at C3I, PES University, on multimodal financial data, where the useful result was how little signal there turned out to be.",
    line: "Applied ML research on multimodal financial data: feature engineering into an ensemble model, evaluated against chance and explained with SHAP.",
    stack: ["Python", "XGBoost", "PyTorch", "FinBERT", "SHAP"],
    moment: { value: "0.54", caption: "AUC, where 0.50 is a coin flip — reported as measured rather than tuned upward" },
    stages: [
      { k: "Inputs", t: "Multimodal financial inputs", d: "prices, fundamentals, news, macro events" },
      { k: "Process", t: "Feature engineering", d: "68 features for 40 large-cap stocks" },
      { k: "Model", t: "Ensemble model", d: "XGBoost and LSTM, 10-day direction" },
      { k: "Evaluation", t: "AUC against chance", d: "0.50 is a coin flip", gate: true, metric: "0.54" },
      { k: "Output", t: "SHAP attribution", d: "which inputs the model leaned on" },
    ],
    facts: [
      { k: "AUC", v: "0.54", accent: true },
      { k: "Chance level", v: "0.50" },
      { k: "Stocks", v: "40" },
      { k: "Group", v: "C3I, PES University" },
    ],
    overview: [
      { k: "Context", v: "Research during an internship at C3I, PES University, from January to May 2026, under faculty supervision." },
      { k: "Problem", v: "Can prices, fundamentals, news sentiment and macroeconomic events together predict the 10-day price direction of 40 Indian large-cap equities, and explain each prediction?" },
      { k: "Data", v: "Market prices and technical indicators, company fundamentals, news scored for sentiment with FinBERT, and macroeconomic events, combined into 68 features." },
      { k: "What made it hard", v: "Time-series data leaks easily: shuffled splits, statistics computed over every row, or validation scores taken from a refitted model all let the future into training. The signal itself is weak." },
      { k: "Approach", v: "Time-based splits; an XGBoost and LSTM ensemble weighted by out-of-sample AUC; a per-stock sentiment-decay feature tuned on training data only; backtesting against transaction costs; and SHAP explanations for each prediction." },
    ],
    findings: [
      { type: "Finding", t: "Ensemble test AUC is 0.54, with a bootstrap 95% interval of 0.529 to 0.552, where 0.50 is chance." },
      { type: "Finding", t: "Ensemble accuracy (0.534) is below an always-up baseline (0.547); AUC is the only measure carrying any signal." },
      { type: "Interpretation", t: "The signal is weak, about four points above random. The work is a research scaffold, not a trading signal." },
    ],
    decisions: [
      { q: "Keeping the future out of training", a: "Splits are time-based with no shuffling, and the per-stock sentiment-decay feature was tuned on training data only, so no feature sees the period it is asked to predict." },
      { q: "Validating on a train-only model", a: "Validation predictions come from a model trained on the training rows only, never from the refit on training and validation data. Without this, the gap between validation and test AUC was over 40 points and silently broke the ensemble weighting." },
      { q: "Backtesting with costs", a: "The ensemble's signals were backtested against transaction costs with a regime-adaptive confidence threshold, and turned into a ranked daily watchlist." },
      { q: "Explaining the model with SHAP", a: "SHAP attributions show which inputs the model relied on, and were turned into plain-English, per-prediction explanations for non-technical readers." },
    ],
    validation: {
      body: "Splits are time-based; validation predictions come from a model trained on training rows only; and the test AUC was bootstrapped over 1,000 resamples.",
      head: "AUC against chance",
      hint: "0.50 is a coin flip",
      value: "0.54",
      name: "Reported result",
      sub: "not tuned upward",
      ticks: [
        { kind: "ref", at: 16.7, label: "0.50 chance", edge: "left" },
        { kind: "value", at: 23.3, label: "0.54" },
      ],
      ends: ["0.40", "1.00"],
      note: "Shown on a full 0.40 – 1.00 axis so the size of the gap is not exaggerated.",
    },
    limits: "This is a research scaffold rather than a trading system, and the result is close enough to chance that it should not be read as a working predictor. The stock universe is 40 large-cap equities, not the full Nifty 50.",
    /* The repository and demo are public but not yet confirmed for portfolio use, so they are not linked. */
    evidence: {
      pending: { t: "Repository and demo not linked yet", d: "Links will appear here once they are confirmed for portfolio use." },
    },
  },
];
