import { getSupabaseClient, SupabaseError } from "@/core/supabase";

import type {
  SyncEventRecord,
  SupabaseSyncEventInput,
  UpdateSyncEventInput,
} from "../types";

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

export class SupabaseSyncEventsRepository {
  async recordEvent(input: SupabaseSyncEventInput): Promise<SyncEventRecord> {
    const client = getSupabaseClient();
    const agentId = input.agentId ?? (await getCurrentAgentId());

    const { data, error } = await client
      .from("sync_events")
      .insert({
        agent_id: agentId,
        submission_id: input.submissionId ?? null,
        session_id: input.sessionId,
        device_id: input.deviceId ?? null,
        event_type: input.eventType,
        sync_status: input.syncStatus ?? "pending",
        attempt_count: input.attemptCount ?? 0,
        last_synced_at: input.lastSyncedAt ?? null,
        payload_hash: input.payloadHash,
        error_message: input.errorMessage ?? null,
      })
      .select("*")
      .single();

    return unwrap(data, error);
  }

  async listForCurrentAgent(): Promise<SyncEventRecord[]> {
    const client = getSupabaseClient();
    const agentId = await getCurrentAgentId();
    const { data, error } = await client
      .from("sync_events")
      .select("*")
      .eq("agent_id", agentId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new SupabaseError("request_failed", error.message, error);
    }

    return data ?? [];
  }

  async updateEvent(
    id: string,
    update: UpdateSyncEventInput,
  ): Promise<SyncEventRecord> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from("sync_events")
      .update(update)
      .eq("id", id)
      .select("*")
      .single();

    return unwrap(data, error);
  }
}
