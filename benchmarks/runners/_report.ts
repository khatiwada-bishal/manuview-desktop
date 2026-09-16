import * as fs from 'fs';
import * as path from 'path';

export interface ScorecardEntry {
  id: string;
  detector: string;
  layer: 'A' | 'B' | 'C';
  metric: string;
  scoreFormatted: string;
  scoreNumeric: number;
  targetFormatted: string;
  targetNumeric: number;
  targetOperator: '<=' | '>=' | '<' | '==' | 'report';
  passed: boolean;
  coverage: number;
  details?: string;
  deltaVsBase?: string;
}

export interface ScorecardReport {
  timestamp: string;
  engineCommit: string;
  manifestVersion: string;
  summary: {
    totalDetectors: number;
    passedDetectors: number;
    failedDetectors: number;
  };
  entries: ScorecardEntry[];
}

const REPORT_DIR = path.resolve(process.cwd(), 'benchmarks/report');
const HISTORY_DIR = path.join(REPORT_DIR, 'history');
const SCORECARD_JSON = path.join(REPORT_DIR, 'scorecard.json');
const SCORECARD_MD = path.join(REPORT_DIR, 'scorecard.md');

export function loadBaselineScorecard(): ScorecardReport | null {
  try {
    if (fs.existsSync(SCORECARD_JSON)) {
      const raw = fs.readFileSync(SCORECARD_JSON, 'utf8');
      return JSON.parse(raw) as ScorecardReport;
    }
  } catch (err) {
    console.warn('[benchmarks] Could not read baseline scorecard:', err);
  }
  return null;
}

export function saveScorecard(
  entries: ScorecardEntry[],
  engineCommit = 'HEAD',
  manifestVersion = '1.0.0'
): { scorecard: ScorecardReport; allPassed: boolean } {
  if (!fs.existsSync(REPORT_DIR)) {
    fs.mkdirSync(REPORT_DIR, { recursive: true });
  }
  if (!fs.existsSync(HISTORY_DIR)) {
    fs.mkdirSync(HISTORY_DIR, { recursive: true });
  }

  const baseline = loadBaselineScorecard();
  const baselineMap = new Map<string, ScorecardEntry>();
  if (baseline && baseline.entries) {
    for (const b of baseline.entries) {
      baselineMap.set(`${b.id}:${b.metric}`, b);
    }
  }

  let passedDetectors = 0;
  let failedDetectors = 0;

  for (const entry of entries) {
    const key = `${entry.id}:${entry.metric}`;
    const prev = baselineMap.get(key);
    if (prev) {
      const diff = entry.scoreNumeric - prev.scoreNumeric;
      if (Math.abs(diff) < 0.0001) {
        entry.deltaVsBase = '0.00';
      } else {
        entry.deltaVsBase = (diff > 0 ? '+' : '') + diff.toFixed(3);
      }
    } else {
      entry.deltaVsBase = 'n/a';
    }

    if (entry.passed) {
      passedDetectors++;
    } else {
      failedDetectors++;
    }
  }

  const scorecard: ScorecardReport = {
    timestamp: new Date().toISOString(),
    engineCommit,
    manifestVersion,
    summary: {
      totalDetectors: entries.length,
      passedDetectors,
      failedDetectors,
    },
    entries,
  };

  // Write JSON
  fs.writeFileSync(SCORECARD_JSON, JSON.stringify(scorecard, null, 2), 'utf8');

  // Write History snapshot
  const timestampSafe = scorecard.timestamp.replace(/[:.]/g, '-');
  fs.writeFileSync(
    path.join(HISTORY_DIR, `scorecard-${timestampSafe}.json`),
    JSON.stringify(scorecard, null, 2),
    'utf8'
  );

  // Generate Markdown
  const md = generateMarkdownScorecard(scorecard);
  fs.writeFileSync(SCORECARD_MD, md, 'utf8');

  return {
    scorecard,
    allPassed: failedDetectors === 0,
  };
}

function pad(str: string, width: number): string {
  if (str.length >= width) return str;
  return str + ' '.repeat(width - str.length);
}

export function generateMarkdownScorecard(report: ScorecardReport): string {
  const lines: string[] = [];
  lines.push('# ManuView Benchmark Scorecard');
  lines.push('');
  lines.push(`- **Timestamp**: ${report.timestamp}`);
  lines.push(`- **Engine Commit**: \`${report.engineCommit}\``);
  lines.push(`- **Manifest Version**: \`${report.manifestVersion}\``);
  lines.push(`- **Status**: ${report.summary.failedDetectors === 0 ? '✅ All Targets Met' : `⚠️ ${report.summary.failedDetectors} Target(s) Need Attention`}`);
  lines.push('');
  lines.push('| Detector | Layer | Metric | Score (95% CI) | Target | Coverage | Δ vs base | Status |');
  lines.push('|---|---|---|---|---|---|---|---|');

  for (const e of report.entries) {
    const status = e.passed ? '✅ Pass' : '❌ Fail';
    lines.push(
      `| ${e.detector} | Layer ${e.layer} | ${e.metric} | ${e.scoreFormatted} | ${e.targetFormatted} | ${(e.coverage * 100).toFixed(0)}% | ${e.deltaVsBase || 'n/a'} | ${status} |`
    );
  }

  lines.push('');
  lines.push('---');
  lines.push('*Generated deterministically by ManuView Benchmark Runner.*');
  lines.push('');

  return lines.join('\n');
}
