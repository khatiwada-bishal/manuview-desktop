import test from "node:test";
import assert from "node:assert/strict";
import {
  pValueFromT,
  pValueFromF,
  pValueFromChiSquare,
  pValueFromZ,
  pValueFromR,
  testGrim,
  runStatcheckAudit,
  logGamma,
} from "../src/lib/statcheck.ts";

test("logGamma matches standard mathematical reference values", () => {
  // Gamma(1) = 1, ln(Gamma(1)) = 0
  assert.ok(Math.abs(logGamma(1)) < 1e-6, "ln(Gamma(1)) should be ~0");
  // Gamma(5) = 4! = 24, ln(24) ≈ 3.17805383
  assert.ok(Math.abs(logGamma(5) - Math.log(24)) < 1e-6, "ln(Gamma(5)) should be ln(24)");
  // Gamma(0.5) = sqrt(pi) ≈ 1.77245385
  assert.ok(Math.abs(logGamma(0.5) - Math.log(Math.sqrt(Math.PI))) < 1e-6, "ln(Gamma(0.5)) should be ln(sqrt(pi))");
});

test("pValueFromT computes accurate Student's t two-tailed p-values", () => {
  // t = 0 -> p = 1
  assert.equal(pValueFromT(0, 10), 1.0);

  // t = 2.0, df = 10 -> SciPy: 0.073387...
  const p1 = pValueFromT(2.0, 10);
  assert.ok(Math.abs(p1 - 0.073387) < 0.001, `Expected ~0.0734, got ${p1}`);

  // t = 2.228, df = 10 -> critical t at 0.05
  const p2 = pValueFromT(2.228, 10);
  assert.ok(Math.abs(p2 - 0.05) < 0.002, `Expected ~0.05, got ${p2}`);

  // Negative t should produce identical two-tailed p-value
  assert.equal(pValueFromT(-2.0, 10), pValueFromT(2.0, 10));
});

test("pValueFromF computes accurate Fisher-Snedecor F upper-tail p-values", () => {
  // F = 4.0, df1 = 2, df2 = 20 -> SciPy: ~0.0345
  const p1 = pValueFromF(4.0, 2, 20);
  assert.ok(Math.abs(p1 - 0.0345) < 0.001, `Expected ~0.0345, got ${p1}`);

  // F = 1.0, df1 = 1, df2 = 10 -> SciPy: ~0.3409
  const p2 = pValueFromF(1.0, 1, 10);
  assert.ok(Math.abs(p2 - 0.3409) < 0.002, `Expected ~0.3409, got ${p2}`);
});

test("pValueFromChiSquare computes accurate Chi-Square p-values", () => {
  // Chi2 = 5.991, df = 2 -> critical value at alpha = 0.05
  const p1 = pValueFromChiSquare(5.991, 2);
  assert.ok(Math.abs(p1 - 0.05) < 0.002, `Expected ~0.05, got ${p1}`);

  // Chi2 = 3.841, df = 1 -> critical value at alpha = 0.05
  const p2 = pValueFromChiSquare(3.841, 1);
  assert.ok(Math.abs(p2 - 0.05) < 0.002, `Expected ~0.05, got ${p2}`);
});

test("pValueFromZ computes accurate Standard Normal two-tailed p-values", () => {
  // Z = 0 -> p = 1
  assert.equal(pValueFromZ(0), 1.0);

  // Z = 1.96 -> two-tailed p ≈ 0.0500
  const p1 = pValueFromZ(1.96);
  assert.ok(Math.abs(p1 - 0.05) < 0.002, `Expected ~0.05, got ${p1}`);

  // Z = 2.576 -> two-tailed p ≈ 0.0100
  const p2 = pValueFromZ(2.576);
  assert.ok(Math.abs(p2 - 0.01) < 0.002, `Expected ~0.01, got ${p2}`);
});

test("pValueFromR computes accurate Pearson r p-values", () => {
  // r = 0.5, df = 18 (N = 20) -> p ≈ 0.0248
  const p = pValueFromR(0.5, 18);
  assert.ok(Math.abs(p - 0.0248) < 0.002, `Expected ~0.0248, got ${p}`);
});

test("testGrim correctly evaluates granularity-related consistency of means", () => {
  // Possible: N = 20, Mean = 3.25 -> 20 * 3.25 = 65 (exact integer)
  const grim1 = testGrim(3.25, 20);
  assert.equal(grim1.isValid, true);

  // Impossible: N = 20, Mean = 3.22 -> 20 * 3.22 = 64.4 (non-integer)
  const grim2 = testGrim(3.22, 20);
  assert.equal(grim2.isValid, false);
  assert.equal(grim2.closestValidMean, 3.2);

  // Brown & Heathers (2017) benchmark: N = 10, Mean = 1.15 -> 10 * 1.15 = 11.5 (impossible)
  const grim3 = testGrim(1.15, 10);
  assert.equal(grim3.isValid, false);
});

test("runStatcheckAudit flags gross statistical inconsistencies in text", () => {
  const text = `
    In Study 1, participants showed significant improvement, t(28) = 2.15, p = .04.
    In Study 2, the interaction was reported as significant, F(2, 30) = 0.50, p < .01.
  `;
  const report = runStatcheckAudit(text);
  assert.equal(report.totalTestsFound, 2);
  assert.equal(report.consistentCount, 1);
  assert.equal(report.grossInconsistencyCount, 1);
  assert.equal(report.hasCriticalErrors, true);
});
