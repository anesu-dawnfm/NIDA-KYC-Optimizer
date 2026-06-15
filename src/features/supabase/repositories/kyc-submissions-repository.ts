import { getSupabaseClient, SupabaseError } from "@/core/supabase";

import type {
  KycSubmissionRecord,
  SupabaseKycSubmissionUpsertInput,
  UpdateKycSubmissionInput,
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

export class SupabaseKycSubmissionsRepository {
  async upsertSubmission(
    input: SupabaseKycSubmissionUpsertInput,
  ): Promise<KycSubmissionRecord> {
    const client = getSupabaseClient();
    const agentId = await getCurrentAgentId();

    const { data, error } = await client
      .from("kyc_submissions")
      .upsert(
        {
          agent_id: agentId,
          session_id: input.sessionId,
          nida_number: input.nidaNumber ?? null,
          full_name: input.fullName ?? null,
          date_of_birth: input.dateOfBirth ?? null,
          expiry_date: input.expiryDate ?? null,
          payload: input.payload,
          submission_status: input.submissionStatus ?? "queued",
          sync_status: input.syncStatus ?? "pending",
          submitted_at: input.submittedAt ?? null,
        },
        { onConflict: "session_id" },
      )
      .select("*")
      .single();

    return unwrap(data, error);
  }

  async getBySessionId(sessionId: string): Promise<KycSubmissionRecord> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from("kyc_submissions")
      .select("*")
      .eq("session_id", sessionId)
      .single();

    return unwrap(data, error);
  }

  async listForCurrentAgent(): Promise<KycSubmissionRecord[]> {
    const client = getSupabaseClient();
    const agentId = await getCurrentAgentId();
    const { data, error } = await client
      .from("kyc_submissions")
      .select("*")
      .eq("agent_id", agentId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new SupabaseError("request_failed", error.message, error);
    }

    return data ?? [];
  }

  async updateSubmissionStatus(
    sessionId: string,
    update: UpdateKycSubmissionInput,
  ): Promise<KycSubmissionRecord> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from("kyc_submissions")
      .update(update)
      .eq("session_id", sessionId)
      .select("*")
      .single();

    return unwrap(data, error);
  }
}
