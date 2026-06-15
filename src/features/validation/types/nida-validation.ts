import type { NidaParsedResult } from "@/features/parser";

export type ValidationStatus = "VALID" | "WARNING" | "INVALID";

export type ChecksumStatus = "pending" | "passed" | "failed" | "not_applicable";

export type ValidationIssueCode =
  | "missing_field"
  | "invalid_nida_number_format"
  | "invalid_date_format"
  | "expired_document"
  | "expiring_soon"
  | "low_confidence"
  | "checksum_pending"
  | "checksum_failed";

export type ValidationIssue = {
  code: ValidationIssueCode;
  field: "nidaNumber" | "dateOfBirth" | "expiryDate" | "fullName" | "document";
  message: string;
};

export type FieldValidation = {
  status: ValidationStatus;
  issues: ValidationIssue[];
};

export type NidaValidationResult = {
  status: ValidationStatus;
  fields: {
    fullName: FieldValidation;
    nidaNumber: FieldValidation;
    dateOfBirth: FieldValidation;
    expiryDate: FieldValidation;
  };
  checksum: {
    status: ChecksumStatus;
    supported: boolean;
    issue?: ValidationIssue;
  };
  issues: ValidationIssue[];
  parsed: NidaParsedResult;
};

export type ValidateNidaOptions = {
  referenceDate?: Date;
  warningWindowDays?: number;
  checksumValidator?: (nidaNumber: string) => boolean;
};
