import { create } from "zustand";

import type { ScanResult } from "@/features/results/types/scan-result";

type ScanResultState = {
  currentSessionId: string | null;
  currentResult: ScanResult | null;
  setCurrentResult: (result: ScanResult) => void;
  setCurrentSessionId: (sessionId: string | null) => void;
  clearCurrentResult: () => void;
};

export const useScanResultStore = create<ScanResultState>((set) => ({
  currentSessionId: null,
  currentResult: null,
  setCurrentResult: (currentResult) => set({ currentResult }),
  setCurrentSessionId: (currentSessionId) => set({ currentSessionId }),
  clearCurrentResult: () => set({ currentResult: null, currentSessionId: null }),
}));
