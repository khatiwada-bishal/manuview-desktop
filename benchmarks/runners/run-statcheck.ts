import * as fs from 'fs';
import * as path from 'path';
import {
  pValueFromT,
  pValueFromF,
  pValueFromChiSquare,
  pValueFromZ,
  pValueFromR,
  runStatcheckAudit,
} from '../../src/lib/statcheck';
import { computeBinaryMetrics, computeNumericMetrics } from './_metrics';
import { ScorecardEntry } from './_report';

export async function runStatcheckBenchmark(): Promise<ScorecardEntry[]> {
  const fixturePath = path.resolve(process.cwd(), 'benchmarks/datasets/fixtures/statcheck.gold.json');
  const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

  // 1. Evaluate mathematical p-values against reference values
  const predictions: number[] = [];
  const references: number[] = [];

  for (const item of fixture.referencePValues) {
    let p = 0;
    if (item.test === 't') p = pValueFromT(item.val, item.df);
    else if (item.test === 'F') p = pValueFromF(item.val, item.df1, item.df2);
    else if (item.test === 'chi2') p = pValueFromChiSquare(item.val, item.df);
    else if (item.test === 'z') p = pValueFromZ(item.val);
    else if (item.test === 'r') p = pValueFromR(item.val, item.n - 2);

    predictions.push(p);
    references.push(item.expectedP);
  }

  const numMetrics = computeNumericMetrics(predictions, references);

  // Target: Max abs error < 2e-3 across approximations
  const mathEntry: ScorecardEntry = {
    id: 'statcheck_math',
    detector: 'pValueFromT/F/ChiSquare/Z/R',
    layer: 'A',
    metric: 'Max abs error',
    scoreFormatted: numMetrics.maxAbsoluteError.toExponential(2),
    scoreNumeric: numMetrics.maxAbsoluteError,
    targetFormatted: '< 2e-3',
    targetNumeric: 0.002,
    targetOperator: '<=',
    passed: numMetrics.maxAbsoluteError <= 0.002,
    coverage: 1.0,
    details: `Evaluated ${numMetrics.count} test configurations. MAE: ${numMetrics.meanAbsoluteError.toExponential(2)}`,
  };

  // 2. Evaluate statcheck text inconsistency detector
  const auditPreds: boolean[] = [];
  const auditLabels: boolean[] = [];

  for (const c of fixture.auditCases) {
    const auditResult = runStatcheckAudit(c.text);
    const hasInconsistent = auditResult.tests.some(t => !t.isConsistent);
    auditPreds.push(hasInconsistent);
    auditLabels.push(c.hasInconsistency);
  }

  const binMetrics = computeBinaryMetrics(auditPreds, auditLabels);

  const auditEntry: ScorecardEntry = {
    id: 'statcheck_audit',
    detector: 'runStatcheckAudit (inconsistency flags)',
    layer: 'A',
    metric: 'F1',
    scoreFormatted: `${binMetrics.f1.toFixed(2)} [${binMetrics.precision.point.toFixed(2)} prec, ${binMetrics.recall.point.toFixed(2)} rec]`,
    scoreNumeric: binMetrics.f1,
    targetFormatted: '≥ 0.85',
    targetNumeric: 0.85,
    targetOperator: '>=',
    passed: binMetrics.f1 >= 0.85,
    coverage: binMetrics.coverage,
    details: `TP: ${binMetrics.tp}, FP: ${binMetrics.fp}, TN: ${binMetrics.tn}, FN: ${binMetrics.fn}`,
  };

  return [mathEntry, auditEntry];
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runStatcheckBenchmark().then(entries => {
    console.log(JSON.stringify(entries, null, 2));
  });
}
