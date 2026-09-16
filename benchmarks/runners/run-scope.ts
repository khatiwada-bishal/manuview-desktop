import * as fs from 'fs';
import * as path from 'path';
import { isDisciplineMatch } from '../../src/lib/journals';
import { computeBinaryMetrics, formatInterval } from './_metrics';
import { ScorecardEntry } from './_report';

export async function runScopeBenchmark(): Promise<ScorecardEntry[]> {
  const casePath = path.resolve(process.cwd(), 'benchmarks/cases/scope.cases.json');
  const data = JSON.parse(fs.readFileSync(casePath, 'utf8'));

  // Target condition: "Scope Desk-Reject"
  // If isDisciplineMatch returns false -> triggers Desk Reject (true)
  // If isDisciplineMatch returns true -> in-scope (false)
  const deskRejectPreds: boolean[] = [];
  const deskRejectLabels: boolean[] = [];

  for (const c of data.cases) {
    const res = isDisciplineMatch(c.paperDiscipline, c.targetDiscipline);
    const predictedDeskReject = !res.isMatch;
    const actualDeskReject = !c.isMatch;

    deskRejectPreds.push(predictedDeskReject);
    deskRejectLabels.push(actualDeskReject);
  }

  const metrics = computeBinaryMetrics(deskRejectPreds, deskRejectLabels);

  const entry: ScorecardEntry = {
    id: 'scope_desk_reject_gate',
    detector: 'isDisciplineMatch (scope desk-reject gate)',
    layer: 'B',
    metric: 'Scope-FPR',
    scoreFormatted: formatInterval(metrics.falsePositiveRate),
    scoreNumeric: metrics.falsePositiveRate.point,
    targetFormatted: '≤ 0.05',
    targetNumeric: 0.05,
    targetOperator: '<=',
    passed: metrics.falsePositiveRate.point <= 0.05,
    coverage: metrics.coverage,
    details: `FP (false desk-rejects): ${metrics.fp}/${metrics.fp + metrics.tn} in-scope submissions. Out-of-scope Recall: ${(metrics.recall.point * 100).toFixed(1)}% (TP: ${metrics.tp}/${metrics.tp + metrics.fn})`,
  };

  return [entry];
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runScopeBenchmark().then(entries => {
    console.log(JSON.stringify(entries, null, 2));
  });
}
