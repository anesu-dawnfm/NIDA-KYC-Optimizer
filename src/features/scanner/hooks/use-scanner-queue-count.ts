import { useSyncStore, type SyncStoreState } from "@/features/sync";

export function useScannerQueueCount<T>(
  selector: (state: SyncStoreState) => T,
): T {
  return useSyncStore(selector);
}
