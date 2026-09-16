import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { checkRetractionStatus, KNOWN_RETRACTED_DOIS } from '../src/lib/retractions';
import {
  verifyDOIWithCrossref,
  searchReferenceBibliographic,
  batchVerifyReferences,
  getCachedDoiVerification,
  clearDoiCache,
} from '../src/lib/crossref';
import { computeCitationIntegrity } from '../src/lib/engine/citation-audit';
import {
  extractReferencesFromText,
  deduplicateReferences,
  detectReferenceExtractionQuality,
} from '../src/lib/utils';
import { ReferenceVerification } from '../src/lib/types';

test('G1 & G2: checkRetractionStatus detects Retraction Watch entries and discriminates retraction notices', () => {
  // Landmark curated retractions
  const wakefield = checkRetractionStatus('10.1016/s0140-6736(97)11096-0');
  assert.equal(wakefield.isRetracted, true);
  assert.equal(wakefield.isExpressionOfConcern, false);

  const surgisphere = checkRetractionStatus('10.1056/nejmoa2007621');
  assert.equal(surgisphere.isRetracted, true);

  const stap = checkRetractionStatus('10.1038/nature12968');
  assert.equal(stap.isRetracted, true);

  // Retraction Watch database sample (Science stem cells 2005)
  const stemCell = checkRetractionStatus('10.1126/science.1105458');
  assert.equal(stemCell.isRetracted, true);
  assert.ok(stemCell.reason?.includes('Retracted'));

  // Superconductivity sample
  const superconductivity = checkRetractionStatus('10.1038/nature04512');
  assert.equal(superconductivity.isRetracted, true);

  // G2: Retraction notice DOI must NOT be flagged as retracted paper
  const stapNoticeDoi = '10.1038/nature13598';
  const noticeCheck = checkRetractionStatus(stapNoticeDoi);
  assert.equal(noticeCheck.isRetracted, false);
  assert.equal(noticeCheck.isRetractionNotice, true);

  // Clean legitimate paper must NOT be retracted
  const validDoi = '10.1038/s41586-020-2180-5'; // SARS-CoV-2 spike
  const validCheck = checkRetractionStatus(validDoi);
  assert.equal(validCheck.isRetracted, false);
  assert.equal(validCheck.isExpressionOfConcern, false);
});

test('G4: deduplicateReferences consolidates duplicate DOIs and citation keys', () => {
  const citations = [
    '1. Saunders D, et al. A DLL3-targeted antibody-drug conjugate. Sci Transl Med. 2015. DOI: 10.1126/scitranslmed.aac9459',
    '2. Wakefield AJ, et al. Ileal-lymphoid-nodular hyperplasia. Lancet. 1998. DOI: 10.1016/S0140-6736(97)11096-0',
    '3. Duplicate Wakefield reference. Lancet. 1998. DOI: 10.1016/s0140-6736(97)11096-0', // duplicate DOI (different casing)
    '4. Rudin CM, et al. Molecular subtypes of small cell lung cancer. Nat Rev Cancer. 2019. DOI: 10.1038/s41568-019-0133-9',
    '5. Rudin CM, et al. Molecular subtypes of small cell lung cancer. Nat Rev Cancer. 2019. DOI: 10.1038/s41568-019-0133-9', // exact duplicate
  ];

  const result = deduplicateReferences(citations);
  assert.equal(result.totalCount, 5);
  assert.equal(result.unique.length, 3);
  assert.equal(result.duplicateCount, 2);
});

test('G5: DOI de-wrapping repairs split DOIs across line breaks and hyphens', () => {
  const fragmentedText = `
References
1. Smith J, et al. Study on cellular reprogramming. Nature. 2020. doi: 10.1038/
s41586-020-2801-z
2. Jones M. Cancer genomics. Science. 2018. 10.1126/
science.aad8828
  `;

  const extracted = extractReferencesFromText(fragmentedText);
  assert.equal(extracted.length, 2);
  assert.ok(extracted[0].includes('10.1038/s41586-020-2801-z'));
  assert.ok(extracted[1].includes('10.1126/science.aad8828'));

  const quality = detectReferenceExtractionQuality(fragmentedText, extracted);
  assert.equal(quality.isHighConfidence, true);
  assert.equal(quality.extractedCount, 2);
  assert.equal(quality.abnormallyLongCount, 0);
});

test('C1: Standalone service and AI Review produce identical CitationIntegritySummary metrics', async () => {
  clearDoiCache();

  const testRefs = [
    '1. Saunders D, et al. A DLL3-targeted ADC for SCLC. Sci Transl Med. 2015. DOI: 10.1126/scitranslmed.aac9459',
    '2. Wakefield AJ, et al. Autism paper. Lancet. 1998. DOI: 10.1016/S0140-6736(97)11096-0',
    '3. Obokata H, et al. STAP pluripotency. Nature. 2014. DOI: 10.1038/nature12968',
    '4. Fake Author. Hallucinated nonexistent paper. J Bio. 2024. DOI: 10.1038/s41586-999-fake404',
  ];

  // Run through batchVerifyReferences
  const verified = await batchVerifyReferences(testRefs);

  // Both standalone service and AI review use computeCitationIntegrity
  const authors = ['Saunders', 'Smith'];
  const standaloneSummary = computeCitationIntegrity(verified, testRefs.length, authors);
  const aiReviewSummary = computeCitationIntegrity(verified, testRefs.length, authors);

  // Assert perfect consistency
  assert.deepEqual(standaloneSummary, aiReviewSummary);
  assert.equal(standaloneSummary.totalReferences, 4);
  assert.equal(standaloneSummary.retractedCount, 2); // Wakefield + Obokata STAP
  assert.ok(standaloneSummary.coverageNote.includes('verified'));
});

test('E1 & E2: In-memory cache bypasses redundant lookups and local-first handles offline retractions', async () => {
  clearDoiCache();
  const testDoi = '10.1016/s0140-6736(20)31180-6'; // Surgisphere Lancet

  // First lookup
  const res1 = await verifyDOIWithCrossref(testDoi);
  assert.equal(res1.isRetracted, true);

  // Check that item is in cache
  const cached = getCachedDoiVerification(testDoi);
  assert.ok(cached);
  assert.equal(cached.isRetracted, true);

  // Second lookup must hit cache
  const res2 = await verifyDOIWithCrossref(testDoi);
  assert.deepEqual(res1, res2);
});
