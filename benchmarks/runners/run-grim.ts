import * as fs from 'fs';
import * as path from 'path';
import { testGrim } from '../../src/lib/statcheck';
import { computeBinaryMetrics, formatInterval } from './_metrics';
import { ScorecardEntry } from './_report';

export async function runGrimBenchmark(): Promise<ScorecardEntry[]> {
  const fixturePath = path.resolve(process.cwd(), 'benchmarks/datasets/fixtures/grim.gold.json');
  const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

  const predictions: boolean[] = [];
  const labels: boolean[] = [];

  for (const c of fixture.cases) {
    const res = testGrim(parseFloat(c.mean), c.n);
    predictions.push(res.isValid);
    labels.push(c.consistent);
  }

  const metrics = computeBinaryMetrics(predictions, labels);

  const entry: ScorecardEntry = {
    id: 'grim_test',
    detector: 'testGrim (granularity of means)',
    layer: 'A',
    metric: 'Accuracy',
    scoreFormatted: formatInterval(metrics.accuracy),
    scoreNumeric: metrics.accuracy.point,
    targetFormatted: '≥ 0.98',
    targetNumeric: 0.98,
    targetOperator: '>=',
    passed: metrics.accuracy.point >= 0.98,
    coverage: metrics.coverage,
    details: `${fixture.cases.length} cases evaluated. Correct: ${metrics.tp + metrics.tn}/${metrics.total}`,
  };

  return [entry];
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runGrimBenchmark().then(entries => {
    console.log(JSON.stringify(entries, null, 2));
  });
}
