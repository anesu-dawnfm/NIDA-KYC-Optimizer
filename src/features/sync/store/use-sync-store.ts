import { create } from "zustand";

import type { SyncNetworkType } from "@/features/sync/types/sync";

export type SyncStoreState = {
  networkType: SyncNetworkType;
  isOnline: boolean;
  isSyncing: boolean;
  queueCount: number;
  retryAttempt: number;
  nextRetryAt: string | null;
  lastSyncError: string | null;
  lastSyncedAt: string | null;
  setNetworkState: (state: {
    isOnline: boolean;
    networkType: SyncNetworkType;
  }) => void;
  setQueueCount: (count: number) => void;
  incrementQueueCount: () => void;
  decrementQueueCount: () => void;
  setSyncing: (isSyncing: boolean) => void;
  setRetryState: (state: {
    attempt: number;
    lastSyncError: string | null;
    nextRetryAt: string | null;
  }) => void;
  clearRetryState: () => void;
  setLastSyncedAt: (timestamp: string | null) => void;
};

export const useSyncStore = create<SyncStoreState>((set) => ({
  networkType: "offline",
  isOnline: false,
  isSyncing: false,
  queueCount: 0,
  retryAttempt: 0,
  nextRetryAt: null,
  lastSyncError: null,
  lastSyncedAt: null,
  setNetworkState: ({ isOnline, networkType }) =>
    set({ isOnline, networkType }),
  setQueueCount: (queueCount) => set({ queueCount }),
  incrementQueueCount: () =>
    set((state) => ({ queueCount: state.queueCount + 1 })),
  decrementQueueCount: () =>
    set((state) => ({ queueCount: Math.max(0, state.queueCount - 1) })),
  setSyncing: (isSyncing) => set({ isSyncing }),
  setRetryState: ({ attempt, lastSyncError, nextRetryAt }) =>
    set({
      lastSyncError,
      nextRetryAt,
      retryAttempt: attempt,
    }),
  clearRetryState: () =>
    set({
      lastSyncError: null,
      nextRetryAt: null,
      retryAttempt: 0,
    }),
  setLastSyncedAt: (lastSyncedAt) => set({ lastSyncedAt }),
}));
