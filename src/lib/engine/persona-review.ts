import { validateReviewerPersonas } from "../schemas";
import {
  PanelConsensus,
  ParsedManuscript,
  ReviewerPersonaFeedback,
} from "../types";
import {
  DecisionCategory,
  EvidenceSpan,
  GroundedClaim,
  Issue,
  JournalArchetype,
  ManuscriptContext,
  PersonaId,
  PersonaReview,
  ScoringDimension,
  SectionSelector,
} from "./types";

export { validateReviewerPersonas };

export const CANONICAL_PERSONA_ROLES: ReviewerPersonaFeedback["persona"][] = [
  "journal_editor",
  "domain_expert",
  "methods_reviewer",
  "statistician",
  "devils_advocate",
];

export const CANONICAL_ANONYMOUS_TRACKS: Record<ReviewerPersonaFeedback["persona"], string> = {
  journal_editor: "Reviewer 1: Lead Handling Editor",
  domain_expert: "Reviewer 2: Target Domain Specialist",
  methods_reviewer: "Reviewer 3: Research Methodology Referee",
  statistician: "Reviewer 4: Statistical & Quantitative Auditor",
  devils_advocate: "Reviewer 5: Adversarial Translation Referee",
};

export interface PersonaSpecification {
  id: PersonaId;
  legacyRole: ReviewerPersonaFeedback["persona"];
  displayName: string;
  reads: SectionSelector;
  archetypeWeights: Record<JournalArchetype, number>;
  focusDimensions: ScoringDimension[];
  systemGoal: string;
}

export const PERSONA_SPEC: Record<PersonaId, PersonaSpecification> = {
  DOMAIN_EXPERT: {
    id: "DOMAIN_EXPERT",
    legacyRole: "domain_expert",
    displayName: "Domain Specialist Referee",
    reads: ["abstract", "introduction", "discussion", "conclusion"],
    archetypeWeights: {
      SIGNIFICANCE_GATED: 0.35,
      SOUNDNESS_ONLY: 0.15,
      ASSESSMENT_STYLE: 0.25,
    },
    focusDimensions: ["NOVELTY", "PRESENTATION"],
    systemGoal: "Evaluate domain novelty, conceptual advance, boundary conditions, and theoretical positioning.",
  },
  METHODOLOGICAL_SPECIALIST: {
    id: "METHODOLOGICAL_SPECIALIST",
    legacyRole: "methods_reviewer",
    displayName: "Research Methodology Referee",
    reads: ["methods", "results"],
    archetypeWeights: {
      SIGNIFICANCE_GATED: 0.25,
      SOUNDNESS_ONLY: 0.4,
      ASSESSMENT_STYLE: 0.3,
    },
    focusDimensions: ["METHODOLOGY"],
    systemGoal: "Audit experimental controls, instrumentation, missing variables, reproducibility, and protocols.",
  },
  STATISTICAL_REVIEWER: {
    id: "STATISTICAL_REVIEWER",
    legacyRole: "statistician",
    displayName: "Statistical & Quantitative Auditor",
    reads: ["methods", "results"],
    archetypeWeights: {
      SIGNIFICANCE_GATED: 0.2,
      SOUNDNESS_ONLY: 0.3,
      ASSESSMENT_STYLE: 0.25,
    },
    focusDimensions: ["STATISTICAL_RIGOR"],
    systemGoal: "Audit statistical power, confidence intervals, degrees of freedom, multiplicity corrections, and p-value validity.",
  },
  LITERATURE_REVIEWER: {
    id: "LITERATURE_REVIEWER",
    legacyRole: "devils_advocate",
    displayName: "Literature & Adversarial Translation Referee",
    reads: ["abstract", "introduction", "discussion"],
    archetypeWeights: {
      SIGNIFICANCE_GATED: 0.1,
      SOUNDNESS_ONLY: 0.05,
      ASSESSMENT_STYLE: 0.1,
    },
    focusDimensions: ["LITERATURE_COMPLETENESS", "ETHICAL_RIGOR"],
    systemGoal: "Test for omitted benchmark literature (2023-2025), over-extrapolated causal claims, and alternative hypotheses.",
  },
  JOURNAL_EDITOR: {
    id: "JOURNAL_EDITOR",
    legacyRole: "journal_editor",
    displayName: "Senior Handling Editor",
    reads: ["abstract", "introduction", "conclusion"],
    archetypeWeights: {
      SIGNIFICANCE_GATED: 0.1,
      SOUNDNESS_ONLY: 0.1,
      ASSESSMENT_STYLE: 0.1,
    },
    focusDimensions: ["NOVELTY", "PRESENTATION"],
    systemGoal: "Assess readership interest, broad community impact, formatting compliance, and editorial remit.",
  },
};

export const PERSONA_ID_TO_LEGACY: Record<PersonaId, ReviewerPersonaFeedback["persona"]> = {
  DOMAIN_EXPERT: "domain_expert",
  METHODOLOGICAL_SPECIALIST: "methods_reviewer",
  STATISTICAL_REVIEWER: "statistician",
  LITERATURE_REVIEWER: "devils_advocate",
  JOURNAL_EDITOR: "journal_editor",
};

export const LEGACY_TO_PERSONA_ID: Record<ReviewerPersonaFeedback["persona"], PersonaId> = {
  domain_expert: "DOMAIN_EXPERT",
  methods_reviewer: "METHODOLOGICAL_SPECIALIST",
  statistician: "STATISTICAL_REVIEWER",
  devils_advocate: "LITERATURE_REVIEWER",
  journal_editor: "JOURNAL_EDITOR",
};

export type PersonaProfile = {
  methods: { name: string; title: string; affiliation: string; expertise: string };
  domain: { name: string; title: string; affiliation: string; expertise: string };
  editor: { name: string; title: string; affiliation: string; expertise: string };
  statistician: { name: string; title: string; affiliation: string; expertise: string };
  devilsAdvocate: { name: string; title: string; affiliation: string; expertise: string };
};

export const DISCIPLINE_HEURISTIC_PROFILES: Record<string, PersonaProfile> = {
  "Operations Research & Management": {
    methods: {
      name: "Lead Methods Referee (Mathematical Programming)",
      title: "Senior Referee in Mathematical Optimization & Algorithmic Convergence",
      affiliation: "School of Industrial & Systems Engineering",
      expertise: "Mathematical optimization, algorithmic convergence, Karush-Kuhn-Tucker conditions, and inventory models",
    },
    domain: {
      name: "Domain Specialist (Operations & Supply Chain)",
      title: "Senior Referee in Operations Economics & Reverse Logistics",
      affiliation: "Department of Operations & Supply Chain Management",
      expertise: "Supply chain operations, circular economy, and production economics",
    },
    editor: {
      name: "Senior Handling Editor (Decision Sciences)",
      title: "Executive Editorial Board Member",
      affiliation: "Editorial Board, Operations Research & Management Science",
      expertise: "Operations research scope, editorial triage, and managerial decision support",
    },
    statistician: {
      name: "Quantitative Methods Auditor (Operations Analytics)",
      title: "Referee in Quantitative Decision Sciences & Sensitivity Analysis",
      affiliation: "Division of Quantitative Decision Sciences",
      expertise: "Sensitivity analysis, numerical stability, and optimization diagnostics",
    },
    devilsAdvocate: {
      name: "Adversarial Stress-Testing Referee (Systems Rigor)",
      title: "Industrial Systems Implementation & Boundary Auditor",
      affiliation: "Consortium for Industrial & Engineering Stress-Testing",
      expertise: "Adversarial stress-testing, parameter gaming, and industrial implementation friction",
    },
  },
  "Computer Science": {
    methods: {
      name: "Lead Methods Referee (Algorithmic Systems)",
      title: "Senior Referee in Neural Architectures & Algorithmic Complexity",
      affiliation: "Department of Computer Science & Algorithmic Theory",
      expertise: "Neural architectures, algorithmic complexity, and computational benchmarks",
    },
    domain: {
      name: "Domain Specialist (Representation Learning)",
      title: "Principal Referee in Machine Learning & Empirical Benchmarking",
      affiliation: "Laboratory for Computational Intelligence",
      expertise: "Empirical benchmarking, representation learning, and transferability",
    },
    editor: {
      name: "Executive Handling Editor (Computing & ML)",
      title: "Senior Executive Editor (Machine Learning Systems)",
      affiliation: "Editorial Board, High-Impact Computational Journals",
      expertise: "Computational novelty, algorithmic advance, and editorial triage",
    },
    statistician: {
      name: "Statistical Learning Auditor (Multi-Seed Inference)",
      title: "Senior Referee in Statistical Learning & Empirical Validation",
      affiliation: "Division of Statistical Learning & Applied Inference",
      expertise: "Multi-seed variance reporting, Wilcoxon testing, and hyperparameter sensitivity",
    },
    devilsAdvocate: {
      name: "Adversarial Reproducibility Referee (AI Stress-Testing)",
      title: "Lead AI Reproducibility Auditor & Adversarial Benchmark Tester",
      affiliation: "AI Reproducibility & Open Benchmarking Group",
      expertise: "Benchmark overfitting, compute-unbalanced baseline comparisons, and out-of-distribution failure",
    },
  },
  Clinical: {
    methods: {
      name: "Lead Methods Referee (Clinical Trial Rigor)",
      title: "Senior Referee in Clinical Protocol & Trial Methodology",
      affiliation: "Department of Clinical Trials & Observational Study Protocols",
      expertise: "Clinical trial design, observational study protocols, and STROBE/CONSORT standards",
    },
    domain: {
      name: "Clinical Investigator (Outcomes & Translation)",
      title: "Senior Referee in Clinical Outcomes & Patient Stratification",
      affiliation: "Division of Clinical Medicine & Outcomes Research",
      expertise: "Clinical outcomes, patient stratification, and healthcare translation",
    },
    editor: {
      name: "Executive Handling Editor (Clinical Medicine)",
      title: "Senior Executive Editor (General Medicine)",
      affiliation: "Editorial Board, Leading General Medical Journals",
      expertise: "Editorial triage, clinical impact, and patient-centered research",
    },
    statistician: {
      name: "Biostatistics Referee (Causal Inference)",
      title: "Senior Referee in Biostatistics & Epidemiological Modeling",
      affiliation: "Department of Biostatistics & Causal Inference",
      expertise: "Survival analysis, proportional hazards, propensity score matching, and missing data",
    },
    devilsAdvocate: {
      name: "Adversarial Clinical Auditor (Evidence-Based Medicine)",
      title: "Evidence-Based Medicine Referee & Observational Bias Skeptic",
      affiliation: "Centre for Evidence-Based Clinical Audit",
      expertise: "Confounding by indication, immortal time bias, and clinical 'So What?' thresholds",
    },
  },
  Oncology: {
    methods: {
      name: "Lead Methods Referee (Functional Genomics)",
      title: "Senior Referee in High-Throughput Functional Assays & Screening",
      affiliation: "Department of Experimental Oncology & Functional Genomics",
      expertise: "Cellular assays, functional screening, experimental controls, and protocol reproducibility",
    },
    domain: {
      name: "Domain Specialist (Mechanistic Oncology)",
      title: "Senior Referee in Cancer Biology & Biomarker Discovery",
      affiliation: "Division of Molecular Oncology & Translational Therapeutics",
      expertise: "Mechanistic biology, therapeutic resistance, and biomarker discovery",
    },
    editor: {
      name: "Executive Handling Editor (Cancer Biology)",
      title: "Senior Executive Editor (Translational Oncology)",
      affiliation: "High-Impact Multidisciplinary Oncology Editorial Board",
      expertise: "Translational relevance, high-impact scientific framing, and desk-rejection triage",
    },
    statistician: {
      name: "High-Dimensional Biostatistics Auditor",
      title: "Senior Referee in High-Dimensional Inference & Multiple Testing",
      affiliation: "Department of Biostatistics & Genomic Data Science",
      expertise: "Multiplicity adjustments, false discovery rate control, and biological replicate variance",
    },
    devilsAdvocate: {
      name: "Adversarial Experimental Skeptic (Translational Oncology)",
      title: "Translational Oncology Referee & Experimental Artifact Auditor",
      affiliation: "Translational Medicine Skepticism & Replication Group",
      expertise: "Culture-adaptation artifacts, off-target toxicity, and clinical translation failure",
    },
  },
  "Environmental Science & Sustainability": {
    methods: {
      name: "Lead Methods Referee (Environmental Systems & Modeling)",
      title: "Senior Referee in Ecological Modeling & Environmental Measurement",
      affiliation: "Institute for Environmental Science & Technology",
      expertise: "Life cycle assessment, carbon accounting, environmental flux modeling, and analytical measurement quality",
    },
    domain: {
      name: "Domain Specialist (Ecosystems & Sustainability)",
      title: "Senior Referee in Planetary Boundaries & Sustainability Science",
      affiliation: "Centre for Climate & Sustainability Studies",
      expertise: "Climate impact attribution, circular economy, biodiversity indicators, and socio-ecological systems",
    },
    editor: {
      name: "Executive Handling Editor (Environmental Science)",
      title: "Senior Executive Editor in Environmental & Sustainability Research",
      affiliation: "Editorial Board, Environmental & Sustainability Letters",
      expertise: "Environmental scope triage, high-impact interdisciplinary relevance, and policy actionability",
    },
    statistician: {
      name: "Environmental Biostatistician & Spatial Auditor",
      title: "Senior Referee in Spatial Statistics & Uncertainty Quantification",
      affiliation: "Department of Environmental Biostatistics & Geospatial Analysis",
      expertise: "Spatial-temporal autocorrelation, uncertainty quantification, and environmental sensor calibration",
    },
    devilsAdvocate: {
      name: "Adversarial Stress-Testing Referee (Ecological Rigor)",
      title: "Ecological Validity & Industrial Environmental Auditor",
      affiliation: "Environmental Systems Verification & Skepticism Group",
      expertise: "Confounding environmental variables, scale extrapolation hazards, and lifecycle boundary omissions",
    },
  },
};

export const DISCIPLINE_ALIAS_MAP: Record<string, string> = {
  "Machine Learning": "Computer Science",
  "Artificial Intelligence": "Computer Science",
  "Data Science": "Computer Science",
  "Software Engineering": "Computer Science",
  "Computing": "Computer Science",
  "Information Systems": "Computer Science",
  Medicine: "Clinical",
  "Clinical Medicine": "Clinical",
  "Medical Sciences": "Clinical",
  Epidemiology: "Clinical",
  "Public Health": "Clinical",
  "Internal Medicine": "Clinical",
  Biomedicine: "Clinical",
  Cancer: "Oncology",
  "Cancer Research": "Oncology",
  "Cancer Biology": "Oncology",
  Ecology: "Environmental Science & Sustainability",
  "Climate Science": "Environmental Science & Sustainability",
  "Environmental Engineering": "Environmental Science & Sustainability",
  Sustainability: "Environmental Science & Sustainability",
  "Earth Sciences": "Environmental Science & Sustainability",
  "Operations Research": "Operations Research & Management",
  Management: "Operations Research & Management",
  "Management Science": "Operations Research & Management",
  "Supply Chain": "Operations Research & Management",
  Economics: "Operations Research & Management",
  Finance: "Operations Research & Management",
  Business: "Operations Research & Management",
  "Economics, Finance & Business": "Operations Research & Management",
};

export function getDefaultDisciplineProfile(discipline: string): PersonaProfile {
  return {
    methods: {
      name: `Lead Methods Referee (Empirical Rigor: ${discipline})`,
      title: `Senior Referee in Research Methodology & Empirical Design`,
      affiliation: `Faculty of ${discipline} Methodology & Standards`,
      expertise: `Methodological protocols, reproducibility standards, and experimental design in ${discipline}`,
    },
    domain: {
      name: `Domain Specialist (${discipline})`,
      title: `Senior Referee in ${discipline} Frontiers`,
      affiliation: `Department of ${discipline} Research & Evaluation`,
      expertise: `Domain frontiers, theoretical novelty, and literature positioning in ${discipline}`,
    },
    editor: {
      name: `Executive Handling Editor (${discipline})`,
      title: "Senior Editorial Board Member",
      affiliation: `Editorial Advisory Board, Journals in ${discipline}`,
      expertise: "Editorial triage, broad readership interest, and desk-rejection risk assessment",
    },
    statistician: {
      name: `Quantitative Integrity Auditor (${discipline})`,
      title: "Senior Referee in Applied Statistics & Quantitative Integrity",
      affiliation: "Consortium for Quantitative Methods & Data Standards",
      expertise: "Sample power, inferential validity, variance reporting, and numerical stability",
    },
    devilsAdvocate: {
      name: `Adversarial Referee (Hostile Stress-Test: ${discipline})`,
      title: "Senior Research Auditor & Adversarial Stress-Tester",
      affiliation: "Consortium for Rigorous & Reproducible Science",
      expertise: "Selective reporting, p-hacking risks, unmeasured confounding, and adversarial stress-testing",
    },
  };
}

export function resolveDisciplineProfile(discipline: string): PersonaProfile {
  if (DISCIPLINE_HEURISTIC_PROFILES[discipline]) {
    return DISCIPLINE_HEURISTIC_PROFILES[discipline];
  }
  const alias = DISCIPLINE_ALIAS_MAP[discipline];
  if (alias && DISCIPLINE_HEURISTIC_PROFILES[alias]) {
    return DISCIPLINE_HEURISTIC_PROFILES[alias];
  }
  for (const [key, profile] of Object.entries(DISCIPLINE_HEURISTIC_PROFILES)) {
    if (discipline.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(discipline.toLowerCase())) {
      return profile;
    }
  }
  return getDefaultDisciplineProfile(discipline);
}

/**
 * Computes panel consensus distribution, agreement level, and score uncertainty margin (P0-3).
 */
export function computePanelConsensus(
  personas: ReviewerPersonaFeedback[],
  overallScore?: number
): PanelConsensus | undefined {
  if (!personas || personas.length < 3) return undefined;

  const distribution = {
    deskReject: 0,
    reject: 0,
    majorRevision: 0,
    minorRevision: 0,
  };

  for (const p of personas) {
    const rec = p.decisionRecommendation || "";
    if (rec.includes("Desk Reject")) {
      distribution.deskReject++;
    } else if (rec.includes("Reject")) {
      distribution.reject++;
    } else if (rec.includes("Minor") || rec.includes("Accept")) {
      distribution.minorRevision++;
    } else {
      distribution.majorRevision++;
    }
  }

  const rejectFamily = distribution.deskReject + distribution.reject;
  const reviseFamily = distribution.majorRevision + distribution.minorRevision;
  const total = personas.length;

  let consensusLevel: "unanimous" | "majority" | "split" = "majority";
  let uncertaintyMargin = 6;

  if (rejectFamily === total || reviseFamily === total) {
    consensusLevel = "unanimous";
    uncertaintyMargin = 3;
  } else if (Math.abs(rejectFamily - reviseFamily) <= 1 && total >= 4) {
    consensusLevel = "split";
    uncertaintyMargin = 10;
  } else {
    consensusLevel = "majority";
    uncertaintyMargin = 6;
  }

  // Borderline diagnosis
  let borderlineDiagnosis = "";
  if (consensusLevel === "unanimous") {
    borderlineDiagnosis =
      rejectFamily === total
        ? "The panel is unanimous in recommending rejection prior to submission; structural revisions or alternate venue targeting is required."
        : "The panel reaches unanimous consensus that the manuscript is suitable for peer review following targeted revisions.";
  } else if (consensusLevel === "split") {
    const editorIsReject = personas
      .find((p) => p.persona === "journal_editor")
      ?.decisionRecommendation?.includes("Reject");
    const methodsIsReject = personas
      .find((p) => p.persona === "methods_reviewer")
      ?.decisionRecommendation?.includes("Reject");

    if (editorIsReject && !methodsIsReject) {
      borderlineDiagnosis =
        "The panel splits on editorial significance and journal remit rather than methodology — your borderline hazard is venue framing and scope alignment.";
    } else if (methodsIsReject && !editorIsReject) {
      borderlineDiagnosis =
        "The panel splits on experimental controls and empirical proof rather than conceptual interest — your borderline hazard is methodological rigor.";
    } else {
      borderlineDiagnosis =
        "The panel displays substantial divergence between critical auditors and domain specialists (~25% inconsistency band), indicating a borderline submission.";
    }
  } else {
    borderlineDiagnosis =
      rejectFamily > reviseFamily
        ? "A majority of the panel advises rejection, indicating substantial evidentiary or scope hurdles."
        : "A majority of the panel supports proceeding to peer review after addressing specific methodological caveats.";
  }

  const scoreRange: [number, number] | undefined =
    overallScore !== undefined
      ? [
          Math.max(0, overallScore - uncertaintyMargin),
          Math.min(100, overallScore + uncertaintyMargin),
        ]
      : undefined;

  return {
    distribution,
    consensusLevel,
    borderlineDiagnosis,
    uncertaintyMargin,
    scoreRange,
  };
}

export interface DeterministicPersonasParams {
  manuscript: ParsedManuscript;
  discipline: string;
  targetJournal: string;
  isScopeMismatch: boolean;
}

/**
 * Generates the deterministic 5-persona peer review panel.
 * If the manuscript is desk-rejected due to scope mismatch, external peer reviewers
 * were never convened, so this strictly returns an empty array [].
 */
export function calculateDeterministicPersonas(
  params: DeterministicPersonasParams
): ReviewerPersonaFeedback[] {
  const { manuscript, discipline, targetJournal, isScopeMismatch } = params;

  const paperProfile = resolveDisciplineProfile(discipline);
  const cleanTitle = manuscript.title.trim();
  const sampleSizes = manuscript.empiricalCues?.sampleSizes || [];
  const statMetrics = manuscript.empiricalCues?.statisticalMetrics || [];
  const sampleCount = sampleSizes.length;
  const statCount = statMetrics.length;

  const sections = manuscript.sections || {};
  const isMethodsMissing =
    Boolean(manuscript.sectionProvenance?.methodsMissing) ||
    !sections.methods ||
    sections.methods.length < 50;

  const editorPersona: ReviewerPersonaFeedback = {
    persona: "journal_editor",
    name: CANONICAL_ANONYMOUS_TRACKS.journal_editor,
    title: `Senior Handling Editor (${targetJournal})`,
    affiliation: `Editorial Advisory Board, ${targetJournal}`,
    expertise: paperProfile.editor.expertise,
    roleDescription: isScopeMismatch
      ? "Editorial Screening, Aims & Scope Triage, and Desk-Rejection Determination"
      : "Aims & Scope, Readership Fit, and Contribution Triage",
    decisionRecommendation: isScopeMismatch ? "Desk Reject" : "Major Revision",
    keyChallenge: isScopeMismatch
      ? `Disciplinary Scope Mismatch: Manuscript domain (${discipline}) does not match ${targetJournal}'s publication remit.`
      : `Demarcating the conceptual advance and subscriber interest specifically for readers of ${targetJournal}.`,
    assessment: isScopeMismatch
      ? `As Handling Editor for ${targetJournal}, I have conducted preliminary editorial screening for "${cleanTitle}".\n\nThe manuscript presents an empirical investigation situated within ${discipline}, whereas ${targetJournal} publishes strictly within a different scholarly remit. Under standard editorial policy, out-of-scope submissions cannot proceed to external referees and are declined at editorial triage.\n\nTo ensure maximum constructive utility for the authors, our simulated panel has nonetheless completed comprehensive methodological, quantitative, and adversarial stress-tests below so you can strengthen the manuscript prior to submitting to a field-aligned journal in ${discipline}.`
      : `As Handling Editor for ${targetJournal}, I have evaluated "${cleanTitle}" for editorial suitability and community interest.\n\nThe manuscript addresses an active topic in ${discipline}. However, before external reviewers can be commissioned, the manuscript must more clearly articulate its theoretical and practical utility specifically for the readership of ${targetJournal}. The introductory rationale requires sharper differentiation against recently published works in this venue.`,
    strengths: [
      `Addresses an empirically consequential problem in ${discipline} with clear real-world relevance.`,
      `The research question is well-timed and reflects growing interest across the scholarly community.`,
      `Assembled empirical material provides a solid foundation for substantive investigation.`,
    ],
    majorCritiques: isScopeMismatch
      ? [
          `Substantive research focus falls outside the published aims & scope of ${targetJournal}.`,
          `Retarget the submission to a field-aligned journal in ${discipline} before engaging external peer reviewers.`,
          `Calibrate the conceptual framing in the abstract and introduction to reflect the norms of the intended target domain.`,
        ]
      : [
          `Articulate direct readership interest and theoretical utility for ${targetJournal}.`,
          `Synthesize practitioner and theoretical takeaways in an expanded discussion section.`,
          `Differentiate the core value proposition from baseline literature published over the last two years.`,
        ],
    concreteSolutions: [
      {
        issue: isScopeMismatch
          ? `Disciplinary misalignment between manuscript focus (${discipline}) and ${targetJournal}.`
          : `Introductory framing does not establish unique importance for ${targetJournal} subscribers.`,
        proposedFix: isScopeMismatch
          ? `Redirect submission to an indexed venue in ${discipline}, re-centering the abstract around disciplinary benchmarks.`
          : `Add a dedicated paragraph at the end of the Introduction explicitly defining the threshold contribution for ${targetJournal}.`,
        exampleRewrite: isScopeMismatch
          ? `Revise opening: "This study investigates [core topic] within ${discipline}, addressing unresolved questions in recent domain literature..."`
          : `Revise Introduction §1.3: "Whereas recent papers in ${targetJournal} have focused primarily on descriptive surveys, this study provides the first quantitative assessment of..."`,
      },
    ],
    missingControlsOrAnalyses: isScopeMismatch
      ? [
          `Alignment with recent publications and editorial debates in ${targetJournal}.`,
        ]
      : [
          "Explicit statement of contribution benchmarked against recent publications in this venue.",
        ],
    mustAddressItems: isScopeMismatch
      ? [
          `Redirect submission to a journal focused in ${discipline} (see Matching Journals tab).`,
          `Re-frame the title and introductory rationale to emphasize contributions relevant to the alternative venue.`,
        ]
      : [
          `Refine title and abstract to communicate direct relevance to ${targetJournal}.`,
        ],
    minorComments: [
      "Ensure abstract length complies with target journal word limits and structured heading format.",
      "Expand all abbreviations and acronyms upon first mention in both Abstract and Main Text.",
    ],
    evidenceAnchors: [`text: §Introduction "${cleanTitle.slice(0, 60)}..."`],
    counterArguments: isScopeMismatch
      ? [
          `Even if the methodology is sound, general-interest and out-of-scope venues will decline this work without peer review due to editorial remit constraints.`,
        ]
      : [
          "Ensure findings possess generalizable significance beyond a single localized cohort.",
        ],
    source: "heuristic",
  };

  let abstractCore = "";
  if (manuscript.abstract && manuscript.abstract.length > 25) {
    const sentences = manuscript.abstract
      .replace(/\r?\n+/g, " ")
      .split(/(?<=[.?!])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 15);
    const findingSentence =
      sentences.find((s) =>
        /\b(we find|we show|we demonstrate|results indicate|we propose|we develop|findings suggest|we observe|our analysis|we formulate|we evaluate|this paper presents|this study investigates)\b/i.test(
          s
        )
      ) || sentences[0];
    if (findingSentence) {
      abstractCore = findingSentence.replace(/^["'“”«»‘’]+|["'“”«»‘’]+$/g, "").trim();
      if (!abstractCore.endsWith(".")) abstractCore += ".";
    }
  }

  const domainPersona: ReviewerPersonaFeedback = {
    persona: "domain_expert",
    name: CANONICAL_ANONYMOUS_TRACKS.domain_expert,
    title: paperProfile.domain.title,
    affiliation: paperProfile.domain.affiliation,
    expertise: paperProfile.domain.expertise,
    roleDescription: `Domain Novelty & ${discipline} Conceptual Advance`,
    decisionRecommendation: "Major Revision",
    keyChallenge: `Situating the contribution against 2023–2025 benchmark publications in ${discipline}.`,
    assessment: `This manuscript investigates a significant empirical question within ${discipline}.\n\nThe author's focus on "${cleanTitle.slice(0, 70)}" addresses a topic of strong ongoing interest. The descriptive findings provide helpful context. However, from a specialist perspective, the manuscript does not sufficiently interact with leading contemporary benchmark frameworks in ${discipline}.\n\nThe theoretical mechanisms linking the observed variables require deeper substantiation, and the discussion should delineate boundary conditions under which these findings may not hold.`,
    strengths: [
      `Engages an active and practically relevant research challenge in ${discipline}.`,
      `Presents valuable empirical evidence relating to ${cleanTitle.slice(0, 50)}.`,
      `Provides clear data tables and descriptive summaries of the primary study variables.`,
    ],
    majorCritiques: [
      `Differentiate findings more clearly from recent benchmark papers (2023–2025) in ${discipline}.`,
      `Elaborate the mechanistic pathway connecting inputs to observed outcomes rather than relying on correlational descriptions.`,
      `Address potential confounding variables unique to this domain context.`,
    ],
    concreteSolutions: [
      {
        issue: `Literature engagement lacks direct comparison with contemporary 2023–2025 ${discipline} frameworks.`,
        proposedFix: `Add a comparative table or dedicated literature paragraph contrasting your operational parameters with recent standard models.`,
        exampleRewrite: `Revise Discussion: "Whereas conventional ${discipline} models assume homogeneous responses across cohorts, our empirical observations demonstrate substantial variance (mean difference = 0.34, p < 0.01), reconciling the divergent conclusions of recent studies."`,
      },
    ],
    missingControlsOrAnalyses: [
      "Subgroup sensitivity analyses examining heterogeneity across project cohorts.",
      "Comparison with standard baseline models in recent discipline literature.",
    ],
    mustAddressItems: [
      "Update literature review with relevant 2023–2025 citations from leading field journals.",
      "Explicitly state boundary conditions and external validity limitations.",
    ],
    minorComments: [
      "Standardize terminology for key variables throughout Sections 2 and 4.",
      "Check citation formatting for accuracy against journal guidelines.",
    ],
    evidenceAnchors: [
      abstractCore
        ? `text: §Abstract "${abstractCore.slice(0, 75)}"`
        : 'text: §Introduction "research problem formulation"',
    ],
    counterArguments: [
      "Clarify whether observed effects are structural or driven by sampling composition.",
    ],
    source: "heuristic",
  };

  const methodsPersona: ReviewerPersonaFeedback = {
    persona: "methods_reviewer",
    name: CANONICAL_ANONYMOUS_TRACKS.methods_reviewer,
    title: paperProfile.methods.title,
    affiliation: paperProfile.methods.affiliation,
    expertise: paperProfile.methods.expertise,
    roleDescription: "Protocol Rigor, Reproducibility, and Empirical Design",
    decisionRecommendation: isMethodsMissing ? "Reject / Resubmit" : "Major Revision",
    keyChallenge: isMethodsMissing
      ? "Absence of identifiable formal Methods / Experimental section."
      : "Providing full step-by-step procedural parameters and data access specifications.",
    assessment: isMethodsMissing
      ? `The manuscript lacks an identifiable, dedicated Materials and Methods section.\n\nWithout explicit documentation of sampling procedures, instrument calibrations, control conditions, and computational pipelines, external referees cannot evaluate experimental integrity or replicate the findings. An academic submission cannot proceed to publication without a transparent methodological architecture.`
      : `The methodology outlines a sequential empirical workflow for studying "${cleanTitle.slice(0, 60)}".\n\nWhile the general design is clear, crucial procedural parameters remain underspecified. To meet high-impact reproducibility standards, the authors must specify exact sampling criteria, instrument settings, missing data handling, and public repository deposition for analysis scripts.`,
    strengths: [
      `The empirical design aligns logically with the primary exploratory aims.`,
      `Structured workflow allows straightforward tracking from data ingestion to reported outputs.`,
      `Identifies relevant observational units and measurement metrics.`,
    ],
    majorCritiques: isMethodsMissing
      ? [
          "Add an explicit Materials & Methods section detailing all experimental specifications and protocols.",
          "Document data provenance, filtering criteria, and cohort exclusions systematically.",
        ]
      : [
          "Document complete instrumentation parameters, software dependencies, and exact version numbers.",
          "Provide an explicit protocol for outlier exclusion and missing data imputation.",
          "Clarify pre-registration status and deposit reproducible computational scripts.",
        ],
    concreteSolutions: [
      {
        issue: isMethodsMissing
          ? "No formal Materials & Methods section detected in manuscript."
          : "Reproducibility parameters (software version, seeds, raw data repository) are omitted.",
        proposedFix: isMethodsMissing
          ? "Introduce a structured §Methods section covering: (1) Sample / Cohort Selection, (2) Experimental Setup, (3) Analytical Pipeline."
          : "Include a 'Reproducibility and Code Availability' paragraph detailing computational environments and permanent DOI archives.",
        exampleRewrite: `Add to Methods: "All analyses were performed in Python (v3.11) and R (v4.3). Code pipelines and anonymized data matrices are openly archived via Zenodo (DOI: 10.5281/zenodo.XXXXXXX). Random seeds were set to 42 for all non-deterministic steps."`,
      },
    ],
    missingControlsOrAnalyses: [
      "Robustness checks testing sensitivity to alternative model specifications.",
      "Negative control tests or baseline sanity checks verifying measurement stability.",
    ],
    mustAddressItems: [
      isMethodsMissing
        ? "Draft a comprehensive Materials & Methods section before submitting."
        : "Provide public replication code and data accession link.",
      "Explicitly report inclusion and exclusion criteria for all cohorts.",
    ],
    minorComments: [
      "Specify manufacturer, model, and city/country for all proprietary hardware/software used.",
      "Include a flow diagram illustrating cohort inclusion/exclusion if applicable.",
    ],
    evidenceAnchors: [
      isMethodsMissing
        ? "absence: §Methods heading not detected in manuscript"
        : `text: §Methods "${sampleSizes[0] || cleanTitle.slice(0, 50)}"`,
    ],
    counterArguments: [
      "Rule out alternative methodological explanations through negative control experiments.",
    ],
    source: "heuristic",
  };

  const statisticianPersona: ReviewerPersonaFeedback = {
    persona: "statistician",
    name: CANONICAL_ANONYMOUS_TRACKS.statistician,
    title: paperProfile.statistician.title,
    affiliation: paperProfile.statistician.affiliation,
    expertise: paperProfile.statistician.expertise,
    roleDescription: "Statistical Power, Inference Validity, and Variance Reporting",
    decisionRecommendation: "Major Revision",
    keyChallenge: "Statistical power reporting, uncertainty quantification, and multiplicity control.",
    assessment: `I have reviewed the quantitative and statistical procedures reported in the manuscript.\n\nThe empirical presentation incorporates ${statCount > 0 ? statMetrics.slice(0, 2).join(", ") : "statistical testing"}. However, the reporting does not adhere to contemporary statistical reporting guidelines (e.g. ASA, SAMPL).\n\nSpecifically: (1) Point estimates are frequently presented without 95% confidence intervals; (2) Sample size justification via a-priori power calculations is absent; (3) When multiple hypotheses are evaluated, family-wise error rate or False Discovery Rate (FDR) corrections are not clearly documented.`,
    strengths: [
      `Quantitative framework is directly aligned with the stated research questions.`,
      `Data presentation includes clear tabular summaries of point estimates and test statistics.`,
      `Analytical procedures appear appropriate for the declared study design.`,
    ],
    majorCritiques: [
      "Report exact p-values, test statistics, degrees of freedom, and 95% confidence intervals throughout.",
      "Justify sample size with formal a-priori or sensitivity power calculations (target 1 - beta >= 0.80).",
      "Apply and document multiple testing corrections (e.g., Benjamini-Hochberg FDR) where multiple parameters are tested.",
    ],
    concreteSolutions: [
      {
        issue: "Solitary p-values and point estimates reported without confidence intervals or effect sizes.",
        proposedFix: "Replace bare p-value reporting with standardized effect sizes (Cohen's d, partial eta squared, or odds ratios) accompanied by 95% CIs.",
        exampleRewrite: `Revise results sentences: "The intervention produced a significant effect (beta = 0.42, 95% CI [0.18, 0.66], t(142) = 3.48, p = 0.0007, Cohen's d = 0.58). Post-hoc power analysis indicated 88% power to detect an effect of this magnitude at alpha = 0.05."`,
      },
    ],
    missingControlsOrAnalyses: [
      "Multiple hypothesis testing corrections (Bonferroni or Benjamini-Hochberg FDR).",
      "Model diagnostics testing assumptions of normality and homoscedasticity of residuals.",
    ],
    mustAddressItems: [
      "Add 95% confidence intervals to all graphical and tabular data summaries.",
      "State exact numerical p-values rather than inequality thresholds (except p < 0.001).",
    ],
    minorComments: [
      "Define all error bars in figure captions (indicate whether they represent SD, SEM, or 95% CI).",
      "Do not report p-values as 'p = 0.000'; use 'p < 0.001'.",
    ],
    evidenceAnchors: [
      sampleCount > 0
        ? `text: §Methods "${sampleSizes[0]}"`
        : "absence: §Methods lacks explicit statistical power calculation",
    ],
    counterArguments: [
      "Verify that distribution assumptions (normality, homoscedasticity) hold for all parametric tests.",
    ],
    source: "heuristic",
  };

  const devilsAdvocatePersona: ReviewerPersonaFeedback = {
    persona: "devils_advocate",
    name: CANONICAL_ANONYMOUS_TRACKS.devils_advocate,
    title: paperProfile.devilsAdvocate.title,
    affiliation: paperProfile.devilsAdvocate.affiliation,
    expertise: paperProfile.devilsAdvocate.expertise,
    roleDescription: "Hostile Audit, Unmeasured Confounders, and Stress-Testing",
    decisionRecommendation: "Reject / Resubmit",
    keyChallenge: "Observational confounding and over-extrapolation of causal claims.",
    assessment: `Examining this work through an adversarial audit: what rival hypotheses could produce these exact empirical patterns without the author's preferred explanation?\n\nThe manuscript demonstrates noteworthy associations, but the text frequently slips into causal assertions that exceed the evidentiary design.\n\nWithout rigorous falsification tests, sensitivity bounds for unobserved confounders (e.g., Oster bounds or E-values), and explicit discussion of selection bias, the strongest conclusions remain vulnerable to skeptical readers and referees.`,
    strengths: [
      `Tackles an ambitious question and formulates clear, testable assertions.`,
      `Exposes potentially impactful patterns that provoke meaningful debate in ${discipline}.`,
      `Provides an open target for rigorous empirical interrogation and replication.`,
    ],
    majorCritiques: [
      "Causal language is overly strong given the observational or non-randomized dataset.",
      "Selection bias, survivorship effects, or reverse causality have not been rigorously ruled out.",
      "Absence of placebo checks or falsification tests to establish counterfactual validity.",
    ],
    concreteSolutions: [
      {
        issue: "Causal claims in Abstract and Conclusion exceed the observational design.",
        proposedFix: "Modulate causal verbs ('proves', 'causes', 'demonstrates') to associative or conditional framing, and introduce an honest Limitations subsection.",
        exampleRewrite: `Revise Abstract conclusion: "Our empirical findings indicate a strong positive association between [Variable A] and [Variable B] across the sampled cohorts. While these results suggest a potential mechanism, establishing definitive causality will require longitudinal or randomized experimental designs."`,
      },
    ],
    missingControlsOrAnalyses: [
      "Falsification / placebo tests to verify that the estimated effect vanishes under randomized counterfactuals.",
      "Quantification of sensitivity to unobserved confounding (e.g., E-values or Rosenbaum bounds).",
    ],
    mustAddressItems: [
      "Tone down causal assertions throughout the Abstract, Results, and Conclusion.",
      "Add a dedicated Limitations subsection acknowledging observational boundary conditions.",
    ],
    minorComments: [
      "Explicitly discuss at least two rival interpretations of your primary empirical findings.",
      "Acknowledge demographic or cohort boundary conditions in the final summary.",
    ],
    evidenceAnchors: [`text: §Abstract "${cleanTitle.slice(0, 60)}..."`],
    counterArguments: [
      "Could reverse causality or omitted macroeconomic variables explain the observed outcome?",
    ],
    source: "heuristic",
  };

  return [
    editorPersona,
    domainPersona,
    methodsPersona,
    statisticianPersona,
    devilsAdvocatePersona,
  ];
}

// -----------------------------------------------------------------------------
// AUDIT REDESIGN: SECTION-SCOPED PROMPTS, GROUNDED HEURISTICS & ADAPTERS
// -----------------------------------------------------------------------------

function specTitle(personaId: PersonaId, profile?: PersonaProfile): string {
  if (profile) {
    if (personaId === "DOMAIN_EXPERT") return profile.domain.title;
    if (personaId === "METHODOLOGICAL_SPECIALIST") return profile.methods.title;
    if (personaId === "STATISTICAL_REVIEWER") return profile.statistician.title;
    if (personaId === "LITERATURE_REVIEWER") return profile.devilsAdvocate.title;
    if (personaId === "JOURNAL_EDITOR") return profile.editor.title;
  }
  return PERSONA_SPEC[personaId]?.displayName || "Peer Reviewer";
}

function specAffiliation(personaId: PersonaId, profile?: PersonaProfile): string {
  if (profile) {
    if (personaId === "DOMAIN_EXPERT") return profile.domain.affiliation;
    if (personaId === "METHODOLOGICAL_SPECIALIST") return profile.methods.affiliation;
    if (personaId === "STATISTICAL_REVIEWER") return profile.statistician.affiliation;
    if (personaId === "LITERATURE_REVIEWER") return profile.devilsAdvocate.affiliation;
    if (personaId === "JOURNAL_EDITOR") return profile.editor.affiliation;
  }
  return "Editorial & Peer Review Panel";
}

function specExpertise(personaId: PersonaId, profile?: PersonaProfile): string {
  if (profile) {
    if (personaId === "DOMAIN_EXPERT") return profile.domain.expertise;
    if (personaId === "METHODOLOGICAL_SPECIALIST") return profile.methods.expertise;
    if (personaId === "STATISTICAL_REVIEWER") return profile.statistician.expertise;
    if (personaId === "LITERATURE_REVIEWER") return profile.devilsAdvocate.expertise;
    if (personaId === "JOURNAL_EDITOR") return profile.editor.expertise;
  }
  return PERSONA_SPEC[personaId]?.systemGoal || "Peer Review";
}

/**
 * Builds an LLM prompt scoped strictly to the persona's designated reading list (Spec §4.2).
 * Drastically cuts token context and prevents domain personas from hallucinating wet-lab or code errors.
 */
export function buildPersonaPrompt(
  personaId: PersonaId,
  ctx: ManuscriptContext,
  archetype: JournalArchetype = "SIGNIFICANCE_GATED",
  targetJournal?: string
): string {
  const spec = PERSONA_SPEC[personaId];
  const scopedText = ctx.getSections(spec.reads);

  let archetypeGuidance = "";
  if (archetype === "SIGNIFICANCE_GATED") {
    archetypeGuidance = "TARGET VENUE ARCHETYPE: SIGNIFICANCE-GATED (e.g. Nature/Science/Cell/NEJM). Conceptual advance, transformative significance, and broad impact are primary gates. Incremental work will be rejected even if technically flawless.";
  } else if (archetype === "SOUNDNESS_ONLY") {
    archetypeGuidance = "TARGET VENUE ARCHETYPE: SOUNDNESS-ONLY (e.g. PLOS ONE / Scientific Reports). Technical correctness, methodological rigor, and data availability are the ONLY gates. Do NOT reject for lack of subjective novelty or impact if the method and analysis are sound.";
  } else {
    archetypeGuidance = "TARGET VENUE ARCHETYPE: ASSESSMENT-STYLE (e.g. eLife). Explicitly separate assessment of scientific significance from strength of empirical evidence.";
  }

  return `You are serving as an independent peer reviewer: ${spec.displayName}${targetJournal ? ` for ${targetJournal}` : ""}.

ROLE & SYSTEM OBJECTIVE:
${spec.systemGoal}
Target Scoring Dimensions: ${spec.focusDimensions.join(", ")}

${archetypeGuidance}

ASSIGNED SECTIONS (STRICT READING SCOPE):
You are assigned to evaluate ONLY these sections: ${spec.reads.join(", ")}.
Do NOT assume or fabricate details regarding sections outside your assigned scope.

MANDATORY EDITORIAL INSTRUCTIONS:
1. ANONYMITY: Scholarly peer review is strictly blinded. Do not invent personal human names.
2. MECHANICAL SPAN GROUNDING: Every critique, issue, or evidence point MUST include an exact verbatim substring from the text below in "quotedText".
3. HONEST ABSTENTION: If a topic, technique, or assay is outside your assigned sections or lacks sufficient evidence in the text, YOU MUST ABSTAIN. Add the item to "abstentions" or set status to "INSUFFICIENT_EVIDENCE". Never hallucinate laboratory protocols or statistical errors if not documented in the provided text.
4. INDEPENDENT JUDGMENT: Provide your own uninfluenced scientific evaluation.

MANUSCRIPT TEXT (${spec.reads.join(", ")}):
<<<MANUSCRIPT_UNTRUSTED_CONTENT_VERBATIM>>>
${scopedText}
<<<MANUSCRIPT_UNTRUSTED_CONTENT_VERBATIM>>>

Respond with STRICT JSON adhering to this schema:
{
  "personaId": "${personaId}",
  "summary": "Concise 2-3 paragraph diagnostic critique",
  "recommendation": "DESK_REJECT" | "REJECT_AFTER_REVIEW" | "MAJOR_REVISION" | "MINOR_REVISION" | "ACCEPT",
  "confidence": 0.0 to 1.0,
  "abstentions": ["list of areas outside assigned scope or lacking evidence in text"],
  "dimensionScores": {
    "<DIMENSION_NAME>": {
      "score": 1 to 10,
      "evidence": [{ "section": "methods", "startOffset": 0, "endOffset": 0, "quotedText": "exact verbatim quote" }]
    }
  },
  "issues": [
    {
      "id": "ISSUE-1",
      "severity": "CRITICAL" | "MAJOR" | "MINOR",
      "grounded": {
        "claim": "Specific factual critique",
        "evidence": [{ "section": "methods", "startOffset": 0, "endOffset": 0, "quotedText": "exact verbatim quote" }],
        "status": "SUPPORTED" | "INSUFFICIENT_EVIDENCE"
      },
      "recommendation": "Concrete actionable fix",
      "source": "PERSONA"
    }
  ]
}`;
}

/**
 * Generates 5 fully grounded PersonaReview objects using deterministic heuristics (Spec §4.1).
 * Used for offline execution, testing, or as resilient fallback.
 */
export function generateHeuristicPersonaReviews(
  ctx: ManuscriptContext,
  discipline: string = "Multidisciplinary",
  archetype: JournalArchetype = "SIGNIFICANCE_GATED"
): PersonaReview[] {
  const manuscript = ctx.manuscript;
  const cleanTitle = (manuscript.title || "Submitted Manuscript").trim();
  const sampleSizes = manuscript.empiricalCues?.sampleSizes || [];
  const statMetrics = manuscript.empiricalCues?.statisticalMetrics || [];
  const sections = manuscript.sections || {};
  const isMethodsMissing =
    Boolean(manuscript.sectionProvenance?.methodsMissing) ||
    !sections.methods ||
    sections.methods.length < 50;

  // Real spans mechanically located via ManuscriptContext
  const titleSpan = ctx.locateSpan(cleanTitle.slice(0, 40));
  const abstractSpan = manuscript.abstract
    ? ctx.locateSpan(manuscript.abstract.slice(0, 60))
    : null;
  const methodsSpan = !isMethodsMissing && sections.methods
    ? ctx.locateSpan(sections.methods.slice(0, 60))
    : null;
  const sampleSpan = sampleSizes[0] ? ctx.locateSpan(sampleSizes[0]) : null;

  // 1. DOMAIN_EXPERT
  const domainReview: PersonaReview = {
    personaId: "DOMAIN_EXPERT",
    summary: `This manuscript investigates an important empirical challenge in ${discipline} centered on "${cleanTitle.slice(0, 60)}". While the research question is timely, the conceptual advance over recent 2023–2025 literature requires sharper demarcation.`,
    recommendation: "MAJOR_REVISION",
    confidence: 0.85,
    abstentions: [
      "Low-level instrumentation calibration and software dependencies (deferred to Methodological Specialist)",
      "Multiplicity and family-wise error adjustments (deferred to Statistical Auditor)",
    ],
    dimensionScores: {
      NOVELTY: {
        score: archetype === "SOUNDNESS_ONLY" ? 8.0 : 6.8,
        evidence: abstractSpan ? [abstractSpan] : [],
        agreement: 0.85,
      },
      PRESENTATION: {
        score: 7.5,
        evidence: titleSpan ? [titleSpan] : [],
        agreement: 0.9,
      },
    },
    issues: [
      {
        id: "ISSUE-DOMAIN-1",
        pillar: "NOVELTY_SIGNIFICANCE",
        dimension: "NOVELTY",
        severity: "MAJOR",
        grounded: {
          claim: `Conceptual advance over recent literature in ${discipline} is insufficiently demarcated.`,
          evidence: abstractSpan ? [abstractSpan] : [],
          status: abstractSpan ? "SUPPORTED" : "INSUFFICIENT_EVIDENCE",
        },
        recommendation: `Contrast core operational parameters with contemporary 2023-2025 benchmark models in ${discipline}.`,
        source: "PERSONA",
        personaId: "DOMAIN_EXPERT",
      },
    ],
    reliabilityFlag: "HIGH",
  };

  // 2. METHODOLOGICAL_SPECIALIST
  const methodsReview: PersonaReview = {
    personaId: "METHODOLOGICAL_SPECIALIST",
    summary: isMethodsMissing
      ? "The manuscript lacks a dedicated, identifiable Materials and Methods section. Experimental protocols, sampling procedures, and controls cannot be verified without a transparent methodological architecture."
      : `The methodology describes an empirical sequence for studying "${cleanTitle.slice(0, 50)}". However, specific reproducibility parameters (sampling criteria, version dependencies, and data repository access) require explicit disclosure.`,
    recommendation: isMethodsMissing ? "REJECT_AFTER_REVIEW" : "MAJOR_REVISION",
    confidence: isMethodsMissing ? 0.95 : 0.8,
    abstentions: [
      "Subjective domain significance and reader appeal (deferred to Domain Specialist and Editor)",
      "Target journal word limit formatting",
    ],
    dimensionScores: {
      METHODOLOGY: {
        score: isMethodsMissing ? 3.5 : 6.5,
        evidence: methodsSpan ? [methodsSpan] : [],
        agreement: 0.88,
      },
    },
    issues: [
      {
        id: "ISSUE-METHODS-1",
        pillar: "METHODOLOGICAL_SOUNDNESS",
        dimension: "METHODOLOGY",
        severity: isMethodsMissing ? "CRITICAL" : "MAJOR",
        grounded: {
          claim: isMethodsMissing
            ? "Dedicated Materials & Methods section not identified in manuscript text."
            : "Procedural parameters and code/data deposition links are underspecified.",
          evidence: methodsSpan ? [methodsSpan] : [],
          status: isMethodsMissing ? "INSUFFICIENT_EVIDENCE" : methodsSpan ? "SUPPORTED" : "INSUFFICIENT_EVIDENCE",
        },
        recommendation: isMethodsMissing
          ? "Introduce a formal Materials & Methods section detailing cohort selection and analytical workflow."
          : "Provide a dedicated Data & Code Availability statement with repository accession identifier.",
        source: "PERSONA",
        personaId: "METHODOLOGICAL_SPECIALIST",
      },
    ],
    reliabilityFlag: "HIGH",
  };

  // 3. STATISTICAL_REVIEWER
  const statReview: PersonaReview = {
    personaId: "STATISTICAL_REVIEWER",
    summary: `Quantitative reporting audit: The manuscript reports ${statMetrics.length > 0 ? statMetrics.slice(0, 2).join(", ") : "point estimates"}. However, reporting guidelines require consistent 95% confidence intervals, explicit sample size justification, and multiple comparison adjustments.`,
    recommendation: "MAJOR_REVISION",
    confidence: 0.82,
    abstentions: [
      "Conceptual/theoretical literature framing",
      "Biological/experimental assay wet-lab validity",
    ],
    dimensionScores: {
      STATISTICAL_RIGOR: {
        score: sampleSizes.length > 0 ? 6.5 : 5.8,
        evidence: sampleSpan ? [sampleSpan] : [],
        agreement: 0.85,
      },
    },
    issues: [
      {
        id: "ISSUE-STATS-1",
        pillar: "METHODOLOGICAL_SOUNDNESS",
        dimension: "STATISTICAL_RIGOR",
        severity: "MAJOR",
        grounded: {
          claim: "Point estimates and statistical comparisons lack uniform 95% confidence intervals and formal power justifications.",
          evidence: sampleSpan ? [sampleSpan] : [],
          status: sampleSpan ? "SUPPORTED" : "INSUFFICIENT_EVIDENCE",
        },
        recommendation: "Add 95% confidence intervals to all reported estimates and provide a-priori sample size power justification.",
        source: "PERSONA",
        personaId: "STATISTICAL_REVIEWER",
      },
    ],
    reliabilityFlag: "HIGH",
  };

  // 4. LITERATURE_REVIEWER
  const litReview: PersonaReview = {
    personaId: "LITERATURE_REVIEWER",
    summary: "Critical audit of literature integration and scope claims: Causal formulations in the text must be bounded against unobserved confounding and observational study limits.",
    recommendation: "MAJOR_REVISION",
    confidence: 0.78,
    abstentions: [
      "Numerical algorithm convergence verification",
      "Detailed sample power calculation auditing",
    ],
    dimensionScores: {
      LITERATURE_COMPLETENESS: {
        score: 6.2,
        evidence: abstractSpan ? [abstractSpan] : [],
        agreement: 0.8,
      },
      ETHICAL_RIGOR: {
        score: 7.8,
        evidence: [],
        agreement: 0.9,
      },
    },
    issues: [
      {
        id: "ISSUE-LIT-1",
        pillar: "NOVELTY_SIGNIFICANCE",
        dimension: "LITERATURE_COMPLETENESS",
        severity: "MAJOR",
        grounded: {
          claim: "Causal language in abstract or conclusion should be tempered with observational boundary conditions and alternative hypotheses.",
          evidence: abstractSpan ? [abstractSpan] : [],
          status: abstractSpan ? "SUPPORTED" : "INSUFFICIENT_EVIDENCE",
        },
        recommendation: "Modulate causal assertions to conditional or associative phrasing, and add an explicit Limitations subsection.",
        source: "PERSONA",
        personaId: "LITERATURE_REVIEWER",
      },
    ],
    reliabilityFlag: "HIGH",
  };

  // 5. JOURNAL_EDITOR
  const editorReview: PersonaReview = {
    personaId: "JOURNAL_EDITOR",
    summary: "Editorial assessment: The topic holds clear community interest. Prior to sending for external peer review, the manuscript must heighten its introductory differentiation and ensure compliance with publication guidelines.",
    recommendation: "MAJOR_REVISION",
    confidence: 0.88,
    abstentions: [
      "Granular statistical derivations",
      "Specialized wet-lab or algorithmic step-by-step auditing",
    ],
    dimensionScores: {
      NOVELTY: {
        score: 7.0,
        evidence: titleSpan ? [titleSpan] : [],
        agreement: 0.85,
      },
      PRESENTATION: {
        score: 7.2,
        evidence: abstractSpan ? [abstractSpan] : [],
        agreement: 0.88,
      },
    },
    issues: [
      {
        id: "ISSUE-EDITOR-1",
        pillar: "SCOPE_FIT",
        dimension: "PRESENTATION",
        severity: "MINOR",
        grounded: {
          claim: "Introductory framing must clearly establish theoretical and practitioner utility for venue readership.",
          evidence: titleSpan ? [titleSpan] : [],
          status: titleSpan ? "SUPPORTED" : "INSUFFICIENT_EVIDENCE",
        },
        recommendation: "Add an explicit contribution summary paragraph at the close of the Introduction.",
        source: "PERSONA",
        personaId: "JOURNAL_EDITOR",
      },
    ],
    reliabilityFlag: "HIGH",
  };

  return [domainReview, methodsReview, statReview, litReview, editorReview];
}

/**
 * Adapter converting modern PersonaReview into legacy ReviewerPersonaFeedback
 * for seamless UI rendering on DesktopDashboard.
 */
export function personaReviewToLegacy(
  review: PersonaReview,
  profile?: PersonaProfile
): ReviewerPersonaFeedback {
  const legacyRole = PERSONA_ID_TO_LEGACY[review.personaId] || "domain_expert";
  const trackName = CANONICAL_ANONYMOUS_TRACKS[legacyRole];

  const recMap: Record<DecisionCategory, ReviewerPersonaFeedback["decisionRecommendation"]> = {
    DESK_REJECT: "Desk Reject",
    REJECT_AFTER_REVIEW: "Reject / Resubmit",
    MAJOR_REVISION: "Major Revision",
    MINOR_REVISION: "Minor Revision",
    ACCEPT: "Minor Revision",
  };

  const majorCritiques = review.issues
    .filter((i) => i.severity === "CRITICAL" || i.severity === "MAJOR")
    .map((i) => i.grounded.claim);

  const concreteSolutions = review.issues.map((i) => ({
    issue: i.grounded.claim,
    proposedFix: i.recommendation,
  }));

  const evidenceAnchors = review.issues.flatMap((i) =>
    i.grounded.evidence.map((e) => `text: §${e.section} "${e.quotedText}"`)
  );

  return {
    persona: legacyRole,
    name: trackName,
    title: specTitle(review.personaId, profile),
    affiliation: specAffiliation(review.personaId, profile),
    expertise: specExpertise(review.personaId, profile),
    roleDescription: PERSONA_SPEC[review.personaId]?.systemGoal || "Peer Reviewer",
    decisionRecommendation: recMap[review.recommendation] || "Major Revision",
    keyChallenge: majorCritiques[0] || "Methodological and reporting refinement required.",
    assessment: review.summary,
    strengths: [
      "Presents clear empirical focus aligned with study goals.",
      "Identifies important domain questions suitable for scientific inquiry.",
    ],
    majorCritiques: majorCritiques.length > 0 ? majorCritiques : ["Address methodological caveats detailed in issues."],
    concreteSolutions: concreteSolutions.length > 0 ? concreteSolutions : [
      {
        issue: "Reporting clarity and precision.",
        proposedFix: "Follow structured reporting guidelines and clarify observational bounds.",
      },
    ],
    missingControlsOrAnalyses: review.abstentions.length > 0 ? review.abstentions : ["Sensitivity power analysis."],
    mustAddressItems: majorCritiques.slice(0, 2),
    minorComments: review.issues.filter((i) => i.severity === "MINOR").map((i) => i.grounded.claim),
    evidenceAnchors: evidenceAnchors.length > 0 ? evidenceAnchors : ['text: §Abstract "manuscript topic"'],
    counterArguments: ["Ensure findings are robust against alternative cohort configurations."],
    source: "heuristic",
  };
}

/**
 * Adapter converting legacy ReviewerPersonaFeedback into PersonaReview,
 * extracting claims and mechanically grounding evidence spans.
 */
export function legacyToPersonaReview(
  legacy: ReviewerPersonaFeedback,
  ctx: ManuscriptContext
): PersonaReview {
  const personaId = LEGACY_TO_PERSONA_ID[legacy.persona] || "DOMAIN_EXPERT";
  const spec = PERSONA_SPEC[personaId];

  let recommendation: DecisionCategory = "MAJOR_REVISION";
  const recLower = (legacy.decisionRecommendation || "").toLowerCase();
  if (recLower.includes("desk reject")) recommendation = "DESK_REJECT";
  else if (recLower.includes("reject")) recommendation = "REJECT_AFTER_REVIEW";
  else if (recLower.includes("accept")) recommendation = "ACCEPT";
  else if (recLower.includes("minor")) recommendation = "MINOR_REVISION";

  const issues: Issue[] = [];
  const critiques = legacy.majorCritiques || [];
  critiques.forEach((c, idx) => {
    const candidateQuote = legacy.evidenceAnchors?.[idx] || c;
    const quoteMatch = candidateQuote.match(/["'“](.+?)["'”]/);
    const textToMatch = quoteMatch ? quoteMatch[1] : candidateQuote;
    const span = ctx.locateSpan(textToMatch);

    issues.push({
      id: `ISSUE-${personaId}-${idx + 1}`,
      pillar: personaId === "DOMAIN_EXPERT" ? "NOVELTY_SIGNIFICANCE" : personaId === "METHODOLOGICAL_SPECIALIST" ? "METHODOLOGICAL_SOUNDNESS" : "SCOPE_FIT",
      dimension: spec.focusDimensions[0] || "METHODOLOGY",
      severity: idx === 0 ? "MAJOR" : "MINOR",
      grounded: {
        claim: c,
        evidence: span ? [span] : [],
        status: span ? "SUPPORTED" : "INSUFFICIENT_EVIDENCE",
      },
      recommendation: legacy.concreteSolutions?.[idx]?.proposedFix || "Address this critique systematically.",
      source: "PERSONA",
      personaId,
    });
  });

  const dimensionScores: Partial<Record<ScoringDimension, import("./types").DimensionScore>> = {};
  for (const dim of spec.focusDimensions) {
    dimensionScores[dim] = {
      score: recommendation === "REJECT_AFTER_REVIEW" ? 4.5 : recommendation === "DESK_REJECT" ? 3.0 : 7.0,
      evidence: [],
      agreement: 0.85,
    };
  }

  return {
    personaId,
    summary: legacy.assessment || "",
    issues,
    dimensionScores,
    recommendation,
    confidence: 0.85,
    abstentions: legacy.missingControlsOrAnalyses || [],
    reliabilityFlag: "HIGH",
  };
}

