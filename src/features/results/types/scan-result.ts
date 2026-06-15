import type { NidaParsedResult } from "@/features/parser";
import type { NidaValidationResult } from "@/features/validation";

export type ScanResult = {
  parsed: NidaParsedResult;
  validation: NidaValidationResult;
};
