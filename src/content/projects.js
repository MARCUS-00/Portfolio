/*
 * Projects ("systems"). Order here is display order.
 *
 * Sources for every figure: the résumé (Aug 2026) and each project's public README
 * on github.com/MARCUS-00. Do not add a number that is not in one of those.
 *
 * Required: id, name, kind, title, lede, line, stack, stages.
 * Optional: shortName, featured, viz, note, moment, facts, decisions, validation,
 *           limits, evidence. A missing optional field removes its block/section;
 *           nothing is replaced with filler.
 *
 * stages: the system path. Featured projects appear in the home topology, which
 * reads as five columns (Source, Process, Model/store, Validation, Output), so a
 * featured project needs exactly five stages with the gate (validation) fourth.
 *
 * viz: "pipeline" (vertical steps), "strata" (stacked layers) or "research"
 * (linear steps that branch at the validation gate). Defaults to "pipeline".
 */
export default [
  {
    id: "osteoscan",
    name: "OsteoScan",
    kind: "Computer vision system",
    viz: "pipeline",
    note: "Dental radiographs in, a three-class prediction out over HTTP. The validation step is a patient-grouped split, because the first split let the model recognise patients instead of bone density.",
    title: "OsteoScan",
    lede: "A three-class bone-density classifier on dental radiographs, trained, checked against patient leakage, and served over HTTP.",
    line: "A convolutional classifier on dental radiographs, served behind a Flask endpoint. The first evaluation leaked patients across folds; the figure shown is the corrected one.",
    stack: ["Python", "TensorFlow", "EfficientNet-B0", "Flask", "Docker"],
    moment: { value: "61.5%", caption: "accuracy on a patient-grouped split, where chance for three classes is 33.3%" },
    stages: [
      { k: "Input", t: "Dental radiographs", d: "periapical X-rays, 13 patients" },
      { k: "Process", t: "Preprocessing pipeline", d: "contrast enhancement, 100×100 patches" },
      { k: "Model", t: "EfficientNet-B0", d: "three bone-density classes" },
      { k: "Validation", t: "Patient-grouped split", d: "bootstrap confidence interval", gate: true, metric: "61.5%" },
      { k: "Service", t: "Flask service", d: "image in, class out over HTTP" },
    ],
    facts: [
      { k: "Accuracy", v: "61.5%", accent: true },
      { k: "Interval", v: "30.8 – 84.6%" },
      { k: "Chance level", v: "33.3%" },
      { k: "Macro-F1", v: "0.594" },
      { k: "Patients", v: "13" },
    ],
    decisions: [
      { q: "Discarding the first 97.28%", a: "The first split put images from the same patient on both sides of the train/test divide, so the model could recognise patients instead of bone density. The corrected, patient-grouped split gives 61.5%." },
      { q: "Reporting a range, not just one number", a: "Bootstrapping the test predictions gives an interval of 30.8% to 84.6%. It is wide, and it is shown next to the 61.5% rather than left out." },
      { q: "Checking against a trivial baseline", a: "A brightness-only baseline scores 53.8% accuracy and 0.533 macro-F1. The model beats it on both, but the interval overlaps the baseline, so the result is suggestive rather than decisive." },
      { q: "Freezing the backbone", a: "With only 13 patients, fine-tuning overfit: training accuracy approached 100% while held-out accuracy collapsed. Freezing the ImageNet backbone and training only the classification head generalised better." },
      { q: "Serving the model", a: "The trained model runs behind a Flask service, deployed on Hugging Face Spaces, so a radiograph can be sent over HTTP and a predicted class comes back with a PDF report. A 14-test suite runs in GitHub Actions CI." },
    ],
    validation: {
      body: "The first run reported 97.28%. The split was leaking patients across folds, so the model was recognising people rather than bone density. Holding out one patient at a time across all 13 gives 61.5%, and bootstrapping the test predictions puts a wide interval around it.",
      head: "Accuracy, three classes",
      hint: "shaded band is the bootstrap interval",
      value: "61.5",
      suffix: "%",
      name: "Patient-grouped split",
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
    limits: "The interval is too wide to support a clinical claim, and narrowing it would need more patients rather than more tuning. The model has not been tested on a second dataset.",
    evidence: {
      links: [
        { k: "Repository", href: "https://github.com/MARCUS-00/Early-Detection-of-Osteoporosis-using-Dental-X-rays", text: "github.com/MARCUS-00/Early-Detection-of-Osteoporosis-using-Dental-X-rays" },
        { k: "Live app", href: "https://manojkumar724-osteoscan.hf.space", text: "manojkumar724-osteoscan.hf.space", note: "sign-in required; accounts can be created on the page" },
      ],
    },
  },

  {
    id: "olist",
    name: "Olist",
    kind: "Data platform",
    viz: "strata",
    note: "A hundred thousand orders into a containerised warehouse, queried in SQL and prepared for Power BI. The validation step is a seasonal baseline, which beat my own forecast and shipped instead of it.",
    title: "Olist analytics platform",
    lede: "About a hundred thousand e-commerce orders moved into a containerised warehouse, queried in SQL, forecast, and prepared for reporting in Power BI.",
    line: "An ETL pipeline into a PostgreSQL warehouse running in Docker, eighteen SQL analyses on top, and a 28-day demand forecast that was benchmarked before anyone trusted it.",
    stack: ["Python", "PostgreSQL 16", "Docker", "SQL", "DAX"],
    moment: { value: "0.2308", caption: "WAPE of the seasonal baseline, which beat my own forecast by 0.0002 and shipped instead of it" },
    stages: [
      { k: "Source", t: "99,441 Olist orders", d: "nine relational tables" },
      { k: "Process", t: "Python ETL", d: "clean, validate and load" },
      { k: "Store", t: "PostgreSQL 16 in Docker", d: "star-schema warehouse" },
      { k: "Validation", t: "SQL analysis and forecast benchmark", d: "18 analyses, 28-day WAPE", gate: true, metric: "0.2308" },
      { k: "Output", t: "Power BI views", d: "feeding views and DAX measures for the report" },
    ],
    facts: [
      { k: "Shipped model", v: "Seasonal baseline" },
      { k: "Baseline WAPE", v: "0.2308", accent: true },
      { k: "My model WAPE", v: "0.2310" },
      { k: "Orders", v: "99,441" },
    ],
    decisions: [
      { q: "Comparing against a baseline", a: "The 28-day demand forecast was scored against a plain seasonal baseline in a walk-forward backtest, using WAPE." },
      { q: "Shipping the baseline", a: "The baseline scored 0.2308 and my Holt-Winters model 0.2310. My model lost, so the baseline shipped." },
      { q: "Counting customers, not orders", a: "In this dataset customer_id is unique per order, not per person, so every retention figure joins through customer_unique_id. Done the other way, the repeat-purchase rate reads as roughly zero; done this way it is 3.0%." },
      { q: "Testing the late-delivery effect", a: "8.11% of delivered orders arrive late. Late orders have a median review of 2/5 against 5/5 on time, and a Mann-Whitney U test shows the difference is significant. It is reported as an association, not a cause." },
    ],
    validation: {
      body: "I built a demand model and scored it against a plain seasonal baseline in a walk-forward backtest over a 28-day horizon. The baseline came in at 0.2308 WAPE, mine at 0.2310. The margin is too small to matter, which is the point: there was no case for shipping the more complex model.",
      head: "WAPE over 28 days, lower is better",
      hint: "axis is zoomed to 0.2300 – 0.2315",
      value: "0.2308",
      name: "Seasonal baseline",
      sub: "shipped",
      ticks: [
        { kind: "value", at: 53.3, label: "0.2308 baseline" },
        { kind: "ghost", at: 66.7, label: "0.2310 mine" },
      ],
      ends: ["0.2300", "0.2315"],
      note: "Zoomed hard so the gap is visible at all. On a 0-to-1 axis the two marks would sit on top of each other.",
    },
    limits: "The data covers 2016 to 2018 from one Brazilian marketplace, so the findings are observational rather than causal. Only about 20 months of history inform the forecast, which is a single annual cycle.",
    evidence: {
      links: [
        { k: "Repository", href: "https://github.com/MARCUS-00/ecommerce-retention-analytics", text: "github.com/MARCUS-00/ecommerce-retention-analytics" },
      ],
      missing: { t: "Power BI report not shown", d: "The repository includes the feeding views, DAX measures and a build specification. No report capture has been supplied, and nothing stands in for one." },
    },
  },

  {
    id: "c3i",
    name: "C3I research",
    shortName: "C3I",
    kind: "Applied research",
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
    decisions: [
      { q: "Reporting 0.54 as measured", a: "The model reached 0.54 AUC, where 0.50 is chance. It is reported at that value rather than tuned toward a better-looking one." },
      { q: "Keeping the future out of training", a: "Splits are time-based with no shuffling, and the per-stock sentiment-decay feature was tuned on training data only, so no feature sees the period it is asked to predict." },
      { q: "Backtesting with costs", a: "The ensemble's signals were backtested against transaction costs with a regime-adaptive confidence threshold, and turned into a ranked daily watchlist." },
      { q: "Explaining the model with SHAP", a: "SHAP attributions show which inputs the model relied on, and were turned into plain-English, per-prediction explanations for non-technical readers." },
    ],
    validation: {
      body: "The model reached 0.54 AUC where chance is 0.50. That gap is small enough that the honest reading is close to no signal, and the SHAP attributions were used to understand what the model was leaning on rather than to dress the number up.",
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
    limits: "This is a research scaffold rather than a trading system, and the result is close enough to chance that it should not be read as a working predictor.",
    /* The repository and demo are public but not yet confirmed for portfolio use, so they are not linked. */
    evidence: {
      missing: { t: "Repository and demo not linked yet", d: "Links will appear here once they are confirmed for portfolio use." },
    },
  },
];
