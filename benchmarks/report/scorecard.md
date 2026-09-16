# ManuView Benchmark Scorecard

- **Timestamp**: 2026-09-16T07:06:25.875Z
- **Engine Commit**: `HEAD`
- **Manifest Version**: `1.0.0`
- **Status**: ✅ All Targets Met

| Detector | Layer | Metric | Score (95% CI) | Target | Coverage | Δ vs base | Status |
|---|---|---|---|---|---|---|---|
| pValueFromT/F/ChiSquare/Z/R | Layer A | Max abs error | 6.59e-4 | < 2e-3 | 100% | 0.00 | ✅ Pass |
| runStatcheckAudit (inconsistency flags) | Layer A | F1 | 0.89 [1.00 prec, 0.80 rec] | ≥ 0.85 | 100% | 0.00 | ✅ Pass |
| testGrim (granularity of means) | Layer A | Accuracy | 1.00 [0.89–1.00] | ≥ 0.98 | 100% | 0.00 | ✅ Pass |
| analyzeCitationRecency | Layer A | Max abs error | 0.00 | 0.00 (exact) | 100% | 0.00 | ✅ Pass |
| isStructuralAnchorResolvable (grounding gate) | Layer A | Precision | 1.00 [0.65–1.00] | ≥ 0.95 | 100% | 0.00 | ✅ Pass |
| lookupJournalInCatalog | Layer A | Precision | 1.00 [0.78–1.00] | ≥ 0.98 | 100% | 0.00 | ✅ Pass |
| detectPublishedArticle (gate) | Layer B | FPR | 0.00 [0.00–0.16] | ≤ 0.02 | 100% | 0.00 | ✅ Pass |
| extractPreprintMarkers | Layer B | Accuracy | 1.00 [0.89–1.00] | ≥ 0.95 | 100% | 0.00 | ✅ Pass |
| isDisciplineMatch (scope desk-reject gate) | Layer B | Scope-FPR | 0.00 [0.00–0.20] | ≤ 0.05 | 100% | 0.00 | ✅ Pass |
| classifyDocument (multi-class) | Layer B | Macro-F1 | 1.00 (Acc: 100.0%) | ≥ 0.90 | 100% | 0.00 | ✅ Pass |
| parseRawTextToManuscript (IMRaD sectioning) | Layer B | Section-F1 | 1.00 [0.72–1.00] | ≥ 0.85 | 100% | 0.00 | ✅ Pass |
| checkRetractionStatus (offline catalog) | Layer B | FPR | 0.00 [0.00–0.32] | ≤ 0.02 | 100% | 0.00 | ✅ Pass |
| sanitizePromptInjectionAndHiddenContent | Layer B | Recall | 1.00 [0.51–1.00] | ≥ 0.90 | 100% | 0.00 | ✅ Pass |
| detectLanguageIntegrity | Layer B | Accuracy | 1.00 [0.61–1.00] | ≥ 0.95 | 100% | 0.00 | ✅ Pass |
| detectPdfExtractionQuality | Layer B | Accuracy | 1.00 [0.51–1.00] | ≥ 0.90 | 100% | 0.00 | ✅ Pass |
| runHedgingAndOverclaimAudit | Layer B | Precision | 1.00 [0.21–1.00] | ≥ 0.80 | 100% | 0.00 | ✅ Pass |
| extractMandatoryDeclarations | Layer B | F1 | 0.88 [0.53–0.98] | ≥ 0.85 | 100% | 0.00 | ✅ Pass |

---
*Generated deterministically by ManuView Benchmark Runner.*
