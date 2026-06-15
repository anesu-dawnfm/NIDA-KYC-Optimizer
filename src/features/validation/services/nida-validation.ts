import type { NidaParsedResult } from "@/features/parser";
import type {
  ChecksumStatus,
  FieldValidation,
  NidaValidationResult,
  ValidationIssue,
  ValidationStatus,
  ValidateNidaOptions,
} from "@/features/validation/types/nida-validation";

const NIDA_NUMBER_REGEX = /^\d{16,20}$/;
const DATE_REGEX = /^\d{2}\/\d{2}\/\d{4}$/;
const DEFAULT_WARNING_WINDOW_DAYS = 180;

export function validateNidaDocument(
  parsed: NidaParsedResult,
  options: ValidateNidaOptions = {},
): NidaValidationResult {
  const referenceDate = options.referenceDate ?? new Date();
  const warningWindowDays = options.warningWindowDays ?? DEFAULT_WARNING_WINDOW_DAYS;

  const fullName = validateTextField(
    parsed.fullName.value,
    "fullName",
    parsed.fullName.confidence,
    "Full name is missing or incomplete.",
  );

  const nidaNumber = validateNidaNumberField(
    parsed.nidaNumber.value,
    parsed.nidaNumber.confidence,
  );

  const dateOfBirth = validateDateField(
    parsed.dateOfBirth.value,
    "dateOfBirth",
    parsed.dateOfBirth.confidence,
    "Date of birth must be in DD/MM/YYYY format.",
  );

  const expiryDate = validateExpiryField(
    parsed.expiryDate.value,
    parsed.expiryDate.confidence,
    referenceDate,
    warningWindowDays,
  );

  const fieldIssues = [
    ...fullName.issues,
    ...nidaNumber.issues,
    ...dateOfBirth.issues,
    ...expiryDate.issues,
  ];

  const checksum = evaluateChecksum(
    parsed.nidaNumber.value,
    options.checksumValidator,
  );

  if (checksum.issue && checksum.status === "failed") {
    fieldIssues.push(checksum.issue);
  }

  const lowConfidenceIssues = collectLowConfidenceIssues(parsed);
  fieldIssues.push(...lowConfidenceIssues);

  const status = deriveOverallStatus([
    fullName.status,
    nidaNumber.status,
    dateOfBirth.status,
    expiryDate.status,
    checksum.status === "failed" ? "INVALID" : "VALID",
    ...lowConfidenceIssues.map(() => "WARNING" as const),
  ]);

  return {
    status,
    fields: {
      fullName,
      nidaNumber,
      dateOfBirth,
      expiryDate,
    },
    checksum,
    issues: fieldIssues,
    parsed,
  };
}

function validateTextField(
  value: string | null,
  field: FieldValidation["issues"][number]["field"],
  confidence: number,
  missingMessage: string,
): FieldValidation {
  if (!value || !value.trim()) {
    return {
      status: "INVALID",
      issues: [{ code: "missing_field", field, message: missingMessage }],
    };
  }

  const issues: ValidationIssue[] = [];
  if (confidence < 0.7) {
    issues.push({
      code: "low_confidence",
      field,
      message: `${capitalize(field)} confidence is low.`,
    });
  }

  return {
    status: issues.length ? "WARNING" : "VALID",
    issues,
  };
}

function validateNidaNumberField(
  value: string | null,
  confidence: number,
): FieldValidation {
  if (!value || !value.trim()) {
    return {
      status: "INVALID",
      issues: [
        {
          code: "missing_field",
          field: "nidaNumber",
          message: "NIDA number is missing.",
        },
      ],
    };
  }

  if (!NIDA_NUMBER_REGEX.test(value)) {
    return {
      status: "INVALID",
      issues: [
        {
          code: "invalid_nida_number_format",
          field: "nidaNumber",
          message: "NIDA number must contain 16 to 20 digits.",
        },
      ],
    };
  }

  const issues: ValidationIssue[] = [];
  if (confidence < 0.75) {
    issues.push({
      code: "low_confidence",
      field: "nidaNumber",
      message: "NIDA number confidence is low.",
    });
  }

  return {
    status: issues.length ? "WARNING" : "VALID",
    issues,
  };
}

function validateDateField(
  value: string | null,
  field: "dateOfBirth" | "expiryDate",
  confidence: number,
  missingMessage: string,
): FieldValidation {
  if (!value || !value.trim()) {
    return {
      status: "INVALID",
      issues: [{ code: "missing_field", field, message: missingMessage }],
    };
  }

  if (!DATE_REGEX.test(value)) {
    return {
      status: "INVALID",
      issues: [
        {
          code: "invalid_date_format",
          field,
          message: "Date must use DD/MM/YYYY format.",
        },
      ],
    };
  }

  const parsedDate = parseDate(value);
  if (!parsedDate) {
    return {
      status: "INVALID",
      issues: [
        {
          code: "invalid_date_format",
          field,
          message: "Date is not a valid calendar value.",
        },
      ],
    };
  }

  const issues: ValidationIssue[] = [];
  if (confidence < 0.7) {
    issues.push({
      code: "low_confidence",
      field,
      message: `${capitalize(field)} confidence is low.`,
    });
  }

  return {
    status: issues.length ? "WARNING" : "VALID",
    issues,
  };
}

function validateExpiryField(
  value: string | null,
  confidence: number,
  referenceDate: Date,
  warningWindowDays: number,
): FieldValidation {
  const dateField = validateDateField(
    value,
    "expiryDate",
    confidence,
    "Expiry date is missing.",
  );

  if (dateField.status === "INVALID") {
    return dateField;
  }

  const parsedExpiry = value ? parseDate(value) : null;
  if (!parsedExpiry) {
    return {
      status: "INVALID",
      issues: [
        {
          code: "invalid_date_format",
          field: "expiryDate",
          message: "Expiry date is not valid.",
        },
      ],
    };
  }

  const deltaDays = diffInDays(referenceDate, parsedExpiry);
  if (deltaDays < 0) {
    return {
      status: "INVALID",
      issues: [
        {
          code: "expired_document",
          field: "expiryDate",
          message: "Document has expired.",
        },
      ],
    };
  }

  if (deltaDays <= warningWindowDays) {
    return {
      status: "WARNING",
      issues: [
        {
          code: "expiring_soon",
          field: "expiryDate",
          message: `Document expires within ${warningWindowDays} days.`,
        },
      ],
    };
  }

  return {
    status: "VALID",
    issues: dateField.issues,
  };
}

function evaluateChecksum(
  nidaNumber: string | null,
  checksumValidator?: (nidaNumber: string) => boolean,
): { status: ChecksumStatus; supported: boolean; issue?: ValidationIssue } {
  if (!nidaNumber || !nidaNumber.trim()) {
    return {
      status: "not_applicable",
      supported: false,
    };
  }

  if (!checksumValidator) {
    return {
      status: "pending",
      supported: false,
      issue: {
        code: "checksum_pending",
        field: "nidaNumber",
        message: "Checksum validation is not yet implemented.",
      },
    };
  }

  return checksumValidator(nidaNumber)
    ? {
        status: "passed",
        supported: true,
      }
    : {
        status: "failed",
        supported: true,
        issue: {
          code: "checksum_failed",
          field: "nidaNumber",
          message: "Checksum validation failed.",
        },
      };
}

function collectLowConfidenceIssues(parsed: NidaParsedResult): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (parsed.fullName.value && parsed.fullName.confidence < 0.7) {
    issues.push({
      code: "low_confidence",
      field: "fullName",
      message: "Full name confidence is low.",
    });
  }

  if (parsed.nidaNumber.value && parsed.nidaNumber.confidence < 0.75) {
    issues.push({
      code: "low_confidence",
      field: "nidaNumber",
      message: "NIDA number confidence is low.",
    });
  }

  if (parsed.dateOfBirth.value && parsed.dateOfBirth.confidence < 0.7) {
    issues.push({
      code: "low_confidence",
      field: "dateOfBirth",
      message: "Date of birth confidence is low.",
    });
  }

  if (parsed.expiryDate.value && parsed.expiryDate.confidence < 0.7) {
    issues.push({
      code: "low_confidence",
      field: "expiryDate",
      message: "Expiry date confidence is low.",
    });
  }

  return issues;
}

function deriveOverallStatus(statuses: ValidationStatus[]): ValidationStatus {
  if (statuses.includes("INVALID")) {
    return "INVALID";
  }

  if (statuses.includes("WARNING")) {
    return "WARNING";
  }

  return "VALID";
}

function parseDate(value: string): Date | null {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) {
    return null;
  }

  const [, day, month, year] = match;
  if (!day || !month || !year) {
    return null;
  }

  const parsed = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));

  if (
    parsed.getUTCFullYear() !== Number(year) ||
    parsed.getUTCMonth() + 1 !== Number(month) ||
    parsed.getUTCDate() !== Number(day)
  ) {
    return null;
  }

  return parsed;
}

function diffInDays(referenceDate: Date, targetDate: Date): number {
  const start = Date.UTC(
    referenceDate.getUTCFullYear(),
    referenceDate.getUTCMonth(),
    referenceDate.getUTCDate(),
  );
  const end = Date.UTC(
    targetDate.getUTCFullYear(),
    targetDate.getUTCMonth(),
    targetDate.getUTCDate(),
  );

  return Math.floor((end - start) / (24 * 60 * 60 * 1000));
}

function capitalize(value: string): string {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}
