/**
 * Central Chart Theme, Color Tokens & Accessibility Helpers
 * 
 * Provides unified theme palettes, contrast-safe styling, ARIA helpers,
 * and static SVG generation for export parity across ManuView.
 */

import type { ScoreDimension, ExpectedDecisionOutcome } from '../types';

export interface ChartColorToken {
  fill: string;
  stroke: string;
  text: string;
  bgLight: string;
  bgDark: string;
  borderLight: string;
  borderDark: string;
}

export const READINESS_BAND_THEME: Record<string, {
  label: string;
  stepIndex: number; // 0 to 3
  color: string;
  darkColor: string;
  badgeClass: string;
  description: string;
}> = {
  "Desk Reject Hazard": {
    label: "Desk Reject Hazard",
    stepIndex: 0,
    color: "#E11D48", // rose-600
    darkColor: "#FB7185", // rose-400
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800",
    description: "Fatal scope mismatch, protocol absence, or citation integrity barrier detected prior to peer review.",
  },
  "Substantial Revision Needed": {
    label: "Substantial Revision Needed",
    stepIndex: 1,
    color: "#D97706", // amber-600
    darkColor: "#FBBF24", // amber-400
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
    description: "Multiple methodological, empirical, or structural deficits requiring significant author remediation.",
  },
  "Competitive / Moderate Readiness": {
    label: "Competitive / Moderate Readiness",
    stepIndex: 2,
    color: "#2563EB", // blue-600
    darkColor: "#60A5FA", // blue-400
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800",
    description: "Competitive submission profile likely to be dispatched to external referees; outcome subject to normal review variance.",
  },
  "Strong Submission Readiness": {
    label: "Strong Submission Readiness",
    stepIndex: 3,
    color: "#059669", // emerald-600
    darkColor: "#34D399", // emerald-400
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
    description: "High methodological rigor, comprehensive controls, transparent reporting, and strong discipline alignment.",
  },
};

export const DECISION_CATEGORY_THEME: Record<string, {
  label: string;
  shortLabel: string;
  color: string;
  darkColor: string;
  description: string;
}> = {
  p_desk_reject: {
    label: "Desk Reject",
    shortLabel: "Desk Reject",
    color: "#E11D48", // rose-600
    darkColor: "#F43F5E",
    description: "Declined at editorial triage without referee review.",
  },
  p_reject_after_review: {
    label: "Reject After Review",
    shortLabel: "Reject (Post-Review)",
    color: "#EA580C", // orange-600
    darkColor: "#FB923C",
    description: "Referees identify substantive empirical or methodological limitations.",
  },
  p_major_revision: {
    label: "Major Revision",
    shortLabel: "Major Rev",
    color: "#D97706", // amber-600
    darkColor: "#FBBF24",
    description: "Substantial experimental additions or re-analysis required.",
  },
  p_minor_revision: {
    label: "Minor Revision",
    shortLabel: "Minor Rev",
    color: "#0284C7", // sky-600
    darkColor: "#38BDF8",
    description: "Clarifications, additional discussion, or textual adjustments.",
  },
  p_accept: {
    label: "Direct Accept",
    shortLabel: "Accept",
    color: "#059669", // emerald-600
    darkColor: "#34D399",
    description: "Unconditional acceptance on initial round (rare in selective venues).",
  },
};

export const DIMENSION_LABELS: Record<ScoreDimension, string> = {
  originality: "Originality & Novelty",
  broad_interest: "Broad Subject Interest",
  claims_vs_evidence: "Claims vs Evidence",
  methodology: "Methodological Rigor",
  clarity: "Presentation & Clarity",
  prior_work: "Prior Work Context",
};

export const DIMENSION_AXES: ScoreDimension[] = [
  "originality",
  "broad_interest",
  "claims_vs_evidence",
  "methodology",
  "clarity",
  "prior_work",
];

/**
 * Calculates (x, y) coordinates for a regular polygon vertex on a radar chart.
 * Center is (cx, cy), radius is r, vertex index is i out of total N.
 * Starts at 12 o'clock (-pi/2) and goes clockwise.
 */
export function getRadarVertexCoordinate(
  cx: number,
  cy: number,
  r: number,
  index: number,
  total: number = 6
): { x: number; y: number } {
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
  return {
    x: Number((cx + r * Math.cos(angle)).toFixed(2)),
    y: Number((cy + r * Math.sin(angle)).toFixed(2)),
  };
}

/**
 * Generates an SVG polygon points string for an array of coordinates.
 */
export function formatPolygonPoints(points: { x: number; y: number }[]): string {
  return points.map((p) => `${p.x},${p.y}`).join(" ");
}

/**
 * Generates static, standalone SVG markup for a 6-Dimension Radar Chart
 * suitable for embedding in HTML or Word export files.
 */
export function renderStaticRadarSvg(
  dimensions: Record<string, { score: number; label?: string }>,
  options: { size?: number; isDarkMode?: boolean } = {}
): string {
  const size = options.size || 340;
  const cx = size / 2;
  const cy = size / 2;
  const maxRadius = size * 0.38;

  const bgGrid = options.isDarkMode ? "#334155" : "#E2E8F0";
  const axisColor = options.isDarkMode ? "#475569" : "#CBD5E1";
  const textColor = options.isDarkMode ? "#94A3B8" : "#475569";
  const polyFill = options.isDarkMode ? "rgba(96, 165, 250, 0.35)" : "rgba(37, 99, 235, 0.25)";
  const polyStroke = options.isDarkMode ? "#60A5FA" : "#2563EB";

  // Concentric guideline rings (1 to 5)
  const gridRings = [1, 2, 3, 4, 5]
    .map((step) => {
      const r = (maxRadius * step) / 5;
      const pts = DIMENSION_AXES.map((_, i) => getRadarVertexCoordinate(cx, cy, r, i));
      return `<polygon points="${formatPolygonPoints(pts)}" fill="none" stroke="${bgGrid}" stroke-width="1" stroke-dasharray="${step === 5 ? 'none' : '2,2'}" />`;
    })
    .join("\n");

  // Radial axes
  const axisLines = DIMENSION_AXES.map((dim, i) => {
    const end = getRadarVertexCoordinate(cx, cy, maxRadius, i);
    const labelCoord = getRadarVertexCoordinate(cx, cy, maxRadius + 18, i);
    const label = dimensions[dim]?.label || DIMENSION_LABELS[dim] || dim;
    const scoreVal = dimensions[dim]?.score || 3;
    const anchor =
      labelCoord.x > cx + 10 ? "start" : labelCoord.x < cx - 10 ? "end" : "middle";
    return `
      <line x1="${cx}" y1="${cy}" x2="${end.x}" y2="${end.y}" stroke="${axisColor}" stroke-width="1" />
      <text x="${labelCoord.x}" y="${labelCoord.y + 4}" fill="${textColor}" font-size="9" font-family="system-ui, sans-serif" font-weight="600" text-anchor="${anchor}">
        ${label} (${scoreVal}/5)
      </text>
    `;
  }).join("\n");

  // Manuscript score polygon
  const scorePoints = DIMENSION_AXES.map((dim, i) => {
    const rawScore = dimensions[dim]?.score ?? 3;
    const clamped = Math.max(1, Math.min(5, rawScore));
    const r = (maxRadius * clamped) / 5;
    return getRadarVertexCoordinate(cx, cy, r, i);
  });

  const polyMarkup = `<polygon points="${formatPolygonPoints(scorePoints)}" fill="${polyFill}" stroke="${polyStroke}" stroke-width="2.5" />`;

  // Vertex points
  const vertexDots = scorePoints
    .map(
      (p) =>
        `<circle cx="${p.x}" cy="${p.y}" r="4" fill="${polyStroke}" stroke="#FFFFFF" stroke-width="1.5" />`
    )
    .join("\n");

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="6-Dimension Pre-Submission Evaluation Radar Chart">
      ${gridRings}
      ${axisLines}
      ${polyMarkup}
      ${vertexDots}
    </svg>
  `;
}
