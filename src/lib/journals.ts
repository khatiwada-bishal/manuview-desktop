import type { OpenAlexSource } from "./openalex";

export type Discipline =
  | 'Oncology'
  | 'Biomedicine'
  | 'Computer Science'
  | 'Clinical'
  | 'Neuroscience'
  | 'Operations Research & Management'
  | 'Environmental Science & Sustainability'
  | 'Economics, Finance & Business'
  | 'Physical Sciences & Mathematics'
  | 'Chemistry & Materials Science'
  | 'Engineering & Applied Sciences'
  | 'Social Sciences, Psychology & Education'
  | 'Multidisciplinary';

export interface JournalEntry {
  name: string;
  publisher: string;
  impactFactor: number;
  discipline: Discipline;
  acceptanceRate: string;
  reviewSpeed: string;
  openAccess: 'Hybrid' | 'Gold OA' | 'Subscription';
  aimsAndScope: string;
  deskRejectHazards: string[];
  keyExpectations: string[];
  isCrossDisciplinary?: boolean;
}

import { JOURNAL_CATALOG } from "./data/journal-catalog.data";
export { JOURNAL_CATALOG };


/**
 * Intelligent domain classifier to detect manuscript discipline
 * Evaluates the manuscript content (title, abstract, keywords, and cited references)
 * independently from the author's target journal preference.
 */
export function detectDiscipline(
  title: string,
  abstract: string,
  targetJournal?: string,
  citedJournals?: string[]
): JournalEntry['discipline'] {
  const manuscriptText = `${title} ${abstract}`.toLowerCase();
  const citedText = (citedJournals || []).join(' ').toLowerCase();

  // 1. Keyword Scoring across all 12 distinct disciplinary fields
  // Economics, Finance & Business
  const econTerms = [
    'economics', 'macroeconomic', 'microeconomic', 'econometric', 'inflation', 'monetary policy',
    'gdp', 'firm performance', 'asset pricing', 'liquidity', 'capital structure', 'corporate governance',
    'stock returns', 'fintech', 'market efficiency', 'consumer behavior', 'behavioral economics',
    'financial economics', 'portfolio', 'interest rate', 'venture capital', 'banking', 'finance',
    'financial', 'climate finance', 'funding sufficiency', 'subsidies', 'disbursement', 'fiscal policy',
    'socioeconomic', 'willingness to pay'
  ];
  const econScore = econTerms.filter(t => manuscriptText.includes(t) || citedText.includes(t)).length;

  // Physical Sciences & Mathematics
  const physMathTerms = [
    'quantum', 'hamiltonian', 'superconductivity', 'particle physics', 'gravitational',
    'spectroscopy', 'thermodynamic', 'black hole', 'astrophysics', 'condensed matter',
    'fermi', 'lorentz', 'differential equation', 'eigenvalue', 'stochastic calculus',
    'topology', 'manifold', 'riemannian', 'bayesian inference', 'markov chain', 'photon', 'optics'
  ];
  const physMathScore = physMathTerms.filter(t => manuscriptText.includes(t) || citedText.includes(t)).length;

  // Chemistry & Materials Science
  const chemMatTerms = [
    'catalysis', 'synthesis', 'spectroscopy', 'crystal structure', 'nanoparticle', 'polymer',
    'metal-organic framework', 'electrochemical', 'spectrophotometry', 'photovoltaic', 'graphene',
    'density functional theory', 'dft', 'nmr', 'ligand', 'perovskite', 'corrosion', 'composite material',
    'chemical engineering', 'reaction kinetics', 'sol-gel'
  ];
  const chemMatScore = chemMatTerms.filter(t => manuscriptText.includes(t) || citedText.includes(t)).length;

  // Engineering & Applied Sciences
  const engTerms = [
    'finite element', 'computational fluid dynamics', 'cfd', 'heat transfer', 'stress analysis',
    'turbulent flow', 'structural integrity', 'actuator', 'aerodynamic', 'tribology', 'vibration analysis',
    'signal processing', 'mechatronics', 'robotics', 'control system', 'kinematics', 'inverter', 'motor drive'
  ];
  const engScore = engTerms.filter(t => manuscriptText.includes(t) || citedText.includes(t)).length;

  // Social Sciences, Psychology & Education
  const socPsychTerms = [
    'psychological', 'cognitive', 'social psychology', 'pedagogical', 'higher education',
    'survey questionnaire', 'mental health', 'well-being', 'depressive symptoms', 'public policy',
    'sociological', 'curriculum', 'qualitative interview', 'behavioral intervention', 'likert scale',
    'educational technology', 'learning analytics', 'health equity'
  ];
  const socPsychScore = socPsychTerms.filter(t => manuscriptText.includes(t) || citedText.includes(t)).length;

  // Environmental Science & Sustainability
  const envTerms = [
    'climate change', 'sustainability', 'carbon footprint', 'greenhouse gas', 'biodiversity',
    'ecosystem', 'deforestation', 'renewable energy', 'life cycle assessment', 'lifecycle assessment',
    'environmental policy', 'water quality', 'ecological', 'conservation', 'carbon sequestration',
    'microplastics', 'pollution', 'sustainable development', 'planetary boundaries', 'circular economy',
    'carbon emissions', 'emissions reduction', 'air quality', 'soil degradation', 'environmental science',
    'climate finance', 'climate funding', 'carbon finance', 'climate', 'renewable', 'clean energy',
    'solar home', 'biogas', 'cookstove', 'energy access', 'rural energy', 'energy policy',
    'energy transition', 'off-grid', 'clean cooking', 'firewood', 'energy poverty', 'solar energy',
    'e-waste', 'electronic waste', 'waste management', 'waste', 'recycling', 'transboundary'
  ];
  const envScore = envTerms.filter(t => manuscriptText.includes(t) || citedText.includes(t)).length;

  // Operations Research, Supply Chain & Industrial Engineering
  const orTerms = [
    'supply chain', 'inventory model', 'reverse logistics', 'remanufacturing',
    'operations research', 'opsearch', 'eoq', 'holding cost', 'decision variable',
    'nonlinear optimization', 'sensitivity analysis', 'replenishment', 'refurbishment',
    'production planning', 'queueing', 'stochastic programming', 'vehicle routing',
    'facility location', 'integer programming', 'linear programming'
  ];
  const orScore = orTerms.filter(t => manuscriptText.includes(t) || citedText.includes(t)).length;

  // Computer Science & AI
  const csTerms = [
    'neural network', 'deep learning', 'transformer', 'machine learning', 'computer vision',
    'segmentation', 'benchmark', 'classifier', 'algorithm', 'loss function', 'gpu',
    'reinforcement learning', 'llm', 'natural language', 'backbone', 'convolutional', 'tpami', 'ieee trans'
  ];
  const csScore = csTerms.filter(t => manuscriptText.includes(t) || citedText.includes(t)).length;

  // Oncology / Cancer Biology
  const oncoTerms = [
    'cancer', 'tumor', 'tumour', 'carcinoma', 'oncology', 'oncogene', 'dll3', 'sclc', 'nsclc',
    'melanoma', 'chemotherapy', 'metastasis', 'pd-l1', 'organoid', 'immunotherapy', 'leukemia',
    'lymphoma', 'glioma', 'p53', 'kras', 'biomarker', 'pou2f1', 'crispr screen'
  ];
  const oncoScore = oncoTerms.filter(t => manuscriptText.includes(t) || citedText.includes(t)).length;

  // Clinical Medicine
  const clinTerms = [
    'clinical trial', 'randomized controlled', 'randomised', 'placebo', 'cohort', 'patients',
    'phase 1', 'phase 2', 'phase 3', 'hospital', 'mortality', 'hazard ratio', 'survival rate',
    'epidemiology', 'prognosis', 'multicenter', 'consort', 'strobe', 'lancet', 'nejm', 'jama',
    'cardiology', 'cardiovascular', 'physiology', 'heart failure', 'hypertension'
  ];
  const clinScore = clinTerms.filter(t => manuscriptText.includes(t) || citedText.includes(t)).length;

  // Neuroscience
  const neuroTerms = [
    'neuron', 'neural circuit', 'synaptic', 'cortex', 'hippocampus', 'electrophysiology',
    'optogenetic', 'brain', 'cognitive', 'glial', 'astrocyte', 'neurodegenerative', 'parkinson', 'alzheimer'
  ];
  const neuroScore = neuroTerms.filter(t => manuscriptText.includes(t) || citedText.includes(t)).length;

  // Biomedicine / Genetics
  const bioTerms = [
    'rna-seq', 'protein', 'crispr', 'chip-seq', 'pathway', 'gene expression', 'enzyme',
    'western blot', 'mutation', 'cell culture', 'phosphorylation', 'chromatin', 'promoter', 'enhancer'
  ];
  const bioScore = bioTerms.filter(t => manuscriptText.includes(t) || citedText.includes(t)).length;

  // Evaluate weighted domain scores
  const scores = [
    { discipline: 'Environmental Science & Sustainability' as const, score: envScore * 2.4 },
    { discipline: 'Economics, Finance & Business' as const, score: econScore * 2.3 },
    { discipline: 'Physical Sciences & Mathematics' as const, score: physMathScore * 2.3 },
    { discipline: 'Chemistry & Materials Science' as const, score: chemMatScore * 2.3 },
    { discipline: 'Engineering & Applied Sciences' as const, score: engScore * 2.2 },
    { discipline: 'Operations Research & Management' as const, score: orScore * 2.2 },
    { discipline: 'Oncology' as const, score: oncoScore * 2.2 },
    { discipline: 'Social Sciences, Psychology & Education' as const, score: socPsychScore * 2.1 },
    { discipline: 'Computer Science' as const, score: csScore * 2.0 },
    { discipline: 'Neuroscience' as const, score: neuroScore * 2.0 },
    { discipline: 'Clinical' as const, score: clinScore * 1.8 },
    { discipline: 'Biomedicine' as const, score: bioScore * 1.5 }
  ];

  scores.sort((a, b) => b.score - a.score);

  // 1. Check cited journals (highest empirical evidence of discourse community)
  if (citedJournals && citedJournals.length > 0) {
    const disciplineCitationCounts: Partial<Record<Discipline, number>> = {};
    for (const cited of citedJournals) {
      const cNorm = cited.trim().toLowerCase();
      for (const catEntry of JOURNAL_CATALOG) {
        if (catEntry.discipline === 'Multidisciplinary') continue;
        if (cNorm.includes(catEntry.name.toLowerCase()) || catEntry.name.toLowerCase().includes(cNorm)) {
          disciplineCitationCounts[catEntry.discipline] = (disciplineCitationCounts[catEntry.discipline] || 0) + 1;
        }
      }
    }
    const sortedCitations = Object.entries(disciplineCitationCounts).sort((a, b) => (b[1] || 0) - (a[1] || 0));
    if (sortedCitations.length > 0 && (sortedCitations[0][1] || 0) >= 1) {
      // If cited journals agree with a top keyword score, or strong citation signal, return it
      if ((sortedCitations[0][1] || 0) >= 2 || scores[0].score >= 2.0) {
        return sortedCitations[0][0] as Discipline;
      }
    }
  }

  // 2. High or moderate keyword score from title/abstract
  if (scores[0].score > 0) {
    return scores[0].discipline;
  }

  // 3. Fallback to Target Journal ONLY if manuscript content and citations provided zero domain signal
  if (targetJournal) {
    const targetNorm = targetJournal.trim().toLowerCase();
    const catalogDirect = JOURNAL_CATALOG.find(
      j => j.name.toLowerCase() === targetNorm || targetNorm.includes(j.name.toLowerCase()) || j.name.toLowerCase().includes(targetNorm)
    );
    if (catalogDirect && catalogDirect.discipline !== 'Multidisciplinary') {
      return catalogDirect.discipline;
    }
  }

  return 'Multidisciplinary';
}

/**
 * Infers a journal's academic discipline from its name when it is not present in the curated catalog.
 */
export function inferJournalDiscipline(journalName: string): Discipline | undefined {
  if (!journalName || !journalName.trim()) return undefined;
  const name = journalName.toLowerCase();

  // 1. Multidisciplinary
  if (/\b(nature|science|pnas|plos one|scientific reports|proceedings of the national academy|peerj)\b/.test(name) && !/\b(nature [a-z]+|science [a-z]+)\b/.test(name)) {
    return 'Multidisciplinary';
  }

  // 2. Clinical Medicine, Cardiology, & Human Physiology
  if (
    /\b(physiology|circulatory|cardiology|cardiovascular|heart|surgery|surgical|pediatrics?|pediatric|neurology|psychiatry|medicine|medical|pharmacology|pharmaceutical|radiology|orthopedic|dermatology|gastroenterology|endocrinology|nephrology|hematology|epidemiology|clinical|pathology|anesthesiology|ophthalmology|oncology|cancer|jama|lancet|nejm|bmj|american journal of physiology)\b/.test(
      name
    )
  ) {
    if (/\b(cancer|oncology|carcinoma|tumor|tumour|melanoma|leukemia|lymphoma)\b/.test(name)) {
      return 'Oncology';
    }
    if (/\b(neuroscience|neuro|brain|synapse)\b/.test(name)) {
      return 'Neuroscience';
    }
    return 'Clinical';
  }

  // 3. Oncology
  if (/\b(cancer|oncology|carcinoma|tumor|tumour|melanoma|leukemia|lymphoma)\b/.test(name)) {
    return 'Oncology';
  }

  // 4. Neuroscience
  if (/\b(neuroscience|neuro|brain|synapse|cognitive neuroscience)\b/.test(name)) {
    return 'Neuroscience';
  }

  // 5. Biomedicine & Molecular Biology
  if (
    /\b(biology|biological|biochemistry|genetics|genomics|molecular|cellular|immunology|microbiology|virology|biomedical|biomedicine|biophysics|cell reports|embo)\b/.test(
      name
    )
  ) {
    return 'Biomedicine';
  }

  // 6. Environmental Science, Energy & Sustainability
  if (
    /\b(environment|environmental|climate|ecology|ecological|sustainability|sustainable|energy|renewable|cleaner production|pollution|water resources|conservation|forestry|geosciences?|earth science|meteorology|energy policy)\b/.test(
      name
    )
  ) {
    return 'Environmental Science & Sustainability';
  }

  // 7. Operations Research & Industrial Engineering
  if (/\b(operations research|supply chain|logistics|industrial engineering|management science|decision sciences|queueing|transportation research)\b/.test(name)) {
    return 'Operations Research & Management';
  }

  // 8. Economics, Finance & Business
  if (
    /\b(economics?|economic|finance|financial|banking|accounting|business|management|marketing|econometrics?|macroeconomics|microeconomics)\b/.test(
      name
    )
  ) {
    return 'Economics, Finance & Business';
  }

  // 9. Computer Science & AI
  if (
    /\b(computer|computing|software|neural networks?|machine learning|artificial intelligence|robotics|pattern analysis|data mining|information systems|cybernetics?|ieee transactions on|acm transactions)\b/.test(
      name
    )
  ) {
    return 'Computer Science';
  }

  // 10. Engineering & Applied Sciences
  if (/\b(engineering|applied sciences?|mechanics|aerospace|materials engineering|thermal engineering)\b/.test(name)) {
    return 'Engineering & Applied Sciences';
  }

  // 11. Physical Sciences & Mathematics
  if (/\b(physics|physical review|mathematics?|mathematical|astronomy|astrophysics|optics|quantum)\b/.test(name)) {
    return 'Physical Sciences & Mathematics';
  }

  // 12. Chemistry & Materials Science
  if (/\b(chemistry|chemical|materials|polymers|catalysis|nano)\b/.test(name)) {
    return 'Chemistry & Materials Science';
  }

  // 13. Social Sciences, Psychology & Education
  if (/\b(psychology|psychological|education|educational|sociology|sociological|public policy|political science|anthropology)\b/.test(name)) {
    return 'Social Sciences, Psychology & Education';
  }

  return undefined;
}

export interface DisciplineMatchResult {
  isMatch: boolean;
  isCrossDisciplinary: boolean;
  crossDisciplinary: boolean;
  severity: "exact" | "cross_field" | "mismatch";
  message: string;
}

function normalizeDisciplineInput(d: string): Discipline {
  const norm = d.trim();
  if (/clinical|medicine|surgery|pediatric|cardio|hospital|health sciences?/i.test(norm)) return "Clinical";
  if (/biomed|biological|biology|genetics|genomics|molecular|biochem/i.test(norm)) return "Biomedicine";
  if (/machine learning|artificial intelligence|computer science|software|computing|data science|information systems?/i.test(norm)) return "Computer Science";
  if (/operations research|management science|supply chain|logistics|industrial engineering/i.test(norm)) return "Operations Research & Management";
  if (/finance|economics|econometric|business|accounting|banking/i.test(norm)) return "Economics, Finance & Business";
  if (/environment|ecology|sustainability|climate|earth science|planetary/i.test(norm)) return "Environmental Science & Sustainability";
  if (/physics|mathematics|astronomy|applied math/i.test(norm)) return "Physical Sciences & Mathematics";
  if (/materials science|chemical|chemistry|polymers/i.test(norm)) return "Chemistry & Materials Science";
  if (/engineering|applied sciences?/i.test(norm)) return "Engineering & Applied Sciences";
  if (/psychology|social sciences?|education|sociology/i.test(norm)) return "Social Sciences, Psychology & Education";
  if (/oncolog|cancer|carcinoma/i.test(norm)) return "Oncology";
  if (/neuro/i.test(norm)) return "Neuroscience";
  if (/multidisciplinary|general|interdisciplinary/i.test(norm)) return "Multidisciplinary";
  return norm as Discipline;
}

/**
 * Checks whether a target journal's disciplinary remit aligns with the manuscript's detected discipline
 */
export function isDisciplineMatch(
  manuscriptDiscipline: Discipline | string,
  journalDiscipline: Discipline | string
): DisciplineMatchResult {
  const mDisc = normalizeDisciplineInput(manuscriptDiscipline);
  const jDisc = normalizeDisciplineInput(journalDiscipline);

  if (mDisc === jDisc) {
    return {
      isMatch: true,
      isCrossDisciplinary: false,
      crossDisciplinary: false,
      severity: "exact",
      message: `Direct discipline match (${mDisc}).`,
    };
  }

  if (jDisc === "Multidisciplinary" || mDisc === "Multidisciplinary") {
    return {
      isMatch: true,
      isCrossDisciplinary: true,
      crossDisciplinary: true,
      severity: "cross_field",
      message: `Cross-disciplinary alignment with multidisciplinary venue.`,
    };
  }

  // Interdisciplinary domain pairings that share substantive crossover
  const COMPATIBLE_CROSS_FIELDS: Record<string, Set<Discipline>> = {
    "Computer Science": new Set([
      "Operations Research & Management",
      "Engineering & Applied Sciences",
      "Physical Sciences & Mathematics",
      "Biomedicine",
      "Economics, Finance & Business",
      "Environmental Science & Sustainability",
      "Neuroscience",
    ]),
    "Operations Research & Management": new Set([
      "Computer Science",
      "Economics, Finance & Business",
      "Engineering & Applied Sciences",
      "Environmental Science & Sustainability",
    ]),
    "Economics, Finance & Business": new Set([
      "Operations Research & Management",
      "Social Sciences, Psychology & Education",
      "Environmental Science & Sustainability",
      "Computer Science",
    ]),
    "Oncology": new Set(["Biomedicine", "Clinical"]),
    "Clinical": new Set(["Oncology", "Biomedicine", "Neuroscience"]),
    "Biomedicine": new Set([
      "Oncology",
      "Clinical",
      "Neuroscience",
      "Chemistry & Materials Science",
      "Computer Science",
    ]),
    "Neuroscience": new Set([
      "Biomedicine",
      "Clinical",
      "Social Sciences, Psychology & Education",
      "Computer Science",
    ]),
    "Environmental Science & Sustainability": new Set([
      "Engineering & Applied Sciences",
      "Economics, Finance & Business",
      "Operations Research & Management",
      "Chemistry & Materials Science",
      "Physical Sciences & Mathematics",
    ]),
    "Engineering & Applied Sciences": new Set([
      "Computer Science",
      "Operations Research & Management",
      "Physical Sciences & Mathematics",
      "Chemistry & Materials Science",
      "Environmental Science & Sustainability",
    ]),
    "Physical Sciences & Mathematics": new Set([
      "Engineering & Applied Sciences",
      "Chemistry & Materials Science",
      "Computer Science",
      "Economics, Finance & Business",
    ]),
    "Chemistry & Materials Science": new Set([
      "Physical Sciences & Mathematics",
      "Engineering & Applied Sciences",
      "Biomedicine",
      "Environmental Science & Sustainability",
    ]),
    "Social Sciences, Psychology & Education": new Set([
      "Economics, Finance & Business",
      "Neuroscience",
    ]),
  };

  if (COMPATIBLE_CROSS_FIELDS[mDisc]?.has(jDisc) || COMPATIBLE_CROSS_FIELDS[jDisc]?.has(mDisc)) {
    return {
      isMatch: true,
      isCrossDisciplinary: true,
      crossDisciplinary: true,
      severity: "cross_field",
      message: `Interdisciplinary crossover between ${mDisc} and ${jDisc}.`,
    };
  }

  return {
    isMatch: false,
    isCrossDisciplinary: false,
    crossDisciplinary: false,
    severity: "mismatch",
    message: `Disciplinary mismatch: manuscript is in ${mDisc}, while journal publishes in ${jDisc}.`,
  };
}

/**
 * Parses acceptance rate percentage string into a numeric value
 */
export function parseAcceptanceRate(rateStr: string): number {
  if (!rateStr) return 0;
  const m = rateStr.match(/(\d+(?:\.\d+)?)(?:\s*-\s*(\d+(?:\.\d+)?))?\s*%/);
  if (!m) return 0;
  if (m[2]) {
    return (parseFloat(m[1]) + parseFloat(m[2])) / 2;
  }
  return parseFloat(m[1]);
}

export interface MatchedJournalItem {
  journal: JournalEntry;
  matchScore: number;
}

export interface TargetJournalTierResults {
  reach: JournalEntry;
  realistic: JournalEntry;
  fallback: JournalEntry;
  reachFitScore: number;
  realisticFitScore: number;
  fallbackFitScore: number;
  detectedDiscipline: JournalEntry['discipline'];
  allMatches: MatchedJournalItem[];
  otherMatches: MatchedJournalItem[];
  crossDisciplinary?: JournalEntry[];
  targetJournalEvaluation?: {
    name: string;
    journalName?: string;
    foundInCatalog: boolean;
    tier: 'Reach' | 'Realistic' | 'Fallback';
    fitScore: number;
    impactFactor: number;
    discipline?: Discipline;
    journalDiscipline?: string;
    manuscriptDiscipline?: string;
    isDisciplinaryMismatch?: boolean;
    mismatchWarning?: string;
  };
}

/**
 * Looks up a journal in the authoritative curated JOURNAL_CATALOG (§1.3).
 * Prevents LLM-invented impact factors and publishers from being accepted as facts.
 */
export function lookupJournalInCatalog(name: string): JournalEntry | undefined {
  if (!name || typeof name !== "string") return undefined;
  const clean = name.trim().toLowerCase();
  if (!clean) return undefined;

  // 1. Exact case-insensitive match
  const exact = JOURNAL_CATALOG.find((j) => j.name.toLowerCase() === clean);
  if (exact) return exact;

  // 2. Normalized match (strip leading "the ", punctuation, excessive spaces)
  const normClean = clean.replace(/^the\s+/i, "").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  const normMatch = JOURNAL_CATALOG.find((j) => {
    const jNorm = j.name.toLowerCase().replace(/^the\s+/i, "").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
    return jNorm === normClean;
  });
  if (normMatch) return normMatch;

  // 3. Substring match for substantial titles (> 6 chars) with length ratio guard (>= 0.75)
  // to prevent common single words like "Research" from matching "The Phantom Research Herald"
  if (normClean.length > 6) {
    const subMatch = JOURNAL_CATALOG.find((j) => {
      const jNorm = j.name.toLowerCase().replace(/^the\s+/i, "").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
      if (jNorm.length <= 5) return false;
      const lengthRatio = Math.min(normClean.length, jNorm.length) / Math.max(normClean.length, jNorm.length);
      if (lengthRatio < 0.75) return false;
      return jNorm.includes(normClean) || normClean.includes(jNorm);
    });
    if (subMatch) return subMatch;
  }

  return undefined;
}

/**
 * Maps OpenAlex scientific taxonomy (domain, field, subfield, or concept) to canonical ManuView disciplines
 */
export function mapOpenAlexToDiscipline(field?: string, domain?: string, subfield?: string): Discipline | undefined {
  const combined = `${subfield || ""} ${field || ""} ${domain || ""}`.toLowerCase();
  if (/oncolog|cancer/i.test(combined)) return "Oncology";
  if (/neuro/i.test(combined)) return "Neuroscience";
  if (/biomed|molecular biology|genetics|biochem/i.test(combined)) return "Biomedicine";
  if (/clinical|medicine|surgery|pediatric|cardio/i.test(combined)) return "Clinical";
  if (/computer science|artificial intelligence|software|machine learning/i.test(combined)) return "Computer Science";
  if (/operations research|management science|supply chain|logistics/i.test(combined)) return "Operations Research & Management";
  if (/finance|economics|econometric|business|accounting/i.test(combined)) return "Economics, Finance & Business";
  if (/materials science|chemical|chemistry/i.test(combined)) return "Chemistry & Materials Science";
  if (/physics|mathematics|astronomy/i.test(combined)) return "Physical Sciences & Mathematics";
  if (/environment|ecology|sustainability|climate/i.test(combined)) return "Environmental Science & Sustainability";
  if (/engineering/i.test(combined)) return "Engineering & Applied Sciences";
  if (/psychology|social sciences|education|sociology/i.test(combined)) return "Social Sciences, Psychology & Education";
  return undefined;
}

export interface CanonicalFitInput {
  manuscriptText: string;
  manuscriptDiscipline: Discipline | string;
  journal:
    | { source: "catalog"; entry: JournalEntry }
    | { source: "openalex"; profile: OpenAlexSource }
    | { source: "name_only"; name: string; inferredDiscipline?: Discipline | string };
  tier?: "Reach" | "Realistic" | "Fallback";
  isCited?: boolean;
  isTarget?: boolean;
}

export interface CanonicalFitResult {
  fitScore: number;
  isDisciplinaryMismatch: boolean;
  disciplineOfRecord: Discipline;
  components: {
    disciplineAffinity: number;
    scopeOverlap: number;
    tierAdjustment: number;
  };
  rationale: string;
}

/**
 * Computes a canonical, deterministic journal fit score (0-100).
 * Acts as the single authoritative source of truth across Recommendation tier cards,
 * Target Journal Evaluation, and the Brief Journal Fit check.
 */
export function computeCanonicalJournalFit(input: CanonicalFitInput): CanonicalFitResult {
  let disciplineOfRecord: Discipline;
  let catalogEntry: JournalEntry | undefined;
  let journalName: string;
  let aimsScopeText = "";
  let expectationsText = "";
  let impactFactor: number | undefined;

  if (input.journal.source === "catalog") {
    catalogEntry = input.journal.entry;
    journalName = catalogEntry.name;
    disciplineOfRecord = catalogEntry.discipline;
    aimsScopeText = catalogEntry.aimsAndScope;
    expectationsText = catalogEntry.keyExpectations.join(" ");
    impactFactor = catalogEntry.impactFactor;
  } else if (input.journal.source === "openalex") {
    journalName = input.journal.profile.displayName;
    catalogEntry = lookupJournalInCatalog(journalName);
    if (catalogEntry) {
      disciplineOfRecord = catalogEntry.discipline;
      aimsScopeText = catalogEntry.aimsAndScope;
      expectationsText = catalogEntry.keyExpectations.join(" ");
      impactFactor = catalogEntry.impactFactor;
    } else {
      let mapped: Discipline | undefined;
      for (const t of input.journal.profile.topics || []) {
        mapped = mapOpenAlexToDiscipline(t.field, t.domain, t.subfield);
        if (mapped) break;
      }
      if (!mapped) {
        for (const c of input.journal.profile.concepts || []) {
          mapped = mapOpenAlexToDiscipline(c.displayName, c.displayName, c.displayName);
          if (mapped) break;
        }
      }
      disciplineOfRecord = mapped || inferJournalDiscipline(journalName) || "Multidisciplinary";
      aimsScopeText = [
        ...(input.journal.profile.concepts || []).map((c) => c.displayName),
        ...(input.journal.profile.topics || []).map((t) => [t.displayName, t.subfield, t.field, t.domain].filter(Boolean).join(" ")),
      ].join(" ");
      impactFactor = input.journal.profile.twoYearMeanCitedness;
    }
  } else {
    journalName = input.journal.name;
    catalogEntry = lookupJournalInCatalog(journalName);
    if (catalogEntry) {
      disciplineOfRecord = catalogEntry.discipline;
      aimsScopeText = catalogEntry.aimsAndScope;
      expectationsText = catalogEntry.keyExpectations.join(" ");
      impactFactor = catalogEntry.impactFactor;
    } else {
      disciplineOfRecord =
        (input.journal.inferredDiscipline as Discipline) ||
        inferJournalDiscipline(journalName) ||
        "Multidisciplinary";
      aimsScopeText = journalName;
    }
  }

  const matchInfo = isDisciplineMatch(input.manuscriptDiscipline, disciplineOfRecord);
  const isDisciplinaryMismatch = !matchInfo.isMatch;

  // Semantic keyword overlap
  const textLower = (input.manuscriptText || "").toLowerCase();
  const scopeWords = aimsScopeText.toLowerCase().split(/\W+/).filter((w) => w.length > 4);
  const expectationsWords = expectationsText.toLowerCase().split(/\W+/).filter((w) => w.length > 4);
  const allKeywords = new Set([...scopeWords, ...expectationsWords]);

  let matchedWords = 0;
  for (const w of allKeywords) {
    if (textLower.includes(w)) matchedWords++;
  }

  // 1. Severe Disciplinary Mismatch: constrained to [15, 35]
  if (isDisciplinaryMismatch) {
    const disciplineAffinity = 22;
    const citationBonus = input.isCited ? 6 : 0;
    const scopeOverlap = Math.min(5, Math.floor(matchedWords / 3));
    const rawScore = disciplineAffinity + citationBonus + scopeOverlap;
    const fitScore = Math.min(35, Math.max(15, rawScore));

    return {
      fitScore,
      isDisciplinaryMismatch: true,
      disciplineOfRecord,
      components: {
        disciplineAffinity,
        scopeOverlap,
        tierAdjustment: 0,
      },
      rationale: `Severe Disciplinary Scope Mismatch: Manuscript study area is in "${input.manuscriptDiscipline}", whereas "${journalName}" operates in "${disciplineOfRecord}". High desk-rejection risk.`,
    };
  }

  // 2. Disciplinary Match or Cross-Disciplinary Alignment
  let disciplineAffinity = matchInfo.severity === "exact" ? 78 : (matchInfo.isCrossDisciplinary ? 72 : 68);
  if (input.isCited) disciplineAffinity += 8;

  const scopeOverlap = Math.min(10, Math.floor(matchedWords / 3));
  const combinedScore = disciplineAffinity + scopeOverlap;

  let tierAdjustment = 0;
  if (input.tier === "Realistic") {
    tierAdjustment = 4;
  } else if (input.tier === "Reach") {
    tierAdjustment = -4;
  } else if (input.tier === "Fallback") {
    tierAdjustment = 6;
  }

  if (impactFactor && impactFactor > 30 && input.tier !== "Reach") {
    tierAdjustment -= 4;
  }

  let fitScore = combinedScore + tierAdjustment;

  // Clamping by tier
  if (input.tier === "Realistic") {
    fitScore = Math.min(95, Math.max(68, fitScore));
  } else if (input.tier === "Reach") {
    fitScore = Math.min(88, Math.max(60, fitScore));
  } else if (input.tier === "Fallback") {
    fitScore = Math.min(96, Math.max(72, fitScore));
  } else {
    fitScore = Math.min(95, Math.max(65, fitScore));
  }

  const rationale = matchInfo.severity === "exact"
    ? `Strong domain alignment with ${disciplineOfRecord} core remit.`
    : `Cross-disciplinary alignment with ${disciplineOfRecord} readership.`;

  return {
    fitScore,
    isDisciplinaryMismatch: false,
    disciplineOfRecord,
    components: {
      disciplineAffinity,
      scopeOverlap,
      tierAdjustment,
    },
    rationale,
  };
}

/**
 * Calculates a dynamic, mathematically sound fit score (0-100) based on
 * disciplinary compatibility, text overlap, tier expectation alignment, and citation cues.
 * Delegates directly to the canonical fit computation.
 */
export function calculateDynamicFitScore(
  journal: JournalEntry,
  tier: 'Reach' | 'Realistic' | 'Fallback',
  manuscriptText: string,
  manuscriptDiscipline: Discipline,
  isTarget: boolean,
  isCited: boolean
): number {
  return computeCanonicalJournalFit({
    manuscriptText,
    manuscriptDiscipline,
    journal: { source: "catalog", entry: journal },
    tier,
    isTarget,
    isCited,
  }).fitScore;
}

/**
 * Genuine Target Journal Recommendation Engine:
 * - Detects manuscript study area / discipline strictly from manuscript content
 * - Anchors tiers (Reach, Realistic, Fallback) relative to the author's specified Target Journal when in-field,
 *   or strictly within the manuscript's detected domain when target journal is out-of-field
 * - Scores candidate journals dynamically using keyword & thematic relevance against journal aims & scope
 * - Dynamically ranks list view (otherMatches) by matchScore descending
 */
export function findMatchingJournals(
  title: string,
  abstract: string,
  targetJournal?: string,
  citedJournals?: string[]
): TargetJournalTierResults {
  const discipline = detectDiscipline(title, abstract, targetJournal, citedJournals);
  const text = `${title} ${abstract}`.toLowerCase();

  // Filter catalog strictly to matching discipline
  const domainJournals = JOURNAL_CATALOG.filter(j => j.discipline === discipline);
  const multiJournals = JOURNAL_CATALOG.filter(j => j.discipline === 'Multidisciplinary');

  // Sort domain journals by impact factor descending
  domainJournals.sort((a, b) => b.impactFactor - a.impactFactor);

  let reach: JournalEntry;
  let realistic: JournalEntry;
  let fallback: JournalEntry;

  // Check if target journal is in catalog
  let targetEntry: JournalEntry | undefined = undefined;
  if (targetJournal) {
    const targetNorm = targetJournal.trim().toLowerCase();
    targetEntry = JOURNAL_CATALOG.find(
      j => j.name.toLowerCase() === targetNorm || targetNorm.includes(j.name.toLowerCase()) || j.name.toLowerCase().includes(targetNorm)
    );
  }

  // Check if target journal discipline matches manuscript discipline
  const isTargetDisciplineMatch = targetEntry
    ? isDisciplineMatch(discipline, targetEntry.discipline).isMatch
    : true;

  // Set of cited journal names normalized
  const citedNormSet = new Set((citedJournals || []).map(c => c.trim().toLowerCase()));

  // Manuscript-grounded natural domain tiering
  const nonReach = domainJournals.slice(1);
  const sortedByAR = [...nonReach].sort((a, b) => {
    const arDiff = parseAcceptanceRate(b.acceptanceRate) - parseAcceptanceRate(a.acceptanceRate);
    if (arDiff !== 0) return arDiff;
    return a.impactFactor - b.impactFactor;
  });
  const naturalFallback = sortedByAR[0] || domainJournals[domainJournals.length - 1];
  const naturalReach = domainJournals[0];
  const naturalRemaining = domainJournals.filter((j) => j.name !== naturalReach.name && j.name !== naturalFallback.name);
  const naturalCitedMatch = naturalRemaining.find((j) => citedNormSet.has(j.name.toLowerCase()));
  let naturalRealistic = naturalCitedMatch;
  if (!naturalRealistic) {
    const domainARs = domainJournals.map((j) => parseAcceptanceRate(j.acceptanceRate)).sort((a, b) => a - b);
    const medianAR = domainARs[Math.floor(domainARs.length / 2)];

    naturalRemaining.sort((a, b) => {
      const distA = Math.abs(parseAcceptanceRate(a.acceptanceRate) - medianAR);
      const distB = Math.abs(parseAcceptanceRate(b.acceptanceRate) - medianAR);
      if (distA !== distB) return distA - distB;
      return b.impactFactor - a.impactFactor;
    });
    naturalRealistic = naturalRemaining[0] || nonReach[0] || naturalReach;
  }

  if (domainJournals.length >= 3) {
    if (targetEntry && isTargetDisciplineMatch && targetEntry.discipline === discipline) {
      if (targetEntry.name.toLowerCase() === naturalReach.name.toLowerCase()) {
        reach = targetEntry;
        realistic = naturalRealistic;
        fallback = naturalFallback;
      } else if (targetEntry.name.toLowerCase() === naturalFallback.name.toLowerCase()) {
        fallback = targetEntry;
        reach = naturalReach;
        realistic = naturalRealistic;
      } else {
        // TARGET-CENTRIC TIER CALIBRATION (In-Discipline peer benchmark)
        const targetIF = targetEntry.impactFactor;
        realistic = targetEntry;

        const higherIFJournals = domainJournals.filter((j) => j.impactFactor > targetIF * 1.15 && j.name !== targetEntry!.name);
        if (higherIFJournals.length > 0) {
          reach = higherIFJournals[0];
        } else {
          reach = naturalReach.name !== targetEntry.name ? naturalReach : (multiJournals[0] || naturalReach);
        }

        const fallbackCandidates = domainJournals
          .filter((j) => j.name !== realistic.name && j.name !== reach.name)
          .sort((a, b) => parseAcceptanceRate(b.acceptanceRate) - parseAcceptanceRate(a.acceptanceRate));

        fallback = fallbackCandidates[0] || domainJournals[domainJournals.length - 1];
      }
    } else {
      reach = naturalReach;
      realistic = naturalRealistic;
      fallback = naturalFallback;
    }
  } else if (domainJournals.length === 2) {
    reach = domainJournals[0];
    realistic = domainJournals[1];
    fallback = multiJournals.find(j => parseAcceptanceRate(j.acceptanceRate) >= 40) || domainJournals[1];
  } else if (domainJournals.length === 1) {
    reach = domainJournals[0];
    realistic = domainJournals[0];
    fallback = multiJournals.find(j => parseAcceptanceRate(j.acceptanceRate) >= 40) || domainJournals[0];
  } else {
    reach = multiJournals[0];
    realistic = multiJournals[2] || multiJournals[1];
    fallback = multiJournals[multiJournals.length - 1];
  }

  // Compute dynamic fit scores
  const reachFitScore = calculateDynamicFitScore(
    reach,
    'Reach',
    text,
    discipline,
    targetJournal ? reach.name.toLowerCase().includes(targetJournal.toLowerCase()) : false,
    citedNormSet.has(reach.name.toLowerCase())
  );
  const realisticFitScore = calculateDynamicFitScore(
    realistic,
    'Realistic',
    text,
    discipline,
    targetJournal ? realistic.name.toLowerCase().includes(targetJournal.toLowerCase()) : false,
    citedNormSet.has(realistic.name.toLowerCase())
  );
  const fallbackFitScore = calculateDynamicFitScore(
    fallback,
    'Fallback',
    text,
    discipline,
    targetJournal ? fallback.name.toLowerCase().includes(targetJournal.toLowerCase()) : false,
    citedNormSet.has(fallback.name.toLowerCase())
  );

  // Cross-disciplinary journals
  const crossDisciplinary = discipline !== 'Multidisciplinary'
    ? multiJournals.map(j => ({ ...j, isCrossDisciplinary: true }))
    : [];

  const primaryNames = new Set([reach.name, realistic.name, fallback.name]);

  // Score candidate journals in domain and multidisciplinary
  const remainingDomain: MatchedJournalItem[] = domainJournals
    .filter(j => !primaryNames.has(j.name))
    .map(j => ({
      journal: j,
      matchScore: calculateDynamicFitScore(j, 'Realistic', text, discipline, false, citedNormSet.has(j.name.toLowerCase())),
    }));

  const remainingMulti: MatchedJournalItem[] = multiJournals
    .filter(j => !primaryNames.has(j.name))
    .map(j => ({
      journal: { ...j, isCrossDisciplinary: discipline !== 'Multidisciplinary' },
      matchScore: calculateDynamicFitScore(j, 'Realistic', text, discipline, false, citedNormSet.has(j.name.toLowerCase())),
    }));

  const otherMatches: MatchedJournalItem[] = [...remainingDomain];
  for (const m of remainingMulti) {
    if (!otherMatches.some(x => x.journal.name === m.journal.name)) {
      otherMatches.push(m);
    }
  }

  // If still under 10 (fallback safeguard), pull related journals from broader catalog
  if (otherMatches.length < 10) {
    for (const j of JOURNAL_CATALOG) {
      if (!primaryNames.has(j.name) && !otherMatches.some(x => x.journal.name === j.name)) {
        otherMatches.push({
          journal: { ...j, isCrossDisciplinary: true },
          matchScore: calculateDynamicFitScore(j, 'Fallback', text, discipline, false, citedNormSet.has(j.name.toLowerCase())),
        });
      }
      if (otherMatches.length >= 12) break;
    }
  }

  // DYNAMIC SORT: Sort otherMatches by matchScore descending!
  // Journals that have the highest thematic and keyword overlap with this paper's title/abstract/keywords rank first!
  otherMatches.sort((a, b) => {
    if (b.matchScore !== a.matchScore) {
      return b.matchScore - a.matchScore;
    }
    return b.journal.impactFactor - a.journal.impactFactor;
  });

  const allScored: MatchedJournalItem[] = [
    { journal: reach, matchScore: reachFitScore },
    { journal: realistic, matchScore: realisticFitScore },
    { journal: fallback, matchScore: fallbackFitScore },
    ...otherMatches,
  ];

  // Target journal evaluation (calibrated for field match or out-of-scope mismatch)
  let targetJournalEvaluation: TargetJournalTierResults['targetJournalEvaluation'] = undefined;
  if (targetEntry) {
    const targetNorm = targetEntry.name.toLowerCase();
    const isReach = targetNorm === reach.name.toLowerCase();
    const isFallback = targetNorm === fallback.name.toLowerCase();
    const isRealistic = targetNorm === realistic.name.toLowerCase();
    const targetTier: 'Reach' | 'Realistic' | 'Fallback' = isReach ? 'Reach' : isFallback ? 'Fallback' : 'Realistic';

    const canonicalResult = computeCanonicalJournalFit({
      manuscriptText: text,
      manuscriptDiscipline: discipline,
      journal: { source: "catalog", entry: targetEntry },
      tier: targetTier,
      isTarget: true,
      isCited: citedNormSet.has(targetNorm),
    });

    const targetFitScore = isReach
      ? reachFitScore
      : isRealistic
      ? realisticFitScore
      : isFallback
      ? fallbackFitScore
      : canonicalResult.fitScore;

    targetJournalEvaluation = {
      name: targetEntry.name,
      journalName: targetEntry.name,
      foundInCatalog: true,
      tier: targetTier,
      fitScore: targetFitScore,
      impactFactor: targetEntry.impactFactor,
      discipline: canonicalResult.disciplineOfRecord,
      journalDiscipline: canonicalResult.disciplineOfRecord,
      manuscriptDiscipline: discipline,
      isDisciplinaryMismatch: canonicalResult.isDisciplinaryMismatch,
      mismatchWarning: canonicalResult.isDisciplinaryMismatch
        ? `Severe Disciplinary Scope Mismatch: Manuscript study area is in "${discipline}", whereas "${targetEntry.name}" publishes in "${targetEntry.discipline}". High desk-rejection risk.`
        : undefined,
    };
  } else if (targetJournal) {
    const targetNorm = targetJournal.trim().toLowerCase();
    const isReach = targetNorm === reach.name.toLowerCase();
    const isFallback = targetNorm === fallback.name.toLowerCase();
    const isRealistic = targetNorm === realistic.name.toLowerCase();
    const targetTier: 'Reach' | 'Realistic' | 'Fallback' = isReach ? 'Reach' : isFallback ? 'Fallback' : 'Realistic';

    const canonicalResult = computeCanonicalJournalFit({
      manuscriptText: text,
      manuscriptDiscipline: discipline,
      journal: { source: "name_only", name: targetJournal },
      tier: targetTier,
      isTarget: true,
      isCited: citedNormSet.has(targetNorm),
    });

    const targetFitScore = isReach
      ? reachFitScore
      : isRealistic
      ? realisticFitScore
      : isFallback
      ? fallbackFitScore
      : canonicalResult.fitScore;

    targetJournalEvaluation = {
      name: targetJournal,
      journalName: targetJournal,
      foundInCatalog: false,
      tier: targetTier,
      fitScore: targetFitScore,
      impactFactor: realistic.impactFactor,
      discipline: canonicalResult.disciplineOfRecord,
      journalDiscipline: canonicalResult.disciplineOfRecord,
      manuscriptDiscipline: discipline,
      isDisciplinaryMismatch: canonicalResult.isDisciplinaryMismatch,
      mismatchWarning: canonicalResult.isDisciplinaryMismatch
        ? `Severe Disciplinary Scope Mismatch: Manuscript study area is in "${discipline}", whereas target journal "${targetJournal}" operates in "${canonicalResult.disciplineOfRecord}". High desk-rejection risk.`
        : undefined,
    };
  }

  return {
    reach,
    realistic,
    fallback,
    reachFitScore,
    realisticFitScore,
    fallbackFitScore,
    detectedDiscipline: discipline,
    allMatches: allScored,
    otherMatches,
    crossDisciplinary: crossDisciplinary.length > 0 ? crossDisciplinary : undefined,
    targetJournalEvaluation,
  };
}

