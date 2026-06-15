import type {
  AgentRole,
  AuditEventType,
  Json,
  SubmissionStatus,
  SyncEventType,
  SyncStatus,
  TableInsert,
  TableRow,
  TableUpdate,
} from "@/core/supabase";

export type AgentRecord = TableRow<"agents">;
export type KycSubmissionRecord = TableRow<"kyc_submissions">;
export type AuditLogRecord = TableRow<"audit_logs">;
export type SyncEventRecord = TableRow<"sync_events">;

export type CreateAgentInput = TableInsert<"agents">;
export type UpdateAgentInput = TableUpdate<"agents">;
export type CreateKycSubmissionInput = TableInsert<"kyc_submissions">;
export type UpdateKycSubmissionInput = TableUpdate<"kyc_submissions">;
export type CreateAuditLogInput = TableInsert<"audit_logs">;
export type CreateSyncEventInput = TableInsert<"sync_events">;
export type UpdateSyncEventInput = TableUpdate<"sync_events">;

export type SupabaseAgentUpsertInput = {
  id?: string;
  email: string;
  fullName: string;
  role?: AgentRole;
  branchCode?: string | null;
  isActive?: boolean;
};

export type SupabaseKycSubmissionUpsertInput = {
  sessionId: string;
  payload: Json;
  nidaNumber?: string | null;
  fullName?: string | null;
  dateOfBirth?: string | null;
  expiryDate?: string | null;
  submissionStatus?: SubmissionStatus;
  syncStatus?: SyncStatus;
  submittedAt?: string | null;
};

export type SupabaseAuditLogInput = {
  actorId?: string;
  submissionId?: string | null;
  eventType: AuditEventType;
  eventData?: Json;
};

export type SupabaseSyncEventInput = {
  agentId?: string;
  submissionId?: string | null;
  sessionId: string;
  deviceId?: string | null;
  eventType: SyncEventType;
  syncStatus?: SyncStatus;
  attemptCount?: number;
  lastSyncedAt?: string | null;
  payloadHash: string;
  errorMessage?: string | null;
};
