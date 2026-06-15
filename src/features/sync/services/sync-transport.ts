import { apiClient } from "@/core/api";
import { env } from "@/core/config/env";
import { supabaseSyncTransport } from "@/features/supabase";

import type { SyncTransportPayload } from "@/features/sync/types/sync";

export type SyncTransportResult = {
  submissionId?: string;
};

export interface SyncTransport {
  submitSession(payload: SyncTransportPayload): Promise<SyncTransportResult>;
}

export const apiSyncTransport: SyncTransport = {
  async submitSession(
    payload: SyncTransportPayload,
  ): Promise<SyncTransportResult> {
    if (env.hasSupabaseConfig) {
      return supabaseSyncTransport.submitSession(payload);
    }

    await apiClient.post("/sync/sessions", payload);
    return {};
  },
};

export { supabaseSyncTransport };
