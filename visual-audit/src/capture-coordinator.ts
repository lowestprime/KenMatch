import type {
  CaptureRecord,
  DiagnosticRecord,
  RequestSecuritySummary,
} from "./types.js";

export interface CaptureProgress {
  captures: CaptureRecord[];
  diagnostics: DiagnosticRecord[];
  renderedLinks: string[];
}

export interface CaptureCommit {
  capture: CaptureRecord;
  diagnostics: DiagnosticRecord[];
  renderedLinks: string[];
  security: RequestSecuritySummary;
}

function compareDiagnostics(left: DiagnosticRecord, right: DiagnosticRecord) {
  return (left.captureKey ?? "").localeCompare(right.captureKey ?? "")
    || left.route.localeCompare(right.route)
    || left.kind.localeCompare(right.kind)
    || left.severity.localeCompare(right.severity)
    || left.message.localeCompare(right.message)
    || left.timestamp.localeCompare(right.timestamp);
}

export function sortDiagnostics(diagnostics: DiagnosticRecord[]) {
  return [...diagnostics].sort(compareDiagnostics);
}

export function newCaptureSecurityDelta(): RequestSecuritySummary {
  return {
    loginMutations: 0,
    blockedUnsafeRequests: 0,
    successfulUnsafeRequests: 0,
    blockedCrossOriginRequests: 0,
    allowedCrossOriginRequests: 0,
    telemetrySuppressed: true,
    inventoryRequests: 0,
  };
}

function mergeSecurity(target: RequestSecuritySummary, delta: RequestSecuritySummary) {
  target.loginMutations += delta.loginMutations;
  target.blockedUnsafeRequests += delta.blockedUnsafeRequests;
  target.successfulUnsafeRequests += delta.successfulUnsafeRequests;
  target.blockedCrossOriginRequests += delta.blockedCrossOriginRequests;
  target.allowedCrossOriginRequests += delta.allowedCrossOriginRequests;
  target.telemetrySuppressed = target.telemetrySuppressed && delta.telemetrySuppressed;
  target.inventoryRequests += delta.inventoryRequests;
}

class SerializedTaskQueue {
  private tail: Promise<void> = Promise.resolve();
  private failure: unknown = null;
  private failed = false;

  enqueue(task: () => void | Promise<void>) {
    const operation = this.tail.then(async () => {
      if (this.failed) throw this.failure;
      await task();
    });
    this.tail = operation.catch((error) => {
      if (!this.failed) {
        this.failed = true;
        this.failure = error;
      }
    });
    return operation;
  }

  async drain() {
    await this.tail;
    if (this.failed) throw this.failure;
  }
}

export class CaptureCoordinator {
  private readonly captures = new Map<string, CaptureRecord>();
  private readonly diagnostics: DiagnosticRecord[];
  private readonly renderedLinks: Set<string>;
  private readonly queue = new SerializedTaskQueue();

  constructor(private readonly input: {
    security: RequestSecuritySummary;
    existingCaptures?: CaptureRecord[] | undefined;
    existingDiagnostics?: DiagnosticRecord[] | undefined;
    existingRenderedLinks?: string[] | undefined;
    onProgress?: ((progress: CaptureProgress) => void | Promise<void>) | undefined;
  }) {
    for (const capture of input.existingCaptures ?? []) {
      if (this.captures.has(capture.key)) {
        throw new Error(`Duplicate existing capture key ${capture.key}.`);
      }
      this.captures.set(capture.key, capture);
    }
    this.diagnostics = (input.existingDiagnostics ?? [])
      .filter((diagnostic) => diagnostic.kind !== "duplicate");
    this.renderedLinks = new Set(input.existingRenderedLinks ?? []);
  }

  hasCapture(key: string) {
    return this.captures.has(key);
  }

  commit(batch: CaptureCommit) {
    return this.queue.enqueue(async () => {
      if (this.captures.has(batch.capture.key)) {
        throw new Error(`Duplicate capture key ${batch.capture.key}.`);
      }
      this.captures.set(batch.capture.key, batch.capture);
      this.diagnostics.push(...batch.diagnostics);
      batch.renderedLinks.forEach((link) => this.renderedLinks.add(link));
      mergeSecurity(this.input.security, batch.security);
      await this.input.onProgress?.(this.snapshot());
    });
  }

  snapshot(): CaptureProgress {
    return {
      captures: [...this.captures.values()].sort((left, right) => left.key.localeCompare(right.key)),
      diagnostics: sortDiagnostics(this.diagnostics),
      renderedLinks: [...this.renderedLinks].sort((left, right) => left.localeCompare(right)),
    };
  }

  async drain() {
    await this.queue.drain();
    return this.snapshot();
  }
}

export async function runBounded<T>(input: {
  items: T[];
  limit: number;
  worker: (item: T, index: number, signal: AbortSignal) => void | Promise<void>;
  signal?: AbortSignal | undefined;
}) {
  if (!Number.isSafeInteger(input.limit) || input.limit < 1) {
    throw new Error(`Worker limit must be a positive integer; received ${input.limit}.`);
  }
  if (input.items.length === 0) {
    if (input.signal?.aborted) throw input.signal.reason ?? new Error("Capture execution cancelled.");
    return;
  }

  const controller = new AbortController();
  const failures: Array<{ index: number; error: unknown }> = [];
  let cursor = 0;
  const stop = (reason?: unknown) => {
    if (!controller.signal.aborted) controller.abort(reason);
  };
  const onAbort = () => stop(input.signal?.reason ?? new Error("Capture execution cancelled."));
  if (input.signal?.aborted) onAbort();
  else input.signal?.addEventListener("abort", onAbort, { once: true });

  const loop = async () => {
    while (!controller.signal.aborted) {
      const index = cursor;
      cursor += 1;
      if (index >= input.items.length) return;
      try {
        await input.worker(input.items[index]!, index, controller.signal);
      } catch (error) {
        failures.push({ index, error });
        stop(error);
      }
    }
  };

  try {
    const workerCount = Math.min(input.limit, input.items.length);
    await Promise.all(Array.from({ length: workerCount }, () => loop()));
  } finally {
    input.signal?.removeEventListener("abort", onAbort);
  }

  if (failures.length > 0) {
    failures.sort((left, right) => left.index - right.index);
    throw failures[0]!.error;
  }
  if (input.signal?.aborted) {
    throw input.signal.reason ?? new Error("Capture execution cancelled.");
  }
}
