import type { GuidelineDefinition, GuidelineDefinitionItem } from "./types";
import { regexMatcher } from "./utils";

export const ML_REPRODUCIBILITY_ITEMS: GuidelineDefinitionItem[] = [
  {
    itemNumber: 1,
    name: "Algorithmic Formulation",
    section: "Methods",
    description: "Mathematical formulation, objective function, and formal pseudocode or algorithmic steps",
    detector: regexMatcher(/\b(algorithm \d+|pseudocode|objective function|loss function|formulation|minimizing|maximizing)\b/i, "methods"),
    recommendationIfAbsent: "Provide formal mathematical formulations or pseudocode detailing algorithmic step execution.",
  },
  {
    itemNumber: 2,
    name: "Code & Data Replication Archive",
    section: "Methods",
    description: "Link to code repository, dependencies, and replication dataset",
    detector: regexMatcher(/\b(github\.com|gitlab|zenodo|osf\.io|code is available at|repository|open-source)\b/i),
    recommendationIfAbsent: "Provide a public DOI or repository link (GitHub, Zenodo) containing runnable code and environment configs.",
  },
  {
    itemNumber: 3,
    name: "Hyperparameter Configuration",
    section: "Methods",
    description: "Search spaces, chosen hyperparameters, and tuning protocol",
    detector: regexMatcher(/\b(hyperparameter|learning rate|batch size|grid search|cross-validation|optimizer|adam|epochs)\b/i, "methods"),
    recommendationIfAbsent: "Document hyperparameter search ranges, final configurations, and tuning selection criteria.",
  },
  {
    itemNumber: 4,
    name: "Computational Environment & Complexity",
    section: "Methods",
    description: "Hardware specs (GPUs/CPUs), operating system, software packages, and runtimes",
    detector: regexMatcher(/\b(nvidia|gpu|cpu|ram|runtime|computational complexity|pytorch|tensorflow|gurobi|cplex)\b/i, "methods"),
    recommendationIfAbsent: "Specify hardware accelerator architecture, runtime wall-clock metrics, and solver package versions.",
  },
  {
    itemNumber: 5,
    name: "Statistical Variance & Seeds",
    section: "Results",
    description: "Multiple trials, random seeds, standard deviations, and statistical significance tests",
    detector: regexMatcher(/\b(random seed|mean ± std|error bars|trials|runs|standard deviation|wilcoxon|paired t-test)\b/i, "results"),
    recommendationIfAbsent: "Report results averaged across multiple random seeds with error margins or confidence intervals.",
  },
];

export const mlReproducibilityGuideline: GuidelineDefinition = {
  id: "ml_reproducibility",
  name: "NeurIPS / ICML Machine Learning Reproducibility Checklist",
  standardType: "Computational, Algorithmic & Optimization Benchmarks",
  standardVersion: "NeurIPS 2020 ML Reproducibility",
  standardUrl: "https://neurips.cc/public/guides/PaperChecklist",
  itemSetScope: "core_subset",
  itemSetSize: 10,
  items: ML_REPRODUCIBILITY_ITEMS,
};
