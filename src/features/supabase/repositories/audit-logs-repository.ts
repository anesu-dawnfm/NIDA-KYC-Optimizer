import { getSupabaseClient, SupabaseError } from "@/core/supabase";

import type { AuditLogRecord, SupabaseAuditLogInput } from "../types";

function unwrap<T>(data: T | null, error: { message: string } | null): T {
  if (error) {
    throw new SupabaseError("request_failed", error.message, error);
  }

  if (data === null) {
    throw new SupabaseError("record_not_found", "Supabase record not found.");
  }

  return data;
}

async function getCurrentAgentId(): Promise<string> {
  const client = getSupabaseClient();
  const { data: authData, error } = await client.auth.getUser();

  if (error) {
    throw new SupabaseError("request_failed", error.message, error);
  }

  const agentId = authData.user?.id;
  if (!agentId) {
    throw new SupabaseError(
      "client_not_configured",
      "An authenticated Supabase agent is required.",
    );
  }

  return agentId;
}

export class SupabaseAuditLogsRepository {
  async appendLog(input: SupabaseAuditLogInput): Promise<AuditLogRecord> {
    const client = getSupabaseClient();
    const actorId = input.actorId ?? (await getCurrentAgentId());

    const { data, error } = await client
      .from("audit_logs")
      .insert({
        actor_id: actorId,
        submission_id: input.submissionId ?? null,
        event_type: input.eventType,
        event_data: input.eventData ?? {},
      })
      .select("*")
      .single();

    return unwrap(data, error);
  }

  async listForSubmission(submissionId: string): Promise<AuditLogRecord[]> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from("audit_logs")
      .select("*")
      .eq("submission_id", submissionId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new SupabaseError("request_failed", error.message, error);
    }

    return data ?? [];
  }
}
