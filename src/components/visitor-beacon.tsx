import { trackVisitor } from "@/lib/visitor";

export async function VisitorBeacon() {
  try {
    await trackVisitor();
  } catch {
    /* swallow — never break the render on beacon failure */
  }
  return null;
}
