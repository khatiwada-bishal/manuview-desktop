import test from "node:test";
import assert from "node:assert/strict";
import { sanitizeErrorMessage } from "../src/lib/llm.ts";

test("sanitizeErrorMessage safely handles strings and redacts sensitive credentials", () => {
  const textWithKey = "Request failed: https://api.example.com/v1?key=AIzaSy1234567890abcdef1234567890abcdef";
  const sanitized = sanitizeErrorMessage(textWithKey);
  assert.equal(sanitized.includes("AIzaSy"), false);
  assert.equal(sanitized.includes("[REDACTED]"), true);
});

test("sanitizeErrorMessage safely handles Error instances", () => {
  const err = new Error("Bearer sk-ant-123456789012345678901234567890 failed");
  const sanitized = sanitizeErrorMessage(err);
  assert.equal(sanitized.includes("sk-ant-"), false);
  assert.equal(sanitized.includes("[REDACTED]"), true);
});

test("sanitizeErrorMessage safely handles validation error arrays without throwing msg.replace is not a function", () => {
  const pydanticDetail = [
    { loc: ["body", "questions", "is_academic"], msg: "field required", type: "value_error.missing" },
    { loc: ["body", "model"], msg: "invalid choice", type: "value_error" },
  ];
  // Must NOT throw: msg.replace is not a function
  assert.doesNotThrow(() => {
    const sanitized = sanitizeErrorMessage(pydanticDetail);
    assert.equal(typeof sanitized, "string");
    assert.equal(sanitized.includes("field required"), true);
  });
});

test("sanitizeErrorMessage safely handles objects, null, undefined, and primitives", () => {
  assert.equal(sanitizeErrorMessage(undefined), "");
  assert.equal(sanitizeErrorMessage(null), "");
  assert.equal(sanitizeErrorMessage(123), "123");
  assert.doesNotThrow(() => {
    const res = sanitizeErrorMessage({ error: { message: "Internal server error" } });
    assert.equal(typeof res, "string");
    assert.equal(res.includes("Internal server error"), true);
  });
});
