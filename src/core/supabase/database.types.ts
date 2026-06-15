export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AgentRole = "agent" | "supervisor" | "admin";
export type SubmissionStatus =
  | "draft"
  | "queued"
  | "submitted"
  | "synced"
  | "rejected"
  | "failed";
export type AuditEventType =
  | "created"
  | "updated"
  | "submitted"
  | "synced"
  | "retry_scheduled"
  | "rejected"
  | "deleted";
export type SyncEventType = "queued" | "retry" | "synced" | "failed";
export type SyncStatus = "pending" | "synced" | "failed";

export interface Database {
  public: {
    Tables: {
      agents: {
        Row: {
          branch_code: string | null;
          created_at: string;
          email: string;
          full_name: string;
          id: string;
          is_active: boolean;
          role: AgentRole;
          updated_at: string;
        };
        Insert: {
          branch_code?: string | null;
          created_at?: string;
          email: string;
          full_name: string;
          id: string;
          is_active?: boolean;
          role?: AgentRole;
          updated_at?: string;
        };
        Update: {
          branch_code?: string | null;
          created_at?: string;
          email?: string;
          full_name?: string;
          id?: string;
          is_active?: boolean;
          role?: AgentRole;
          updated_at?: string;
        };
        Relationships: [];
      };
      kyc_submissions: {
        Row: {
          agent_id: string;
          created_at: string;
          date_of_birth: string | null;
          expiry_date: string | null;
          full_name: string | null;
          id: string;
          payload: Json;
          session_id: string;
          submission_status: SubmissionStatus;
          sync_status: SyncStatus;
          nida_number: string | null;
          submitted_at: string | null;
          updated_at: string;
        };
        Insert: {
          agent_id: string;
          created_at?: string;
          date_of_birth?: string | null;
          expiry_date?: string | null;
          full_name?: string | null;
          id?: string;
          payload: Json;
          session_id: string;
          submission_status?: SubmissionStatus;
          sync_status?: SyncStatus;
          nida_number?: string | null;
          submitted_at?: string | null;
          updated_at?: string;
        };
        Update: {
          agent_id?: string;
          created_at?: string;
          date_of_birth?: string | null;
          expiry_date?: string | null;
          full_name?: string | null;
          id?: string;
          payload?: Json;
          session_id?: string;
          submission_status?: SubmissionStatus;
          sync_status?: SyncStatus;
          nida_number?: string | null;
          submitted_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          actor_id: string;
          created_at: string;
          event_data: Json;
          event_type: AuditEventType;
          id: string;
          submission_id: string | null;
        };
        Insert: {
          actor_id: string;
          created_at?: string;
          event_data?: Json;
          event_type: AuditEventType;
          id?: string;
          submission_id?: string | null;
        };
        Update: {
          actor_id?: string;
          created_at?: string;
          event_data?: Json;
          event_type?: AuditEventType;
          id?: string;
          submission_id?: string | null;
        };
        Relationships: [];
      };
      sync_events: {
        Row: {
          agent_id: string;
          attempt_count: number;
          created_at: string;
          device_id: string | null;
          error_message: string | null;
          event_type: SyncEventType;
          id: string;
          last_synced_at: string | null;
          payload_hash: string;
          session_id: string;
          submission_id: string | null;
          sync_status: SyncStatus;
        };
        Insert: {
          agent_id: string;
          attempt_count?: number;
          created_at?: string;
          device_id?: string | null;
          error_message?: string | null;
          event_type: SyncEventType;
          id?: string;
          last_synced_at?: string | null;
          payload_hash: string;
          session_id: string;
          submission_id?: string | null;
          sync_status?: SyncStatus;
        };
        Update: {
          agent_id?: string;
          attempt_count?: number;
          created_at?: string;
          device_id?: string | null;
          error_message?: string | null;
          event_type?: SyncEventType;
          id?: string;
          last_synced_at?: string | null;
          payload_hash?: string;
          session_id?: string;
          submission_id?: string | null;
          sync_status?: SyncStatus;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type TableRow<TableName extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][TableName]["Row"];
export type TableInsert<TableName extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][TableName]["Insert"];
export type TableUpdate<TableName extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][TableName]["Update"];
