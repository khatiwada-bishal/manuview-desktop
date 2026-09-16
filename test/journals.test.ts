import test from "node:test";
import assert from "node:assert/strict";
import {
  JOURNAL_CATALOG,
  findMatchingJournals,
  isDisciplineMatch,
  inferJournalDiscipline,
} from "../src/lib/journals.ts";

test("JOURNAL_CATALOG has valid metadata for all entries", () => {
  assert.ok(JOURNAL_CATALOG.length >= 100, `Catalog should have at least 100 journals, found ${JOURNAL_CATALOG.length}`);

  for (const journal of JOURNAL_CATALOG) {
    assert.ok(journal.name, "Journal entry missing name");
    assert.ok(journal.discipline, `Journal ${journal.name} missing discipline`);
    assert.ok(journal.aimsAndScope && journal.aimsAndScope.length > 20, `Journal ${journal.name} missing aimsAndScope`);
    assert.ok(Array.isArray(journal.deskRejectHazards), `Journal ${journal.name} missing deskRejectHazards`);
  }
});

test("inferJournalDiscipline maps major journal archetypes correctly", () => {
  assert.equal(inferJournalDiscipline("Nature"), "Multidisciplinary");
  assert.equal(inferJournalDiscipline("Science"), "Multidisciplinary");
  assert.equal(inferJournalDiscipline("The Lancet"), "Clinical");
  assert.equal(inferJournalDiscipline("IEEE Transactions on Pattern Analysis and Machine Intelligence"), "Computer Science");
  assert.equal(inferJournalDiscipline("Journal of Machine Learning Research"), "Computer Science");
});

test("isDisciplineMatch properly handles cross-disciplinary intersections", () => {
  // Exact match
  assert.equal(isDisciplineMatch("Computer Science", "Computer Science").isMatch, true);

  // Cross-disciplinary: CS intersects with Operations Research
  assert.equal(isDisciplineMatch("Computer Science", "Operations Research").isMatch, true);

  // Cross-disciplinary: Environmental Science intersects with Earth Science
  assert.equal(isDisciplineMatch("Environmental Science", "Earth Science").isMatch, true);

  // Distinct disciplines do not match
  assert.equal(isDisciplineMatch("Clinical", "Physics").isMatch, false);
});

test("Recommendation Consistency Guarantee: recommended journals match scope", () => {
  const query = "deep reinforcement learning neural networks optimization algorithms";
  const matches = findMatchingJournals(query, "Computer Science");

  assert.ok(matches.allMatches.length > 0, "Should return matches for CS query");

  // Verify that top recommended journals are within matching or cross-disciplinary scope
  for (const item of matches.allMatches.slice(0, 5)) {
    const result = isDisciplineMatch("Computer Science", item.journal.discipline);
    assert.equal(result.isMatch, true, `Recommended journal ${item.journal.name} (${item.journal.discipline}) should be discipline-compatible with CS`);
  }
});

test("lookupJournalInCatalog grounds journal metrics and rejects hallucinated entries", async () => {
  const { lookupJournalInCatalog } = await import("../src/lib/journals.ts");

  // Exact match
  const nature = lookupJournalInCatalog("Nature");
  assert.ok(nature !== undefined);
  assert.equal(nature?.name, "Nature");
  assert.equal(typeof nature?.impactFactor, "number");
  assert.ok(nature?.impactFactor > 50);

  // Normalized match with "The" prefix and case insensitivity
  const lancet = lookupJournalInCatalog("the lancet");
  assert.ok(lancet !== undefined);
  assert.equal(lancet?.name, "The Lancet");
  assert.equal(typeof lancet?.impactFactor, "number");

  // Non-catalog / fabricated journal returns undefined (refusing hallucinated IFs)
  const fakeJournal = lookupJournalInCatalog("Journal of Completely Fabricated Studies 2026");
  assert.equal(fakeJournal, undefined);
});

