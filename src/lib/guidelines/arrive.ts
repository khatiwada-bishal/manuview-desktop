import type { GuidelineDefinition, GuidelineDefinitionItem } from "./types";
import { regexMatcher } from "./utils";

export const ARRIVE_ITEMS: GuidelineDefinitionItem[] = [
  {
    itemNumber: 1,
    name: "Ethical Approval & Animal Welfare",
    section: "Methods",
    description: "Ethical review committee approval, animal welfare regulations and 3Rs compliance",
    detector: regexMatcher(/\b(iacuc|institutional animal care|animal welfare|ethics committee approval|guidelines for the care and use)\b/i, "methods"),
    recommendationIfAbsent: "Provide IACUC ethics protocol approval code and adherence to laboratory animal care guidelines.",
  },
  {
    itemNumber: 2,
    name: "Experimental Animals Specification",
    section: "Methods",
    description: "Species, strain, substrain, sex, age/developmental stage, and weight of animals",
    detector: regexMatcher(/\b(c57bl\/6|balb\/c|mice|rats|male|female|weeks of age|weighing \d+|strain)\b/i, "methods"),
    recommendationIfAbsent: "Itemize exact species, strain, supplier, sex, age, and initial weight ranges.",
  },
  {
    itemNumber: 3,
    name: "Housing & Husbandry",
    section: "Methods",
    description: "Housing conditions, light/dark cycle, temperature, humidity, cage type, bedding, food/water",
    detector: regexMatcher(/\b(12-h light|dark cycle|pathogen-free|ad libitum|housing conditions|temperature \(2\d°c\))\b/i, "methods"),
    recommendationIfAbsent: "Describe vivarium environmental conditions (photoperiod, cage enrichment, feeding regimen).",
  },
  {
    itemNumber: 4,
    name: "Experimental Procedures",
    section: "Methods",
    description: "Details of all procedures: dosing, anesthesia, surgical protocol, euthanasia",
    detector: regexMatcher(/\b(anesthetized|ketamine|xylazine|isoflurane|euthanasia|cervical dislocation|injected|surgical)\b/i, "methods"),
    recommendationIfAbsent: "Detail surgical anesthetics, drug vehicle, delivery routes, and humane endpoint protocols.",
  },
  {
    itemNumber: 5,
    name: "Sample Size Calculation & Blinding",
    section: "Methods",
    description: "Justification of animal numbers per group, randomization, and blinding of observers",
    detector: regexMatcher(/\b(sample size calculation|animals per group|randomly assigned|investigator was blinded|blinded to treatment)\b/i, "methods"),
    recommendationIfAbsent: "State animal sample size rationale (resource equation or power test) and operator blinding.",
  },
];

export const arriveGuideline: GuidelineDefinition = {
  id: "arrive",
  name: "ARRIVE 2.0 (In Vivo Animal Research)",
  standardType: "Preclinical Experimental Physiology & In Vivo Assays",
  standardVersion: "ARRIVE 2.0",
  standardUrl: "https://arriveguidelines.org/",
  itemSetScope: "core_subset",
  itemSetSize: 21,
  items: ARRIVE_ITEMS,
};
