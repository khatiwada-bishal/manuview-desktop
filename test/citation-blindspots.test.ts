import test from "node:test";
import assert from "node:assert/strict";
import {
  extractResolvedDois,
  calculatePaperPrestige,
  classifyBlindspotCategory,
  generateCitationBlindspotsReport,
} from "../src/lib/citation-blindspots";
import type { ReferenceVerification } from "../src/lib/types";

test("Citation Blindspots: extractResolvedDois normalizes and deduplicates valid DOIs", () => {
  const mockRefs: ReferenceVerification[] = [
    {
      index: 1,
      raw: "Test Ref 1",
      doi: "https://doi.org/10.1038/s41586-020-2649-2",
      status: "valid",
    },
    {
      index: 2,
      raw: "Test Ref 2",
      resolvedDoi: "10.1016/j.cell.2021.05.001",
      status: "valid",
    },
    {
      index: 3,
      raw: "Duplicate Ref 1",
      doi: "10.1038/s41586-020-2649-2",
      status: "valid",
    },
    {
      index: 4,
      raw: "Invalid Ref",
      doi: "invalid-doi-no-slash",
      status: "unresolvable",
    },
    {
      index: 5,
      raw: "Empty Ref",
      status: "unchecked",
    },
  ];

  const dois = extractResolvedDois(mockRefs);
  assert.equal(dois.length, 2, "Must extract exactly 2 unique valid DOIs");
  assert.ok(dois.includes("10.1038/s41586-020-2649-2"));
  assert.ok(dois.includes("10.1016/j.cell.2021.05.001"));
});

test("Citation Blindspots: calculatePaperPrestige computes balanced hybrid prestige scores", () => {
  const highCoCite = calculatePaperPrestige(
    { citationCount: 150, coCitationScore: 6, year: 2023 },
    10
  );
  const lowCoCite = calculatePaperPrestige(
    { citationCount: 150, coCitationScore: 1, year: 2023 },
    10
  );

  assert.ok(
    highCoCite > lowCoCite,
    "Candidate with higher co-citation frequency must receive higher prestige score"
  );

  const recentPaper = calculatePaperPrestige(
    { citationCount: 80, coCitationScore: 3, year: 2024 },
    10
  );
  const oldPaper = calculatePaperPrestige(
    { citationCount: 80, coCitationScore: 3, year: 2005 },
    10
  );

  assert.ok(
    recentPaper > oldPaper,
    "Recent paper must receive a recency boost compared to ancient paper with same citations"
  );
});

test("Citation Blindspots: classifyBlindspotCategory accurately discriminates academic tiers", () => {
  const currentYear = new Date().getFullYear();

  const seminal = classifyBlindspotCategory(
    { year: currentYear - 8, citationCount: 650, coCitationScore: 4 },
    currentYear
  );
  assert.equal(seminal, "seminal", "High-citation older paper must be classified as seminal");

  const recent = classifyBlindspotCategory(
    { year: currentYear - 1, citationCount: 45, coCitationScore: 2 },
    currentYear
  );
  assert.equal(recent, "recent_landmark", "Recent paper with strong citations must be recent_landmark");

  const peer = classifyBlindspotCategory(
    { year: currentYear - 4, citationCount: 60, coCitationScore: 1 },
    currentYear
  );
  assert.equal(peer, "methodological_peer", "Standard domain study must be methodological_peer");
});

test("Citation Blindspots: generateCitationBlindspotsReport handles empty seeds gracefully", async () => {
  const emptyReport = await generateCitationBlindspotsReport([]);
  assert.equal(emptyReport.analyzedSeedCount, 0);
  assert.equal(emptyReport.candidatesFound.length, 0);
  assert.equal(emptyReport.detectedGapsCount, 0);
});
