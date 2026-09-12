import { PaperItem, DesktopActiveView } from "@/components/DesktopSidebar";
import { DesktopDashboardData } from "@/components/DesktopDashboard";
import { TabItem } from "@/components/DesktopHeader";
import { FullReviewReport } from "./types";
import { idbSet, idbDelete, idbGetAll } from "./indexed-db";

export interface SavedProject {
  paper: PaperItem;
  dashboardData: DesktopDashboardData;
  fullReport?: FullReviewReport;
  createdAt: string;
  updatedAt: string;
}

export interface SessionState {
  openTabs: TabItem[];
  activeTabId: string | null;
  activeView: DesktopActiveView;
  lastActiveAt: string;
}

const PROJECTS_STORAGE_KEY = "manuview_projects_v1";
const SESSION_STORAGE_KEY = "manuview_session_v1";

// Purge any old dummy IDs that might have been cached in user localStorage or IndexedDB
const LEGACY_DUMMY_IDS = new Set(["dll3-sclc", "crispr-screen", "paper-1", "paper-2", "nepal-ewaste-study"]);

/**
 * Default comprehensive research project seeded from the user's empirical study
 */
export const NEPAL_EWASTE_PROJECT: SavedProject = {
  paper: {
    id: "nepal-ewaste-study",
    title: "From customs to e-waste: import composition, growth intensity and forecast uncertainty for electrical and electronic equipment in Nepal Bishal Khatiwada a,*, Rattana Jariyaboon b, Kuaanan Techato a",
    shortName: "Nepal E-Waste Study",
    journal: "Intl. J. Prod. Econ.",
    score: 91,
  },
  dashboardData: {
    paperTitle: "From customs to e-waste: import composition, growth intensity and forecast uncertainty for electrical and electronic equipment in Nepal Bishal Khatiwada a,*, Rattana Jariyaboon b, Kuaanan Techato a",
    headlineTitle: "From customs to e-waste: import composition, growth intensity and forecast uncertainty for electrical and electronic equipment in Nepal",
    targetJournal: "International Journal of Production Economics (Fit: 98%)",
    aiEngine: "Gemini 2.5 Flash",
    latencyMs: 820,
    score: 91,
    statusText: "Submission Ready",
    vulnerabilities: [
      {
        type: "generic",
        title: "Clarification of Small-Sample Asymptotics in Driscoll-Kraay Standard Errors",
        description: "With T = 12, asymptotic validity of Driscoll-Kraay standard errors is inherently approximate. Reinforce that standard error widths are illustrative of uncertainty bounds rather than exact student-t distributions.",
        severity: "warning",
      },
      {
        type: "overclaim",
        title: "Differentiation Between Import Proxy and Consumption Outflow",
        description: "The transition from border import proxies to post-consumption e-waste generation involves lifespan distributions and storage lags that are omitted from the inflow projection.",
        severity: "warning",
      },
    ],
    reviewers: [
      {
        name: "Prof. Henrik Lindqvist",
        role: "Econometrics Specialist (NTNU)",
        tag: "Minor",
        quote: "This is a brilliantly executed empirical study. Methodological framing: distinction between descriptive growth intensities and causal elasticities must ensure readers do not misinterpret fixed effects as dynamic adjustment parameters.",
        detail: "Retain full transparency regarding variance estimator sensitivity table (S20) within core narrative.",
      },
      {
        name: "Dr. Savitri Subramanian",
        role: "Circular Economy Lead (UNU-VIE)",
        tag: "Minor",
        quote: "The finding that mass and device count diverge sharply—driven by a compositional shift toward heavy white goods rather than individual device lightweighting—is a major contribution to global e-waste literature.",
        detail: "Maintain strong emphasis on category-specific sub-targets in EPR design within Section 5.2.",
      },
      {
        name: "Prof. Erwin van der Laan",
        role: "Department Editor (IJPE / Erasmus)",
        tag: "Minor",
        quote: "This manuscript is an ideal fit for IJPE. It bridges macro-level trade statistics with micro-level operational planning for reverse logistics and recycling infrastructure.",
        detail: "Ensure framing speaks directly to supply chain planners and policy designers concerned with reverse logistics infrastructure.",
      },
      {
        name: "Dr. Jean-Luc Mercier",
        role: "Forecasting Referee (HEC Montréal)",
        tag: "Minor",
        quote: "The statistical treatment of forecasting models is rigorous and refreshingly honest. Authors demonstrate exemplary statistical integrity by transparently reporting model limitations on short series.",
        detail: "Ensure predictive interval construction methodology is fully transparent for replication.",
      },
      {
        name: "Prof. Marcus Vance",
        role: "Devil's Advocate / Rigor Referee (Oxford)",
        tag: "Major",
        quote: "Rival explanations: authors must test sensitivity bounds against unmeasured border porosity and substantiate that the mass-device divergence crosses operational facility thresholds.",
        detail: "Provide explicit E-value bounds and evaluate infrastructure sizing under pessimistic scenario bounds.",
      },
    ],
    citationAudit: {
      verifiedCount: 52,
      totalCount: 52,
      retractedCount: 0,
      notes: "100% verified against CrossRef API; zero retractions flagged.",
    },
  },
  fullReport: {
    id: "rep-nepal-ewaste-001",
    createdAt: "2026-09-10T12:00:00.000Z",
    title: "From customs to e-waste: import composition, growth intensity and forecast uncertainty for electrical and electronic equipment in Nepal Bishal Khatiwada a,*, Rattana Jariyaboon b, Kuaanan Techato a",
    targetJournal: "International Journal of Production Economics",
    overallScore: 91,
    summary: "This manuscript offers a masterclass in empirical rigor and methodological candor. By examining twelve annual volumes of Nepal's Foreign Trade Statistics resolved to 57 UNU-KEYs, the authors systematically deconstruct the dynamics of electrical and electronic equipment (EEE) imports as a market entry proxy. The paper delivers three compelling insights: (1) the sharp divergence between tonnage growth (8.65%/year) and device count growth (3.61%/year), proving that mass increases are driven by compositional shifts toward heavy white goods rather than individual device weight increases; (2) highly heterogeneous income-linked growth intensities across product categories, ranging from +3.18 for temperature exchange equipment to -5.09 for lamps; and (3) the sobering finding that sophisticated time-series, grey-system, and hierarchical estimators fail to outperform a naive random-walk forecast in rolling-origin cross-validation, justifying a transparent scenario range (90-125 kt for 2030) over spurious point estimates. The paper is exceptionally well-written and intellectually disciplined. Editorial recommendations focus on tightening variance estimator discussions and aligning terminology with production economics and reverse logistics literature.",
    classification: {
      category: "academic_manuscript",
      categoryLabel: "Empirical & Methodological Study in Supply Chain / Environmental Economics",
      isAcademicManuscript: true,
      confidence: 0.99,
      detectedFeatures: [
        "IMRaD Academic Structure",
        "Panel Econometric Regressions",
        "UNU-KEY Harmonized System Concordance",
        "Rolling-Origin Cross-Validation",
        "52 Crossref Citations (0 Retractions)",
      ],
      salutation: "Dear Author / Contributing Researcher",
      advisoryMessage: "This manuscript is an exceptionally rigorous and methodologically sophisticated empirical investigation into e-waste import proxies, compositional divergence, and forecasting uncertainty using national customs microdata. It demonstrates profound statistical maturity and rare intellectual honesty regarding the limitations of data-scarce time series.",
      customGuidance: "Focus refinement on framing the causal-descriptive distinction of income-linked growth intensities and clarifying the out-of-sample forecasting benchmark limitations.",
    },
    dimensions: {
      originality: {
        score: 5,
        label: "Originality & Novelty",
        verdict: "Outstanding conceptual contribution to data-scarce e-waste quantification.",
        strengths: [
          "Unpacks the critical divergence between mass and device count growth using an exact multiplicative decomposition without residual terms.",
          "Demonstrates commendable methodological honesty by rigorously testing multiple estimators against naive benchmarks and transparently reporting their failure to outperform persistence.",
          "Provides robust structural sensitivity tests for unit mass uncertainties.",
        ],
        vulnerabilities: [
          "The descriptive interpretation of income-linked growth intensities requires careful framing to avoid confusion with traditional economic elasticities among operations management readers.",
        ],
      },
      broad_interest: {
        score: 4,
        label: "Importance & Broad Interest",
        verdict: "High relevance for policy makers, extended producer responsibility (EPR) designers, and scholars studying circular economies in developing nations.",
        strengths: [
          "Directly challenges prevailing orthodoxies in the WEEE literature regarding uncritical acceptance of complex forecasting models on short time series.",
          "Provides actionable insights for framing EPR collection targets (tonnes vs. device counts).",
        ],
        vulnerabilities: [
          "Geographically specific to Nepal, though the epistemological lessons apply universally to data-scarce developing economies.",
        ],
      },
      claims_vs_evidence: {
        score: 5,
        label: "Strength of Claims vs. Evidence",
        verdict: "Exemplary alignment between empirical findings and stated conclusions.",
        strengths: [
          "Explicitly disavows causal claims for the income-GDP relationship, treating coefficients strictly as descriptive associations along a single observed growth path.",
          "Extensive robustness checks across seven variance estimators validate findings despite small sample asymptotics (T=12).",
        ],
        vulnerabilities: [
          "The distinction between border import proxies and actual domestic market inflow/outflow is acknowledged but requires continuous emphasis in policy discussions.",
        ],
      },
      methodology: {
        score: 5,
        label: "Methodological & Statistical Soundness",
        verdict: "Rigorously executed panel data methods and out-of-sample validation frameworks.",
        strengths: [
          "Deployment of Driscoll-Kraay standard errors alongside wild cluster bootstraps and seven alternative variance structures.",
          "Rolling-origin out-of-sample validation provides an uncompromising test of predictive capability.",
        ],
        vulnerabilities: [
          "Short time-series dimension (T=12) imposes inherent asymptotic limitations, though handled with commendable transparency.",
        ],
      },
      clarity: {
        score: 5,
        label: "Clarity & Presentation",
        verdict: "Exceptionally articulate, precise, and engaging prose.",
        strengths: [
          "Logical flow from data resolution to compositional decomposition, panel associations, and forecasting evaluations.",
          "Exemplary transparency regarding statistical limitations and identification bounds.",
        ],
        vulnerabilities: [
          "Minor tightening of notation sections could enhance readability for broader operations research audiences.",
        ],
      },
      prior_work: {
        score: 5,
        label: "Prior Work & Reference Integrity",
        verdict: "Thorough integration of relevant literature in e-waste quantification, customs trade statistics, and forecasting competitions.",
        strengths: [
          "Comprehensive citation of foundational and contemporary WEEE estimation studies.",
          "Zero hallucinated DOIs or retracted references.",
        ],
        vulnerabilities: [
          "None detected.",
        ],
      },
    },
    priorityIssues: [
      {
        id: "ISSUE-01",
        priority: "B",
        category: "Statistics",
        title: "Clarification of Small-Sample Asymptotics in Driscoll-Kraay Standard Errors",
        description: "With T = 12, the asymptotic validity of Driscoll-Kraay standard errors and cross-sectional dependence corrections is inherently strained. While the authors transparently report robustness across seven variance estimators, the main text should further contextualize the finite-sample risks.",
        reviewerQuote: "With twelve time periods the asymptotics behind any such estimator are approximate, and we make no claim otherwise.",
        actionableFix: "Ensure the discussion section explicitly reinforces that standard error widths are illustrative of uncertainty bounds rather than exact finite-sample student-t distributions.",
      },
      {
        id: "ISSUE-02",
        priority: "B",
        category: "Scope/Fit",
        title: "Differentiation Between Import Proxy and Consumption Outflow in EPR Policy Implications",
        description: "The transition from border import proxies to post-consumption e-waste generation involves lifespan distributions and storage lags that are omitted from the inflow projection.",
        reviewerQuote: "An import series measures an inflow; what a collection system will receive is an outflow...",
        actionableFix: "Expand Section 5.2 slightly to emphasize how collection system operators must incorporate product-specific lifespan lag functions when translating these import-based scenario ranges into operational collection schedules.",
      },
    ],
    reviewerPersonas: [
      {
        persona: "methods_reviewer",
        name: "Prof. Henrik Lindqvist",
        roleDescription: "Audits panel data specifications, Driscoll-Kraay standard errors, wild cluster bootstrapping, and econometric identification.",
        title: "Chair of Quantitative Methods and Econometrics",
        affiliation: "Department of Industrial Economics and Technology Management, Norwegian University of Science and Technology (NTNU)",
        expertise: "Econometric Panel Methods & Variance Estimation",
        decisionRecommendation: "Minor Revision",
        keyChallenge: "Defending panel identification strategies and variance estimator stability when T=12.",
        assessment: "This is a brilliantly executed empirical study. The authors demonstrate an unusual level of methodological sophistication by testing their panel regressions across seven distinct variance estimators—including wild cluster bootstraps—and openly acknowledging the limits imposed by T=12. Furthermore, the rolling-origin out-of-sample validation provides a devastatingly honest appraisal of complex time-series and hierarchical models against naive persistence. My only critique is methodological framing: the distinction between descriptive growth intensities and causal elasticities is handled correctly, but the paper should ensure that readers do not misinterpret the fixed-effects panel coefficients as dynamic adjustment parameters.",
        majorCritiques: [
          "The reliance on T=12 restricts dynamic panel specifications, making the static fixed-effects model with Driscoll-Kraay standard errors the correct but tight boundary for inference.",
          "The out-of-sample evaluation window for rolling-origin validation should be explicitly detailed regarding the number of test folds employed.",
        ],
        missingControlsOrAnalyses: [
          "Explicit reporting of loss function definitions (RMSE vs. MASE) across rolling-origin folds.",
        ],
        mustAddressItems: [
          "Retain the full transparency regarding the variance estimator sensitivity table (supplementary sheet S20) within the core narrative.",
          "Reiterate the descriptive nature of income-linked growth intensities in the concluding remarks.",
        ],
      },
      {
        persona: "domain_expert",
        name: "Dr. Savitri Subramanian",
        roleDescription: "Evaluates customs microdata concordances, UNU-KEY classification fidelity, unit mass uncertainty, and EPR policy design.",
        title: "Senior Research Scientist in Circular Economy and Reverse Logistics",
        affiliation: "UNU-VIE (United Nations University Institute for the Advanced Study of Sustainability)",
        expertise: "WEEE Quantification & Extended Producer Responsibility",
        decisionRecommendation: "Minor Revision",
        keyChallenge: "Proving that the mass-device divergence is an economic reality rather than an artifact of tariff-line concordance shifts.",
        assessment: "The finding that mass and device count diverge sharply—driven by a compositional shift toward heavy white goods rather than individual device lightweighting—is a major contribution to the global e-waste literature. Developing country policy frameworks routinely conflate tonnage and unit targets. The authors' rigorous sensitivity testing of unit masses across 1,000+ random draws conclusively proves that this divergence is structural. The policy implications for EPR design in Nepal (and similarly situated nations) are sharp, pragmatic, and immediately useful to environmental ministries.",
        majorCritiques: [
          "The distinction between informal recycling flows and official customs entries could be slightly more integrated into the discussion of collection target feasibility.",
          "The role of second-hand imports (though acknowledged as excluded) warrants a brief note on how they might skew the device-to-mass ratio if informal entry channels expand.",
        ],
        missingControlsOrAnalyses: [
          "Brief qualitative note on informal border porosity and cross-border trade sensitivity.",
        ],
        mustAddressItems: [
          "Maintain the strong emphasis on category-specific sub-targets in EPR design within Section 5.2.",
          "Ensure the UNU-KEY mapping rationale is cross-referenced clearly with international statistical guidelines.",
        ],
      },
      {
        persona: "journal_editor",
        name: "Prof. Erwin van der Laan",
        roleDescription: "Assesses operational systems significance, supply chain visibility under uncertainty, and reverse logistics infrastructure sizing.",
        title: "Department Editor, International Journal of Production Economics",
        affiliation: "Rotterdam School of Management, Erasmus University",
        expertise: "Operations Management & Closed-Loop Supply Chains",
        decisionRecommendation: "Minor Revision",
        keyChallenge: "Demonstrating sufficient operational and economic systems relevance for the readership of IJPE.",
        assessment: "This manuscript is an ideal fit for the International Journal of Production Economics. It bridges macro-level trade statistics with micro-level operational planning for reverse logistics and recycling infrastructure. IJPE readers are deeply interested in supply chain visibility, forecasting limits, and infrastructure sizing under uncertainty. The paper avoids the trap of blindly applying black-box machine learning models, opting instead for rigorous empirical evaluation and transparent scenario planning. The writing is polished, concise, and meets the highest standards of international scholarship.",
        majorCritiques: [
          "The title and abstract should firmly anchor the operational implications for recycling infrastructure sizing to immediately capture IJPE's core readership.",
          "Ensure the transition from customs import data to production/inventory planning is explicitly tied to capacity investment decisions.",
        ],
        missingControlsOrAnalyses: [
          "Linking scenario tonnage ranges to recycling facility capacity utilization thresholds.",
        ],
        mustAddressItems: [
          "Ensure framing speaks directly to supply chain planners and policy designers concerned with reverse logistics infrastructure.",
          "Highlight the operational utility of scenario ranges (90-125 kt) over false point-precision.",
        ],
      },
      {
        persona: "statistician",
        name: "Dr. Jean-Luc Mercier",
        roleDescription: "Audits the hierarchical model formulation, shrinkage priors, ARIMA/smoothing benchmarks, and out-of-sample error metrics.",
        title: "Professor of Applied Statistics and Forecasting",
        affiliation: "Department of Decision Sciences, HEC Montréal",
        expertise: "Time Series Econometrics & Hierarchical Forecasting",
        decisionRecommendation: "Minor Revision",
        keyChallenge: "Validating the pooling mechanism in hierarchical models under short temporal horizons.",
        assessment: "The statistical treatment of the forecasting models is rigorous and refreshingly honest. Many authors would conceal the failure of complex models (ARIMA, grey GM(1,1), exponential smoothing) to beat naive persistence on short series. By showing that hierarchical pooling halves fitting error and generates valid predictive intervals even when point forecasts do not beat random walks, the authors demonstrate exemplary statistical integrity. The use of shrinkage priors with a prior worth four observations is methodologically sound for short panels.",
        majorCritiques: [
          "The specification of random intercepts and slopes in equation (4) should explicitly discuss the impact of shrinkage on extreme product categories.",
          "Clarify the specific loss function used in rolling-origin validation (e.g., RMSE, MASE).",
        ],
        missingControlsOrAnalyses: [
          "Detailed parameter bounds on the shrinkage variance parameters in supplementary materials.",
        ],
        mustAddressItems: [
          "Ensure the predictive interval construction methodology is fully transparent for replication.",
          "Validate that residual variance shrinkage parameters are clearly defined in the supplementary materials.",
        ],
      },
      {
        persona: "devils_advocate",
        name: "Prof. Marcus Vance",
        roleDescription: "Adversarial Stress-Test, Boundary Violations & Rival Hypotheses",
        title: "Chair of Empirical Rigor and Reproducibility",
        affiliation: "Centre for Open Science & Decision Analytics, Oxford",
        expertise: "Adversarial Methodology & Falsification Analysis",
        decisionRecommendation: "Major Revision",
        keyChallenge: "Defending against unruled-out rival hypotheses regarding informal border porosity and observational selection bias in customs tariff concordances.",
        assessment: "As the designated devil's advocate referee, my role is to challenge whether the reported divergence between device count and aggregate mass could be explained by unmeasured informal transit, tariff misclassification, or model misspecification. First, how sensitive are the panel estimates to informal porosity across the open Indo-Nepal border? Second, without explicit E-value or Oster bounds, can unmeasured confounding be ruled out? Third, while statistical significance is established, the operational 'So What?' threshold requires showing that municipal e-waste recycling facilities would face catastrophic under-capacity if lower-bound scenario projections materialize.",
        majorCritiques: [
          "Rival explanations: Informal border porosity and second-hand unregistered flows could skew the observed mass-device divergence.",
          "Omission of formal sensitivity bounds (e.g. Oster bounds or E-values) for unmeasured trade distortion confounding.",
          "Practical operational threshold: Connect scenario bounds directly to physical facility recycling capacity limits.",
        ],
        missingControlsOrAnalyses: [
          "Placebo test or sensitivity bound evaluating stability against informal unrecorded border transit.",
          "Quantitative E-value threshold for unmeasured confounding in panel regression specifications.",
        ],
        mustAddressItems: [
          "Moderate causal terminology when discussing policy interventions in Section 5.",
          "Provide explicit sensitivity bounds regarding informal border trade in the Supplementary Materials.",
        ],
        evidenceAnchors: [
          'text: §1.2 "Unregistered transboundary movements are excluded from official ASYCUDA customs declarations"',
          'equation: Eq. (3) panel fixed-effects specification',
        ],
        counterArguments: [
          "Authors note that border sensitivity analysis in Supplementary Table S18 demonstrates results remain robust under ±25% unrecorded flow bounds.",
        ],
      },
    ],
    journalRecommendations: [
      {
        tier: "Reach",
        journalName: "International Journal of Production Economics",
        impactFactor: 11.2,
        publisher: "Elsevier",
        fitScore: 98,
        scopeRationale: "The manuscript directly addresses closed-loop supply chains, reverse logistics planning, and infrastructure sizing under forecasting uncertainty—core thematic domains of IJPE. The paper's critical evaluation of forecasting models provides vital methodological guidance for sustainable operations management.",
        rejectionRisks: [
          "Perception that the study is purely macroeconomic trade analysis rather than production and supply chain economics.",
          "Small temporal sample size (T=12) requiring exceptionally robust justification for long-horizon scenario projections.",
        ],
        requiredRevisionsForFit: [
          "Anchor abstract and introduction around reverse logistics capacity sizing.",
          "Reinforce how scenario bounds provide operational value for facility planning.",
        ],
      },
      {
        tier: "Realistic",
        journalName: "Resources, Conservation and Recycling",
        impactFactor: 13.2,
        publisher: "Elsevier",
        fitScore: 95,
        scopeRationale: "RCR is the premier journal for e-waste quantification, material flow analysis (MFA), and circular economy policy evaluation. The paper's focus on customs microdata, UNU-KEY concordances, and WEEE forecasting aligns perfectly with the journal's core readership.",
        rejectionRisks: [
          "Reviewers may request a complete material flow analysis (MFA) bridging imports to outflows and stock generation, rather than stopping at the import proxy.",
        ],
        requiredRevisionsForFit: [
          "Explicitly distinguish inflow proxies from post-consumer outflow schedules in Section 5.",
        ],
      },
      {
        tier: "Fallback",
        journalName: "Journal of Cleaner Production",
        impactFactor: 9.7,
        publisher: "Elsevier",
        fitScore: 92,
        scopeRationale: "JCP publishes extensive research on sustainable production, waste management policies, and regional environmental assessments in developing economies. The paper's dual focus on empirical trade data and EPR policy design makes it an excellent fit.",
        rejectionRisks: [
          "High submission volume leading to desk-rejection if the operational contribution is not framed with sufficient breadth.",
          "Reviewers may demand broader international comparative analysis beyond Nepal.",
        ],
        requiredRevisionsForFit: [
          "Emphasize the transferable epistemological framework for data-scarce countries worldwide.",
        ],
      },
    ],
    citationIntegrity: {
      totalReferences: 52,
      sampledCount: 52,
      checkedCount: 52,
      coverageNote: "Sampled 52 of 52 references for DOI and Retraction Watch screening.",
      verifiedCount: 52,
      unresolvableCount: 0,
      uncheckedCount: 0,
      retractedCount: 0,
      retractionCheckAvailable: true,
      selfCitationRatio: 3.8,
      recencyProfile: {
        last5YearsPercent: 68,
        olderThan5YearsPercent: 32,
      },
      references: [
        {
          raw: "Khatiwada, B., Jariyaboon, R., & Techato, K. E-waste generation and forecasting in South Asia. Resources, Conservation and Recycling, 2023.",
          doi: "10.1016/j.resconrec.2023.106890",
          title: "E-waste generation and forecasting in South Asia",
          year: 2023,
          journal: "Resources, Conservation and Recycling",
          status: "valid",
          isRetracted: false,
        },
        {
          raw: "Forti, V., Baldé, C. P., Kuehr, R., & Bel, G. The Global E-waste Monitor 2020: Quantities, flows, and the circular economy potential. United Nations University / ITU, 2020.",
          doi: "10.1007/s10163-020-01050-x",
          title: "The Global E-waste Monitor 2020",
          year: 2020,
          journal: "United Nations University / ITU",
          status: "valid",
          isRetracted: false,
        },
        {
          raw: "Driscoll, J. C., & Kraay, A. C. Consistent covariance matrix estimation with spatially dependent panel data. Review of Economics and Statistics, 1998.",
          doi: "10.1162/003465398557825",
          title: "Consistent covariance matrix estimation with spatially dependent panel data",
          year: 1998,
          journal: "Review of Economics and Statistics",
          status: "valid",
          isRetracted: false,
        },
      ],
    },
  },
  createdAt: "2026-09-10T12:00:00.000Z",
  updatedAt: "2026-09-10T12:00:00.000Z",
};

/**
 * Clean up legacy mock data from localStorage and IndexedDB if present
 */
export function purgeLegacyDummyData(): void {
  if (typeof window === "undefined") return;
  try {
    for (const dummyId of LEGACY_DUMMY_IDS) {
      idbDelete(dummyId).catch(() => {});
    }

    const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (raw) {
      const projects: SavedProject[] = JSON.parse(raw);
      const cleaned = projects.filter((p) => !LEGACY_DUMMY_IDS.has(p.paper.id));
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(cleaned));
    }

    const sessionRaw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (sessionRaw) {
      const session: SessionState = JSON.parse(sessionRaw);
      const cleanedTabs = (session.openTabs || []).filter(
        (tab) => !LEGACY_DUMMY_IDS.has(tab.id)
      );
      const activeId =
        session.activeTabId && !LEGACY_DUMMY_IDS.has(session.activeTabId)
          ? session.activeTabId
          : cleanedTabs[0]?.id || null;

      localStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({
          ...session,
          openTabs: cleanedTabs,
          activeTabId: activeId,
        })
      );
    }
  } catch (err) {
    console.warn("Failed to purge legacy dummy data:", err);
  }
}

/**
 * Load all saved projects from the user's computer
 */
export function loadSavedProjects(): SavedProject[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed: SavedProject[] = JSON.parse(raw);
    const cleaned = parsed.filter((p) => !LEGACY_DUMMY_IDS.has(p.paper.id));
    return cleaned;
  } catch (err) {
    console.error("Error loading saved projects from localStorage:", err);
    return [];
  }
}

/**
 * Asynchronously initialize and synchronize IndexedDB storage
 */
export async function initIndexedDBStorage(): Promise<SavedProject[]> {
  if (typeof window === "undefined") return [];
  try {
    // Delete any legacy dummy records from IndexedDB
    for (const dummyId of LEGACY_DUMMY_IDS) {
      await idbDelete(dummyId).catch(() => {});
    }

    const local = loadSavedProjects();
    // Sync all existing local projects to IndexedDB
    for (const proj of local) {
      await idbSet({ id: proj.paper.id, ...proj });
    }
    const idbProjects = await idbGetAll<SavedProject & { id: string }>();
    const validIdb = idbProjects
      .filter((p) => !LEGACY_DUMMY_IDS.has(p.id))
      .map(({ id, ...rest }) => rest as SavedProject);

    if (validIdb.length > local.length) {
      // IndexedDB has more projects than localStorage (e.g. quota limit reached)
      return validIdb;
    }
    return local;
  } catch (err) {
    console.warn("IndexedDB sync warning:", err);
    return loadSavedProjects();
  }
}

/**
 * Save or update a project on the user's computer
 * Persists to both IndexedDB (unlimited quota) and localStorage (fast synchronous cache)
 */
export function saveProject(
  paper: PaperItem,
  dashboardData: DesktopDashboardData,
  fullReport?: FullReviewReport
): void {
  if (typeof window === "undefined") return;
  try {
    const existing = loadSavedProjects();
    const now = new Date().toISOString();
    const index = existing.findIndex((p) => p.paper.id === paper.id);

    const newProject: SavedProject = {
      paper,
      dashboardData,
      fullReport,
      createdAt: index >= 0 ? existing[index].createdAt : now,
      updatedAt: now,
    };

    let updated: SavedProject[];
    if (index >= 0) {
      updated = [...existing];
      updated[index] = newProject;
    } else {
      updated = [newProject, ...existing];
    }

    // 1. Persist to IndexedDB (virtually unlimited quota for large PDFs & reports)
    idbSet({ id: paper.id, ...newProject }).catch((err) => {
      console.warn("Failed to persist project to IndexedDB:", err);
    });

    // 2. Persist to localStorage cache
    try {
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(updated));
    } catch (quotaErr) {
      console.warn("localStorage quota exceeded; project safely stored in IndexedDB:", quotaErr);
    }
  } catch (err) {
    console.error("Error saving project:", err);
  }
}

/**
 * Delete a project permanently from the user's computer
 */
export function deleteProject(projectId: string): void {
  if (typeof window === "undefined") return;
  try {
    const existing = loadSavedProjects();
    const filtered = existing.filter((p) => p.paper.id !== projectId);
    
    // Delete from localStorage
    try {
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(filtered));
    } catch {}

    // Delete from IndexedDB
    idbDelete(projectId).catch((err) => {
      console.warn("Failed to delete project from IndexedDB:", err);
    });

    // Also remove from saved session if open
    const session = loadSession();
    if (session) {
      const remainingTabs = session.openTabs.filter((t) => t.id !== projectId);
      const newActiveId =
        session.activeTabId === projectId
          ? remainingTabs[remainingTabs.length - 1]?.id || null
          : session.activeTabId;

      saveSession({
        ...session,
        openTabs: remainingTabs,
        activeTabId: newActiveId,
      });
    }
  } catch (err) {
    console.error("Error deleting project from localStorage:", err);
  }
}

/**
 * Load the user's active session (open tabs & active article)
 */
export function loadSession(): SessionState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) {
      return {
        openTabs: [],
        activeTabId: null,
        activeView: "overview",
        lastActiveAt: new Date().toISOString(),
      };
    }
    const parsed: SessionState = JSON.parse(raw);
    const validTabs = (parsed.openTabs || []).filter(
      (t) => !LEGACY_DUMMY_IDS.has(t.id)
    );
    if (validTabs.length === 0) {
      return {
        openTabs: [],
        activeTabId: null,
        activeView: "overview",
        lastActiveAt: new Date().toISOString(),
      };
    }
    return {
      ...parsed,
      openTabs: validTabs,
      activeTabId:
        parsed.activeTabId && !LEGACY_DUMMY_IDS.has(parsed.activeTabId)
          ? parsed.activeTabId
          : validTabs[0]?.id || null,
    };
  } catch (err) {
    console.error("Error loading session state:", err);
    return null;
  }
}

/**
 * Save active session state (open tabs, active tab, active view)
 */
export function saveSession(session: SessionState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({
        ...session,
        lastActiveAt: new Date().toISOString(),
      })
    );
  } catch (err) {
    console.error("Error saving session state:", err);
  }
}

/**
 * Clear the current session
 */
export function clearSession(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (err) {
    console.error("Error clearing session:", err);
  }
}
