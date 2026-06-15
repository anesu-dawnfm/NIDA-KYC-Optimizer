import { apiClient } from "@/core/api";
import { env } from "@/core/config/env";
import { supabaseSyncTransport } from "@/features/supabase";

import type { SyncTransportPayload } from "@/features/sync/types/sync";

export interface SyncTransport {
  submitSession(payload: SyncTransportPayload): Promise<void>;
}

export const apiSyncTransport: SyncTransport = {
  async submitSession(payload: SyncTransportPayload): Promise<void> {
    if (env.hasSupabaseConfig) {
      await supabaseSyncTransport.submitSession(payload);
      return;
    }

    await apiClient.post("/sync/sessions", payload);
  },
};

export { supabaseSyncTransport };
