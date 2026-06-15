import { apiClient } from "@/core/api";

import type { SyncTransportPayload } from "@/features/sync/types/sync";

export interface SyncTransport {
  submitSession(payload: SyncTransportPayload): Promise<void>;
}

export const apiSyncTransport: SyncTransport = {
  async submitSession(payload: SyncTransportPayload): Promise<void> {
    await apiClient.post("/sync/sessions", payload);
  },
};
