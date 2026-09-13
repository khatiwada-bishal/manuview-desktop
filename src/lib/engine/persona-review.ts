import { validateReviewerPersonas } from "../schemas";
import {
  PanelConsensus,
  ParsedManuscript,
  ReviewerPersonaFeedback,
} from "../types";

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

  // Out-of-scope papers are declined during editorial screening and never forwarded to reviewers
  if (isScopeMismatch) {
    return [];
  }

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
    roleDescription: "Aims & Scope, Readership Fit, and Contribution Triage",
    decisionRecommendation: "Major Revision",
    keyChallenge: `Demarcating the conceptual advance and subscriber interest specifically for readers of ${targetJournal}.`,
    assessment: `As Handling Editor for ${targetJournal}, I have evaluated "${cleanTitle}" for editorial suitability and community interest. The manuscript presents an empirical investigation situated within ${discipline}. Before sending to external referees, the authors must articulate more explicitly how their findings advance core debates in our journal and why this work matters to our primary readership.`,
    majorCritiques: [
      `Articulate direct readership interest and theoretical utility for ${targetJournal}.`,
      `Synthesize practitioner and theoretical takeaways in an expanded discussion section.`,
    ],
    missingControlsOrAnalyses: [
      "Explicit statement of contribution benchmarked against recent publications in this venue.",
    ],
    mustAddressItems: [
      `Refine title and abstract to communicate direct relevance to ${targetJournal}.`,
    ],
    evidenceAnchors: [`text: §Introduction "${cleanTitle.slice(0, 60)}..."`],
    counterArguments: [
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
    assessment: `This study addresses an important problem in ${discipline}. The empirical analysis provides valuable observations regarding "${cleanTitle}". However, the literature positioning must be updated to engage contemporary debate, and the theoretical mechanisms underlying the observed effects require deeper exploration.`,
    majorCritiques: [
      `Differentiate findings more clearly from recent benchmark papers in ${discipline}.`,
      `Elaborate the mechanistic pathway connecting inputs to observed outcomes.`,
    ],
    missingControlsOrAnalyses: [
      "Subgroup sensitivity analyses examining heterogeneity across project cohorts.",
    ],
    mustAddressItems: [
      "Update literature review with relevant 2023–2025 citations from leading field journals.",
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
      ? "The manuscript lacks a dedicated Materials and Methods section. Reviewers cannot audit experimental protocols, data selection criteria, or procedural controls."
      : "The methodology presents a structured empirical workflow. However, complete reproducibility requires depositing raw data and code in a persistent repository.",
    majorCritiques: isMethodsMissing
      ? ["Add an explicit Materials & Methods section detailing all experimental specifications."]
      : ["Document complete instrumentation parameters and software dependencies."],
    missingControlsOrAnalyses: [
      "Robustness checks testing sensitivity to alternative model specifications.",
    ],
    mustAddressItems: [
      "Provide public replication code and data accession link.",
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
    keyChallenge: "Statistical power reporting and multi-testing multiplicity control.",
    assessment: `The quantitative framework incorporates ${statCount > 0 ? statMetrics.slice(0, 2).join(", ") : "standard statistical tests"}. However, explicit statistical power calculations (1 - beta >= 0.80) are absent, and 95% confidence intervals should accompany all point estimates.`,
    majorCritiques: [
      "Report exact p-values, test statistics, and 95% confidence intervals throughout.",
      "Justify sample size with formal a-priori or post-hoc statistical power calculations.",
    ],
    missingControlsOrAnalyses: [
      "Multiple hypothesis testing corrections (Bonferroni or Benjamini-Hochberg FDR).",
    ],
    mustAddressItems: [
      "Add 95% confidence intervals to all graphical and tabular data summaries.",
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
    assessment: "Examining this work with an adversarial lens: what alternative mechanism could generate these exact empirical patterns? The study observes correlations, but the leap to strong causal recommendations requires much more rigorous control of unmeasured confounders.",
    majorCritiques: [
      "Causal language is excessive given the observational nature of the dataset.",
      "Selection bias and survivorship effects in project cohorts have not been eliminated.",
    ],
    missingControlsOrAnalyses: [
      "Falsification / placebo tests to verify that the estimated effect vanishes under randomized counterfactuals.",
    ],
    mustAddressItems: [
      "Tone down causal assertions throughout the Abstract, Results, and Conclusion.",
      "Add a dedicated Limitations subsection acknowledging observational boundary conditions.",
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
