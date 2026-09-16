import * as fs from 'fs';
import * as path from 'path';
import { classifyDocument } from '../../src/lib/parser';
import { computeMultiClassMetrics } from './_metrics';
import { ScorecardEntry } from './_report';

export async function runClassificationBenchmark(): Promise<ScorecardEntry[]> {
  const casePath = path.resolve(process.cwd(), 'benchmarks/cases/classification.cases.json');
  const data = JSON.parse(fs.readFileSync(casePath, 'utf8'));

  const predictions: string[] = [];
  const labels: string[] = [];

  for (const c of data.cases) {
    const res = classifyDocument(c.text);
    predictions.push(res.category);
    labels.push(c.expectedCategory);
  }

  const metrics = computeMultiClassMetrics(predictions, labels);

  const entry: ScorecardEntry = {
    id: 'document_classification',
    detector: 'classifyDocument (multi-class)',
    layer: 'B',
    metric: 'Macro-F1',
    scoreFormatted: `${metrics.macroF1.toFixed(2)} (Acc: ${(metrics.accuracy * 100).toFixed(1)}%)`,
    scoreNumeric: metrics.macroF1,
    targetFormatted: '≥ 0.90',
    targetNumeric: 0.90,
    targetOperator: '>=',
    passed: metrics.macroF1 >= 0.90,
    coverage: 1.0,
    details: `Evaluated ${metrics.total} documents across ${metrics.classes.length} categories: ${metrics.classes.join(', ')}`,
  };

  return [entry];
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runClassificationBenchmark().then(entries => {
    console.log(JSON.stringify(entries, null, 2));
  });
}
