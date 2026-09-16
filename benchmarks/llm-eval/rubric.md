# Layer C — Human Adjudication & LLM Evaluation Protocol

This protocol guides human adjudication of simulated peer review reports produced by ManuView to measure qualitative verdict consistency, groundedness, specificity, and absence of hallucinations.

---

## 1. Evaluation Dimensions

Raters evaluate each diagnostic report across five dimensions on a 1–5 Likert scale or binary flags:

### 1. Groundedness (Verifiability)
- **Target**: $\ge 90\%$ of critiques verifiable in manuscript text.
- **5 (Exemplary)**: Every critique cites a verifiable quote, table, figure, or equation that exists in the text.
- **3 (Acceptable)**: Most critiques reference real content; some general comments lack precise anchors.
- **1 (Ungrounded)**: Critiques reference sections, results, or data not found anywhere in the submitted draft.

### 2. Hallucination Rate
- **Target**: 0 fabricated facts / nonexistent structural anchors per report.
- Evaluates whether the model invented structural elements (e.g. "Table 5" when only 3 tables exist) or hallucinated bibliometric metrics (such as invented impact factors).

### 3. Specificity & Actionability
- **Target**: $\ge 80\%$ of priority issues provide concrete, feasible revision instructions and rebuttal strategies for the formal journal response letter.
- **5 (Actionable)**: Author can directly execute the revision roadmap and drafted response.
- **1 (Vague)**: Generic feedback such as "improve writing" or "add more data" without details.

### 4. Triage Agreement (Cohen's $\kappa$)
- **Target**: $\kappa \ge 0.40$ against human expert panel triage.
- Adjudicators classify the paper into one of four editorial decisions:
  1. `Desk Reject` (out of scope, non-academic, critical ethical/integrity failure)
  2. `Major Revision` (substantive methodological/statistical concerns)
  3. `Minor Revision` (sound empirical core, requires reporting/framing refinement)
  4. `Reject / Resubmit` (requires substantial additional experiments)

---

## 2. Multi-Run Determinism Protocol

To guarantee on-device or cloud SLM dependability:
1. Fix temperature to $0.0$ and pin model release version.
2. Execute each benchmark manuscript **3 times** consecutively.
3. Compute run-to-run variance of dimension scores (0–100) and readiness bands.
4. Flag any non-deterministic drift in editorial triage or priority issue ordering.
