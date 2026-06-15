import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuditLogService } from "@/features/audit";
import type { AuditEventInput } from "@/features/audit";

class MemoryAuditRepository {
  public readonly events: AuditEventInput[] = [];

  async appendLog(input: AuditEventInput): Promise<void> {
    this.events.push(input);
  }
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("AuditLogService", () => {
  it("maps lifecycle events to immutable audit log entries", async () => {
    const repository = new MemoryAuditRepository();
    const service = new AuditLogService(repository, true);

    await service.logScanStarted({
      sessionId: "session-1",
      imageUri: null,
    });
    await service.logValidationCompleted({
      sessionId: "session-1",
      confidence: 0.91,
      validationStatus: "VALID",
      issues: [],
    });
    await service.logSyncEvent({
      sessionId: "session-1",
      status: "completed",
      payloadHash: "hash-1",
      attemptCount: 1,
      syncedAt: "2026-06-15T12:00:00.000Z",
    });

    expect(repository.events).toHaveLength(3);
    expect(repository.events[0]?.eventType).toBe("scan_started");
    expect(repository.events[1]?.eventType).toBe("validation_completed");
    expect(repository.events[2]?.eventType).toBe("sync_completed");
  });

  it("does not append events when disabled", async () => {
    const repository = new MemoryAuditRepository();
    const service = new AuditLogService(repository, false);

    await service.logScanStarted({
      sessionId: "session-1",
      imageUri: null,
    });

    expect(repository.events).toHaveLength(0);
  });
});
