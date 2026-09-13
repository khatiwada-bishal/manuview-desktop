/**
 * Diagnostic Engine Facade
 * 
 * Re-exports modular diagnostic sub-systems for 100% backward compatibility:
 * - Engine Types & Limits: ./engine/types
 * - Shared Utilities: ./engine/shared-utils
 * - Citation Audit: ./engine/citation-audit
 * - Scope Triage & Target Journals: ./engine/scope-triage-journals
 * - Scoring Dimensions: ./engine/scoring-dimensions
 * - Priority Action Items: ./engine/priority-action-items
 * - 5 Persona Review Panel: ./engine/persona-review
 * - Main Diagnostic Orchestrator: ./engine/diagnostic-orchestrator
 */

export * from "./engine/types";
export * from "./engine/shared-utils";
export * from "./engine/citation-audit";
export * from "./engine/scope-triage-journals";
export * from "./engine/scoring-dimensions";
export * from "./engine/priority-action-items";
export * from "./engine/persona-review";
export * from "./engine/diagnostic-orchestrator";
export { sanitizeAuthorText, sanitizeErrorMessage } from "./llm";
