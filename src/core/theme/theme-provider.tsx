import {
  createContext,
  type PropsWithChildren,
  useContext,
  useMemo,
} from "react";
import { useColorScheme } from "react-native";

import { useAppSettingsStore } from "@/core/theme/app-settings-store";
import {
  darkColors,
  lightColors,
  spacing,
  typography,
} from "@/core/theme/tokens";

type AppTheme = {
  colorScheme: "light" | "dark";
  colors: typeof lightColors | typeof darkColors;
  spacing: typeof spacing;
  typography: typeof typography;
};

const ThemeContext = createContext<AppTheme | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemColorScheme = useColorScheme();
  const themePreference = useAppSettingsStore(
    (state) => state.themePreference,
  );
  const resolvedSystemColorScheme =
    systemColorScheme === "dark" ? "dark" : "light";
  const colorScheme =
    themePreference === "system"
      ? resolvedSystemColorScheme
      : themePreference;

  const theme = useMemo<AppTheme>(
    () => ({
      colorScheme,
      colors: colorScheme === "dark" ? darkColors : lightColors,
      spacing,
      typography,
    }),
    [colorScheme],
  );

  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
}

export function useAppTheme(): AppTheme {
  const theme = useContext(ThemeContext);

  if (!theme) {
    throw new Error("useAppTheme must be used within ThemeProvider.");
  }

  return theme;
}
