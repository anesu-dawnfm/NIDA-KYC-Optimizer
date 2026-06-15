import { create } from "zustand";

type ScannerQueueState = {
  queueCount: number;
  setQueueCount: (count: number) => void;
  incrementQueueCount: () => void;
  decrementQueueCount: () => void;
};

export const useScannerQueueCount = create<ScannerQueueState>((set) => ({
  queueCount: 0,
  setQueueCount: (queueCount) => set({ queueCount }),
  incrementQueueCount: () =>
    set((state) => ({ queueCount: state.queueCount + 1 })),
  decrementQueueCount: () =>
    set((state) => ({ queueCount: Math.max(0, state.queueCount - 1) })),
}));
