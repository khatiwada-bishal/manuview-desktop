import * as fs from 'fs';
import * as path from 'path';
import { extractPublicationMarkers, extractPreprintMarkers } from '../../src/lib/publication-detector';
import { computeBinaryMetrics, formatInterval } from './_metrics';
import { ScorecardEntry } from './_report';

export async function runPriorPubBenchmark(): Promise<ScorecardEntry[]> {
  const casePath = path.resolve(process.cwd(), 'benchmarks/cases/prior_publication.cases.json');
  const data = JSON.parse(fs.readFileSync(casePath, 'utf8'));

  const pubPredictions: boolean[] = [];
  const pubLabels: boolean[] = [];

  const prepPredictions: boolean[] = [];
  const prepLabels: boolean[] = [];

  for (const c of data.cases) {
    const pubMarkers = extractPublicationMarkers(c.text);
    const prepMarkers = extractPreprintMarkers(c.text, pubMarkers.doi);

    pubPredictions.push(pubMarkers.hasPublishedMarkers);
    pubLabels.push(c.label.isPublished);

    prepPredictions.push(prepMarkers.isPreprint);
    prepLabels.push(c.label.isPreprint);
  }

  const pubMetrics = computeBinaryMetrics(pubPredictions, pubLabels);
  const prepMetrics = computeBinaryMetrics(prepPredictions, prepLabels);

  // Detector #7: Prior publication gate (Primary metric: False Positive Rate)
  const priorPubEntry: ScorecardEntry = {
    id: 'prior_publication_gate',
    detector: 'detectPublishedArticle (gate)',
    layer: 'B',
    metric: 'FPR',
    scoreFormatted: formatInterval(pubMetrics.falsePositiveRate),
    scoreNumeric: pubMetrics.falsePositiveRate.point,
    targetFormatted: '≤ 0.02',
    targetNumeric: 0.02,
    targetOperator: '<=',
    passed: pubMetrics.falsePositiveRate.point <= 0.02,
    coverage: pubMetrics.coverage,
    details: `FP: ${pubMetrics.fp}, TN: ${pubMetrics.tn} (Negative set N=${pubMetrics.fp + pubMetrics.tn}). Recall: ${(pubMetrics.recall.point * 100).toFixed(1)}% (TP: ${pubMetrics.tp}/${pubMetrics.tp + pubMetrics.fn})`,
  };

  // Detector #8: extractPreprintMarkers (Accuracy)
  const preprintEntry: ScorecardEntry = {
    id: 'preprint_markers',
    detector: 'extractPreprintMarkers',
    layer: 'B',
    metric: 'Accuracy',
    scoreFormatted: formatInterval(prepMetrics.accuracy),
    scoreNumeric: prepMetrics.accuracy.point,
    targetFormatted: '≥ 0.95',
    targetNumeric: 0.95,
    targetOperator: '>=',
    passed: prepMetrics.accuracy.point >= 0.95,
    coverage: prepMetrics.coverage,
    details: `Correctly classified: ${prepMetrics.tp + prepMetrics.tn}/${prepMetrics.total} (Recall: ${(prepMetrics.recall.point * 100).toFixed(1)}%, Specificity: ${(100 - prepMetrics.falsePositiveRate.point * 100).toFixed(1)}%)`,
  };

  return [priorPubEntry, preprintEntry];
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runPriorPubBenchmark().then(entries => {
    console.log(JSON.stringify(entries, null, 2));
  });
}
