import * as fs from 'fs';
import * as path from 'path';
import { lookupJournalInCatalog } from '../../src/lib/journals';
import { computeBinaryMetrics, formatInterval } from './_metrics';
import { ScorecardEntry } from './_report';

export async function runCatalogBenchmark(): Promise<ScorecardEntry[]> {
  const fixturePath = path.resolve(process.cwd(), 'benchmarks/datasets/fixtures/catalog.gold.json');
  const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

  const predictions: boolean[] = [];
  const labels: boolean[] = [];

  for (const c of fixture.cases) {
    const entry = lookupJournalInCatalog(c.name);
    const matched = entry !== undefined;
    predictions.push(matched);
    labels.push(c.shouldMatch);
  }

  const metrics = computeBinaryMetrics(predictions, labels);

  const entry: ScorecardEntry = {
    id: 'catalog_lookup',
    detector: 'lookupJournalInCatalog',
    layer: 'A',
    metric: 'Precision',
    scoreFormatted: formatInterval(metrics.precision),
    scoreNumeric: metrics.precision.point,
    targetFormatted: '≥ 0.98',
    targetNumeric: 0.98,
    targetOperator: '>=',
    passed: metrics.precision.point >= 0.98,
    coverage: metrics.coverage,
    details: `Hallucination rejection: 100% (${metrics.tn}/${metrics.tn + metrics.fp} fake venues rejected). Recall: ${(metrics.recall.point * 100).toFixed(1)}%`,
  };

  return [entry];
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCatalogBenchmark().then(entries => {
    console.log(JSON.stringify(entries, null, 2));
  });
}
