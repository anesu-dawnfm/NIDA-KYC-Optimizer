export { isOcrError, OcrError, type OcrErrorCode } from "./errors/ocr-error";
export { useOcrProcessor } from "./hooks/use-ocr-processor";
export { recognizeOcr, type RecognizeOcrInput } from "./services/ocr-service";
export { useOcrProcessingStore, type OcrProcessingStatus } from "./store/use-ocr-processing-store";
export type {
  OcrBlock,
  OcrBoundingBox,
  OcrLine,
  OcrPoint,
  OcrProcessingMetrics,
  OcrResult,
  OcrScript,
  OcrWord,
} from "./types/ocr-result";
