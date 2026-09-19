import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { generateCounterEvidenceProfiles } from "../src/lib/engine/prompts/controversy-radar";
import { calculateDeterministicPersonas } from "../src/lib/engine/persona-review";
import type { ParsedManuscript } from "../src/lib/types";

describe("Scholarly Consensus & Counter-Evidence Radar (Phase 3)", () => {
  const sampleManuscript: ParsedManuscript = {
    title: "Deep Neural Latents Cause Enhanced Perceptual Invariance in Biological Vision",
    abstract:
      "Here we demonstrate that deep neural representations directly cause perceptual invariance across biological visual cortices. Results indicate that invariant feature extraction drives category selectivity in primate inferior temporal cortex.",
    authors: ["Jane Doe", "John Smith"],
    wordCount: 4200,
    sections: {
      introduction: "Understanding representations in biological vision is a fundamental challenge...",
      methods: "We recorded neural activations across 12 subjects under visual stimulus arrays...",
      results: "Feature vectors revealed significant category clusters (t(142) = 4.21, p < 0.001)...",
      discussion: "These findings demonstrate that neural latents organize perceptual categories...",
    },
    rawText: "Here we demonstrate that deep neural representations directly cause perceptual invariance...",
    references: ["Turing A. (1950). Computing machinery. Mind.", "Hubel D., Wiesel T. (1962). J Physiol."],
    empiricalCues: {
      sampleSizes: ["n = 12"],
      statisticalMetrics: ["p < 0.001", "t(142) = 4.21"],
      causalAssertions: [
        "deep neural representations directly cause perceptual invariance",
      ],
    },
  };

  it("extracts core empirical claims and assigns dispute classifications", () => {
    const profiles = generateCounterEvidenceProfiles(sampleManuscript, "Computational Neuroscience");
    assert.ok(profiles.length >= 1);

    const first = profiles[0];
    assert.ok(first.claim.length > 10);
    assert.ok(["heavily_disputed", "emerging_debate", "consensus"].includes(first.disputedStatus));
    assert.ok(first.opposingSchoolOfThought);
    assert.ok(first.reviewer2Objection.length > 20);
    assert.ok(first.preemptiveRebuttalSnippet.length > 40);
  });

  it("flags strong causal claims without randomization as heavily disputed with endogeneity objections", () => {
    const profiles = generateCounterEvidenceProfiles(sampleManuscript, "Computational Neuroscience");
    const causalDispute = profiles.find((p) => p.disputedStatus === "heavily_disputed");
    assert.ok(causalDispute);
    assert.ok(causalDispute.reviewer2Objection.toLowerCase().includes("causal"));
    assert.ok(causalDispute.preemptiveRebuttalSnippet.toLowerCase().includes("rebuttal") || causalDispute.preemptiveRebuttalSnippet.toLowerCase().includes("confound"));
  });

  it("injects counter-evidence profiles into domain_expert and devils_advocate personas", () => {
    const personas = calculateDeterministicPersonas({
      manuscript: sampleManuscript,
      discipline: "Computational Neuroscience",
      targetJournal: "Nature Neuroscience",
      isScopeMismatch: false,
    });

    const domainExpert = personas.find((p) => p.persona === "domain_expert");
    assert.ok(domainExpert);
    assert.ok(domainExpert.counterEvidenceProfiles && domainExpert.counterEvidenceProfiles.length > 0);
    assert.ok(domainExpert.majorCritiques.some((c) => c.includes("Counter-Evidence Alert")));
    assert.ok(domainExpert.concreteSolutions?.some((s) => s.issue.includes("Anticipated Referee Objection")));

    const devilsAdvocate = personas.find((p) => p.persona === "devils_advocate");
    assert.ok(devilsAdvocate);
    assert.ok(devilsAdvocate.counterEvidenceProfiles && devilsAdvocate.counterEvidenceProfiles.length > 0);
    assert.ok(devilsAdvocate.counterArguments && devilsAdvocate.counterArguments.length > 0);
  });
});
