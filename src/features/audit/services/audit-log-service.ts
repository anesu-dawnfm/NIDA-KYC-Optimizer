import { env } from "@/core/config/env";
import { reportError } from "@/core/utils/report-error";

import type {
  AuditEventInput,
  ScanLifecycleAuditInput,
  SyncAuditInput,
  ValidationAuditInput,
} from "@/features/audit/types/audit-log";

export class AuditLogService {
  private readonly repository: AuditLogRepositoryLike | null;
  private readonly enabled: boolean;

  constructor(
    repository: AuditLogRepositoryLike | null = null,
    enabled: boolean = env.hasSupabaseConfig,
  ) {
    this.repository = repository;
    this.enabled = enabled;
  }

  async logScanStarted(input: ScanLifecycleAuditInput): Promise<void> {
    await this.append({
      eventType: "scan_started",
      eventData: {
        imageUri: input.imageUri ?? null,
        sessionId: input.sessionId,
      },
    });
  }

  async logScanCompleted(input: {
    sessionId: string;
    durationMs: number;
    blocksRecognized: number;
    charactersRecognized: number;
    outcome: "success" | "failed";
    errorMessage?: string | null;
  }): Promise<void> {
    await this.append({
      eventType: "scan_completed",
      eventData: {
        sessionId: input.sessionId,
        durationMs: input.durationMs,
        blocksRecognized: input.blocksRecognized,
        charactersRecognized: input.charactersRecognized,
        outcome: input.outcome,
        errorMessage: input.errorMessage ?? null,
      },
    });
  }

  async logValidationCompleted(input: ValidationAuditInput): Promise<void> {
    await this.append({
      eventType: "validation_completed",
      eventData: {
        sessionId: input.sessionId,
        confidence: input.confidence,
        validationStatus: input.validationStatus,
        issues: input.issues,
      },
    });
  }

  async logSyncEvent(input: SyncAuditInput): Promise<void> {
    const eventType =
      input.status === "queued"
        ? "sync_queued"
        : input.status === "started"
          ? "sync_started"
          : input.status === "completed"
            ? "sync_completed"
            : input.status === "retry_scheduled"
              ? "sync_retry_scheduled"
              : "sync_failed";

    await this.append({
      eventType,
      submissionId: input.submissionId ?? null,
      eventData: {
        sessionId: input.sessionId,
        payloadHash: input.payloadHash ?? null,
        queueCount: input.queueCount ?? null,
        attemptCount: input.attemptCount ?? null,
        errorMessage: input.errorMessage ?? null,
        syncedAt: input.syncedAt ?? null,
      },
    });
  }

  async logCustomEvent(input: AuditEventInput): Promise<void> {
    await this.append(input);
  }

  private async append(input: AuditEventInput): Promise<void> {
    if (!this.enabled) {
      return;
    }

    try {
      const repository = this.repository ?? (await this.loadRepository());
      await repository.appendLog(input);
    } catch (cause) {
      reportError(cause, {
        scope: "audit-log",
        eventType: input.eventType,
      });
    }
  }

  private async loadRepository(): Promise<AuditLogRepositoryLike> {
    const { SupabaseAuditLogsRepository } = await import(
      "@/features/supabase/repositories/audit-logs-repository"
    );

    return new SupabaseAuditLogsRepository();
  }
}

export const auditLogService = new AuditLogService();

type AuditLogRepositoryLike = {
  appendLog(input: AuditEventInput): Promise<unknown>;
};
