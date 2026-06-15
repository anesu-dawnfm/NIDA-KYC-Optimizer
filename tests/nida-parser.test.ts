import { describe, expect, it } from "vitest";

import { parseNidaDocument } from "../src/features/parser";

describe("parseNidaDocument", () => {
  it("extracts fields from clean OCR text", () => {
    const result = parseNidaDocument({
      rawText: `
        FULL NAME: JOHN MWAKYUSA KIBONA
        NIDA NUMBER: 19876543210987654321
        DATE OF BIRTH: 12/03/1991
        EXPIRY DATE: 12/03/2031
      `,
    });

    expect(result.fullName.value).toBe("John Mwakyusa Kibona");
    expect(result.nidaNumber.value).toBe("19876543210987654321");
    expect(result.dateOfBirth.value).toBe("12/03/1991");
    expect(result.expiryDate.value).toBe("12/03/2031");
    expect(result.overallConfidence).toBeGreaterThan(0.8);
  });

  it("handles common OCR mistakes in labels and numbers", () => {
    const result = parseNidaDocument({
      rawText: `
        FUL1 NAME : J0HN MWAKYUSA K1B0NA
        N1DA N0: I987654321O98765432I
        D0B: 12-O3-1991
        EXP1RY DATE: 12/O3/2031
      `,
    });

    expect(result.fullName.value).toBe("John Mwakyusa Kibona");
    expect(result.nidaNumber.value).toBe("19876543210987654321");
    expect(result.dateOfBirth.value).toBe("12/03/1991");
    expect(result.expiryDate.value).toBe("12/03/2031");
    expect(result.fullName.confidence).toBeGreaterThan(0.7);
    expect(result.nidaNumber.confidence).toBeGreaterThan(0.8);
  });

  it("combines surname and given names when full name is not explicitly labelled", () => {
    const result = parseNidaDocument({
      rawText: `
        GIVEN NAME: ALEXANDER
        SURNAME: MWALIMU
        ID NO: 12345678901234567890
        BIRTH DATE: 01 JAN 1990
        VALID UNTIL: 01 JAN 2030
      `,
    });

    expect(result.fullName.value).toBe("Alexander Mwalimu");
    expect(result.dateOfBirth.value).toBe("01/01/1990");
    expect(result.expiryDate.value).toBe("01/01/2030");
  });

  it("returns low confidence and warnings when fields are incomplete", () => {
    const result = parseNidaDocument({
      rawText: `
        NAME: JOHN
        1234 5678 90
        DOB: 1I/0S/1991
      `,
    });

    expect(result.nidaNumber.value).toBeNull();
    expect(result.fullName.confidence).toBeLessThan(0.8);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});
