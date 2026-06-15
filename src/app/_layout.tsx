import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { AppProviders } from "@/core/providers/app-providers";
import { GlobalErrorBoundary } from "@/shared/components/global-error-boundary";

export { ErrorBoundary } from "expo-router";

export default function RootLayout() {
  return (
    <GlobalErrorBoundary>
      <AppProviders>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />
        <StatusBar style="auto" />
      </AppProviders>
    </GlobalErrorBoundary>
  );
}
