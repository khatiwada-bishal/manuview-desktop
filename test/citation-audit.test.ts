import test from "node:test";
import assert from "node:assert/strict";
import { checkRetractionStatus } from "../src/lib/retractions.ts";
import { computeCitationIntegrity } from "../src/lib/engine/citation-audit.ts";
import { ReferenceVerification } from "../src/lib/types.ts";

test("checkRetractionStatus detects landmark retracted DOIs", () => {
  // Wakefield MMR autism paper (Lancet)
  const res1 = checkRetractionStatus("10.1016/s0140-6736(97)11096-0");
  assert.equal(res1.isRetracted, true);
  assert.ok(res1.reason?.includes("Wakefield") || res1.reason?.includes("MMR"));

  // Surgisphere COVID-19 Hydroxychloroquine (Lancet)
  const res2 = checkRetractionStatus("10.1016/S0140-6736(20)31180-6"); // case-insensitive
  assert.equal(res2.isRetracted, true);

  // Unretracted DOI
  const res3 = checkRetractionStatus("10.1038/s41586-021-03819-2");
  assert.equal(res3.isRetracted, false);
});

test("checkRetractionStatus detects title-level retraction notices", () => {
  const refText1 = 'Smith, J. et al. "A study of polymers [Retracted]". Chem Rev, 2019.';
  const res1 = checkRetractionStatus(undefined, refText1);
  assert.equal(res1.isRetracted, true);

  const refText2 = 'Johnson, A. "Retraction Notice: Investigation into synthetic catalysts". Science 2021.';
  const res2 = checkRetractionStatus(undefined, refText2);
  assert.equal(res2.isRetracted, true);

  const normalRef = 'Vaswani, A. et al. "Attention is all you need". NeurIPS 2017.';
  const res3 = checkRetractionStatus(undefined, normalRef);
  assert.equal(res3.isRetracted, false);
});

test("computeCitationIntegrity computes verified metrics, recency, and disambiguated self-citations", () => {
  const verifiedRefs: ReferenceVerification[] = [
    {
      raw: "Smith, A. et al. 2024. Deep Learning advances.",
      status: "valid",
      year: 2024,
      authors: ["Alice Smith", "Bob Jones"],
      familyNames: ["Smith", "Jones"],
    },
    {
      raw: "Smith, A., Taylor, K. 2023. Transformer architectures.",
      status: "valid",
      year: 2023,
      authors: ["Alice Smith", "Kelly Taylor"],
      familyNames: ["Smith", "Taylor"],
    },
    {
      raw: "Brown, C. 2015. Historical benchmarks in translation.",
      status: "valid",
      year: 2015,
      authors: ["Charlie Brown"],
      familyNames: ["Brown"],
    },
    {
      raw: "Wakefield, A. 1998. Retracted study.",
      doi: "10.1016/s0140-6736(97)11096-0",
      status: "retracted",
      isRetracted: true,
      year: 1998,
      authors: ["Andrew Wakefield"],
      familyNames: ["Wakefield"],
    },
    {
      raw: "Unverified paper without DOI or match.",
      status: "unchecked",
      isRetracted: false,
    },
  ];

  const manuscriptAuthors = ["Alice Smith", "David Miller"];

  const integrity = computeCitationIntegrity(verifiedRefs, verifiedRefs.length, manuscriptAuthors);

  assert.equal(integrity.totalReferences, 5);
  assert.equal(integrity.verifiedCount, 3);
  assert.equal(integrity.retractedCount, 1);
  assert.equal(integrity.uncheckedCount, 1);
  // Checked count is 4 (verified + retracted), which is below MIN_VERIFIED_REFS_FOR_SELF_CITATION (10)
  assert.equal(integrity.selfCitationPercent, undefined);
  assert.ok(integrity.selfCitationNote?.includes("requires at least 10 verified references"));

  // Recency profile: 2 out of 4 dated refs are from last 5 years (2023, 2024) -> 50%
  assert.ok(integrity.recencyProfile !== undefined);
  assert.equal(integrity.recencyProfile?.last5YearsPercent, 50);
});

test("computeCitationIntegrity computes self-citation ratio when >= 10 verified refs available", () => {
  const refs: ReferenceVerification[] = [];
  // 2 self citations by Smith
  refs.push({ raw: "Smith, A. 2024", status: "valid", year: 2024, authors: ["Alice Smith"], familyNames: ["Smith"] });
  refs.push({ raw: "Smith, A. 2023", status: "valid", year: 2023, authors: ["Alice Smith"], familyNames: ["Smith"] });
  // 8 non-self citations
  for (let i = 0; i < 8; i++) {
    refs.push({
      raw: `Author_${i}, X. 2022`,
      status: "valid",
      year: 2022,
      authors: [`NonSelf Author${i}`],
      familyNames: [`Author_${i}`],
    });
  }

  const integrity = computeCitationIntegrity(refs, 10, ["Alice Smith", "David Miller"]);
  assert.equal(integrity.totalReferences, 10);
  assert.equal(integrity.verifiedCount, 10);
  // 2 out of 10 = 20%
  assert.equal(integrity.selfCitationPercent, 20);
  assert.equal(integrity.selfCitationRatio, 20);
  assert.ok(integrity.selfCitationNote?.includes("20% self-citation rate"));
});

