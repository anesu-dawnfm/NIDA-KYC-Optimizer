import { ApiError } from "@/core/api";
import { auditLogService } from "@/features/audit";
import {
  type CreateEncryptedSessionInput,
  type PersistedEncryptedSession,
  type SessionStorageRepository,
  SQLiteSessionStorageRepository,
} from "@/features/storage";
import { reportError } from "@/core/utils/report-error";
import { useSyncStore } from "@/features/sync/store/use-sync-store";
import type {
  SyncRunSummary,
  SyncSubmissionOptions,
  SyncSubmissionResult,
} from "@/features/sync/types/sync";
import { calculateRetryTimestamp } from "@/features/sync/services/sync-backoff";
import { createPayloadFingerprint } from "@/features/sync/services/sync-fingerprint";
import {
  apiSyncTransport,
  type SyncTransport,
} from "@/features/sync/services/sync-transport";

export type OfflineFirstSyncQueueManagerDependencies = {
  repository?: SessionStorageRepository;
  transport?: SyncTransport;
  now?: () => Date;
  scheduler?: (callback: () => void, delayMs: number) => any;
  clearScheduler?: (timer: any) => void;
};

export class OfflineFirstSyncQueueManager {
  private readonly repository: SessionStorageRepository;
  private readonly transport: SyncTransport;
  private readonly now: () => Date;
  private readonly scheduler: (
    callback: () => void,
    delayMs: number,
  ) => any;
  private readonly clearScheduler: (timer: any) => void;
  private syncPromise: Promise<SyncRunSummary> | null = null;
  private retryTimer: any = null;

  constructor({
    repository = new SQLiteSessionStorageRepository(),
    transport = apiSyncTransport,
    now = () => new Date(),
    scheduler = (callback, delayMs) => setTimeout(callback, delayMs),
    clearScheduler = (timer) => clearTimeout(timer),
  }: OfflineFirstSyncQueueManagerDependencies = {}) {
    this.repository = repository;
    this.transport = transport;
    this.now = now;
    this.scheduler = scheduler;
    this.clearScheduler = clearScheduler;
  }

  async hydrateQueueCount(): Promise<number> {
    const queueCount = await this.calculateQueueCount();
    useSyncStore.getState().setQueueCount(queueCount);

    return queueCount;
  }

  async enqueueSubmission<TPayload>(
    payload: TPayload,
    options: SyncSubmissionOptions = {},
  ): Promise<SyncSubmissionResult> {
    const dedupeKey = options.dedupeKey ?? (await createPayloadFingerprint(payload));
    const existing =
      (await this.repository.findByDedupeKey(dedupeKey)) ??
      (options.sessionId ? await this.repository.findBySessionId(options.sessionId) : null);

    if (existing) {
      await this.hydrateQueueCount();
      return {
        record: existing,
        dedupeKey,
        queued: false,
      };
    }

    const record = await this.repository.create({
      dedupeKey,
      payload,
      syncStatus: "pending",
      timestamp: options.timestamp ?? this.now().toISOString(),
      ...(options.sessionId ? { sessionId: options.sessionId } : {}),
    } satisfies CreateEncryptedSessionInput);

    useSyncStore.getState().incrementQueueCount();
    void auditLogService.logSyncEvent({
      sessionId: record.sessionId,
      status: "queued",
      payloadHash: dedupeKey,
      queueCount: useSyncStore.getState().queueCount,
    });

    return {
      record,
      dedupeKey,
      queued: true,
    };
  }

  async syncPending(): Promise<SyncRunSummary> {
    if (this.syncPromise) {
      return this.syncPromise;
    }

    this.syncPromise = this.runSync();

    try {
      return await this.syncPromise;
    } finally {
      this.syncPromise = null;
    }
  }

  private async runSync(): Promise<SyncRunSummary> {
    const syncState = useSyncStore.getState();

    if (!syncState.isOnline) {
      const queueCount = await this.hydrateQueueCount();
      return {
        syncedCount: 0,
        failedCount: 0,
        totalCount: queueCount,
        queueCount,
        nextRetryAt: syncState.nextRetryAt,
      };
    }

    this.clearRetryTimer();
    useSyncStore.getState().setSyncing(true);
    void auditLogService.logSyncEvent({
      sessionId: "sync-run",
      status: "started",
      queueCount: await this.calculateQueueCount(),
    });

    const queue = await this.loadQueue();
    let syncedCount = 0;
    let failedCount = 0;

    try {
      for (const record of queue) {
        const payload = await this.repository.hydratePayload<unknown>(record);

        try {
          const transportResult = await this.transport.submitSession({
            dedupeKey: record.dedupeKey,
            payload,
            sessionId: record.sessionId,
            syncStatus: record.syncStatus,
            timestamp: record.timestamp,
          });
          await this.repository.updateSyncStatus(record.sessionId, "synced");
          syncedCount += 1;
          void auditLogService.logSyncEvent({
            sessionId: record.sessionId,
            submissionId: transportResult.submissionId ?? null,
            status: "completed",
            payloadHash: record.dedupeKey ?? record.sessionId,
            attemptCount: 1,
            syncedAt: this.now().toISOString(),
          });
        } catch (cause) {
          if (cause instanceof ApiError && cause.code === "conflict") {
            await this.repository.updateSyncStatus(record.sessionId, "synced");
            syncedCount += 1;
            void auditLogService.logSyncEvent({
              sessionId: record.sessionId,
              status: "completed",
              payloadHash: record.dedupeKey ?? record.sessionId,
              attemptCount: 1,
              syncedAt: this.now().toISOString(),
            });
            continue;
          }

          await this.repository.updateSyncStatus(record.sessionId, "failed");
          failedCount += 1;
          void auditLogService.logSyncEvent({
            sessionId: record.sessionId,
            status: "failed",
            payloadHash: record.dedupeKey ?? record.sessionId,
            attemptCount: useSyncStore.getState().retryAttempt + 1,
            errorMessage: cause instanceof Error ? cause.message : "Sync failed.",
          });

          if (this.shouldRetry(cause)) {
            this.scheduleRetry(cause);
          } else {
            this.markPermanentFailure(cause);
          }

          break;
        }
      }
    } finally {
      const queueCount = await this.hydrateQueueCount();
      useSyncStore.getState().setSyncing(false);

      if (queueCount === 0 && failedCount === 0) {
        useSyncStore.getState().clearRetryState();
        useSyncStore.getState().setLastSyncedAt(this.now().toISOString());
      }
    }

    const queueCount = await this.calculateQueueCount();
    useSyncStore.getState().setQueueCount(queueCount);

    return {
      syncedCount,
      failedCount,
      totalCount: queue.length,
      queueCount,
      nextRetryAt: useSyncStore.getState().nextRetryAt,
    };
  }

  private async loadQueue(): Promise<PersistedEncryptedSession[]> {
    const records = await this.repository.list();

    return records
      .filter((record) => record.syncStatus !== "synced")
      .sort((left, right) => {
        if (left.timestamp === right.timestamp) {
          return left.sessionId.localeCompare(right.sessionId);
        }

        return left.timestamp.localeCompare(right.timestamp);
      });
  }

  private async calculateQueueCount(): Promise<number> {
    const queue = await this.loadQueue();
    return queue.length;
  }

  private scheduleRetry(cause: unknown): void {
    const syncState = useSyncStore.getState();
    const attempt = syncState.retryAttempt + 1;
    const nextRetryAt = calculateRetryTimestamp(attempt, this.now().getTime());

    useSyncStore.getState().setRetryState({
      attempt,
      lastSyncError: cause instanceof Error ? cause.message : "Sync failed.",
      nextRetryAt,
    });
    void auditLogService.logSyncEvent({
      sessionId: "sync-run",
      status: "retry_scheduled",
      attemptCount: attempt,
      errorMessage: cause instanceof Error ? cause.message : "Sync failed.",
      syncedAt: nextRetryAt,
    });

    this.clearRetryTimer();
    const delayMs = new Date(nextRetryAt).getTime() - this.now().getTime();

    this.retryTimer = this.scheduler(() => {
      void this.syncPending().catch((error) => {
        reportError(error, { scope: "offline-sync-retry" });
      });
    }, Math.max(0, delayMs));
  }

  private markPermanentFailure(cause: unknown): void {
    useSyncStore.getState().setRetryState({
      attempt: useSyncStore.getState().retryAttempt,
      lastSyncError: cause instanceof Error ? cause.message : "Sync failed.",
      nextRetryAt: null,
    });
  }

  private shouldRetry(cause: unknown): boolean {
    if (cause instanceof ApiError) {
      return (
        cause.code === "network_error" ||
        cause.code === "request_timeout" ||
        cause.code === "server_error" ||
        cause.code === "unknown_error"
      );
    }

    return true;
  }

  private clearRetryTimer(): void {
    if (!this.retryTimer) {
      return;
    }

    this.clearScheduler(this.retryTimer);
    this.retryTimer = null;
  }
}

export const offlineFirstSyncQueueManager = new OfflineFirstSyncQueueManager();
