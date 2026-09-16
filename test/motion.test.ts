import test from "node:test";
import assert from "node:assert/strict";
import { DURATION, EASING } from "../src/lib/motion.ts";

test("Motion Tokens: DURATION constants are strictly calibrated for 60fps UX", () => {
  assert.equal(typeof DURATION.instant, "number");
  assert.equal(typeof DURATION.fast, "number");
  assert.equal(typeof DURATION.base, "number");
  assert.equal(typeof DURATION.slow, "number");
  assert.equal(typeof DURATION.ambient, "number");

  assert.equal(DURATION.instant, 100);
  assert.equal(DURATION.fast, 150);
  assert.equal(DURATION.base, 220);
  assert.equal(DURATION.slow, 320);
  assert.equal(DURATION.ambient, 600);

  // Strictly ascending order
  assert.ok(DURATION.instant < DURATION.fast);
  assert.ok(DURATION.fast < DURATION.base);
  assert.ok(DURATION.base < DURATION.slow);
  assert.ok(DURATION.slow < DURATION.ambient);
});

test("Motion Tokens: EASING curves match cubic-bezier specifications", () => {
  assert.ok(EASING.standard.startsWith("cubic-bezier"));
  assert.ok(EASING.decelerate.startsWith("cubic-bezier"));
  assert.ok(EASING.spring.startsWith("cubic-bezier"));

  assert.equal(EASING.standard, "cubic-bezier(0.2, 0, 0, 1)");
  assert.equal(EASING.decelerate, "cubic-bezier(0, 0, 0, 1)");
  assert.equal(EASING.spring, "cubic-bezier(0.34, 1.45, 0.64, 1)");
});

test("Motion: Ease-out cubic calculation satisfies boundary conditions", () => {
  // easeOutCubic: 1 - Math.pow(1 - progress, 3)
  const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);

  assert.equal(easeOutCubic(0), 0);
  assert.equal(easeOutCubic(1), 1);
  assert.ok(easeOutCubic(0.5) > 0.5, "Ease out curve must lead linear progress at halfway");
  assert.equal(Math.round(easeOutCubic(0.5) * 1000) / 1000, 0.875);
});
