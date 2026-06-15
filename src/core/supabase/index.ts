export { SupabaseAuthBridge } from "./supabase-auth-bridge";
export {
  getSupabaseClient,
  getSupabaseClientOrNull,
  isSupabaseConfigured,
} from "./supabase-client";
export { SupabaseError, type SupabaseErrorCode } from "./supabase-error";
export { supabaseStorage } from "./secure-storage";
export type {
  AgentRole,
  AuditEventType,
  Database,
  Json,
  SubmissionStatus,
  SyncEventType,
  SyncStatus,
  TableInsert,
  TableRow,
  TableUpdate,
} from "./database.types";
