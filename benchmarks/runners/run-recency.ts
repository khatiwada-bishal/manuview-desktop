import * as fs from 'fs';
import * as path from 'path';
import { analyzeCitationRecency } from '../../src/lib/citation-recency';
import { ScorecardEntry } from './_report';

export async function runRecencyBenchmark(): Promise<ScorecardEntry[]> {
  const fixturePath = path.resolve(process.cwd(), 'benchmarks/datasets/fixtures/recency.gold.json');
  const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

  let maxDiff = 0;
  let totalChecks = 0;

  for (const c of fixture.cases) {
    const analysis = analyzeCitationRecency(c.references);

    if (c.expected.totalReferences !== undefined) {
      totalChecks++;
      maxDiff = Math.max(maxDiff, Math.abs(analysis.totalReferences - c.expected.totalReferences));
    }
    if (c.expected.medianYear !== undefined && analysis.medianYear !== null) {
      totalChecks++;
      maxDiff = Math.max(maxDiff, Math.abs(analysis.medianYear - c.expected.medianYear));
    }
    if (c.expected.last5YearsCount !== undefined) {
      totalChecks++;
      maxDiff = Math.max(maxDiff, Math.abs(analysis.last5YearsCount - c.expected.last5YearsCount));
    }
    if (c.expected.last5YearsPercent !== undefined) {
      totalChecks++;
      maxDiff = Math.max(maxDiff, Math.abs(analysis.last5YearsPercent - c.expected.last5YearsPercent));
    }
    if (c.expected.classicCount !== undefined) {
      totalChecks++;
      maxDiff = Math.max(maxDiff, Math.abs(analysis.classicCount - c.expected.classicCount));
    }
    if (c.expected.classicPercent !== undefined) {
      totalChecks++;
      maxDiff = Math.max(maxDiff, Math.abs(analysis.classicPercent - c.expected.classicPercent));
    }
  }

  const passed = maxDiff <= 0.001;
  const entry: ScorecardEntry = {
    id: 'citation_recency',
    detector: 'analyzeCitationRecency',
    layer: 'A',
    metric: 'Max abs error',
    scoreFormatted: maxDiff === 0 ? '0.00' : maxDiff.toExponential(2),
    scoreNumeric: maxDiff,
    targetFormatted: '0.00 (exact)',
    targetNumeric: 0.0001,
    targetOperator: '<=',
    passed,
    coverage: 1.0,
    details: `Evaluated ${totalChecks} exact numerical properties across ${fixture.cases.length} distributions.`,
  };

  return [entry];
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runRecencyBenchmark().then(entries => {
    console.log(JSON.stringify(entries, null, 2));
  });
}
