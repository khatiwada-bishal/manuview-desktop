import test from "node:test";
import assert from "node:assert/strict";
import { parseManuscriptText } from "../src/lib/parser.ts";

test("parseRawTextToManuscript accurately extracts explicit IMRaD sections", () => {
  const manuscriptText = `
Optimizing Transformer Architectures for Low-Resource Neural Machine Translation

Alice Smith, Bob Jones
Department of Computer Science, University of Technology

Abstract
Recent developments in transformer architectures have achieved impressive translation accuracy.
In this work, we propose a parameter-efficient fine-tuning approach tailored for low-resource languages.
Our experimental results show substantive BLEU score gains over competitive baselines.

1. Introduction
Neural machine translation models require millions of parallel sentence pairs.
In low-resource scenarios, standard scaling laws fail due to extreme data sparsity.

2. Materials and Methods
We implement an adapter-based parameter-efficient framework.
All models were trained on 8 NVIDIA A100 GPUs using AdamW optimizer with learning rate 5e-4.
Sample size comprises 45,000 parallel sentences across three language pairs.

3. Results
The proposed adapter achieves a BLEU score of 28.4 on English-to-Swahili translation.
This represents a +3.2 BLEU improvement over the baseline dense model (p < 0.01).

4. Discussion
Our findings demonstrate that bottleneck adapters prevent catastrophic forgetting.
However, inference latency increases by approximately 4% compared to unadapted models.

5. Conclusion
We presented a parameter-efficient framework for low-resource machine translation.
Future investigations will evaluate cross-lingual transfer in multilingual settings.

References
1. Vaswani, A. et al. Attention is all you need. NeurIPS 2017.
2. Houlsby, N. et al. Parameter-efficient transfer learning for NLP. ICML 2019.
  `;

  const parsed = parseManuscriptText(manuscriptText);

  assert.ok(parsed.title.includes("Optimizing Transformer Architectures"), `Title extracted: ${parsed.title}`);
  assert.ok(parsed.abstract.length > 50, "Abstract should be extracted");
  assert.ok(parsed.sections.methods && parsed.sections.methods.includes("AdamW optimizer"), "Methods should be extracted from explicit heading");
  assert.ok(parsed.sections.results && parsed.sections.results.includes("BLEU score of 28.4"), "Results should be extracted from explicit heading");
  assert.equal(parsed.sectionProvenance?.methodsInferred, false, "Methods should NOT be marked inferred when explicit heading is present");
  assert.equal(parsed.sectionProvenance?.structureNotDetected, undefined, "structureNotDetected should not be true when explicit headings exist");
});

test("parseRawTextToManuscript flags structureNotDetected when headings are missing", () => {
  // Academic manuscript text with sufficient length but completely lacking explicit section headings
  const textWithoutHeadings = `
Investigation into Novel Catalytic Synthesis Pathways for Sustainable Polymers

Elena Rostova, Marcus Vance
Green Chemistry Institute

Abstract
This study investigates catalytic pathways for synthesizing bio-derived polyesters with enhanced thermal stability.
We report reaction kinetics, glass transition temperatures, and degradation profiles across variable catalyst loadings.

The synthesis of biodegradable polymers has emerged as a cornerstone of sustainable materials science.
Traditional petrochemically derived polyesters contribute significantly to microplastic accumulation and environmental degradation.
To address this challenge, we developed a series of zinc-based coordination complexes designed to catalyze the ring-opening copolymerization of cyclic anhydrides and epoxides.
In our experimental protocol, copolymerization reactions were conducted in sealed glass ampoules under dry argon atmosphere at 100 degrees Celsius for 24 hours.
Zinc catalyst concentrations were varied systematically between 0.1 mol% and 1.5 mol% relative to the monomer mixture.
Molecular weight distributions were determined via gel permeation chromatography calibrated with narrow-dispersity polystyrene standards.
Thermal transition characteristics were evaluated using differential scanning calorimetry across a temperature window from -50 to 200 degrees Celsius at 10 degrees per minute.
The zinc coordination catalyst demonstrated high selectivity, achieving complete monomer conversion within 18 hours at 0.5 mol% catalyst loading.
The resulting polyesters exhibited number-average molecular weights ranging from 32,000 to 78,000 g/mol with polydispersity indices below 1.25.
Glass transition temperatures varied systematically with catalyst architecture, reaching a maximum of 68 degrees Celsius for the sterically hindered diimine complex.
These thermal characteristics compare favorably with commercial petrochemical polyethylene terephthalate while maintaining hydrolytic degradability.
The high catalytic activity can be attributed to the cooperative action of the dual Lewis-acidic zinc centers, which facilitate epoxide activation and concerted ring opening.
In summary, the catalytic system reported here offers a viable synthetic route toward high-performance bio-polyesters under mild reaction conditions.

References
1. Smith, J. Catalytic polymerization of bio-monomers. JACS 2021.
2. Doe, R. Biodegradable plastics from renewable feedstocks. Green Chem 2022.
  `;

  const parsed = parseManuscriptText(textWithoutHeadings);

  assert.equal(parsed.sectionProvenance?.methodsInferred, true, "methodsInferred must be true when headings are absent");
  assert.equal(parsed.sectionProvenance?.structureNotDetected, true, "structureNotDetected must be true when body slicing fallback is triggered");
});

test("detectLanguageIntegrity accurately discriminates English from non-English manuscripts", async () => {
  const { detectLanguageIntegrity } = await import("../src/lib/parser.ts");

  const englishText = "The study investigates whether the application of machine learning models improves diagnosis in clinical healthcare systems.";
  const engResult = detectLanguageIntegrity(englishText);
  assert.equal(engResult.isEnglish, true);
  assert.equal(engResult.warning, undefined);

  // Spanish scholarly text
  const spanishText = "El presente estudio analiza el impacto de las redes neuronales en la optimización de procesos industriales según los datos recopilados durante el año anterior.";
  const esResult = detectLanguageIntegrity(spanishText);
  assert.equal(esResult.isEnglish, false);
  assert.ok(esResult.warning?.includes("Non-English Text Detected"));

  // Chinese text
  const chineseText = "本研究探讨了深度神经网络在自然语言处理任务中的性能表现，并对模型参数进行了系统优化。";
  const zhResult = detectLanguageIntegrity(chineseText);
  assert.equal(zhResult.isEnglish, false);
  assert.ok(zhResult.warning?.includes("Non-English Text Detected"));
});

test("detectPdfExtractionQuality flags degraded stream artifacts and corrupted glyphs", async () => {
  const { detectPdfExtractionQuality } = await import("../src/lib/parser.ts");

  const cleanText = "This is a clean, well-formatted scholarly text extracted from a searchable PDF with standard fonts.";
  assert.equal(detectPdfExtractionQuality(cleanText).isHighQuality, true);

  // Corrupted stream with repeated replacement characters
  const corruptedText = "Study \uFFFD\uFFFD\uFFFD\uFFFD of \uFFFD\uFFFD\uFFFD\uFFFD polymers \uFFFD\uFFFD\uFFFD\uFFFD with \uFFFD\uFFFD\uFFFD\uFFFD " + "\uFFFD".repeat(20);
  const corResult = detectPdfExtractionQuality(corruptedText);
  assert.equal(corResult.isHighQuality, false);
  assert.ok(corResult.warning?.includes("Low extraction confidence"));
});

