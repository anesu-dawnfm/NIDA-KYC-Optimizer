import type { PropsWithChildren } from "react";

import { ThemeProvider } from "@/core/theme/theme-provider";
import { SupabaseAuthBridge } from "@/core/supabase";
import { OfflineFirstSyncProvider } from "@/features/sync";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <ThemeProvider>
      <SupabaseAuthBridge />
      <OfflineFirstSyncProvider>{children}</OfflineFirstSyncProvider>
    </ThemeProvider>
  );
}
