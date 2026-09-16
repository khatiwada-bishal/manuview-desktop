/**
 * Scientific Metrics Library for ManuView Benchmarks
 * 
 * Provides rigorous mathematical definitions for benchmark evaluation:
 * - 95% Wilson score confidence intervals for binomial proportions
 * - Binary classification (Precision, Recall, F1, Accuracy, False Positive Rate)
 * - Multi-class classification (Macro-F1, Per-class F1, Confusion Matrix)
 * - Numerical errors (Max Absolute Error, Mean Absolute Error)
 * - Text span metrics (Character-level IoU, Span F1 at IoU >= 0.5)
 * - Coverage & Abstention tracking
 */

export interface ConfidenceInterval {
  point: number;
  low: number;
  high: number;
}

export interface BinaryMetrics {
  total: number;
  tp: number;
  fp: number;
  tn: number;
  fn: number;
  precision: ConfidenceInterval;
  recall: ConfidenceInterval;
  f1: number;
  accuracy: ConfidenceInterval;
  falsePositiveRate: ConfidenceInterval;
  coverage: number;
}

export interface MultiClassMetrics {
  total: number;
  classes: string[];
  perClass: Record<string, {
    tp: number;
    fp: number;
    fn: number;
    precision: number;
    recall: number;
    f1: number;
    support: number;
  }>;
  macroF1: number;
  accuracy: number;
  confusionMatrix: Record<string, Record<string, number>>;
}

export interface NumericMetrics {
  count: number;
  maxAbsoluteError: number;
  meanAbsoluteError: number;
  rootMeanSquaredError: number;
}

export interface SpanMetricResult {
  sectionName: string;
  iou: number;
  hit: boolean; // IoU >= 0.5
}

/**
 * Wilson score interval with continuity correction for binomial proportions.
 * Standard critical value z = 1.95996 for 95% confidence.
 */
export function wilsonScoreInterval(successes: number, total: number, z = 1.95996): [number, number] {
  if (total <= 0) return [0, 0];
  const p = successes / total;
  const z2 = z * z;
  
  const denom = 1 + z2 / total;
  const center = (p + z2 / (2 * total)) / denom;
  const halfWidth = (z * Math.sqrt((p * (1 - p) / total) + (z2 / (4 * total * total)))) / denom;
  
  const low = Math.max(0, center - halfWidth);
  const high = Math.min(1, center + halfWidth);
  return [Number(low.toFixed(4)), Number(high.toFixed(4))];
}

export function computeBinaryMetrics(
  predictions: boolean[],
  labels: boolean[],
  decidedMask?: boolean[]
): BinaryMetrics {
  const total = predictions.length;
  if (total === 0) {
    const emptyCI = { point: 0, low: 0, high: 0 };
    return {
      total: 0,
      tp: 0,
      fp: 0,
      tn: 0,
      fn: 0,
      precision: emptyCI,
      recall: emptyCI,
      f1: 0,
      accuracy: emptyCI,
      falsePositiveRate: emptyCI,
      coverage: 0,
    };
  }

  let tp = 0;
  let fp = 0;
  let tn = 0;
  let fn = 0;
  let evaluatedCount = 0;

  for (let i = 0; i < total; i++) {
    const isDecided = decidedMask ? decidedMask[i] : true;
    if (!isDecided) continue;

    evaluatedCount++;
    const pred = predictions[i];
    const actual = labels[i];

    if (pred && actual) tp++;
    else if (pred && !actual) fp++;
    else if (!pred && !actual) tn++;
    else if (!pred && actual) fn++;
  }

  const precPoint = tp + fp > 0 ? tp / (tp + fp) : 0;
  const [precLow, precHigh] = tp + fp > 0 ? wilsonScoreInterval(tp, tp + fp) : [0, 0];

  const recPoint = tp + fn > 0 ? tp / (tp + fn) : 0;
  const [recLow, recHigh] = tp + fn > 0 ? wilsonScoreInterval(tp, tp + fn) : [0, 0];

  const f1 = precPoint + recPoint > 0 ? (2 * precPoint * recPoint) / (precPoint + recPoint) : 0;

  const accPoint = evaluatedCount > 0 ? (tp + tn) / evaluatedCount : 0;
  const [accLow, accHigh] = evaluatedCount > 0 ? wilsonScoreInterval(tp + tn, evaluatedCount) : [0, 0];

  const negTotal = fp + tn;
  const fprPoint = negTotal > 0 ? fp / negTotal : 0;
  const [fprLow, fprHigh] = negTotal > 0 ? wilsonScoreInterval(fp, negTotal) : [0, 0];

  return {
    total,
    tp,
    fp,
    tn,
    fn,
    precision: { point: Number(precPoint.toFixed(4)), low: precLow, high: precHigh },
    recall: { point: Number(recPoint.toFixed(4)), low: recLow, high: recHigh },
    f1: Number(f1.toFixed(4)),
    accuracy: { point: Number(accPoint.toFixed(4)), low: accLow, high: accHigh },
    falsePositiveRate: { point: Number(fprPoint.toFixed(4)), low: fprLow, high: fprHigh },
    coverage: Number((evaluatedCount / total).toFixed(4)),
  };
}

export function computeMultiClassMetrics(
  predictions: string[],
  labels: string[]
): MultiClassMetrics {
  const total = predictions.length;
  const classSet = new Set<string>();
  for (const l of labels) classSet.add(l);
  for (const p of predictions) classSet.add(p);
  const classes = Array.from(classSet).sort();

  const confusionMatrix: Record<string, Record<string, number>> = {};
  for (const c1 of classes) {
    confusionMatrix[c1] = {};
    for (const c2 of classes) {
      confusionMatrix[c1][c2] = 0;
    }
  }

  let correctCount = 0;
  for (let i = 0; i < total; i++) {
    const act = labels[i];
    const pred = predictions[i];
    if (confusionMatrix[act] && confusionMatrix[act][pred] !== undefined) {
      confusionMatrix[act][pred]++;
    }
    if (act === pred) correctCount++;
  }

  const perClass: MultiClassMetrics['perClass'] = {};
  let macroF1Sum = 0;

  for (const cls of classes) {
    let tp = 0;
    let fp = 0;
    let fn = 0;
    let support = 0;

    for (let i = 0; i < total; i++) {
      const act = labels[i];
      const pred = predictions[i];
      if (act === cls) support++;

      if (pred === cls && act === cls) tp++;
      else if (pred === cls && act !== cls) fp++;
      else if (pred !== cls && act === cls) fn++;
    }

    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

    perClass[cls] = {
      tp,
      fp,
      fn,
      precision: Number(precision.toFixed(4)),
      recall: Number(recall.toFixed(4)),
      f1: Number(f1.toFixed(4)),
      support,
    };

    macroF1Sum += f1;
  }

  return {
    total,
    classes,
    perClass,
    macroF1: Number((macroF1Sum / (classes.length || 1)).toFixed(4)),
    accuracy: total > 0 ? Number((correctCount / total).toFixed(4)) : 0,
    confusionMatrix,
  };
}

export function computeNumericMetrics(predictions: number[], labels: number[]): NumericMetrics {
  const count = Math.min(predictions.length, labels.length);
  if (count === 0) {
    return { count: 0, maxAbsoluteError: 0, meanAbsoluteError: 0, rootMeanSquaredError: 0 };
  }

  let maxAbs = 0;
  let sumAbs = 0;
  let sumSq = 0;

  for (let i = 0; i < count; i++) {
    const diff = Math.abs(predictions[i] - labels[i]);
    if (diff > maxAbs) maxAbs = diff;
    sumAbs += diff;
    sumSq += diff * diff;
  }

  return {
    count,
    maxAbsoluteError: Number(maxAbs.toFixed(6)),
    meanAbsoluteError: Number((sumAbs / count).toFixed(6)),
    rootMeanSquaredError: Number(Math.sqrt(sumSq / count).toFixed(6)),
  };
}

export function computeSpanIoU(
  predSpan: { start: number; end: number } | undefined,
  goldSpan: { start: number; end: number } | undefined
): number {
  if (!predSpan || !goldSpan) return 0;
  const intersectStart = Math.max(predSpan.start, goldSpan.start);
  const intersectEnd = Math.min(predSpan.end, goldSpan.end);
  const intersection = Math.max(0, intersectEnd - intersectStart);

  const unionStart = Math.min(predSpan.start, goldSpan.start);
  const unionEnd = Math.max(predSpan.end, goldSpan.end);
  const union = Math.max(0, unionEnd - unionStart);

  return union > 0 ? Number((intersection / union).toFixed(4)) : 0;
}

export function formatInterval(ci: ConfidenceInterval): string {
  return `${ci.point.toFixed(2)} [${ci.low.toFixed(2)}–${ci.high.toFixed(2)}]`;
}
