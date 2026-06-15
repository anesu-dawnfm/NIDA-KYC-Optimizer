import { useEffect, useMemo } from "react";
import { useNetInfo } from "@react-native-community/netinfo";

import { reportError } from "@/core/utils/report-error";
import { classifyNetworkType, formatNetworkLabel } from "@/features/sync/services/sync-network";
import {
  offlineFirstSyncQueueManager,
  type OfflineFirstSyncQueueManager,
} from "@/features/sync/services/sync-queue-manager";
import { useSyncStore } from "@/features/sync/store/use-sync-store";
import type { SyncNetworkType } from "@/features/sync/types/sync";

type UseOfflineFirstSyncResult = {
  isOnline: boolean;
  networkType: SyncNetworkType;
  networkLabel: string;
  isSyncing: boolean;
  queueCount: number;
  nextRetryAt: string | null;
  lastSyncError: string | null;
  enqueueSubmission: OfflineFirstSyncQueueManager["enqueueSubmission"];
  syncNow: () => Promise<void>;
};

export function useOfflineFirstSync(): UseOfflineFirstSyncResult {
  const netInfo = useNetInfo();
  const networkType = useMemo(
    () =>
      classifyNetworkType({
        isConnected: netInfo.isConnected,
        isInternetReachable: netInfo.isInternetReachable,
        type: netInfo.type,
      }),
    [netInfo.isConnected, netInfo.isInternetReachable, netInfo.type],
  );
  const networkLabel = useMemo(
    () => formatNetworkLabel(networkType),
    [networkType],
  );
  const isOnline = networkType !== "offline";
  const isSyncing = useSyncStore((state) => state.isSyncing);
  const queueCount = useSyncStore((state) => state.queueCount);
  const nextRetryAt = useSyncStore((state) => state.nextRetryAt);
  const lastSyncError = useSyncStore((state) => state.lastSyncError);

  useEffect(() => {
    useSyncStore.getState().setNetworkState({ isOnline, networkType });
  }, [isOnline, networkType]);

  useEffect(() => {
    void offlineFirstSyncQueueManager
      .hydrateQueueCount()
      .catch((error) => reportError(error, { scope: "sync-hydrate" }));
  }, []);

  useEffect(() => {
    if (!isOnline) {
      return;
    }

    void offlineFirstSyncQueueManager.syncPending().catch((error) => {
      reportError(error, { scope: "sync-auto" });
    });
  }, [isOnline]);

  return {
    enqueueSubmission: offlineFirstSyncQueueManager.enqueueSubmission.bind(
      offlineFirstSyncQueueManager,
    ),
    isOnline,
    isSyncing,
    lastSyncError,
    networkLabel,
    networkType,
    nextRetryAt,
    queueCount,
    syncNow: async () => {
      await offlineFirstSyncQueueManager.syncPending();
    },
  };
}
