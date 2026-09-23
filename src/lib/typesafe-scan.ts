/**
 * TypeSafe Scan Compatibility Bridge
 *
 * Re-exports the Laya on-device decision scan engine.
 * Maintains 100% backward compatibility for existing consumers
 * (DesktopTypeSafeScanView, DesktopTypeSafeDashboardView, ScanContext).
 */

export * from "./laya/laya-scan";
export { runTypeSafeScan as default } from "./laya/laya-scan";
