import { getSupabaseClient, SupabaseError } from "@/core/supabase";

import type {
  AgentRecord,
  SupabaseAgentUpsertInput,
  UpdateAgentInput,
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

export class SupabaseAgentsRepository {
  async upsertCurrentAgent(
    input: SupabaseAgentUpsertInput,
  ): Promise<AgentRecord> {
    const client = getSupabaseClient();
    const { data: authData, error: authError } = await client.auth.getUser();

    if (authError) {
      throw new SupabaseError("request_failed", authError.message, authError);
    }

    const agentId = input.id ?? authData.user?.id;
    if (!agentId) {
      throw new SupabaseError(
        "client_not_configured",
        "An authenticated Supabase agent is required.",
      );
    }

    const { data, error } = await client
      .from("agents")
      .upsert(
        {
          id: agentId,
          email: input.email,
          full_name: input.fullName,
          role: input.role ?? "agent",
          branch_code: input.branchCode ?? null,
          is_active: input.isActive ?? true,
        },
        { onConflict: "id" },
      )
      .select("*")
      .single();

    return unwrap(data, error);
  }

  async getCurrentAgent(): Promise<AgentRecord> {
    const client = getSupabaseClient();
    const { data: authData, error: authError } = await client.auth.getUser();

    if (authError) {
      throw new SupabaseError("request_failed", authError.message, authError);
    }

    const agentId = authData.user?.id;
    if (!agentId) {
      throw new SupabaseError(
        "client_not_configured",
        "An authenticated Supabase agent is required.",
      );
    }

    const { data, error } = await client
      .from("agents")
      .select("*")
      .eq("id", agentId)
      .single();

    return unwrap(data, error);
  }

  async updateCurrentAgent(input: UpdateAgentInput): Promise<AgentRecord> {
    const client = getSupabaseClient();
    const { data: authData, error: authError } = await client.auth.getUser();

    if (authError) {
      throw new SupabaseError("request_failed", authError.message, authError);
    }

    const agentId = authData.user?.id;
    if (!agentId) {
      throw new SupabaseError(
        "client_not_configured",
        "An authenticated Supabase agent is required.",
      );
    }

    const { data, error } = await client
      .from("agents")
      .update(input)
      .eq("id", agentId)
      .select("*")
      .single();

    return unwrap(data, error);
  }
}
