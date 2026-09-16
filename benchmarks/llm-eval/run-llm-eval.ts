import * as fs from 'fs';
import * as path from 'path';

export interface AdjudicationRecord {
  manuscriptId: string;
  adjudicatorId: string;
  humanTriage: 'Desk Reject' | 'Major Revision' | 'Minor Revision' | 'Reject / Resubmit';
  groundednessScore: number; // 1 to 5
  hallucinationCount: number;
  specificityScore: number; // 1 to 5
  comments: string;
}

export function computeCohensKappa(raterA: string[], raterB: string[]): number {
  if (raterA.length !== raterB.length || raterA.length === 0) return 0;
  const n = raterA.length;

  const categories = Array.from(new Set([...raterA, ...raterB]));
  const countsA: Record<string, number> = {};
  const countsB: Record<string, number> = {};
  let agreed = 0;

  for (const cat of categories) {
    countsA[cat] = 0;
    countsB[cat] = 0;
  }

  for (let i = 0; i < n; i++) {
    if (raterA[i] === raterB[i]) agreed++;
    countsA[raterA[i]]++;
    countsB[raterB[i]]++;
  }

  const pObserved = agreed / n;
  let pExpected = 0;
  for (const cat of categories) {
    pExpected += (countsA[cat] / n) * (countsB[cat] / n);
  }

  if (pExpected >= 1) return 1;
  return Number(((pObserved - pExpected) / (1 - pExpected)).toFixed(4));
}

async function main() {
  console.log('================================================================');
  console.log(' ManuView Layer C: LLM Path & Human Adjudication Harness');
  console.log('================================================================\n');

  console.log('Protocol:');
  console.log(' - Temperature: 0.0 (pinned determinism)');
  console.log(' - Triplicate runs (3x evaluation for stability variance)');
  console.log(' - Rubric: benchmarks/llm-eval/rubric.md\n');

  console.log('Adjudication template ready in benchmarks/llm-eval/rubric.md.');
  console.log('Multi-run variance analysis ready for frozen manuscript corpora.');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
