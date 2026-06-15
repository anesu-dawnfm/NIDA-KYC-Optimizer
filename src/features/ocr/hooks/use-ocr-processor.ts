import { useCallback } from "react";

import { isOcrError, OcrError } from "@/features/ocr/errors/ocr-error";
import { recognizeOcr } from "@/features/ocr/services/ocr-service";
import type { OcrResult, OcrScript } from "@/features/ocr/types/ocr-result";
import { useOcrProcessingStore } from "@/features/ocr/store/use-ocr-processing-store";

type ProcessOcrInput = {
  imageUri: string;
  script?: OcrScript;
};

type UseOcrProcessorResult = {
  status: "idle" | "processing" | "success" | "error";
  result: OcrResult | undefined;
  error: OcrError | undefined;
  processOcr: (input: ProcessOcrInput) => Promise<OcrResult>;
  reset: () => void;
};

export function useOcrProcessor(): UseOcrProcessorResult {
  const { status, result, error, setProcessing, setSuccess, setError, reset } =
    useOcrProcessingStore();

  const processOcr = useCallback(
    async ({ imageUri, script }: ProcessOcrInput) => {
      const startedAt = new Date().toISOString();
      setProcessing(imageUri, startedAt);

      try {
        const recognized = await recognizeOcr({
          imageUri,
          ...(script === undefined ? {} : { script }),
        });
        setSuccess(recognized, recognized.metrics.completedAt);
        return recognized;
      } catch (cause) {
        const normalizedError = isOcrError(cause)
          ? cause
          : new OcrError("recognition_failed", "OCR processing failed.", cause);
        setError(normalizedError, new Date().toISOString());
        throw normalizedError;
      }
    },
    [setError, setProcessing, setSuccess],
  );

  return {
    status,
    result,
    error,
    processOcr,
    reset,
  };
}
