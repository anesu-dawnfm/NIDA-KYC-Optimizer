import { createPayloadFingerprint } from "@/features/sync/services/sync-fingerprint";
import { SupabaseError } from "@/core/supabase";
import type { Json } from "@/core/supabase";
import { SupabaseKycSubmissionsRepository } from "@/features/supabase/repositories/kyc-submissions-repository";
import { SupabaseSyncEventsRepository } from "@/features/supabase/repositories/sync-events-repository";
import type { SyncTransportPayload } from "@/features/sync/types/sync";

import type {
  SyncTransport,
  SyncTransportResult,
} from "@/features/sync/services/sync-transport";

function toSubmissionStatus(syncStatus: SyncTransportPayload["syncStatus"]) {
  if (syncStatus === "synced") {
    return "synced";
  }

  if (syncStatus === "failed") {
    return "failed";
  }

  return "submitted";
}

export const supabaseSyncTransport: SyncTransport = {
  async submitSession(
    payload: SyncTransportPayload,
  ): Promise<SyncTransportResult> {
    const submissionsRepository = new SupabaseKycSubmissionsRepository();
    const syncEventsRepository = new SupabaseSyncEventsRepository();

    try {
      const payloadHash = await createPayloadFingerprint(payload.payload);
      const submission = await submissionsRepository.upsertSubmission({
        sessionId: payload.sessionId,
        payload: payload.payload as Json,
        submissionStatus: toSubmissionStatus(payload.syncStatus),
        syncStatus: "synced",
        submittedAt: payload.timestamp,
      });

      await syncEventsRepository.recordEvent({
        eventType: "synced",
        payloadHash,
        sessionId: payload.sessionId,
        submissionId: submission.id,
        syncStatus: "synced",
        attemptCount: 1,
        lastSyncedAt: payload.timestamp,
      });

      return { submissionId: submission.id };
    } catch (cause) {
      throw new SupabaseError(
        "request_failed",
        "Failed to persist submission to Supabase.",
        cause,
      );
    }
  },
};
