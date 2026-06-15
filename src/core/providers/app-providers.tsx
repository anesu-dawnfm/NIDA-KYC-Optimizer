import type { PropsWithChildren } from "react";

import { ThemeProvider } from "@/core/theme/theme-provider";

export function AppProviders({ children }: PropsWithChildren) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
