/**
 * Statcheck & Statistical Integrity Engine
 * 
 * Implements rigorous, 100% deterministic statistical audit algorithms:
 * 1. APA & Academic Statistical Test Regex Parser (t, F, chi-square, Z, r)
 * 2. Exact Theoretical Distribution CDFs (Student's t, Fisher-Snedecor F, Chi-Square, Standard Normal)
 * 3. Exact P-Value Recalculation & Inconsistency Detection (Rounding errors, Gross inconsistencies)
 * 4. GRIM Test (Granularity-Related Inconsistency of Means)
 */

// -----------------------------------------------------------------------------
// MATHEMATICAL SPECIAL FUNCTIONS (Log-Gamma, Incomplete Beta, Incomplete Gamma)
// -----------------------------------------------------------------------------

/**
 * Log-Gamma function via Lanczos approximation (Numerical Recipes)
 */
export function logGamma(xx: number): number {
  const cof = [
    76.18009172947146,
    -86.50532032941677,
    24.01409824083091,
    -1.231739572450155,
    0.1208650973866179e-2,
    -0.5395239384953e-5,
  ];
  let y = xx;
  let x = xx;
  let tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (let j = 0; j <= 5; j++) {
    ser += cof[j] / ++y;
  }
  return -tmp + Math.log(2.5066282746310005 * ser / x);
}

/**
 * Error function approximation (Abramowitz and Stegun formula 7.1.26, max error < 1.5e-7)
 */
export function erf(x: number): number {
  const sign = x >= 0 ? 1 : -1;
  const absX = Math.abs(x);

  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const t = 1.0 / (1.0 + p * absX);
  const y = 1.0 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t) * Math.exp(-absX * absX);
  return sign * y;
}

/**
 * Continued fraction helper for incomplete beta
 */
function betacf(a: number, b: number, x: number): number {
  const MAXIT = 200;
  const EPS = 3.0e-12;
  const FPMIN = 1.0e-30;
  const qab = a + b;
  const qap = a + 1.0;
  const qam = a - 1.0;
  let c = 1.0;
  let d = 1.0 - qab * x / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1.0 / d;
  let h = d;
  for (let m = 1; m <= MAXIT; m++) {
    const m2 = 2 * m;
    let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
    d = 1.0 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1.0 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1.0 / d;
    h *= d * c;
    aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
    d = 1.0 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1.0 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1.0 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1.0) <= EPS) break;
  }
  return h;
}

/**
 * Regularized incomplete beta function I_x(a, b)
 */
export function regularizedIncompleteBeta(x: number, a: number, b: number): number {
  if (x < 0.0 || x > 1.0) return 0;
  if (x === 0.0) return 0.0;
  if (x === 1.0) return 1.0;
  const bt = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1.0 - x));
  if (x < (a + 1.0) / (a + b + 2.0)) {
    return bt * betacf(a, b, x) / a;
  } else {
    return 1.0 - bt * betacf(b, a, 1.0 - x) / b;
  }
}

/**
 * Series evaluation of lower incomplete gamma function P(a, x)
 */
function gser(a: number, x: number): number {
  const ITMAX = 200;
  const EPS = 3.0e-12;
  let gln = logGamma(a);
  if (x <= 0.0) return 0.0;
  let ap = a;
  let del = 1.0 / a;
  let sum = del;
  for (let n = 1; n <= ITMAX; n++) {
    ++ap;
    del *= x / ap;
    sum += del;
    if (Math.abs(del) < Math.abs(sum) * EPS) {
      return sum * Math.exp(-x + a * Math.log(x) - gln);
    }
  }
  return sum * Math.exp(-x + a * Math.log(x) - gln);
}

/**
 * Continued fraction evaluation of upper incomplete gamma function Q(a, x)
 */
function gcf(a: number, x: number): number {
  const ITMAX = 200;
  const EPS = 3.0e-12;
  const FPMIN = 1.0e-30;
  let gln = logGamma(a);
  let b = x + 1.0 - a;
  let c = 1.0 / FPMIN;
  let d = 1.0 / b;
  let h = d;
  for (let i = 1; i <= ITMAX; i++) {
    let an = -i * (i - a);
    b += 2.0;
    d = an * d + b;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = b + an / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1.0 / d;
    let del = d * c;
    h *= del;
    if (Math.abs(del - 1.0) <= EPS) break;
  }
  return Math.exp(-x + a * Math.log(x) - gln) * h;
}

/**
 * Upper incomplete gamma function Q(a, x) = 1 - P(a, x)
 */
export function upperIncompleteGammaQ(a: number, x: number): number {
  if (x < 0.0 || a <= 0.0) return 1.0;
  if (x < a + 1.0) {
    return 1.0 - gser(a, x);
  } else {
    return gcf(a, x);
  }
}

// -----------------------------------------------------------------------------
// EXACT DISTRIBUTION P-VALUE CALCULATORS
// -----------------------------------------------------------------------------

/**
 * Standard Normal Z two-tailed p-value
 */
export function pValueFromZ(z: number): number {
  if (z === 0) return 1;
  const absZ = Math.abs(z);
  return Math.max(0, Math.min(1, 1 - erf(absZ / Math.SQRT2)));
}

/**
 * Student's t two-tailed p-value with degrees of freedom df
 */
export function pValueFromT(t: number, df: number): number {
  if (df <= 0) return 1;
  const absT = Math.abs(t);
  const x = df / (df + absT * absT);
  return Math.max(0, Math.min(1, regularizedIncompleteBeta(x, df / 2, 0.5)));
}

/**
 * Fisher-Snedecor F upper-tail p-value with df1, df2
 */
export function pValueFromF(f: number, df1: number, df2: number): number {
  if (f <= 0 || df1 <= 0 || df2 <= 0) return 1;
  const x = df2 / (df2 + df1 * f);
  return Math.max(0, Math.min(1, regularizedIncompleteBeta(x, df2 / 2, df1 / 2)));
}

/**
 * Chi-Square upper-tail p-value with degrees of freedom df
 */
export function pValueFromChiSquare(chi2: number, df: number): number {
  if (chi2 <= 0 || df <= 0) return 1;
  return Math.max(0, Math.min(1, upperIncompleteGammaQ(df / 2, chi2 / 2)));
}

/**
 * Pearson correlation r two-tailed p-value with degrees of freedom df (df = N - 2)
 */
export function pValueFromR(r: number, df: number): number {
  if (df <= 0 || Math.abs(r) >= 1) return 0;
  const t = Math.abs(r) * Math.sqrt(df / (1 - r * r));
  return pValueFromT(t, df);
}

// -----------------------------------------------------------------------------
// STATCHECK TYPES & DATA STRUCTURES
// -----------------------------------------------------------------------------

export type TestStatisticType = "t" | "F" | "chi2" | "Z" | "r";

export interface ParsedTestStatistic {
  id: string;
  rawText: string;
  testType: TestStatisticType;
  testValue: number;
  df1: number;
  df2?: number;
  reportedP: number;
  reportedOperator: "=" | "<" | ">" | "<=" | ">=";
  computedP: number;
  isConsistent: boolean;
  isGrossInconsistency: boolean; // e.g. reported sig p<.05 but actual p>.05, or vice-versa
  errorMargin: number;
  explanation: string;
  contextSnippet?: string;
}

export interface StatcheckReport {
  totalTestsFound: number;
  consistentCount: number;
  inconsistentCount: number;
  grossInconsistencyCount: number;
  tests: ParsedTestStatistic[];
  summary: string;
  hasCriticalErrors: boolean;
}

// -----------------------------------------------------------------------------
// REGEX PARSERS FOR ACADEMIC TEST REPORTING
// -----------------------------------------------------------------------------

/**
 * Scans academic text and extracts all standard statistical test reporting instances
 */
export function parseAcademicStatisticalTests(text: string): ParsedTestStatistic[] {
  if (!text || typeof text !== "string") return [];

  const results: ParsedTestStatistic[] = [];
  let testCounter = 0;

  // Pattern 1: t(df) = val, p [=<>] val
  const tRegex = /\b(?:t|t-test)\s*\((\d+)\)\s*=\s*(-?\d+(?:\.\d+)?)\s*[,;]?\s*p\s*([<>=]=?)\s*(\.?\d+(?:\.\d+)?)/gi;
  let match: RegExpExecArray | null;

  while ((match = tRegex.exec(text)) !== null) {
    testCounter++;
    const df = parseInt(match[1], 10);
    const val = parseFloat(match[2]);
    const op = match[3] as "=" | "<" | ">" | "<=" | ">=";
    const pStr = match[4].startsWith(".") ? `0${match[4]}` : match[4];
    const reportedP = parseFloat(pStr);

    const computedP = pValueFromT(val, df);
    const { isConsistent, isGross, explanation } = evaluateConsistency(computedP, reportedP, op);

    const start = Math.max(0, match.index - 50);
    const end = Math.min(text.length, match.index + match[0].length + 50);

    results.push({
      id: `stat-t-${testCounter}`,
      rawText: match[0],
      testType: "t",
      testValue: val,
      df1: df,
      reportedP,
      reportedOperator: op,
      computedP: Number(computedP.toFixed(4)),
      isConsistent,
      isGrossInconsistency: isGross,
      errorMargin: Number(Math.abs(computedP - reportedP).toFixed(4)),
      explanation,
      contextSnippet: text.substring(start, end).trim(),
    });
  }

  // Pattern 2: F(df1, df2) = val, p [=<>] val
  const fRegex = /\bF\s*\((\d+)\s*,\s*(\d+)\)\s*=\s*(\d+(?:\.\d+)?)\s*[,;]?\s*p\s*([<>=]=?)\s*(\.?\d+(?:\.\d+)?)/gi;
  while ((match = fRegex.exec(text)) !== null) {
    testCounter++;
    const df1 = parseInt(match[1], 10);
    const df2 = parseInt(match[2], 10);
    const val = parseFloat(match[3]);
    const op = match[4] as "=" | "<" | ">" | "<=" | ">=";
    const pStr = match[5].startsWith(".") ? `0${match[5]}` : match[5];
    const reportedP = parseFloat(pStr);

    const computedP = pValueFromF(val, df1, df2);
    const { isConsistent, isGross, explanation } = evaluateConsistency(computedP, reportedP, op);

    const start = Math.max(0, match.index - 50);
    const end = Math.min(text.length, match.index + match[0].length + 50);

    results.push({
      id: `stat-f-${testCounter}`,
      rawText: match[0],
      testType: "F",
      testValue: val,
      df1,
      df2,
      reportedP,
      reportedOperator: op,
      computedP: Number(computedP.toFixed(4)),
      isConsistent,
      isGrossInconsistency: isGross,
      errorMargin: Number(Math.abs(computedP - reportedP).toFixed(4)),
      explanation,
      contextSnippet: text.substring(start, end).trim(),
    });
  }

  // Pattern 3: chi^2(df) or X^2(df) = val, p [=<>] val
  const chiRegex = /\b(?:χ2?|chi(?:2|squared)?|X2)\s*\((\d+)\)\s*=\s*(\d+(?:\.\d+)?)\s*[,;]?\s*p\s*([<>=]=?)\s*(\.?\d+(?:\.\d+)?)/gi;
  while ((match = chiRegex.exec(text)) !== null) {
    testCounter++;
    const df = parseInt(match[1], 10);
    const val = parseFloat(match[2]);
    const op = match[3] as "=" | "<" | ">" | "<=" | ">=";
    const pStr = match[4].startsWith(".") ? `0${match[4]}` : match[4];
    const reportedP = parseFloat(pStr);

    const computedP = pValueFromChiSquare(val, df);
    const { isConsistent, isGross, explanation } = evaluateConsistency(computedP, reportedP, op);

    const start = Math.max(0, match.index - 50);
    const end = Math.min(text.length, match.index + match[0].length + 50);

    results.push({
      id: `stat-chi-${testCounter}`,
      rawText: match[0],
      testType: "chi2",
      testValue: val,
      df1: df,
      reportedP,
      reportedOperator: op,
      computedP: Number(computedP.toFixed(4)),
      isConsistent,
      isGrossInconsistency: isGross,
      errorMargin: Number(Math.abs(computedP - reportedP).toFixed(4)),
      explanation,
      contextSnippet: text.substring(start, end).trim(),
    });
  }

  // Pattern 4: Z = val, p [=<>] val
  const zRegex = /\bZ\s*=\s*(-?\d+(?:\.\d+)?)\s*[,;]?\s*p\s*([<>=]=?)\s*(\.?\d+(?:\.\d+)?)/gi;
  while ((match = zRegex.exec(text)) !== null) {
    testCounter++;
    const val = parseFloat(match[1]);
    const op = match[2] as "=" | "<" | ">" | "<=" | ">=";
    const pStr = match[3].startsWith(".") ? `0${match[3]}` : match[3];
    const reportedP = parseFloat(pStr);

    const computedP = pValueFromZ(val);
    const { isConsistent, isGross, explanation } = evaluateConsistency(computedP, reportedP, op);

    const start = Math.max(0, match.index - 50);
    const end = Math.min(text.length, match.index + match[0].length + 50);

    results.push({
      id: `stat-z-${testCounter}`,
      rawText: match[0],
      testType: "Z",
      testValue: val,
      df1: 0,
      reportedP,
      reportedOperator: op,
      computedP: Number(computedP.toFixed(4)),
      isConsistent,
      isGrossInconsistency: isGross,
      errorMargin: Number(Math.abs(computedP - reportedP).toFixed(4)),
      explanation,
      contextSnippet: text.substring(start, end).trim(),
    });
  }

  // Pattern 5: r(df) = val, p [=<>] val
  const rRegex = /\br\s*\((\d+)\)\s*=\s*(-?\d+(?:\.\d+)?)\s*[,;]?\s*p\s*([<>=]=?)\s*(\.?\d+(?:\.\d+)?)/gi;
  while ((match = rRegex.exec(text)) !== null) {
    testCounter++;
    const df = parseInt(match[1], 10);
    const val = parseFloat(match[2]);
    const op = match[3] as "=" | "<" | ">" | "<=" | ">=";
    const pStr = match[4].startsWith(".") ? `0${match[4]}` : match[4];
    const reportedP = parseFloat(pStr);

    const computedP = pValueFromR(val, df);
    const { isConsistent, isGross, explanation } = evaluateConsistency(computedP, reportedP, op);

    const start = Math.max(0, match.index - 50);
    const end = Math.min(text.length, match.index + match[0].length + 50);

    results.push({
      id: `stat-r-${testCounter}`,
      rawText: match[0],
      testType: "r",
      testValue: val,
      df1: df,
      reportedP,
      reportedOperator: op,
      computedP: Number(computedP.toFixed(4)),
      isConsistent,
      isGrossInconsistency: isGross,
      errorMargin: Number(Math.abs(computedP - reportedP).toFixed(4)),
      explanation,
      contextSnippet: text.substring(start, end).trim(),
    });
  }

  return results;
}

/**
 * Evaluates whether reported p-value is consistent with mathematically computed p-value
 */
function evaluateConsistency(
  computedP: number,
  reportedP: number,
  operator: string
): { isConsistent: boolean; isGross: boolean; explanation: string } {
  const alpha = 0.05;
  const tol = 0.015; // standard tolerance for 2-decimal rounding

  let isConsistent = true;
  let isGross = false;

  if (operator === "=") {
    if (Math.abs(computedP - reportedP) > tol) {
      isConsistent = false;
      // Gross inconsistency: reported < .05 but computed >= .05 or vice versa
      if ((reportedP < alpha && computedP >= alpha) || (reportedP >= alpha && computedP < alpha)) {
        isGross = true;
      }
    }
  } else if (operator === "<" || operator === "<=") {
    if (computedP > reportedP + tol) {
      isConsistent = false;
      if (computedP >= alpha && reportedP <= alpha) {
        isGross = true;
      }
    }
  } else if (operator === ">" || operator === ">=") {
    if (computedP < reportedP - tol) {
      isConsistent = false;
      if (computedP < alpha && reportedP >= alpha) {
        isGross = true;
      }
    }
  }

  let explanation = "Mathematically consistent with theoretical sampling distribution.";
  if (isGross) {
    explanation = `Gross statistical discrepancy: Reported p ${operator} ${reportedP}, but exact theoretical distribution yields p = ${computedP.toFixed(4)}. Changes statistical significance status across the α = 0.05 threshold.`;
  } else if (!isConsistent) {
    explanation = `Minor rounding inconsistency: Reported p ${operator} ${reportedP}, while exact theoretical computation yields p = ${computedP.toFixed(4)}.`;
  }

  return { isConsistent, isGross, explanation };
}

/**
 * Runs the full Statcheck audit across a manuscript's text
 */
export function runStatcheckAudit(manuscriptText: string): StatcheckReport {
  const tests = parseAcademicStatisticalTests(manuscriptText);
  const totalTestsFound = tests.length;
  const consistentCount = tests.filter((t) => t.isConsistent).length;
  const inconsistentCount = tests.filter((t) => !t.isConsistent).length;
  const grossInconsistencyCount = tests.filter((t) => t.isGrossInconsistency).length;

  let summary = "";
  if (totalTestsFound === 0) {
    summary = "No standard APA statistical tests (t, F, χ², Z, r) detected in the manuscript text.";
  } else if (grossInconsistencyCount > 0) {
    summary = `Flagged ${grossInconsistencyCount} gross statistical discrepancies where reported p-values conflict with theoretical test distributions across the α = 0.05 significance threshold.`;
  } else if (inconsistentCount > 0) {
    summary = `Detected ${inconsistentCount} minor rounding inconsistencies among ${totalTestsFound} statistical tests reported.`;
  } else {
    summary = `All ${totalTestsFound} statistical tests verified with 100% mathematical consistency against theoretical sampling distributions.`;
  }

  return {
    totalTestsFound,
    consistentCount,
    inconsistentCount,
    grossInconsistencyCount,
    tests,
    summary,
    hasCriticalErrors: grossInconsistencyCount > 0,
  };
}

// -----------------------------------------------------------------------------
// GRIM TEST (Granularity-Related Inconsistency of Means)
// -----------------------------------------------------------------------------

export interface GrimItemResult {
  reportedMean: number;
  sampleSize: number;
  decimals: number;
  isValid: boolean;
  closestValidMean: number;
  discrepancy: number;
  explanation: string;
}

/**
 * Validates whether a reported sample mean or percentage is mathematically possible
 * given an integer sample size N (Brown & Heathers, 2017).
 */
export function testGrim(reportedMean: number, sampleSize: number, decimalPlaces?: number): GrimItemResult {
  if (sampleSize <= 0) {
    return {
      reportedMean,
      sampleSize,
      decimals: 0,
      isValid: true,
      closestValidMean: reportedMean,
      discrepancy: 0,
      explanation: "Sample size must be positive integer.",
    };
  }

  let decimals = decimalPlaces;
  if (decimals === undefined) {
    const parts = reportedMean.toString().split(".");
    decimals = parts.length > 1 ? parts[1].length : 0;
  }

  if (decimals === 0) {
    return {
      reportedMean,
      sampleSize,
      decimals: 0,
      isValid: true,
      closestValidMean: reportedMean,
      discrepancy: 0,
      explanation: "Integer values are always mathematically possible.",
    };
  }

  const intProduct = Math.round(sampleSize * reportedMean);
  const reconstructedMean = Number((intProduct / sampleSize).toFixed(decimals));
  const diff = Math.abs(reconstructedMean - reportedMean);
  const isValid = diff < 1e-6;

  return {
    reportedMean,
    sampleSize,
    decimals,
    isValid,
    closestValidMean: reconstructedMean,
    discrepancy: Number(diff.toFixed(decimals + 1)),
    explanation: isValid
      ? `Mathematically possible: For N = ${sampleSize}, an integer total sum of ${intProduct} produces exactly ${reportedMean}.`
      : `GRIM Discrepancy: For integer sample size N = ${sampleSize}, a mean of ${reportedMean} is mathematically impossible (nearest valid mean is ${reconstructedMean}, total sum = ${intProduct}).`,
  };
}

/**
 * Searches text for patterns like: "M = 3.22, N = 20" or "mean of 4.54 (n = 15)"
 */
export function scanTextForGrimAnomalies(text: string): GrimItemResult[] {
  if (!text) return [];

  const results: GrimItemResult[] = [];
  const grimRegex = /\b(?:mean|M)\s*=\s*(\d+\.\d{1,3})[^\d\n\r]{1,40}\b(?:N|n|sample\s*size)\s*=\s*(\d+)\b/gi;
  let match: RegExpExecArray | null;

  while ((match = grimRegex.exec(text)) !== null) {
    const mean = parseFloat(match[1]);
    const n = parseInt(match[2], 10);
    if (n > 0 && n <= 1000) {
      const result = testGrim(mean, n);
      if (!result.isValid) {
        results.push(result);
      }
    }
  }

  return results;
}
