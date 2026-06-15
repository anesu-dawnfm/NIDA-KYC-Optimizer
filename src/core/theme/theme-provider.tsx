import {
  createContext,
  type PropsWithChildren,
  useContext,
  useMemo,
} from "react";
import { useColorScheme } from "react-native";

import { useAppSettingsStore } from "@/core/theme/app-settings-store";
import {
  borderTokens,
  colorTokens,
  radiusTokens,
  shadowTokens,
  spacingTokens,
  typographyTokens,
} from "@/core/theme/tokens";

type ThemeColorScheme = "light" | "dark";

export type ThemeTokens = {
  colors: (typeof colorTokens)[ThemeColorScheme];
  spacing: typeof spacingTokens;
  typography: typeof typographyTokens;
  radius: typeof radiusTokens;
  border: typeof borderTokens;
  shadow: typeof shadowTokens;
};

type ThemeContextValue = ThemeTokens & {
  colorScheme: ThemeColorScheme;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemColorScheme = useColorScheme();
  const themePreference = useAppSettingsStore(
    (state) => state.themePreference,
  );
  const resolvedSystemColorScheme: ThemeColorScheme =
    systemColorScheme === "dark" ? "dark" : "light";
  const colorScheme: ThemeColorScheme =
    themePreference === "system" ? resolvedSystemColorScheme : themePreference;

  const theme = useMemo<ThemeContextValue>(
    () => ({
      colorScheme,
      colors: colorTokens[colorScheme],
      spacing: spacingTokens,
      typography: typographyTokens,
      radius: radiusTokens,
      border: borderTokens,
      shadow: shadowTokens,
    }),
    [colorScheme],
  );

  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
}

export function useAppTheme(): ThemeContextValue {
  const theme = useContext(ThemeContext);

  if (!theme) {
    throw new Error("useAppTheme must be used within ThemeProvider.");
  }

  return theme;
}
