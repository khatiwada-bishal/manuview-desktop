import test from "node:test";
import assert from "node:assert/strict";
import { cleanAndRepairJson } from "../src/lib/json-repair.ts";

test("cleanAndRepairJson correctly parses unquoted identifiers in arrays and values (e.g. unquoted 'need')", () => {
  const malformed = `{
    need: "value",
    tier: Realistic,
    fitScore: 70,
    rejectionRisks: [
      need to provide more empirical data,
      need baseline comparisons
    ],
    priorityIssues: [
      {
        id: "P1",
        title: "Missing controls",
        actionableFix: need to add control group in experiment 2
      }
    ]
  }`;

  const res = cleanAndRepairJson<any>(malformed);
  assert.equal(res.need, "value");
  assert.equal(res.tier, "Realistic");
  assert.equal(res.fitScore, 70);
  assert.equal(Array.isArray(res.rejectionRisks), true);
  assert.equal(res.rejectionRisks[0], "need to provide more empirical data");
  assert.equal(res.rejectionRisks[1], "need baseline comparisons");
  assert.equal(res.priorityIssues[0].actionableFix, "need to add control group in experiment 2");
});

test("cleanAndRepairJson handles conversational preambles starting with 'need' and internal quotes", () => {
  const textWithPreamble = `Here is what you need:
{
  "summary": "The author claimed "novelty" without experimental controls.",
  "requiredRevisions": [
    need to expand cohort
  ]
}
Hope this helps!`;

  const res = cleanAndRepairJson<any>(textWithPreamble);
  assert.equal(typeof res.summary, "string");
  assert.ok(res.summary.includes("novelty"));
  assert.equal(res.requiredRevisions[0], "need to expand cohort");
});

test("cleanAndRepairJson converts Python constants and single-quoted strings", () => {
  const pyJson = `{'title': 'Empirical Study', 'score': None, 'valid': True, 'flagged': False}`;
  const res = cleanAndRepairJson<any>(pyJson);
  assert.equal(res.title, "Empirical Study");
  assert.equal(res.score, null);
  assert.equal(res.valid, true);
  assert.equal(res.flagged, false);
});

test("cleanAndRepairJson safely repairs truncated JSON mid-string and mid-array", () => {
  const truncated = `{"overallScore": 70, "priorityIssues": [{"id": "P1", "actionableFix": "You need to fix`;
  const res = cleanAndRepairJson<any>(truncated);
  assert.equal(res.overallScore, 70);
  assert.equal(res.priorityIssues[0].id, "P1");
  assert.equal(res.priorityIssues[0].actionableFix, "You need to fix");
});

test("cleanAndRepairJson strips markdown codeblocks and trailing commas", () => {
  const fenced = "```json\n{\n  \"overallScore\": 70,\n  \"items\": [need to add tests,],\n}\n```";
  const res = cleanAndRepairJson<any>(fenced);
  assert.equal(res.overallScore, 70);
  assert.equal(res.items[0], "need to add tests");
});

test("cleanAndRepairJson handles missing commas between properties and array items", () => {
  const missingCommas = `{\n  "title": "Paper"\n  "score": 85\n  "items": [\n    "item1"\n    "item2"\n  ]\n}`;
  const res = cleanAndRepairJson<any>(missingCommas);
  assert.equal(res.title, "Paper");
  assert.equal(res.score, 85);
  assert.deepEqual(res.items, ["item1", "item2"]);
});

test("cleanAndRepairJson handles text with leading 'need' keyword before JSON object", () => {
  const leadingNeed = `need to run review:\n{\n  "overallScore": 70\n}`;
  const res = cleanAndRepairJson<any>(leadingNeed);
  assert.equal(res.overallScore, 70);
});

test("cleanAndRepairJson gracefully returns fallback if provided, or throws clean non-compiler error", () => {
  const pureText = "This response contains no json at all.";
  const fallbackVal = { overallScore: 50 };
  const res = cleanAndRepairJson(pureText, fallbackVal);
  assert.deepEqual(res, fallbackVal);

  assert.throws(
    () => cleanAndRepairJson(pureText),
    (err: any) => {
      assert.ok(!err.message.includes("Unexpected identifier"));
      assert.ok(err.message.includes("could not be parsed as valid JSON"));
      return true;
    }
  );
});
