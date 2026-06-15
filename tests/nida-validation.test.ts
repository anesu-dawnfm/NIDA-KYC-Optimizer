import { describe, expect, it } from "vitest";

import { parseNidaDocument } from "../src/features/parser";
import type { NidaParsedResult } from "../src/features/parser";
import { validateNidaDocument } from "../src/features/validation";

const referenceDate = new Date("2030-01-01T00:00:00.000Z");

describe("validateNidaDocument", () => {
  it("returns VALID when all fields are structurally valid and expiry is in the future", () => {
    const parsed = parseNidaDocument({
      rawText: `
        FULL NAME: JOHN MWAKYUSA KIBONA
        NIDA NUMBER: 19876543210987654321
        DATE OF BIRTH: 12/03/1991
        EXPIRY DATE: 12/03/2031
      `,
    });

    const result = validateNidaDocument(parsed, { referenceDate });

    expect(result.status).toBe("VALID");
    expect(result.fields.nidaNumber.status).toBe("VALID");
    expect(result.fields.expiryDate.status).toBe("VALID");
    expect(result.checksum.status).toBe("pending");
  });

  it("returns WARNING for expiring documents and low-confidence fields", () => {
    const parsed = parseNidaDocument({
      rawText: `
        FULL NAME: JOHN MWAKYUSA KIBONA
        NIDA NUMBER: 19876543210987654321
        DATE OF BIRTH: 12/03/1991
        EXPIRY DATE: 10/01/2030
      `,
    });

    const result = validateNidaDocument(parsed, {
      referenceDate,
      warningWindowDays: 30,
    });

    expect(result.status).toBe("WARNING");
    expect(result.fields.expiryDate.status).toBe("WARNING");
    expect(result.issues.some((issue) => issue.code === "expiring_soon")).toBe(true);
  });

  it("returns INVALID for bad NIDA number formats", () => {
    const parsed: NidaParsedResult = {
      ...parseNidaDocument({
        rawText: `
          FULL NAME: JOHN MWAKYUSA KIBONA
          DATE OF BIRTH: 12/03/1991
          EXPIRY DATE: 12/03/2031
        `,
      }),
      nidaNumber: {
        value: "12345",
        confidence: 0.92,
        sourceText: "NIDA NUMBER: 12345",
        normalizedText: "12345",
      },
    };

    const result = validateNidaDocument(parsed, { referenceDate });

    expect(result.status).toBe("INVALID");
    expect(result.fields.nidaNumber.status).toBe("INVALID");
    expect(result.issues.some((issue) => issue.code === "invalid_nida_number_format")).toBe(true);
  });

  it("returns INVALID for expired documents", () => {
    const parsed = parseNidaDocument({
      rawText: `
        FULL NAME: JOHN MWAKYUSA KIBONA
        NIDA NUMBER: 19876543210987654321
        DATE OF BIRTH: 12/03/1991
        EXPIRY DATE: 01/12/2029
      `,
    });

    const result = validateNidaDocument(parsed, { referenceDate });

    expect(result.status).toBe("INVALID");
    expect(result.fields.expiryDate.status).toBe("INVALID");
    expect(result.issues.some((issue) => issue.code === "expired_document")).toBe(true);
  });

  it("supports checksum validation when provided", () => {
    const parsed = parseNidaDocument({
      rawText: `
        FULL NAME: JOHN MWAKYUSA KIBONA
        NIDA NUMBER: 19876543210987654321
        DATE OF BIRTH: 12/03/1991
        EXPIRY DATE: 12/03/2031
      `,
    });

    const result = validateNidaDocument(parsed, {
      referenceDate,
      checksumValidator: (nidaNumber) => nidaNumber.endsWith("1"),
    });

    expect(result.checksum.status).toBe("passed");
    expect(result.status).toBe("VALID");
  });
});
