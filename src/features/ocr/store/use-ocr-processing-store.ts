import { create } from "zustand";

import type { OcrError } from "@/features/ocr/errors/ocr-error";
import type { OcrResult } from "@/features/ocr/types/ocr-result";

export type OcrProcessingStatus = "idle" | "processing" | "success" | "error";

type OcrProcessingState = {
  status: OcrProcessingStatus;
  sourceUri: string | undefined;
  result: OcrResult | undefined;
  error: OcrError | undefined;
  startedAt: string | undefined;
  completedAt: string | undefined;
  setProcessing: (sourceUri: string, startedAt: string) => void;
  setSuccess: (result: OcrResult, completedAt: string) => void;
  setError: (error: OcrError, completedAt: string) => void;
  reset: () => void;
};

export const useOcrProcessingStore = create<OcrProcessingState>((set) => ({
  status: "idle",
  sourceUri: undefined,
  result: undefined,
  error: undefined,
  startedAt: undefined,
  completedAt: undefined,
  setProcessing: (sourceUri, startedAt) =>
    set({
      status: "processing",
      sourceUri,
      startedAt,
      completedAt: undefined,
      error: undefined,
      result: undefined,
    }),
  setSuccess: (result, completedAt) =>
    set({
      status: "success",
      result,
      completedAt,
      error: undefined,
    }),
  setError: (error, completedAt) =>
    set({
      status: "error",
      error,
      completedAt,
    }),
  reset: () =>
    set({
      status: "idle",
      sourceUri: undefined,
      result: undefined,
      error: undefined,
      startedAt: undefined,
      completedAt: undefined,
    }),
}));
