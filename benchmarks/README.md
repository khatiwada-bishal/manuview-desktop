# ManuView Scientific Benchmark & Validation Suite

This directory contains the reproducible benchmark harness, gold evaluation fixtures, and real-world corpus datasets used to measure the empirical accuracy, precision, and false-positive rates of all heuristic and algorithmic detectors in the ManuView peer-review diagnostic engine.

---

## 1. Principles

1. **Two Layers, Different Jobs**:
   - **Layer A (Gold Unit Benchmarks)**: Deterministic, known-answer mathematical and logical validation. Evaluates approximation error bounds, rounding consistency, and exact catalog lookups. Must pass 100% in CI.
   - **Layer B (Corpus Benchmarks)**: Real-world labeled data. Reports Precision, Recall, F1, and False-Positive Rate (FPR) with 95% Wilson confidence intervals. Gated against stored baseline regression.
2. **Prioritizing False-Positive Rates on Protective Gates**:
   - The two decisions that can wrongly block or reject a manuscript — **Prior-Publication Gate** (`detectPublishedArticle`) and **Scope Desk-Reject Gate** (`isDisciplineMatch`) — are graded primarily on False-Positive Rate ($FPR = \frac{FP}{FP + TN}$) on legitimate, in-scope submissions ($FPR \le 0.02$ and $FPR \le 0.05$).
3. **Honest Coverage & Transparency**:
   - Every metric is reported alongside the detector's **Coverage Rate** (percentage of cases receiving a determination vs. abstaining with `unchecked`), ensuring high precision cannot be achieved through artificial abstention.
4. **Zero Production Mutation**:
   - Benchmarks live entirely in `benchmarks/` and import directly from `src/lib/` without monkey-patching or altering production logic.

---

## 2. Benchmark Inventory

| # | Detector (Function · File) | Layer | Dataset / Fixture | Primary Metric | Target |
|---|---|---|---|---|---|
| 1 | `pValueFromT/F/ChiSquare/Z/R` · `statcheck.ts` | A | SciPy / R Reference Values | Max abs error | < 2e-3 |
| 2 | `runStatcheckAudit` · `statcheck.ts` | A/B | Nuijten et al. (2016) Strings | F1 | ≥ 0.85 |
| 3 | `testGrim` · `statcheck.ts` | A/B | Brown & Heathers (2017) Cases | Accuracy | ≥ 0.98 |
| 4 | `analyzeCitationRecency` · `citation-recency.ts` | A | Reference Age Distributions | Max abs error | 0.00 (exact) |
| 5 | `isStructuralAnchorResolvable` · `validation-gate.ts` | A | Real vs Hallucinated Anchors | Precision | ≥ 0.95 |
| 6 | `lookupJournalInCatalog` · `journals.ts` | A | Normalized Catalog & Fakes | Precision | ≥ 0.98 |
| 7 | `detectPublishedArticle` · `publication-detector.ts` | B | Preprints, Published & Hard Negatives | **FPR (primary)** | **≤ 0.02** |
| 8 | `extractPreprintMarkers` · `publication-detector.ts` | B | Labeled Repository Headers | Accuracy | ≥ 0.95 |
| 9 | `isDisciplineMatch` · `journals.ts` | B | Matched vs Mismatched Pairs | **Scope-FPR** | **≤ 0.05** |
| 10 | `classifyDocument` · `parser.ts` | B | Multi-Class Document Corpus | Macro-F1 | ≥ 0.90 |
| 11 | `parseRawTextToManuscript` · `parser.ts` | B | Structured IMRaD XML/Text | Section-F1 | ≥ 0.85 |
| 12 | `checkRetractionStatus` · `retractions.ts` | B | Curated Catalog & Negative Controls | FPR | ≤ 0.02 |
| 13 | `sanitizePromptInjectionAndHiddenContent` · `parser.ts` | B | Red-Team Injection Corpus | Recall | ≥ 0.90 |
| 14 | `detectLanguageIntegrity` · `parser.ts` | B | Multilingual Text Corpus | Accuracy | ≥ 0.95 |
| 15 | `detectPdfExtractionQuality` · `parser.ts` | B | Corrupted & Degraded Stream Samples | Accuracy | ≥ 0.90 |
| 16 | `runHedgingAndOverclaimAudit` · `hedging-overclaims.ts` | B | Causal Overclaim Statements | Precision | ≥ 0.80 |
| 17 | `extractMandatoryDeclarations` · `parser.ts` | B | Ethics, Data, COI, Contributions | F1 | ≥ 0.85 |

---

## 3. Running Benchmarks

Run all suites and generate the official scorecard:
```bash
npm run benchmark
```

Run only Layer A deterministic gold benchmarks:
```bash
npm run benchmark:gold
```

Run only Layer B real-world corpus benchmarks:
```bash
npm run benchmark:corpus
```

Run a specific detector:
```bash
npx tsx benchmarks/runners/run-all.ts --detector=grim
```

---

## 4. Scorecard Outputs

Every benchmark run produces:
- `benchmarks/report/scorecard.json`: Machine-readable records with full Wilson confidence intervals, sample counts, and coverage.
- `benchmarks/report/scorecard.md`: Formatted markdown table showing status, confidence intervals, and delta ($\Delta$) against previous stored baseline.
- `benchmarks/report/history/scorecard-<timestamp>.json`: Immutable historical run archive for tracking precision and recall trends across releases.

---

## 5. Scientific References & Acknowledgments

- **statcheck**: Nuijten, M. B., Hartgerink, C. H., van Assen, M. A., Epskamp, S., & Wicherts, J. M. (2016). *The prevalence of statistical reporting errors in psychology (1985–2013)*. Behavior Research Methods, 48(4), 1205-1226.
- **GRIM Test**: Brown, N. J., & Heathers, J. A. (2017). *The GRIM test: A simple, technique for detecting anomalies in reported means of integer data*. Social Psychological and Personality Science, 8(4), 363-369.
- **Retraction Watch Database**: Crossref & The Center for Scientific Integrity. Open retraction data infrastructure.
- **PubMed Central Open Access (PMC OA)**: National Library of Medicine (NLM) structured XML and JATS schemas for empirical biomedical literature.
