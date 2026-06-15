import type { PropsWithChildren } from "react";

import { ThemeProvider } from "@/core/theme/theme-provider";
import { OfflineFirstSyncProvider } from "@/features/sync";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <ThemeProvider>
      <OfflineFirstSyncProvider>{children}</OfflineFirstSyncProvider>
    </ThemeProvider>
  );
}
