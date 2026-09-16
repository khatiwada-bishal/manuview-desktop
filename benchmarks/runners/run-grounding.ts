import * as fs from 'fs';
import * as path from 'path';
import { isStructuralAnchorResolvable } from '../../src/lib/engine/validation-gate';
import { computeBinaryMetrics, formatInterval } from './_metrics';
import { ScorecardEntry } from './_report';

export async function runGroundingBenchmark(): Promise<ScorecardEntry[]> {
  const fixturePath = path.resolve(process.cwd(), 'benchmarks/datasets/fixtures/grounding.gold.json');
  const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

  const rawText = fixture.document.rawText;
  const sections = fixture.document.sections;

  const predictions: boolean[] = [];
  const labels: boolean[] = [];

  for (const item of fixture.anchors) {
    const resolvable = isStructuralAnchorResolvable(item.anchor, rawText, sections);
    predictions.push(resolvable);
    labels.push(item.resolvable);
  }

  const metrics = computeBinaryMetrics(predictions, labels);

  const entry: ScorecardEntry = {
    id: 'structural_grounding',
    detector: 'isStructuralAnchorResolvable (grounding gate)',
    layer: 'A',
    metric: 'Precision',
    scoreFormatted: formatInterval(metrics.precision),
    scoreNumeric: metrics.precision.point,
    targetFormatted: '≥ 0.95',
    targetNumeric: 0.95,
    targetOperator: '>=',
    passed: metrics.precision.point >= 0.95,
    coverage: metrics.coverage,
    details: `Suppression accuracy: ${(metrics.accuracy.point * 100).toFixed(1)}%. Recall: ${(metrics.recall.point * 100).toFixed(1)}%. FPR: ${(metrics.falsePositiveRate.point * 100).toFixed(1)}%`,
  };

  return [entry];
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runGroundingBenchmark().then(entries => {
    console.log(JSON.stringify(entries, null, 2));
  });
}
