import type {
  DisplayItemAuditReport,
  FigureConsistencyIssue,
  StatisticalLegendCheck,
} from './types';

export interface ExtractedCaption {
  number: number;
  itemType: 'figure' | 'table';
  captionText: string;
  startIndex: number;
}

/**
 * Detects captions in manuscript text (e.g. "Figure 1: ...", "Fig. 2 - ...", "Table 1. ...")
 */
export function detectCaptions(text: string): {
  figureCaptions: ExtractedCaption[];
  tableCaptions: ExtractedCaption[];
} {
  if (!text) {
    return { figureCaptions: [], tableCaptions: [] };
  }

  const figureCaptions: ExtractedCaption[] = [];
  const tableCaptions: ExtractedCaption[] = [];

  // Match captions at start of line or after double line break
  // Allows optional markdown bold or headings: **Figure 1**, ### Fig 1, Figure 1:, etc.
  const captionRegex =
    /(?:^|\n)\s*(?:#{1,4}\s*)?(?:\*{1,2})?(?:(Figure|Fig\.?)|(Table))\s+(\d+)(?:\*{1,2})?[:.\s—–-]\s*([^\n]+(?:\n(?!\s*(?:(?:#{1,4}\s*)?(?:Figure|Fig\.?|Table)\s+\d+|[A-Z][a-z]+:|\n))[^\n]+)*)/gi;

  let match: RegExpExecArray | null;
  while ((match = captionRegex.exec(text)) !== null) {
    const isFigure = Boolean(match[1]);
    const isTable = Boolean(match[2]);
    const number = parseInt(match[3], 10);
    const captionBody = (match[4] || '').trim();

    if (isNaN(number)) continue;

    const extracted: ExtractedCaption = {
      number,
      itemType: isFigure ? 'figure' : 'table',
      captionText: captionBody,
      startIndex: match.index,
    };

    if (isFigure) {
      if (!figureCaptions.some((c) => c.number === number)) {
        figureCaptions.push(extracted);
      }
    } else if (isTable) {
      if (!tableCaptions.some((c) => c.number === number)) {
        tableCaptions.push(extracted);
      }
    }
  }

  figureCaptions.sort((a, b) => a.number - b.number);
  tableCaptions.sort((a, b) => a.number - b.number);

  return { figureCaptions, tableCaptions };
}

/**
 * Detects in-text narrative callouts to figures and tables (e.g., "(Figure 1)", "see Fig. 2B", "as shown in Table 3")
 */
export function detectFigureAndTableCallouts(
  text: string,
  captions?: {
    figureCaptions: ExtractedCaption[];
    tableCaptions: ExtractedCaption[];
  }
): { figuresInText: number[]; tablesInText: number[] } {
  if (!text) {
    return { figuresInText: [], tablesInText: [] };
  }

  // Create a version of text where caption header lines are blanked out to prevent self-callout matches
  let narrativeText = text;
  if (captions) {
    for (const cap of [...captions.figureCaptions, ...captions.tableCaptions]) {
      const capHeaderRegex = new RegExp(
        `(?:^|\\n)\\s*(?:#{1,4}\\s*)?(?:\\*{1,2})?(?:Figure|Fig\\.?|Table)\\s+${cap.number}[:.\\s—–-]`,
        'gi'
      );
      narrativeText = narrativeText.replace(capHeaderRegex, '\n[CAPTION_HEADER]');
    }
  }

  const figuresInText: number[] = [];
  const tablesInText: number[] = [];

  // Match figure mentions: Figure 1, Fig 2, Figures 1 and 2, Figs. 1-3
  const figureRegex = /\b(?:figures?|figs?\.?)\s*(\d+)(?:\s*(?:and|&|-|to|,)\s*(\d+))?/gi;
  let figMatch: RegExpExecArray | null;
  while ((figMatch = figureRegex.exec(narrativeText)) !== null) {
    const num1 = parseInt(figMatch[1], 10);
    if (!isNaN(num1) && !figuresInText.includes(num1)) {
      figuresInText.push(num1);
    }
    if (figMatch[2]) {
      const num2 = parseInt(figMatch[2], 10);
      if (!isNaN(num2) && !figuresInText.includes(num2)) {
        figuresInText.push(num2);
      }
    }
  }

  // Match table mentions: Table 1, Tables 1 and 2
  const tableRegex = /\btables?\s*(\d+)(?:\s*(?:and|&|-|to|,)\s*(\d+))?/gi;
  let tableMatch: RegExpExecArray | null;
  while ((tableMatch = tableRegex.exec(narrativeText)) !== null) {
    const num1 = parseInt(tableMatch[1], 10);
    if (!isNaN(num1) && !tablesInText.includes(num1)) {
      tablesInText.push(num1);
    }
    if (tableMatch[2]) {
      const num2 = parseInt(tableMatch[2], 10);
      if (!isNaN(num2) && !tablesInText.includes(num2)) {
        tablesInText.push(num2);
      }
    }
  }

  return { figuresInText, tablesInText };
}

/**
 * Evaluates figure/table numbering sequence, orphan items, and phantom references
 */
export function auditCalloutConsistency(
  callouts: number[],
  captions: number[],
  itemType: 'figure' | 'table'
): FigureConsistencyIssue[] {
  const issues: FigureConsistencyIssue[] = [];
  const labelCapitalized = itemType === 'figure' ? 'Figure' : 'Table';

  const captionSet = new Set(captions);
  const calloutSet = new Set(callouts);

  // 1. Phantom Items: referenced in text but no caption exists
  for (const num of callouts) {
    if (!captionSet.has(num)) {
      issues.push({
        type: 'phantom',
        itemType,
        number: num,
        message: `${labelCapitalized} ${num} is cited in the narrative text, but no caption or display item for ${labelCapitalized} ${num} was found.`,
        severity: 'error',
      });
    }
  }

  // 2. Orphan Items: caption exists but never cited in narrative text
  for (const num of captions) {
    if (!calloutSet.has(num)) {
      issues.push({
        type: 'orphan',
        itemType,
        number: num,
        message: `${labelCapitalized} ${num} has a defined caption, but is never referenced or discussed anywhere in the main manuscript text.`,
        severity: 'warning',
      });
    }
  }

  // 3. Caption Sequence Gaps: Check if captions skip numbers (e.g., 1, 3 -> missing 2)
  if (captions.length > 1) {
    const sortedCaptions = [...captions].sort((a, b) => a - b);
    for (let i = 0; i < sortedCaptions.length - 1; i++) {
      const current = sortedCaptions[i];
      const next = sortedCaptions[i + 1];
      if (next > current + 1) {
        issues.push({
          type: 'non_sequential',
          itemType,
          number: current + 1,
          message: `${labelCapitalized} numbering skips from ${labelCapitalized} ${current} to ${labelCapitalized} ${next} (${labelCapitalized} ${current + 1} is missing from the sequence).`,
          severity: 'error',
        });
      }
    }
  }

  // 4. In-Text First Citation Order: Check if callouts appear drastically out of order (e.g., Fig 3 before Fig 1)
  if (callouts.length > 1) {
    let highestSeen = 0;
    for (const num of callouts) {
      if (num > highestSeen + 1 && highestSeen > 0) {
        // Only warn once per skip
        const isAlreadyReported = issues.some(
          (i) => i.type === 'non_sequential' && i.number === num && i.itemType === itemType
        );
        if (!isAlreadyReported) {
          issues.push({
            type: 'non_sequential',
            itemType,
            number: num,
            message: `${labelCapitalized} ${num} is cited before ${labelCapitalized} ${highestSeen + 1} in the narrative flow. Most journals require display items to be cited in strictly sequential order.`,
            severity: 'warning',
          });
        }
      }
      if (num > highestSeen) {
        highestSeen = num;
      }
    }
  }

  return issues;
}

/**
 * Audits statistical legend compliance for a figure caption
 * (Verifies error bar definition: SD, SEM, 95% CI; sample size n; significance thresholds)
 */
export function auditStatisticalLegendCompliance(
  captionText: string,
  number: number,
  itemType: 'figure' | 'table' = 'figure'
): StatisticalLegendCheck {
  const issues: string[] = [];
  const text = captionText || '';

  // Check error bar presence
  const hasErrorBarsMentioned = /\b(?:error\s*bars?|bars?\s*represent|error\s*bands?|whiskers?)\b/i.test(text);

  // Check error bar definitions
  const hasErrorBarDefinition =
    /\b(?:standard\s+deviations?|s\.?d\.?|standard\s+errors?(?:\s+of\s+the\s+mean)?|s\.?e\.?m\.?|confidence\s+intervals?|c\.?i\.?|95%\s*ci|interquartile\s+ranges?|iqr|min\s*to\s*max)\b/i.test(
      text
    );

  // Check sample size (n = ...)
  const hasSampleSizeMentioned =
    /\b(?:n\s*=\s*\d+|sample\s*sizes?|cohort(?:\s+size)?\s*(?:of|=)\s*\d+|biological\s+replicates|independent\s+experiments|subjects|patients)\b/i.test(
      text
    );

  // Check p-value or significance
  const hasPValueThresholds =
    /\b(?:p\s*[<=<]\s*0\.\d+|\*+p|p\s*=\s*0\.\d+|asterisks?\s+denote|significance\s+at|two-tailed|paired\s+t-test|anova|ns\s*=\s*not\s+significant)\b/i.test(
      text
    );

  if (hasErrorBarsMentioned && !hasErrorBarDefinition) {
    issues.push(
      `Figure ${number} mentions error bars, but does not define whether they represent Standard Deviation (SD), Standard Error of the Mean (SEM), or 95% Confidence Interval (CI). Peer reviewers and production editors routinely mandate explicit error bar definitions.`
    );
  }

  return {
    itemType,
    number,
    captionSnippet: text.slice(0, 160) + (text.length > 160 ? '...' : ''),
    hasErrorBarsMentioned,
    hasErrorBarDefinition,
    hasSampleSizeMentioned,
    hasPValueThresholds,
    issues,
  };
}

/**
 * Orchestrates full display item pre-flight audit
 */
export function auditManuscriptDisplayItems(rawText: string): DisplayItemAuditReport {
  if (!rawText || rawText.trim().length === 0) {
    return {
      figuresInText: [],
      tablesInText: [],
      figureCaptions: [],
      tableCaptions: [],
      consistencyIssues: [],
      statisticalLegendChecks: [],
      summary: {
        totalFigures: 0,
        totalTables: 0,
        isSequential: true,
        orphanCount: 0,
        phantomCount: 0,
        legendDeficiencyCount: 0,
      },
      complianceStatus: 'pass',
    };
  }

  // 1. Detect captions
  const { figureCaptions, tableCaptions } = detectCaptions(rawText);

  // 2. Detect callouts
  const { figuresInText, tablesInText } = detectFigureAndTableCallouts(rawText, {
    figureCaptions,
    tableCaptions,
  });

  const figureCaptionNumbers = figureCaptions.map((c) => c.number);
  const tableCaptionNumbers = tableCaptions.map((c) => c.number);

  // 3. Consistency checks
  const figIssues = auditCalloutConsistency(figuresInText, figureCaptionNumbers, 'figure');
  const tabIssues = auditCalloutConsistency(tablesInText, tableCaptionNumbers, 'table');
  const consistencyIssues = [...figIssues, ...tabIssues];

  // 4. Statistical legend compliance on figure captions
  const statisticalLegendChecks: StatisticalLegendCheck[] = [];
  for (const cap of figureCaptions) {
    const check = auditStatisticalLegendCompliance(cap.captionText, cap.number, 'figure');
    statisticalLegendChecks.push(check);
  }

  const orphanCount = consistencyIssues.filter((i) => i.type === 'orphan').length;
  const phantomCount = consistencyIssues.filter((i) => i.type === 'phantom').length;
  const nonSeqCount = consistencyIssues.filter((i) => i.type === 'non_sequential').length;
  const legendDeficiencyCount = statisticalLegendChecks.filter((c) => c.issues.length > 0).length;

  const totalFigures = Math.max(figuresInText.length, figureCaptionNumbers.length);
  const totalTables = Math.max(tablesInText.length, tableCaptionNumbers.length);
  const isSequential = nonSeqCount === 0;

  let complianceStatus: 'pass' | 'warning' | 'needs_attention' = 'pass';
  if (phantomCount > 0 || legendDeficiencyCount > 1 || nonSeqCount > 1) {
    complianceStatus = 'needs_attention';
  } else if (orphanCount > 0 || legendDeficiencyCount > 0 || nonSeqCount > 0) {
    complianceStatus = 'warning';
  }

  return {
    figuresInText,
    tablesInText,
    figureCaptions: figureCaptionNumbers,
    tableCaptions: tableCaptionNumbers,
    consistencyIssues,
    statisticalLegendChecks,
    summary: {
      totalFigures,
      totalTables,
      isSequential,
      orphanCount,
      phantomCount,
      legendDeficiencyCount,
    },
    complianceStatus,
  };
}
