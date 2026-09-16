import * as fs from 'fs';
import * as path from 'path';
import { parseManuscriptText } from '../../src/lib/parser';
import { computeBinaryMetrics, formatInterval } from './_metrics';
import { ScorecardEntry } from './_report';

export async function runImradBenchmark(): Promise<ScorecardEntry[]> {
  const casePath = path.resolve(process.cwd(), 'benchmarks/cases/imrad.cases.json');
  const data = JSON.parse(fs.readFileSync(casePath, 'utf8'));

  const sectionPredictions: boolean[] = [];
  const sectionLabels: boolean[] = [];

  const standardSections = ['abstract', 'introduction', 'methodology', 'results', 'discussion', 'conclusion'];

  for (const c of data.cases) {
    const parsed = parseManuscriptText(c.text);
    const parsedSections = parsed.sections || {};

    for (const sec of standardSections) {
      const expectedText = c.expectedSections[sec];
      if (expectedText) {
        sectionLabels.push(true);
        let actualText = parsedSections[sec];
        if (sec === 'abstract') {
          actualText = parsed.abstract || parsedSections.abstract;
        } else if (sec === 'methodology') {
          actualText = parsedSections.methods || parsedSections.methodology;
        }
        const isHit = Boolean(actualText && actualText.trim().length > 0 && actualText.includes(expectedText.slice(0, 30)));
        sectionPredictions.push(isHit);
      }
    }
  }

  const metrics = computeBinaryMetrics(sectionPredictions, sectionLabels);

  const entry: ScorecardEntry = {
    id: 'imrad_sectioning',
    detector: 'parseRawTextToManuscript (IMRaD sectioning)',
    layer: 'B',
    metric: 'Section-F1',
    scoreFormatted: formatInterval(metrics.recall),
    scoreNumeric: metrics.f1,
    targetFormatted: '≥ 0.85',
    targetNumeric: 0.85,
    targetOperator: '>=',
    passed: metrics.f1 >= 0.85,
    coverage: metrics.coverage,
    details: `Extracted ${metrics.tp}/${metrics.tp + metrics.fn} gold IMRaD sections. Precision: ${(metrics.precision.point * 100).toFixed(1)}%, Recall: ${(metrics.recall.point * 100).toFixed(1)}%`,
  };

  return [entry];
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runImradBenchmark().then(entries => {
    console.log(JSON.stringify(entries, null, 2));
  });
}
