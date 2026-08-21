import type { RequestSecuritySummary } from "./types.js";

export function restoreResumeSecurity(
  current: RequestSecuritySummary,
  persisted: RequestSecuritySummary,
) {
  // Login and inventory bounds describe this process. Capture policy totals
  // describe the durable run and must survive a resumed process.
  current.blockedUnsafeRequests = Math.max(
    current.blockedUnsafeRequests,
    persisted.blockedUnsafeRequests,
  );
  current.successfulUnsafeRequests += persisted.successfulUnsafeRequests;
  current.blockedCrossOriginRequests += persisted.blockedCrossOriginRequests;
  current.allowedCrossOriginRequests += persisted.allowedCrossOriginRequests;
  current.telemetrySuppressed = current.telemetrySuppressed && persisted.telemetrySuppressed;
}
