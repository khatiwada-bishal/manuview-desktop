import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RETRACTION_WATCH_CSV_URL = 'https://gitlab.com/crossref/retraction-watch-data/-/raw/main/retraction_watch.csv';
const OUTPUT_JSON_PATH = path.resolve(__dirname, '../src/lib/data/retraction_watch_compact.json');

// Curated landmark DOIs to guarantee inclusion
const CURATED_LANDMARKS: Record<string, { nature: 'retraction' | 'expression_of_concern'; reason: string }> = {
  '10.1016/s0140-6736(97)11096-0': { nature: 'retraction', reason: 'Retracted: Completely falsified data regarding MMR vaccine and autism.' },
  '10.1016/s0140-6736(20)31180-6': { nature: 'retraction', reason: 'Retracted: Authors unable to conduct independent audit of Surgisphere database.' },
  '10.1056/nejmoa2007621': { nature: 'retraction', reason: 'Retracted: Database veracity could not be validated.' },
  '10.1038/nature12968': { nature: 'retraction', reason: 'Retracted: Critical errors and fabricated image data in STAP cell pluripotency study.' },
  '10.1038/nature12373': { nature: 'retraction', reason: 'Retracted: Stimulus-triggered acquisition of pluripotency.' },
  '10.1038/nature04512': { nature: 'retraction', reason: 'Retracted: Superconductivity at 120 K in layered cuprates.' },
  '10.1038/s41586-020-2801-z': { nature: 'retraction', reason: 'Retracted: Irregularities in background subtraction methods.' },
  '10.1126/science.aad8828': { nature: 'retraction', reason: 'Retracted: Suspected data fabrication and missing raw files.' },
  '10.1073/pnas.0908521106': { nature: 'retraction', reason: 'Retracted: Irreproducible genotyping in PKNOX2 substance dependence association study.' },
  '10.1126/science.1094515': { nature: 'retraction', reason: 'Retracted: Fabricated stem cell colonies and somatic cell nuclear transfer claims.' },
  '10.1126/science.1105458': { nature: 'retraction', reason: 'Retracted: Fabricated stem cell colonies in Science (2005).' },
  '10.1126/science.1112286': { nature: 'retraction', reason: 'Retracted: Fabricated data and fraudulent DNA fingerprinting records.' },
  '10.1016/s0140-6736(11)60715-4': { nature: 'retraction', reason: 'Retracted: Falsified clinical outcomes in tissue-engineered trachea transplant.' },
  '10.1016/s0140-6736(11)61715-7': { nature: 'retraction', reason: 'Retracted: Falsified clinical outcomes in tissue-engineered trachea transplant.' },
  '10.1126/science.288.5475.2338': { nature: 'retraction', reason: 'Retracted: Fabricated measurements and identical noise traces across distinct experiments.' },
  '10.1126/science.1202867': { nature: 'retraction', reason: 'Retracted: Statistically impossible data distributions consistent with fabrication.' },
  '10.1016/j.jesp.2011.02.008': { nature: 'retraction', reason: 'Retracted: Irreproducible and manipulated experimental data.' },
};

export interface CompactRetractionDb {
  version: string;
  source: string;
  count: number;
  retractedDois: string[];
  eocDois: string[];
  noticeDois: string[];
  reasonCatalog: string[];
  doiReasons: Record<string, number>;
  landmarkTitles?: Record<string, number>;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function normalizeDoi(doi: string): string {
  return doi.trim().toLowerCase().replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, '').replace(/[.,;)\]]+$/, '');
}

function normalizeTitle(t: string): string {
  return t.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

async function main() {
  console.log(`[Retraction Watch Builder] Fetching from ${RETRACTION_WATCH_CSV_URL}...`);
  
  const retractedSet = new Set<string>();
  const eocSet = new Set<string>();
  const noticeSet = new Set<string>();
  const doiToReasonRaw: Record<string, string> = {};
  const titlesToReasonRaw: Record<string, string> = {};

  // Seed with curated landmarks
  for (const [doi, info] of Object.entries(CURATED_LANDMARKS)) {
    const clean = normalizeDoi(doi);
    if (info.nature === 'retraction') {
      retractedSet.add(clean);
    } else {
      eocSet.add(clean);
    }
    doiToReasonRaw[clean] = info.reason;
  }

  return new Promise<void>((resolve, reject) => {
    https.get(RETRACTION_WATCH_CSV_URL, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to download: HTTP ${res.statusCode}`));
      }

      const rl = readline.createInterface({
        input: res,
        crlfDelay: Infinity,
      });

      let lineCount = 0;
      let headerIndices: Record<string, number> = {};

      rl.on('line', (line) => {
        if (!line.trim()) return;
        lineCount++;

        if (lineCount === 1) {
          const headers = parseCsvLine(line);
          headers.forEach((h, idx) => {
            headerIndices[h.trim()] = idx;
          });
          return;
        }

        const cols = parseCsvLine(line);
        const origDoiRaw = cols[headerIndices['OriginalPaperDOI'] ?? 14] || '';
        const noticeDoiRaw = cols[headerIndices['RetractionDOI'] ?? 11] || '';
        const natureRaw = (cols[headerIndices['RetractionNature'] ?? 16] || '').toLowerCase();
        const reasonRaw = (cols[headerIndices['Reason'] ?? 17] || '').trim();
        const titleRaw = (cols[headerIndices['Title'] ?? 1] || '').trim();

        if (!origDoiRaw && !titleRaw && !noticeDoiRaw) return;

        const cleanOrigDoi = origDoiRaw ? normalizeDoi(origDoiRaw) : '';
        const cleanNoticeDoi = noticeDoiRaw ? normalizeDoi(noticeDoiRaw) : '';

        if (cleanNoticeDoi && cleanNoticeDoi.includes('/')) {
          noticeSet.add(cleanNoticeDoi);
        }

        const isEoc = natureRaw.includes('expression of concern');
        const isReinstated = natureRaw.includes('reinstatement');
        const isRetracted = !isReinstated && (natureRaw.includes('retraction') || !isEoc);

        const primaryReason = reasonRaw
          ? reasonRaw.split(';')[0].replace(/\+/g, ' ').trim()
          : (isEoc ? 'Expression of Concern' : 'Retracted by Journal/Publisher');

        if (cleanOrigDoi && cleanOrigDoi.includes('/')) {
          if (isEoc) {
            eocSet.add(cleanOrigDoi);
          } else if (isRetracted) {
            retractedSet.add(cleanOrigDoi);
          }

          if (primaryReason && (isRetracted || isEoc)) {
            doiToReasonRaw[cleanOrigDoi] = primaryReason;
          }
        }

        if (titleRaw && titleRaw.length >= 25 && (isRetracted || isEoc)) {
          const normTitle = normalizeTitle(titleRaw);
          if (normTitle.length >= 25 && !titlesToReasonRaw[normTitle]) {
            titlesToReasonRaw[normTitle] = primaryReason;
          }
        }
      });

      rl.on('close', () => {
        console.log(`[Retraction Watch Builder] Parsed ${lineCount} rows.`);
        console.log(`[Retraction Watch Builder] Found ${retractedSet.size} retracted DOIs, ${eocSet.size} EoC DOIs, ${noticeSet.size} notice DOIs.`);

        // Build compact reason catalog
        const uniqueReasons = Array.from(new Set(Object.values(doiToReasonRaw))).sort();
        const reasonToId: Record<string, number> = {};
        uniqueReasons.forEach((r, idx) => {
          reasonToId[r] = idx;
        });

        const doiReasons: Record<string, number> = {};
        for (const [doi, r] of Object.entries(doiToReasonRaw)) {
          doiReasons[doi] = reasonToId[r] ?? 0;
        }

        const compactData: CompactRetractionDb = {
          version: new Date().toISOString().split('T')[0],
          source: 'Crossref / Retraction Watch Database (GitLab)',
          count: retractedSet.size + eocSet.size,
          retractedDois: Array.from(retractedSet).sort(),
          eocDois: Array.from(eocSet).sort(),
          noticeDois: Array.from(noticeSet).sort(),
          reasonCatalog: uniqueReasons,
          doiReasons,
        };

        const jsonDir = path.dirname(OUTPUT_JSON_PATH);
        if (!fs.existsSync(jsonDir)) {
          fs.mkdirSync(jsonDir, { recursive: true });
        }

        fs.writeFileSync(OUTPUT_JSON_PATH, JSON.stringify(compactData));
        const stats = fs.statSync(OUTPUT_JSON_PATH);
        console.log(`[Retraction Watch Builder] Successfully written to ${OUTPUT_JSON_PATH} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
        resolve();
      });

      rl.on('error', (err) => reject(err));
    }).on('error', (err) => reject(err));
  });
}

main().catch((err) => {
  console.error('[Retraction Watch Builder] Error:', err);
  process.exit(1);
});

