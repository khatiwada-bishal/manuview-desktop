import { runStatcheckBenchmark } from './run-statcheck';
import { runGrimBenchmark } from './run-grim';
import { runRecencyBenchmark } from './run-recency';
import { runGroundingBenchmark } from './run-grounding';
import { runCatalogBenchmark } from './run-catalog';
import { runPriorPubBenchmark } from './run-prior-pub';
import { runScopeBenchmark } from './run-scope';
import { runClassificationBenchmark } from './run-classification';
import { runImradBenchmark } from './run-imrad';
import { runIntegrityBenchmark } from './run-integrity';
import { ScorecardEntry, saveScorecard } from './_report';

async function main() {
  const args = process.argv.slice(2);
  let filterLayer: 'A' | 'B' | null = null;
  let filterDetector: string | null = null;

  for (const arg of args) {
    if (arg === '--layer=A' || arg === '-A') filterLayer = 'A';
    else if (arg === '--layer=B' || arg === '-B') filterLayer = 'B';
    else if (arg.startsWith('--detector=')) filterDetector = arg.split('=')[1].toLowerCase();
  }

  console.log('================================================================');
  console.log(' ManuView Scientific Validation & Benchmark Runner');
  console.log(` Mode: ${filterLayer ? `Layer ${filterLayer}` : 'Full Suite (Layers A & B)'}`);
  if (filterDetector) console.log(` Filter: Detector matching "${filterDetector}"`);
  console.log('================================================================\n');

  let allEntries: ScorecardEntry[] = [];

  // Layer A: Deterministic Gold Benchmarks
  if (!filterLayer || filterLayer === 'A') {
    console.log('--> Running Layer A: Deterministic Gold Suites...');
    const statEntries = await runStatcheckBenchmark();
    const grimEntries = await runGrimBenchmark();
    const recencyEntries = await runRecencyBenchmark();
    const groundingEntries = await runGroundingBenchmark();
    const catalogEntries = await runCatalogBenchmark();
    allEntries.push(...statEntries, ...grimEntries, ...recencyEntries, ...groundingEntries, ...catalogEntries);
  }

  // Layer B: Real-World Corpus Benchmarks
  if (!filterLayer || filterLayer === 'B') {
    console.log('--> Running Layer B: Corpus Benchmark Suites...');
    const priorPubEntries = await runPriorPubBenchmark();
    const scopeEntries = await runScopeBenchmark();
    const classEntries = await runClassificationBenchmark();
    const imradEntries = await runImradBenchmark();
    const integrityEntries = await runIntegrityBenchmark();
    allEntries.push(...priorPubEntries, ...scopeEntries, ...classEntries, ...imradEntries, ...integrityEntries);
  }

  if (filterDetector) {
    allEntries = allEntries.filter(
      e => e.id.toLowerCase().includes(filterDetector!) || e.detector.toLowerCase().includes(filterDetector!)
    );
  }

  // Save report and generate scorecard.json & scorecard.md
  const { scorecard, allPassed } = saveScorecard(allEntries);

  console.log('\n================================================================');
  console.log(' Benchmark Summary Results');
  console.log('================================================================');
  console.log(`Total Detectors Evaluated: ${scorecard.summary.totalDetectors}`);
  console.log(`Targets Passed:            ${scorecard.summary.passedDetectors}`);
  console.log(`Targets Failed:            ${scorecard.summary.failedDetectors}`);
  console.log('----------------------------------------------------------------');

  for (const e of scorecard.entries) {
    const mark = e.passed ? '✅ [PASS]' : '❌ [FAIL]';
    console.log(
      `${mark} [Layer ${e.layer}] ${e.detector.padEnd(45)} | ${e.metric.padEnd(14)}: ${e.scoreFormatted.padEnd(18)} (Target: ${e.targetFormatted})`
    );
  }
  console.log('================================================================\n');
  console.log('Scorecard written to:');
  console.log(' - benchmarks/report/scorecard.json');
  console.log(' - benchmarks/report/scorecard.md');

  if (!allPassed) {
    console.error('\n⚠️ One or more benchmark targets failed regression gate.');
    process.exit(1);
  } else {
    console.log('\n✨ All benchmark targets met or exceeded!');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Fatal error running benchmarks:', err);
  process.exit(1);
});
