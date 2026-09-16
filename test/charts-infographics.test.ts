import test from "node:test";
import assert from "node:assert/strict";
import {
  READINESS_BAND_THEME,
  DECISION_CATEGORY_THEME,
  DIMENSION_AXES,
  getRadarVertexCoordinate,
  formatPolygonPoints,
  renderStaticRadarSvg,
} from "../src/lib/charts/theme.ts";
import { calculateDecisionCategoryDistribution } from "../src/lib/engine/scoring-dimensions.ts";

test("Chart Theme: Readiness bands and decision categories have complete themes", () => {
  const bands = [
    "Desk Reject Hazard",
    "Substantial Revision Needed",
    "Competitive / Moderate Readiness",
    "Strong Submission Readiness",
  ];

  for (const band of bands) {
    const theme = READINESS_BAND_THEME[band];
    assert.ok(theme, `Theme for ${band} must exist`);
    assert.ok(theme.color.startsWith("#"), `Color for ${band} must be a valid hex color`);
    assert.ok(theme.label.length > 0, `Label for ${band} must not be empty`);
    assert.ok(typeof theme.stepIndex === "number", `stepIndex for ${band} must be numeric`);
  }

  const decisionKeys = [
    "p_desk_reject",
    "p_reject_after_review",
    "p_major_revision",
    "p_minor_revision",
    "p_accept",
  ];

  for (const key of decisionKeys) {
    const theme = DECISION_CATEGORY_THEME[key];
    assert.ok(theme, `Theme for ${key} must exist`);
    assert.ok(theme.color.startsWith("#"), `Color for ${key} must be a valid hex color`);
    assert.ok(theme.label.length > 0, `Label for ${key} must not be empty`);
  }
});

test("Decision Distribution: Always sums strictly to 100% across all scenarios", () => {
  const testCases = [
    { compositeScore: 85, baselineRate: 15, isScopeMismatch: false },
    { compositeScore: 68, baselineRate: 20, isScopeMismatch: false },
    { compositeScore: 52, baselineRate: 10, isScopeMismatch: false },
    { compositeScore: 35, baselineRate: 25, isScopeMismatch: false },
    { compositeScore: 90, baselineRate: 8, isScopeMismatch: true },
    { compositeScore: 80, baselineRate: 15, isMethodsMissing: true },
    { compositeScore: 75, baselineRate: 20, hasRetraction: true },
    { compositeScore: 58, baselineRate: 12, wordCount: 4000 },
  ];

  for (const tc of testCases) {
    const dist = calculateDecisionCategoryDistribution(tc);
    const sum =
      dist.p_desk_reject +
      dist.p_reject_after_review +
      dist.p_major_revision +
      dist.p_minor_revision +
      dist.p_accept;

    assert.equal(sum, 100, `Distribution must sum to 100% for score ${tc.compositeScore}`);
    assert.ok(dist.p_desk_reject >= 0, "p_desk_reject cannot be negative");
    assert.ok(dist.p_reject_after_review >= 0, "p_reject_after_review cannot be negative");
    assert.ok(dist.p_major_revision >= 0, "p_major_revision cannot be negative");
    assert.ok(dist.p_minor_revision >= 0, "p_minor_revision cannot be negative");
    assert.ok(dist.p_accept >= 0, "p_accept cannot be negative");
  }
});

test("Radar Geometry: Calculates symmetrical regular polygon coordinates", () => {
  const cx = 170;
  const cy = 170;
  const r = 100;

  // Vertex 0 should be at 12 o'clock: x = cx, y = cy - r
  const v0 = getRadarVertexCoordinate(cx, cy, r, 0, 6);
  assert.equal(v0.x, cx);
  assert.equal(v0.y, cy - r);

  // Vertex 3 should be at 6 o'clock: x = cx, y = cy + r
  const v3 = getRadarVertexCoordinate(cx, cy, r, 3, 6);
  assert.equal(v3.x, cx);
  assert.equal(v3.y, cy + r);

  const pts = [v0, v3];
  const polyStr = formatPolygonPoints(pts);
  assert.equal(polyStr, `${v0.x},${v0.y} ${v3.x},${v3.y}`);
});

test("renderStaticRadarSvg: Emits clean standalone SVG markup for export", () => {
  const dimensions = {
    originality: { score: 4, label: "Originality" },
    broad_interest: { score: 3, label: "Broad Interest" },
    claims_vs_evidence: { score: 4, label: "Claims vs Evidence" },
    methodology: { score: 5, label: "Methodology" },
    clarity: { score: 4, label: "Clarity" },
    prior_work: { score: 3, label: "Prior Work" },
  };

  const svg = renderStaticRadarSvg(dimensions, { size: 320 });
  assert.ok(svg.includes("<svg"), "Output must contain <svg tag");
  assert.ok(svg.includes("viewBox=\"0 0 320 320\""), "viewBox must match size");
  assert.ok(svg.includes("<polygon"), "Output must contain polygon elements");
  assert.ok(svg.includes("Methodology"), "Output must contain dimension labels");
  assert.ok(svg.includes("</svg>"), "Output must properly close svg");
});
