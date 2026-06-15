import { create } from "zustand";

export type ThemePreference = "light" | "dark" | "system";

type AppSettingsState = {
  themePreference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => void;
};

export const useAppSettingsStore = create<AppSettingsState>((set) => ({
  themePreference: "system",
  setThemePreference: (themePreference) => set({ themePreference }),
}));
