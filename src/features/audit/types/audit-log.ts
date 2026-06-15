import type { AuditEventType, Json } from "@/core/supabase";

export type AuditEventInput = {
  eventType: AuditEventType;
  submissionId?: string | null;
  eventData?: Json;
};

export type ScanLifecycleAuditInput = {
  sessionId: string;
  imageUri?: string | null;
};

export type ValidationAuditInput = {
  sessionId: string;
  confidence: number;
  validationStatus: "VALID" | "WARNING" | "INVALID";
  issues: {
    code: string;
    field: string;
    message: string;
  }[];
};

export type SyncAuditInput = {
  sessionId: string;
  submissionId?: string | null;
  status: "queued" | "started" | "completed" | "failed" | "retry_scheduled";
  payloadHash?: string;
  queueCount?: number;
  attemptCount?: number;
  errorMessage?: string | null;
  syncedAt?: string | null;
};
