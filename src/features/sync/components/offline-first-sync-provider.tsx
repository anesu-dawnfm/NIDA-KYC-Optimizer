import type { PropsWithChildren } from "react";

import { useOfflineFirstSync } from "@/features/sync/hooks/use-offline-first-sync";

export function OfflineFirstSyncProvider({
  children,
}: PropsWithChildren) {
  useOfflineFirstSync();

  return <>{children}</>;
}
