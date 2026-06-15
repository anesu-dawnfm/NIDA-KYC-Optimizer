import { create } from "zustand";

import type { ScanResult } from "@/features/results/types/scan-result";

type ScanResultState = {
  currentResult: ScanResult | null;
  setCurrentResult: (result: ScanResult) => void;
  clearCurrentResult: () => void;
};

export const useScanResultStore = create<ScanResultState>((set) => ({
  currentResult: null,
  setCurrentResult: (currentResult) => set({ currentResult }),
  clearCurrentResult: () => set({ currentResult: null }),
}));
